import React, { useState, useEffect } from 'react';
import { useInvoices } from '@/contexts/InvoiceContext';
import { useData } from '@/contexts/DataContext';
import { Plus, Trash2, Send, X, FileText } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { sendInvoiceEmail } from '@/lib/edgeFunctions';
import { useToast } from '@/hooks/use-toast';
import { autoGrowTextarea } from '@/lib/utils';
import { useT } from '@/i18n';
import { useTranslator } from './Translate';

interface InvoiceBuilderProps {
  estimateId?: string;
  initialData?: any;
  onComplete?: () => void;
  onClose?: () => void;
}

const money = (n: number) => `$${(Number(n) || 0).toFixed(2)}`;

export const InvoiceBuilder: React.FC<InvoiceBuilderProps> = ({ estimateId, initialData, onComplete, onClose }) => {
  const { addInvoice, invoices } = useInvoices();
  const { addClient, clients, estimates } = useData();
  const { toast } = useToast();
  const t = useT();
  const [clientName, setClientName] = useState(initialData?.clientName || '');
  const [clientEmail, setClientEmail] = useState(initialData?.clientEmail || '');
  const [clientPhone, setClientPhone] = useState(initialData?.clientPhone || '');
  const [projectName, setProjectName] = useState(initialData?.projectName || '');
  const [lineItems, setLineItems] = useState(initialData?.lineItems || [{ description: '', quantity: 1, rate: 0 }]);
  const [taxRate, setTaxRate] = useState(initialData?.taxRate || 0);
  const [dueDate, setDueDate] = useState('');
  const [notes, setNotes] = useState('');
  const [sending, setSending] = useState(false);
  const [showClientSuggest, setShowClientSuggest] = useState(false);
  const [showProjectSuggest, setShowProjectSuggest] = useState(false);

  const filteredClients = clientName.trim()
    ? clients.filter((c: any) => c.name.toLowerCase().includes(clientName.trim().toLowerCase()) && c.name.toLowerCase() !== clientName.trim().toLowerCase())
    : [];
  const projectNames = Array.from(new Set([...estimates.map((e: any) => e.projectName), ...invoices.map((i: any) => i.projectName)].filter(Boolean)));
  const filteredProjectNames = projectName.trim()
    ? projectNames.filter((p: any) => p.toLowerCase().includes(projectName.trim().toLowerCase()) && p.toLowerCase() !== projectName.trim().toLowerCase())
    : [];

  // Determine if this is a conversion from an estimate
  const isConversion = !!(estimateId || initialData);

  // The builder covers the whole screen; stop the page behind it scrolling.
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, []);

  const addLineItem = () => setLineItems([...lineItems, { description: '', quantity: 1, rate: 0 }]);

  /**
   * The same translation flow as the estimate, over the same kinds of text:
   * the line items, plus the note the client reads at the bottom of the
   * invoice. Line items have no id here — they are positional — so the index
   * is the id, and the note carries its own.
   */
  const translator = useTranslator({
    pieces: [
      ...lineItems
        .map((i: any, idx: number) => ({ id: `item-${idx}`, text: String(i.description || '') }))
        .filter((p: any) => p.text.trim()),
      ...(notes.trim() ? [{ id: 'notes', text: notes, label: t('m.notes') }] : []),
    ],
    projectName,
    onApply: (map) => {
      setLineItems((prev: any[]) => prev.map((i, idx) => (
        map.has(`item-${idx}`) ? { ...i, description: map.get(`item-${idx}`)! } : i
      )));
      if (map.has('notes')) setNotes(map.get('notes')!);
    },
  });
  const removeLineItem = (index: number) => setLineItems(lineItems.filter((_: any, i: number) => i !== index));
  const updateLineItem = (index: number, field: string, value: any) => {
    const updated = [...lineItems];
    updated[index] = { ...updated[index], [field]: value };
    setLineItems(updated);
  };

  const calculateTotal = () => {
    const subtotal = lineItems.reduce((sum: number, item: any) => sum + (item.quantity * item.rate), 0);
    return subtotal + (subtotal * (taxRate / 100));
  };

  const generateInvoiceNumber = () => {
    const date = new Date();
    return `INV-${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
  };

  // Handle conversion - just save the invoice without sending email
  const handleConvert = async () => {
    if (!clientName || !projectName || lineItems.length === 0) {
      toast({ title: t('inv.fillRequired'), variant: 'destructive' });
      return;
    }
    setSending(true);
    try {
      // Helper to safely convert to number (handles NaN)
      const safeNumber = (val: any): number => {
        if (val === null || val === undefined) return 0;
        const num = Number(val);
        return isNaN(num) ? 0 : num;
      };
      
      // Helper to safely convert to string
      const safeString = (val: any): string => {
        if (val === null || val === undefined) return '';
        return String(val);
      };
      
      const invoiceNumber = generateInvoiceNumber();
      const total = calculateTotal();
      
      // Clean line items before saving - NO NaN, NO undefined
      const cleanLineItems = lineItems.map((item: any, index: number) => ({
        id: safeString(item.id || `item-${index}`),
        description: safeString(item.description),
        quantity: safeNumber(item.quantity),
        rate: safeNumber(item.rate),
        total: safeNumber(item.quantity) * safeNumber(item.rate)
      }));
      
      console.log('[InvoiceBuilder] Converting estimate to invoice...');
      console.log('[InvoiceBuilder] Clean line items:', JSON.stringify(cleanLineItems));
      
      // Save the invoice to the database (without sending email)
      const invoiceId = await addInvoice({
        estimateId: estimateId || undefined, 
        invoiceNumber, 
        clientName: safeString(clientName).trim(), 
        clientEmail: safeString(clientEmail).trim(), 
        clientPhone: safeString(clientPhone).trim(), 
        projectName: safeString(projectName).trim(), 
        lineItems: cleanLineItems, 
        taxRate: safeNumber(taxRate), 
        total: safeNumber(total),
        amountPaid: 0, 
        paymentHistory: [], 
        status: 'unpaid', 
        issueDate: new Date().toISOString(),
        dueDate: dueDate || null,
        notes: notes ? `Converted from estimate. ${notes}` : 'Converted from estimate.',
        sentAt: null // Not sent yet
      });

      console.log('[InvoiceBuilder] Invoice created with ID:', invoiceId);
      toast({ title: t('inv.created'), description: t('inv.createdBody') });

      onComplete?.();
      onClose?.();
    } catch (error: any) {
      console.error('Convert to invoice error:', error);
      let errorMessage = t('inv.couldNotCreate');
      if (error?.message) {
        errorMessage = error.message;
      }
      toast({ title: t('e.somethingWrong'), description: errorMessage, variant: 'destructive' });
    } finally { 
      setSending(false); 
    }
  };

  // Handle sending a new invoice (not conversion)
  const handleSendInvoice = async () => {
    if (!clientName || !clientEmail || !projectName || lineItems.length === 0) {
      toast({ title: t('inv.fillRequired'), variant: 'destructive' });
      return;
    }
    setSending(true);
    try {
      const trimmedName = clientName.trim();
      const exists = clients.some((c: any) => c.name.toLowerCase() === trimmedName.toLowerCase());
      if (!exists) {
        try {
          await addClient({ name: trimmedName, email: clientEmail.trim(), phone: clientPhone.trim(), address: '', totalJobs: 0, totalValue: 0 });
        } catch (e) { console.log('[InvoiceBuilder] Client save skipped:', e); }
      }
      // Helper to safely convert to number (handles NaN)
      const safeNumber = (val: any): number => {
        if (val === null || val === undefined) return 0;
        const num = Number(val);
        return isNaN(num) ? 0 : num;
      };
      
      // Helper to safely convert to string
      const safeString = (val: any): string => {
        if (val === null || val === undefined) return '';
        return String(val);
      };
      
      const invoiceNumber = generateInvoiceNumber();
      const total = calculateTotal();
      
      // Clean line items before saving - NO NaN, NO undefined
      const cleanLineItems = lineItems.map((item: any, index: number) => ({
        id: safeString(item.id || `item-${index}`),
        description: safeString(item.description),
        quantity: safeNumber(item.quantity),
        rate: safeNumber(item.rate),
        total: safeNumber(item.quantity) * safeNumber(item.rate)
      }));
      
      console.log('[InvoiceBuilder] Clean line items:', JSON.stringify(cleanLineItems));
      
      // First, save the invoice to the database
      const invoiceId = await addInvoice({
        estimateId, 
        invoiceNumber, 
        clientName: safeString(clientName).trim(), 
        clientEmail: safeString(clientEmail).trim(), 
        clientPhone: safeString(clientPhone).trim(), 
        projectName: safeString(projectName).trim(), 
        lineItems: cleanLineItems, 
        taxRate: safeNumber(taxRate), 
        total: safeNumber(total),
        amountPaid: 0, 
        paymentHistory: [], 
        status: 'unpaid', 
        issueDate: new Date().toISOString(),
        dueDate: dueDate || null,  // Use null, not undefined
        notes: notes || null,  // Use null, not undefined
        sentAt: new Date().toISOString()
      });

      // Wait a moment for the database to fully commit
      await new Promise(resolve => setTimeout(resolve, 500));

      // Fetch the saved invoice to get the view_token
      const { data: invoiceData } = await supabase.from('invoices').select('*').eq('id', invoiceId).single();
      
      // Get user ID
      const { data: { user } } = await supabase.auth.getUser();
      
      console.log('Sending invoice email...');

      // Use the edge function helper
      const result = await sendInvoiceEmail({
        invoiceId,
        clientEmail,
        invoiceData: {
          invoiceNumber,
          clientName,
          clientEmail,
          clientPhone,
          projectName,
          total,
          amountDue: total,
          issueDate: new Date().toISOString(),
          dueDate,
          notes,
          viewToken: invoiceData?.view_token
        },
        userId: user?.id
      });

      console.log('Send invoice result:', result);
      
      if (result.error) {
        console.error('Send invoice error:', result.error);
        throw result.error;
      }

      const responseData = result.data;

      if (responseData?.errors && responseData.errors.length > 0) {
        toast({ title: t('inv.sentWithWarnings'), description: responseData.errors.join(', ') });
      } else {
        toast({ title: t('inv.sent') });
      }

      onComplete?.();
      onClose?.();
    } catch (error: any) {
      console.error('Send invoice error:', error);
      let errorMessage = t('inv.couldNotSend');
      if (error?.message) {
        errorMessage = error.message;
      }
      toast({ title: t('e.somethingWrong'), description: errorMessage, variant: 'destructive' });
    } finally { 
      setSending(false); 
    }
  };

  // Choose the appropriate handler based on mode
  const handleSubmit = isConversion ? handleConvert : handleSendInvoice;
  const buttonText = isConversion 
    ? (sending ? t('inv.converting') : t('est.convertToInvoice')) 
    : (sending ? t('a.sending') : t('inv.sendInvoice'));
  const buttonIcon = isConversion ? <FileText size={16} /> : <Send size={16} />;

  const handleClose = () => { onClose?.(); onComplete?.(); };

  /* ------------------------------------------------------------------
     What the invoice adds up to. calculateTotal() stays the number the
     handlers save; these are the same sum, broken out for the rail.
     ------------------------------------------------------------------ */
  const subtotal = lineItems.reduce((sum: number, item: any) => sum + ((Number(item.quantity) || 0) * (Number(item.rate) || 0)), 0);
  const tax = subtotal * ((Number(taxRate) || 0) / 100);
  const total = subtotal + tax;
  const itemCount = lineItems.filter((i: any) => String(i.description || '').trim()).length;

  const summary = (
    <div className="eb-sum">
      <div className="eb-sum-head">
        <span className="lv-eyebrow">{t('est.totals')}</span>
        <span className="lv-small">{itemCount === 1 ? t('est.itemCount', { n: itemCount }) : t('est.itemsCount', { n: itemCount })}</span>
      </div>
      <div className="eb-sum-row"><span>{t('m.subtotal')}</span><span className="lv-num">{money(subtotal)}</span></div>
      <div className="eb-sum-row">
        <span>{t('m.tax')}</span>
        <span className="eb-tax">
          <input
            type="number"
            inputMode="decimal"
            className="lv-input num eb-tax-in"
            value={taxRate}
            onChange={(e) => setTaxRate(parseFloat(e.target.value) || 0)}
            onFocus={(e) => e.target.select()}
            aria-label={t('est.taxRatePercent')}
          />
          <span className="lv-small">%</span>
          <b className="lv-num">{money(tax)}</b>
        </span>
      </div>
      <div className="eb-sum-row total"><span>{t('m.total')}</span><span className="lv-num">{money(total)}</span></div>
    </div>
  );

  /* ------------------------------------------------------------------
     Line item — one card per item: what it is, then what it costs.
     ------------------------------------------------------------------ */
  const renderItem = (item: any, index: number) => {
    const lineTotal = (Number(item.quantity) || 0) * (Number(item.rate) || 0);
    return (
      <div className="eb-item" key={index}>
        <div className="eb-item-head">
          <span className="eb-item-n">{index + 1}</span>
          <span className="lv-small">{t('est.item')}</span>
          <div className="eb-item-total lv-num">{money(lineTotal)}</div>
          {lineItems.length > 1 && (
            <button className="lv-icon-btn eb-del" onClick={() => removeLineItem(index)} title={t('est.removeItem')} aria-label={t('est.removeItemN', { n: index + 1 })}>
              <Trash2 size={16} />
            </button>
          )}
        </div>

        <textarea
          ref={autoGrowTextarea}
          className="lv-textarea eb-desc"
          value={item.description}
          onChange={(e) => { updateLineItem(index, 'description', e.target.value); autoGrowTextarea(e.target); }}
          placeholder={t('est.describePlaceholder')}
        />

        <div className="eb-qr">
          <label className="lv-field">
            <span className="lv-label">{t('m.qty')}</span>
            <input type="number" inputMode="decimal" className="lv-input num" value={item.quantity} onChange={(e) => updateLineItem(index, 'quantity', parseFloat(e.target.value) || 0)} onFocus={(e) => e.target.select()} />
          </label>
          <label className="lv-field">
            <span className="lv-label">{t('m.rate')}</span>
            <input type="number" inputMode="decimal" className="lv-input num" value={item.rate} onChange={(e) => updateLineItem(index, 'rate', parseFloat(e.target.value) || 0)} onFocus={(e) => e.target.select()} />
          </label>
          <div className="lv-field">
            <span className="lv-label">{t('m.lineTotal')}</span>
            <div className="eb-linetotal lv-num">{money(lineTotal)}</div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="lv-scrim eb-scrim">
      <div className="eb-shell">

        <header className="eb-head-bar">
          <div className="eb-head-l">
            <span className="lv-eyebrow">{isConversion ? t('est.convertToInvoice') : t('nav.newInvoice')}</span>
            <h2 className="lv-h2">{projectName?.trim() || (clientName?.trim() ? clientName : t('inv.untitled'))}</h2>
          </div>
          <div className="lv-inline">
            <span className="eb-head-total lv-num lv-hide-mobile">{money(total)}</span>
            <button className="lv-icon-btn" onClick={handleClose} aria-label={t('a.close')}><X size={20} /></button>
          </div>
        </header>

        <div className="eb-body">
          <div className="eb-col">

            {/* --- who it's for --- */}
            <section className="lv-card eb-sec">
              <div className="eb-sec-head">
                <h3 className="lv-h3">{t('m.client')}</h3>
              </div>
              <div className="eb-sec-body">
                <div className="eb-client-grid">
                  <label className="lv-field eb-rel">
                    <span className="lv-label">{t('m.name')} *</span>
                    <input
                      className="lv-input"
                      value={clientName}
                      onChange={(e) => { setClientName(e.target.value); setShowClientSuggest(true); }}
                      onFocus={() => setShowClientSuggest(true)}
                      onBlur={() => setTimeout(() => setShowClientSuggest(false), 150)}
                      placeholder={t('est.clientNamePlaceholder')}
                    />
                    {showClientSuggest && filteredClients.length > 0 && (
                      <div className="lv-pop">
                        {filteredClients.map((c: any) => (
                          <button key={c.id} type="button" onMouseDown={(e) => { e.preventDefault(); setClientName(c.name); setClientEmail(c.email || ''); setClientPhone(c.phone || ''); setShowClientSuggest(false); }}>
                            {c.name}{c.email && <small>{c.email}</small>}
                          </button>
                        ))}
                      </div>
                    )}
                  </label>
                  <label className="lv-field">
                    <span className="lv-label">{isConversion ? t('m.email') : `${t('m.email')} *`}</span>
                    <input className="lv-input" type="email" inputMode="email" value={clientEmail} onChange={(e) => setClientEmail(e.target.value)} placeholder={t('est.emailPlaceholder')} />
                    {isConversion && <span className="lv-small" style={{ display: 'block', marginTop: 6 }}>{t('inv.emailOptional')}</span>}
                  </label>
                  <label className="lv-field">
                    <span className="lv-label">{t('m.phone')}</span>
                    <input className="lv-input" type="tel" inputMode="tel" value={clientPhone} onChange={(e) => setClientPhone(e.target.value)} placeholder={t('est.phonePlaceholder')} />
                  </label>
                  <label className="lv-field eb-rel eb-span">
                    <span className="lv-label">{t('m.project')} *</span>
                    <input
                      className="lv-input"
                      value={projectName}
                      onChange={(e) => { setProjectName(e.target.value); setShowProjectSuggest(true); }}
                      onFocus={() => setShowProjectSuggest(true)}
                      onBlur={() => setTimeout(() => setShowProjectSuggest(false), 150)}
                      placeholder={t('est.projectPlaceholder')}
                    />
                    {showProjectSuggest && filteredProjectNames.length > 0 && (
                      <div className="lv-pop">
                        {filteredProjectNames.map((p: any, i: number) => (
                          <button key={i} type="button" onMouseDown={(e) => { e.preventDefault(); setProjectName(p); setShowProjectSuggest(false); }}>{p}</button>
                        ))}
                      </div>
                    )}
                  </label>
                </div>
              </div>
            </section>

            {/* --- the work --- */}
            <section className="lv-card eb-sec">
              <div className="eb-sec-head">
                <h3 className="lv-h3">{t('est.theWork')}</h3>
                <div className="lv-inline" style={{ gap: 8 }}>
                  {translator.button}
                  <button className="lv-btn sec sm" onClick={addLineItem}><Plus size={15} /> {t('est.addItem')}</button>
                </div>
              </div>
              <div className="eb-sec-body eb-items">
                {lineItems.map((item: any, index: number) => renderItem(item, index))}
                <button className="eb-add" onClick={addLineItem}><Plus size={16} /> {t('est.addAnotherItem')}</button>
              </div>
            </section>

            {/* --- totals, on mobile only; the desktop copy is the sticky rail --- */}
            <div className="eb-sum-mobile">{summary}</div>

            {/* --- when it's due, and anything the client should know --- */}
            <section className="lv-card eb-sec">
              <div className="eb-sec-head">
                <h3 className="lv-h3">{t('inv.details')}</h3>
              </div>
              <div className="eb-sec-body">
                <label className="lv-field">
                  <span className="lv-label">{t('m.dueDate')}</span>
                  <input className="lv-input" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
                </label>
                <label className="lv-field">
                  <span className="lv-label">{t('m.notes')}</span>
                  <textarea className="lv-textarea" rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder={t('inv.notesPlaceholder')} />
                </label>
              </div>
            </section>
          </div>

          <aside className="eb-rail">{summary}</aside>
        </div>

        {translator.panel}

        {/* --- the action bar: everything that finishes this invoice, together --- */}
        <footer className="eb-foot">
          <div className="lv-actions">
            <button className="lv-btn quiet lv-hide-mobile" onClick={handleClose}>{t('a.cancel')}</button>
            <div className="spacer" />
            <button className="lv-btn pri span" onClick={handleSubmit} disabled={sending}>
              {buttonIcon} {buttonText}
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
};
