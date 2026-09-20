import React, { useState, useEffect } from 'react';
import { useInvoices } from '@/contexts/InvoiceContext';
import { useData } from '@/contexts/DataContext';
import { Plus, Trash2, Send, X, FileText } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { autoGrowTextarea } from '@/lib/utils';
import { useT, LanguageToggle } from '@/i18n';
import { useTranslator } from './Translate';
import { looksSpanish } from '@/lib/translate';
import { linePricesShown, lineAmountShown, rememberedLinePrices, rememberLinePrices } from '@/lib/linePrices';
import { Switch } from './Switch';
import { clientAddressOf } from '@/lib/clientAddress';
import { payMethodsOf, rememberedPayMethods, rememberPayMethods, bankFee, cardFee, type PayMethod } from '@/lib/payMethods';
import { SendInvoiceModal } from './SendInvoiceModal';

interface InvoiceBuilderProps {
  estimateId?: string;
  /**
   * An existing invoice to reopen and change. The roofer's case: the estimate
   * says "$89 a sheet of plywood as needed" because nobody knows the count
   * until the roof is stripped, so the real number belongs on the invoice.
   * The customer already approved that wording. Also covers simply forgetting
   * a line, which used to mean starting the whole invoice again.
   */
  invoiceId?: string;
  initialData?: any;
  onComplete?: () => void;
  onClose?: () => void;
}

const money = (n: number) => `$${(Number(n) || 0).toFixed(2)}`;

export const InvoiceBuilder: React.FC<InvoiceBuilderProps> = ({ estimateId, invoiceId, initialData, onComplete, onClose }) => {
  const { addInvoice, updateInvoice, invoices } = useInvoices();
  const { addClient, clients, estimates } = useData();
  const { toast } = useToast();
  const t = useT();
  const [clientName, setClientName] = useState(initialData?.clientName || '');
  const [clientEmail, setClientEmail] = useState(initialData?.clientEmail || '');
  const [clientPhone, setClientPhone] = useState(initialData?.clientPhone || '');
  const [clientAddress, setClientAddress] = useState<string>(initialData?.clientAddress || clientAddressOf(initialData?.lineItems));
  const [projectName, setProjectName] = useState(initialData?.projectName || '');
  const [lineItems, setLineItems] = useState(initialData?.lineItems || [{ description: '', quantity: 1, rate: 0 }]);
  const [taxRate, setTaxRate] = useState(initialData?.taxRate || 0);
  // Prices per line on the client's copy, or only the total. Carried over from
  // the estimate it came from; a fresh invoice opens the way he left the last.
  const [showPrices, setShowPricesState] = useState<boolean>(initialData?.lineItems?.length ? linePricesShown(initialData.lineItems) : rememberedLinePrices());
  const setShowPrices = (v: boolean) => { setShowPricesState(v); rememberLinePrices(v); };
  /**
   * How the client may pay: card, bank transfer, or both. His choice, per
   * invoice, because the fee difference is trivial on a repair and enormous on
   * a roof. Carried over from the estimate it came from; a fresh invoice opens
   * the way he left the last one.
   */
  const [payMethods, setPayMethodsState] = useState<PayMethod>(
    initialData?.lineItems?.length ? payMethodsOf(initialData.lineItems) : rememberedPayMethods()
  );
  const setPayMethods = (v: PayMethod) => { setPayMethodsState(v); rememberPayMethods(v); };
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
  const isEditing = !!invoiceId;
  const existing = isEditing ? invoices.find((i: any) => i.id === invoiceId) : null;
  const isConversion = !isEditing && !!(estimateId || initialData);

  /**
   * The invoice made from an estimate, once saved, waiting for the send modal.
   * Eric: "if i make an estimate into an invoice, it should convert and give
   * me the option to send right away." Save closes; Send saves then opens
   * this. Closing the modal closes the builder too: the invoice already
   * exists, so a second press must never make a second one.
   */
  const [sendInvoice, setSendInvoice] = useState<any>(null);

  // The builder covers the whole screen; stop the page behind it scrolling.
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, []);

  /**
   * Reopening an existing invoice: fill the form from the saved row once it
   * arrives. The context loads asynchronously, so this cannot be done in the
   * useState initialisers. Guarded so it never overwrites typing afterwards.
   */
  const [loadedId, setLoadedId] = useState<string | null>(null);
  useEffect(() => {
    if (!existing || loadedId === existing.id) return;
    setLoadedId(existing.id);
    setClientName(existing.clientName || '');
    setClientEmail(existing.clientEmail || '');
    setClientPhone(existing.clientPhone || '');
    setClientAddress(clientAddressOf(existing.lineItems) || '');
    setProjectName(existing.projectName || '');
    setLineItems(existing.lineItems?.length ? existing.lineItems : [{ description: '', quantity: 1, rate: 0 }]);
    setTaxRate(existing.taxRate || 0);
    setShowPricesState(linePricesShown(existing.lineItems));
    setPayMethodsState(payMethodsOf(existing.lineItems));
    setDueDate(existing.dueDate ? String(existing.dueDate).slice(0, 10) : '');
    setNotes(existing.notes || '');
  }, [existing, loadedId]);

  const addLineItem = () => setLineItems([...lineItems, { description: '', quantity: 1, rate: 0 }]);

  /**
   * His words or the client's copy — the same switch as the estimate builder.
   * Once a line has been translated it keeps what he originally typed, and the
   * invoice opens on that, so he is never editing a language he cannot read.
   */
  const hasSource = lineItems.some((i: any) => !!i.sourceText);
  const [view, setView] = useState<'source' | 'client'>('client');
  useEffect(() => { if (hasSource) setView('source'); }, [hasSource]);
  const showingSource = hasSource && view === 'source';
  const staleCount = lineItems.filter((i: any) => i.sourceStale).length;
  const lineText = (i: any) => (showingSource ? (i.sourceText ?? i.description) : i.description);

  /**
   * The same translation flow as the estimate, over the same kinds of text:
   * the line items, plus the note the client reads at the bottom of the
   * invoice. Line items have no id here — they are positional — so the index
   * is the id, and the note carries its own.
   */
  const translator = useTranslator({
    pieces: [
      // Only lines he has edited since translating, plus any new one: rerunning
      // the rest would reword work the client has already read.
      ...lineItems
        .map((i: any, idx: number) => ({ item: i, id: `item-${idx}`, text: String(lineText(i) || '') }))
        .filter((p: any) => p.text.trim() && (!showingSource || p.item.sourceStale || !p.item.sourceText))
        .map(({ id, text }: any) => ({ id, text })),
      ...(notes.trim() ? [{ id: 'notes', text: notes, label: t('m.notes') }] : []),
    ],
    emptyTitle: showingSource ? t('tr.allCurrent') : undefined,
    emptyBody: showingSource ? t('tr.allCurrentBody') : undefined,
    projectName,
    onApply: (map) => {
      setLineItems((prev: any[]) => prev.map((i, idx) => {
        const next = map.get(`item-${idx}`);
        if (next === undefined) return i;
        // From his original: just refresh the client's copy.
        if (showingSource) return { ...i, description: next, sourceStale: undefined };
        // First translation: keep what he wrote before it is replaced.
        return {
          ...i,
          description: next,
          sourceText: i.sourceText ?? i.description,
          sourceLang: i.sourceLang ?? (looksSpanish(String(i.description || '')) ? 'es' : 'en'),
          sourceStale: undefined,
        };
      }));
      if (map.has('notes')) setNotes(map.get('notes')!);
      if (!showingSource) setView('source');
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

  /**
   * The line items as they go to the database. Anything the document carries
   * inside `line_items` has to be stamped here or it vanishes on save: that is
   * the trap `sourceText`, `hidePrice` and `clientAddress` each taught in turn.
   */
  const cleanLineItems = () => {
    const num = (v: any) => { const n = Number(v); return isNaN(n) ? 0 : n; };
    const str = (v: any) => (v === null || v === undefined ? '' : String(v));
    return lineItems.map((item: any, index: number) => ({
      id: str(item.id || `item-${index}`),
      description: str(item.description),
      quantity: num(item.quantity),
      rate: num(item.rate),
      total: num(item.quantity) * num(item.rate),
      ...(item.sourceText ? { sourceText: str(item.sourceText) } : {}),
      ...(item.sourceLang ? { sourceLang: item.sourceLang } : {}),
      ...(item.sourceStale ? { sourceStale: true } : {}),
      ...(showPrices ? {} : { hidePrice: true }),
      ...(clientAddress.trim() ? { clientAddress: clientAddress.trim() } : {}),
      payMethods,
    }));
  };

  /**
   * Save a new invoice and hand back the saved row (with its view token) so
   * the caller can close, or open the send modal on it. Used both for an
   * invoice converted from an estimate and for one started from scratch: the
   * two used to be separate code paths that drifted, and only one of them
   * offered Save. Returns null when validation or the save failed; the toast
   * has already said why.
   */
  const saveConversion = async (): Promise<any | null> => {
    if (!clientName || !projectName || lineItems.length === 0) {
      toast({ title: t('inv.fillRequired'), variant: 'destructive' });
      return null;
    }
    setSending(true);
    try {
      // A client typed straight onto an invoice is still a client worth
      // keeping; the old send-only path did this and it would be a quiet
      // regression to lose it.
      const trimmedName = clientName.trim();
      if (!clients.some((c: any) => c.name.toLowerCase() === trimmedName.toLowerCase())) {
        try {
          await addClient({ name: trimmedName, email: clientEmail.trim(), phone: clientPhone.trim(), address: clientAddress.trim(), totalJobs: 0, totalValue: 0 });
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
      const cleanItems = cleanLineItems();
      
      console.log('[InvoiceBuilder] Converting estimate to invoice...');
      console.log('[InvoiceBuilder] Clean line items:', JSON.stringify(cleanItems));
      
      // Save the invoice to the database (without sending email)
      const invoiceId = await addInvoice({
        estimateId: estimateId || undefined, 
        invoiceNumber, 
        clientName: safeString(clientName).trim(), 
        clientEmail: safeString(clientEmail).trim(), 
        clientPhone: safeString(clientPhone).trim(), 
        projectName: safeString(projectName).trim(), 
        lineItems: cleanItems, 
        taxRate: safeNumber(taxRate), 
        total: safeNumber(total),
        amountPaid: 0, 
        paymentHistory: [], 
        status: 'unpaid', 
        issueDate: new Date().toISOString(),
        dueDate: dueDate || null,
        // Only an invoice that really came from an estimate says so.
        notes: isConversion ? (notes ? `Converted from estimate. ${notes}` : 'Converted from estimate.') : (notes || null),
        sentAt: null // Not sent yet
      });

      console.log('[InvoiceBuilder] Invoice created with ID:', invoiceId);

      // The row carries the view token addInvoice made; the send modal needs it.
      const { data: row } = await supabase.from('invoices').select('*').eq('id', invoiceId).single();
      return {
        id: invoiceId,
        invoiceNumber,
        clientName: safeString(clientName).trim(),
        clientEmail: safeString(clientEmail).trim(),
        clientPhone: safeString(clientPhone).trim(),
        projectName: safeString(projectName).trim(),
        total: safeNumber(total),
        amountPaid: 0,
        issueDate: row?.issue_date || new Date().toISOString(),
        dueDate: row?.due_date || dueDate || null,
        notes: row?.notes || null,
        viewToken: row?.view_token || '',
      };
    } catch (error: any) {
      console.error('Convert to invoice error:', error);
      let errorMessage = t('inv.couldNotCreate');
      if (error?.message) {
        errorMessage = error.message;
      }
      toast({ title: t('e.somethingWrong'), description: errorMessage, variant: 'destructive' });
      return null;
    } finally { 
      setSending(false); 
    }
  };

  /**
   * Reopening an existing invoice writes over it instead of making a second
   * one. Everything else about the screen is identical, which is the point:
   * the contractor should not have to learn a different form to fix a typo.
   */
  const saveEdit = async () => {
    if (!clientName || !projectName || lineItems.length === 0) {
      toast({ title: t('inv.fillRequired'), variant: 'destructive' });
      return null;
    }
    setSending(true);
    try {
      const total = calculateTotal();
      const paid = Number(existing?.amountPaid) || 0;
      // The total moved, so what is still owed moved with it. Without this a
      // paid invoice edited upward silently stays "paid" while money is owed,
      // and one edited downward stays "unpaid" when it is settled.
      const status = paid <= 0
        ? (existing?.status === 'overdue' ? 'overdue' : 'unpaid')
        : paid + 0.005 >= total ? 'paid' : 'partially_paid';

      await updateInvoice(invoiceId!, {
        clientName: clientName.trim(),
        clientEmail: clientEmail.trim(),
        clientPhone: clientPhone.trim(),
        projectName: projectName.trim(),
        lineItems: cleanLineItems(),
        taxRate: Number(taxRate) || 0,
        total,
        status: status as any,
        dueDate: dueDate || null,
        notes: notes || null,
      });

      const { data: row } = await supabase.from('invoices').select('*').eq('id', invoiceId).single();
      return {
        id: invoiceId, invoiceNumber: row?.invoice_number || existing?.invoiceNumber || '',
        clientName: clientName.trim(), clientEmail: clientEmail.trim(), clientPhone: clientPhone.trim(),
        projectName: projectName.trim(), total, amountPaid: paid,
        issueDate: row?.issue_date || existing?.issueDate || new Date().toISOString(),
        dueDate: row?.due_date || dueDate || null, notes: row?.notes || null,
        viewToken: row?.view_token || existing?.viewToken || '',
      };
    } catch (error: any) {
      console.error('Update invoice error:', error);
      toast({ title: t('e.somethingWrong'), description: error?.message || t('inv.couldNotCreate'), variant: 'destructive' });
      return null;
    } finally { setSending(false); }
  };

  /** One save for every mode: new, converted from an estimate, or reopened. */
  const saveAny = () => (isEditing ? saveEdit() : saveConversion());

  /** Save and close; it can still go out from the Invoices list. */
  const handleConvertAndClose = async () => {
    const saved = await saveAny();
    if (!saved) return;
    toast({ title: isEditing ? t('inv.saved') : t('inv.created'), description: isEditing ? undefined : t('inv.createdBody') });
    onComplete?.();
    onClose?.();
  };

  /** Save, then send it right away. */
  const handleConvertAndSend = async () => {
    const saved = await saveAny();
    if (!saved) return;
    setSendInvoice(saved);
  };

  const closeAfterSave = () => { setSendInvoice(null); onComplete?.(); onClose?.(); };

  /*
   * The old direct-email send path lived here. Send now always goes through
   * SendInvoiceModal, the same screen a converted invoice uses, so the client
   * can be reached by email, by text from his own phone, or by a copied link,
   * and there is one send flow instead of two that drifted apart.
   */

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
      <div className="eb-sum-row prices">
        <span className="eb-prices-txt"><b>{t('est.showLinePrices')}</b><span className="lv-small">{t('est.showLinePricesHint')}</span></span>
        <Switch on={showPrices} onChange={setShowPrices} label={t('est.showLinePrices')} />
      </div>
      {/*
        How the client may pay. The fee line underneath is the whole argument:
        a card on a $20,000 roof costs $580, a bank transfer costs $5, because
        Stripe caps it. LevelWorks adds nothing to either.
      */}
      <div className="eb-sum-row prices">
        <span className="eb-prices-txt">
          <b>{t('inv.howTheyPay')}</b>
          <span className="lv-small">
            {payMethods === 'card' ? t('inv.feeCard', { fee: money(cardFee(total)) })
              : payMethods === 'bank' ? t('inv.feeBank', { fee: money(bankFee(total)) })
              : t('inv.feeBoth', { card: money(cardFee(total)), bank: money(bankFee(total)) })}
          </span>
        </span>
      </div>
      <div className="lv-seg eb-pay-seg">
        {(['card', 'bank', 'both'] as PayMethod[]).map((m) => (
          <button key={m} type="button" className={payMethods === m ? 'on' : ''} onClick={() => setPayMethods(m)}>
            {t(m === 'card' ? 'inv.payCard' : m === 'bank' ? 'inv.payBank' : 'inv.payBoth')}
          </button>
        ))}
      </div>
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
          value={lineText(item)}
          onChange={(e) => {
            if (showingSource) {
              // Both fields in one write: updateLineItem copies the current array.
              setLineItems((prev: any[]) => prev.map((it, i) => (
                i === index ? { ...it, sourceText: e.target.value, sourceStale: true } : it
              )));
            } else {
              updateLineItem(index, 'description', e.target.value);
            }
            autoGrowTextarea(e.target);
          }}
          placeholder={t('est.describePlaceholder')}
          disabled={hasSource && !showingSource}
        />
        {showingSource && item.sourceStale && (
          <span className="lv-pill amber eb-stale">{t('tr.needsTranslating')}</span>
        )}

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
            <span className="lv-eyebrow">{isEditing ? t('inv.editInvoice') : isConversion ? t('est.convertToInvoice') : t('nav.newInvoice')}</span>
            <h2 className="lv-h2">{projectName?.trim() || (clientName?.trim() ? clientName : t('inv.untitled'))}</h2>
          </div>
          <div className="lv-inline">
            <span className="eb-head-total lv-num lv-hide-mobile">{money(total)}</span>
            <LanguageToggle />
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
                          <button key={c.id} type="button" onMouseDown={(e) => { e.preventDefault(); setClientName(c.name); setClientEmail(c.email || ''); setClientPhone(c.phone || ''); if (c.address) setClientAddress(c.address); setShowClientSuggest(false); }}>
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
                  <label className="lv-field eb-span">
                    <span className="lv-label">{t('m.address')}</span>
                    <input className="lv-input" type="text" autoComplete="street-address" value={clientAddress} onChange={(e) => setClientAddress(e.target.value)} placeholder={t('est.addressPlaceholder')} />
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
                  {hasSource && (
                    <div className="lv-seg eb-view-seg" role="group" aria-label={t('tr.whichCopy')}>
                      <button type="button" className={view === 'source' ? 'on' : ''} onClick={() => setView('source')}>
                        {t('tr.yourWords')}
                      </button>
                      <button type="button" className={view === 'client' ? 'on' : ''} onClick={() => setView('client')}>
                        {t('tr.clientCopy')}
                      </button>
                    </div>
                  )}
                  {(!hasSource || showingSource) && translator.button}
                  <button className="lv-btn sec sm" onClick={addLineItem}><Plus size={15} /> {t('est.addItem')}</button>
                </div>
              </div>
              <div className="eb-sec-body eb-items">
                {hasSource && (
                  <p className={`eb-view-note${staleCount && showingSource ? ' warn' : ''}`}>
                    {showingSource
                      ? (staleCount ? t('tr.editedSince') : t('tr.editingYours'))
                      : t('tr.clientCopyReadOnly')}
                  </p>
                )}
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
            <button className="lv-btn quiet lv-hide-mobile" onClick={handleClose} disabled={sending}>{t('a.cancel')}</button>
            <div className="spacer" />
            {/*
              Save sits beside Send in every mode. It used to appear only when
              converting an estimate, so a fresh invoice could only be sent —
              which is why the roofer had to send one, mark it paid, and send it
              again just to give a customer a receipt. She got it twice. Saving
              without sending lets him write it up while the crew works, mark it
              paid when the cheque is in his hand, and send the receipt once.
            */}
            <button className="lv-btn dark" onClick={handleConvertAndClose} disabled={sending}>
              {sending ? t('a.saving') : t('a.save')}
            </button>
            <button className="lv-btn pri" onClick={handleConvertAndSend} disabled={sending}>
              <Send size={16} /> {sending ? t('a.saving') : t('est.sendToClient')}
            </button>
          </div>
        </footer>
      </div>

      {sendInvoice && (
        <SendInvoiceModal invoice={sendInvoice} onClose={closeAfterSave} onSuccess={() => {}} />
      )}
    </div>
  );
};
