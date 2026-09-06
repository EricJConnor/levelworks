import React, { useState, useEffect, useRef } from 'react';
import { useData } from '@/contexts/DataContext';
import { useProfile } from '@/contexts/ProfileContext';
import { toast } from '@/components/ui/use-toast';
import { SendEstimateModal } from './SendEstimateModal';
import { supabase } from '@/lib/supabase';
import { X, Plus, Trash2, Users, Edit, ImageIcon, Send, FileText, Eye, Check, ChevronDown, Tag } from 'lucide-react';
import { PhotoUpload } from './PhotoUpload';
import { autoGrowTextarea } from '@/lib/utils';

interface LineItem { id: string; description: string; quantity: number; rate: number; total: number; sectionTitle?: string; }
interface Props { onClose: () => void; onConvertToInvoice?: (data: any) => void; existingEstimate?: any; }

const safeNumber = (val: any): number => {
  if (val === null || val === undefined || val === '') return 0;
  const num = Number(val);
  return isNaN(num) ? 0 : num;
};

const safeString = (val: any): string => {
  if (val === null || val === undefined) return '';
  return String(val);
};

const money = (n: number) => `$${(Number(n) || 0).toFixed(2)}`;

const cleanLineItem = (item: any, index: number): LineItem | null => {
  if (!item) return null;
  const description = safeString(item.description).trim();
  const quantity = safeNumber(item.quantity);
  const rate = safeNumber(item.rate);
  if (!description || quantity <= 0) return null;
  return {
    id: safeString(item.id || `item-${index}-${Date.now()}`),
    description,
    quantity,
    rate,
    total: quantity * rate,
    sectionTitle: item.sectionTitle || undefined
  };
};

export const EstimateBuilder: React.FC<Props> = ({ onClose, onConvertToInvoice, existingEstimate }) => {
  const { addEstimate, updateEstimate, refreshEstimates, addClient, clients, estimates } = useData();
  const { profile } = useProfile();
  const [clientName, setClientName] = useState(existingEstimate?.clientName || '');
  const [clientEmail, setClientEmail] = useState(existingEstimate?.clientEmail || '');
  const [clientPhone, setClientPhone] = useState(existingEstimate?.clientPhone || '');
  const [projectName, setProjectName] = useState(existingEstimate?.projectName || '');
  const [lineItems, setLineItems] = useState<LineItem[]>(existingEstimate?.lineItems || [{ id: '1', description: '', quantity: 1, rate: 0, total: 0 }]);
  const [taxRate, setTaxRate] = useState(Number(existingEstimate?.taxRate) || 0);
  const [deposit, setDeposit] = useState(Number(existingEstimate?.deposit) || 0);
  const [showSendModal, setShowSendModal] = useState(false);
  const [savedEstimateData, setSavedEstimateData] = useState<any>(null);
  const [showPreview, setShowPreview] = useState(!!existingEstimate);
  const [previewData, setPreviewData] = useState<any>(existingEstimate || null);
  const [isSaving, setIsSaving] = useState(false);
  const [isReadOnly, setIsReadOnly] = useState(!!existingEstimate);
  const [showClientPicker, setShowClientPicker] = useState(false);
  const [showClientSuggest, setShowClientSuggest] = useState(false);
  const [showProjectSuggest, setShowProjectSuggest] = useState(false);
  const [savedTitles, setSavedTitles] = useState<string[]>([]);
  const [openTitlePicker, setOpenTitlePicker] = useState<string | null>(null);
  const [newTitleInput, setNewTitleInput] = useState('');
  const [showNewTitleInput, setShowNewTitleInput] = useState(false);
  const titlePickerRef = useRef<HTMLDivElement>(null);
  const clientPickerRef = useRef<HTMLDivElement>(null);
  const [estimatePhotos, setEstimatePhotos] = useState<{ id: string; fileUrl: string; caption: string }[]>([]);
  const [photoCaptions, setPhotoCaptions] = useState<Record<string, string>>({});

  useEffect(() => { loadSavedTitles(); }, []);
  useEffect(() => { if (existingEstimate?.id) loadEstimatePhotos(existingEstimate.id); }, [existingEstimate?.id]);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (titlePickerRef.current && !titlePickerRef.current.contains(e.target as Node)) {
        setOpenTitlePicker(null);
        setShowNewTitleInput(false);
        setNewTitleInput('');
      }
      if (clientPickerRef.current && !clientPickerRef.current.contains(e.target as Node)) {
        setShowClientPicker(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  // The builder covers the whole screen; stop the page behind it scrolling.
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, []);

  const loadEstimatePhotos = async (estimateId: string) => {
    try {
      const { data, error } = await supabase.from('project_photos').select('id, file_url, caption').eq('estimate_id', estimateId);
      if (error) throw error;
      const photos = data?.map(p => ({ id: p.id, fileUrl: p.file_url, caption: p.caption || '' })) || [];
      setEstimatePhotos(photos);
      const caps: Record<string, string> = {};
      photos.forEach(p => { caps[p.id] = p.caption; });
      setPhotoCaptions(caps);
    } catch (e) { console.error('Error loading estimate photos:', e); }
  };

  const handleEstimatePhotoUploaded = (photo: { id: string; fileUrl: string; caption?: string }) => {
    const p = { id: photo.id, fileUrl: photo.fileUrl, caption: photo.caption || '' };
    setEstimatePhotos(prev => [...prev, p]);
    setPhotoCaptions(prev => ({ ...prev, [p.id]: p.caption }));
  };

  const handleEstimatePhotoDeleted = async (photoId: string) => {
    if (!confirm('Delete this photo?')) return;
    try {
      const { error } = await supabase.from('project_photos').delete().eq('id', photoId);
      if (error) throw error;
      setEstimatePhotos(prev => prev.filter(p => p.id !== photoId));
      setPhotoCaptions(prev => { const n = { ...prev }; delete n[photoId]; return n; });
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    }
  };

  const handleCaptionSave = async (photoId: string, caption: string) => {
    try { await supabase.from('project_photos').update({ caption }).eq('id', photoId); }
    catch (e) { console.error('Caption save failed:', e); }
  };

  const loadSavedTitles = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase.from('line_titles').select('title').eq('user_id', user.id).order('created_at', { ascending: false });
      if (data) setSavedTitles(data.map((d: any) => d.title));
    } catch (e) { console.log('Could not load saved titles'); }
  };

  const saveNewTitle = async (title: string) => {
    if (!title || savedTitles.includes(title)) return;
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from('line_titles').insert({ user_id: user.id, title });
        setSavedTitles([title, ...savedTitles]);
      }
    } catch (e) { console.log('Could not save title'); }
  };

  const applyTitle = (itemId: string, title: string) => {
    updateItem(itemId, 'sectionTitle', title);
    setOpenTitlePicker(null);
    setShowNewTitleInput(false);
    setNewTitleInput('');
    saveNewTitle(title);
  };

  const addNewTitle = (itemId: string) => {
    const trimmed = newTitleInput.trim();
    if (!trimmed) return;
    applyTitle(itemId, trimmed);
  };

  const filteredClients = clientName.trim()
    ? clients.filter(c => c.name.toLowerCase().includes(clientName.trim().toLowerCase()) && c.name.toLowerCase() !== clientName.trim().toLowerCase())
    : [];
  const projectNames = Array.from(new Set(estimates.map(e => e.projectName).filter(Boolean)));
  const filteredProjectNames = projectName.trim()
    ? projectNames.filter(p => p.toLowerCase().includes(projectName.trim().toLowerCase()) && p.toLowerCase() !== projectName.trim().toLowerCase())
    : [];

  const subtotal = lineItems.reduce((sum, item) => sum + (Number(item.total) || 0), 0);
  const tax = subtotal * (taxRate / 100);
  const total = subtotal + tax;
  const balanceDue = total - deposit;

  const addLineItem = () => setLineItems(prev => [...prev, { id: Date.now().toString(), description: '', quantity: 1, rate: 0, total: 0 }]);

  const updateItem = (id: string, field: string, value: any) => {
    setLineItems(lineItems.map(item => {
      if (item.id === id) {
        const updated = { ...item, [field]: value };
        if (field === 'quantity' || field === 'rate') updated.total = (Number(updated.quantity) || 0) * (Number(updated.rate) || 0);
        return updated;
      }
      return item;
    }));
  };

  const removeItem = (id: string) => { if (lineItems.length > 1) setLineItems(lineItems.filter(item => item.id !== id)); };

  const saveEstimate = async (forSending = false): Promise<any> => {
    if (!clientName.trim()) { toast({ title: 'Client name needed', description: 'Add the client’s name before saving.', variant: 'destructive' }); return null; }
    if (!projectName.trim()) { toast({ title: 'Project name needed', description: 'Give this estimate a project name so you can find it later.', variant: 'destructive' }); return null; }
    if (forSending && !clientEmail.trim()) { toast({ title: 'Client email needed', description: 'Add an email address to send this estimate.', variant: 'destructive' }); return null; }

    setIsSaving(true);
    try {
      const existingToken = existingEstimate?.viewToken || existingEstimate?.view_token;
      const viewToken = (existingToken && String(existingToken).trim() !== '') ? existingToken : crypto.randomUUID();

      const validItems = lineItems
        .map((item, index) => cleanLineItem(item, index))
        .filter((item): item is LineItem => item !== null);

      if (validItems.length === 0) {
        toast({ title: 'Add a line item', description: 'Every estimate needs at least one item with a description and a quantity.', variant: 'destructive' });
        setIsSaving(false);
        return null;
      }

      const estimateData = {
        clientName: safeString(clientName).trim(),
        clientEmail: safeString(clientEmail).trim(),
        clientPhone: safeString(clientPhone).trim(),
        projectName: safeString(projectName).trim(),
        lineItems: validItems,
        taxRate: safeNumber(taxRate),
        deposit: safeNumber(deposit),
        total: safeNumber(total),
        status: 'draft' as const,
        viewToken
      };

      let resultId: string;
      let resultViewToken: string;

      if (existingEstimate?.id) {
        await updateEstimate(existingEstimate.id, estimateData);
        resultId = existingEstimate.id;
        resultViewToken = viewToken;
      } else {
        const saveResult = await addEstimate(estimateData);
        resultId = saveResult.id;
        resultViewToken = saveResult.viewToken;
        if (clientName.trim()) {
          const exists = clients.some(c => c.name.toLowerCase() === clientName.trim().toLowerCase());
          if (!exists) {
            try {
              await addClient({ name: clientName.trim(), email: clientEmail.trim(), phone: clientPhone.trim(), address: '', totalJobs: 0, totalValue: 0 });
            } catch (e) { console.log('[EstimateBuilder] Client save skipped:', e); }
          }
        }
      }

      await refreshEstimates();
      const result = { id: resultId, ...estimateData, viewToken: resultViewToken };
      return result;
    } catch (error: any) {
      toast({ title: 'Could not save', description: error.message || 'Something went wrong saving this estimate.', variant: 'destructive' });
      return null;
    } finally {
      setIsSaving(false);
    }
  };

  const handleSave = async () => {
    const result = await saveEstimate(false);
    if (result) { toast({ title: 'Saved', description: 'This estimate is in your list.' }); onClose(); }
  };

  const handleDone = async () => {
    const result = await saveEstimate(false);
    if (result) {
      setPreviewData(result);
      setShowPreview(true);
    }
  };

  const handleSendEstimate = async () => {
    const result = await saveEstimate(true);
    if (result && result.id && result.viewToken) {
      setSavedEstimateData(result);
      setShowSendModal(true);
    } else if (result) {
      toast({ title: 'Could not send', description: 'This estimate could not be prepared for sending. Try again.', variant: 'destructive' });
    }
  };

  const handlePreviewSend = async () => {
    setSavedEstimateData(previewData);
    setShowSendModal(true);
  };

  const handleConvert = () => onConvertToInvoice?.({ clientName, clientEmail, clientPhone, projectName, lineItems, taxRate, deposit });

  const handleSendModalClose = () => { setShowSendModal(false); setSavedEstimateData(null); };
  const handleSendSuccess = () => { setShowSendModal(false); setSavedEstimateData(null); onClose(); };

  const canConvert = !!onConvertToInvoice;
  const itemCount = lineItems.filter(i => safeString(i.description).trim()).length;

  /* ------------------------------------------------------------------
     Line item — one card per item: what it is, then what it costs.
     ------------------------------------------------------------------ */
  const renderItem = (item: LineItem, idx: number) => (
    <div className="eb-item" key={item.id}>
      <div className="eb-item-head">
        <span className="eb-item-n">{idx + 1}</span>
        {isReadOnly ? (
          item.sectionTitle ? <span className="lv-pill blue">{item.sectionTitle}</span> : <span className="lv-small">Item</span>
        ) : (
          <div className="eb-title-wrap" ref={openTitlePicker === item.id ? titlePickerRef : undefined}>
            <button
              type="button"
              className={`eb-title-btn${item.sectionTitle ? ' has' : ''}`}
              onClick={() => setOpenTitlePicker(openTitlePicker === item.id ? null : item.id)}
            >
              <Tag size={13} />
              {item.sectionTitle || 'Add a section'}
              <ChevronDown size={13} />
            </button>
            {openTitlePicker === item.id && (
              <div className="lv-pop eb-title-pop">
                <div className="lv-pop-head">
                  <span className="lv-eyebrow">Saved sections</span>
                  <button type="button" className="lv-btn quiet sm" onClick={() => setShowNewTitleInput(true)}>+ New</button>
                </div>
                {showNewTitleInput && (
                  <div className="eb-title-new">
                    <input
                      className="lv-input"
                      value={newTitleInput}
                      onChange={(e) => setNewTitleInput(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') addNewTitle(item.id); }}
                      placeholder="e.g. Kitchen"
                      autoFocus
                    />
                    <button type="button" className="lv-btn pri sm" onClick={() => addNewTitle(item.id)}>Add</button>
                  </div>
                )}
                {savedTitles.length === 0 ? (
                  <p className="lv-small eb-pop-empty">No saved sections yet — add your first above.</p>
                ) : (
                  savedTitles.map((t, i) => (
                    <button key={i} type="button" onClick={() => applyTitle(item.id, t)}>
                      {t}{item.sectionTitle === t && <Check size={14} style={{ float: 'right', color: 'var(--lv-blue)' }} />}
                    </button>
                  ))
                )}
                {item.sectionTitle && (
                  <button type="button" className="eb-title-clear" onClick={() => { updateItem(item.id, 'sectionTitle', undefined); setOpenTitlePicker(null); }}>
                    Remove section
                  </button>
                )}
              </div>
            )}
          </div>
        )}
        <div className="eb-item-total lv-num">{money(item.total)}</div>
        {!isReadOnly && lineItems.length > 1 && (
          <button className="lv-icon-btn eb-del" onClick={() => removeItem(item.id)} title="Remove item" aria-label={`Remove item ${idx + 1}`}>
            <Trash2 size={16} />
          </button>
        )}
      </div>

      <textarea
        ref={autoGrowTextarea}
        className="lv-textarea eb-desc"
        value={item.description}
        onChange={(e) => { updateItem(item.id, 'description', e.target.value); autoGrowTextarea(e.target); }}
        placeholder="Describe the work — materials, prep, coats, anything the client should see"
        disabled={isReadOnly}
      />

      <div className="eb-qr">
        <label className="lv-field">
          <span className="lv-label">Qty</span>
          <input type="number" inputMode="decimal" className="lv-input num" value={item.quantity} onChange={(e) => updateItem(item.id, 'quantity', parseFloat(e.target.value) || 0)} onFocus={(e) => e.target.select()} disabled={isReadOnly} />
        </label>
        <label className="lv-field">
          <span className="lv-label">Rate</span>
          <input type="number" inputMode="decimal" className="lv-input num" value={item.rate} onChange={(e) => updateItem(item.id, 'rate', parseFloat(e.target.value) || 0)} onFocus={(e) => e.target.select()} disabled={isReadOnly} />
        </label>
        <div className="lv-field">
          <span className="lv-label">Line total</span>
          <div className="eb-linetotal lv-num">{money(item.total)}</div>
        </div>
      </div>
    </div>
  );

  /* ------------------------------------------------------------------
     Preview — the document exactly as the client receives it.
     ------------------------------------------------------------------ */
  if (showPreview && previewData) {
    const previewSubtotal = (previewData.lineItems || []).reduce((s: number, i: any) => s + (Number(i.total) || 0), 0);
    const previewTax = previewSubtotal * ((Number(previewData.taxRate) || 0) / 100);
    const previewTotal = previewSubtotal + previewTax;
    const previewDeposit = Number(previewData.deposit) || 0;

    return (
      <div className="lv-scrim eb-scrim">
        <div className="eb-shell">
          <header className="eb-head-bar">
            <div className="eb-head-l">
              <span className="lv-eyebrow">Client view</span>
              <h2 className="lv-h2">{previewData.projectName || 'Estimate'}</h2>
            </div>
            <div className="lv-inline">
              <span className="lv-pill blue lv-hide-mobile">This is what your client sees</span>
              <button className="lv-icon-btn" onClick={onClose} aria-label="Close"><X size={20} /></button>
            </div>
          </header>

          <div className="eb-body eb-body-preview">
            <div className="eb-doc">
              <div className="eb-doc-top">
                <div className="eb-doc-biz">
                  {profile?.profile_photo_url && <img src={profile.profile_photo_url} alt="" className="eb-doc-logo" />}
                  <div>
                    <p className="eb-doc-name">{profile?.company_name || profile?.full_name || 'Your Business'}</p>
                    {profile?.phone_number && <p className="lv-small">{profile.phone_number}</p>}
                    {profile?.business_address && <p className="lv-small">{profile.business_address}</p>}
                  </div>
                </div>
                <div className="eb-doc-meta">
                  <p className="eb-doc-num">Estimate #{safeString(previewData.id).slice(-6).toUpperCase() || 'DRAFT'}</p>
                  <p className="lv-small">{previewData.createdAt ? new Date(previewData.createdAt).toLocaleDateString() : new Date().toLocaleDateString()}</p>
                </div>
              </div>

              <div className="eb-doc-for">
                <span className="lv-eyebrow">Prepared for</span>
                <p className="eb-doc-name">{previewData.clientName}</p>
                {previewData.clientEmail && <p className="lv-small">{previewData.clientEmail}</p>}
                {previewData.clientPhone && <p className="lv-small">{previewData.clientPhone}</p>}
              </div>

              <div className="eb-doc-items">
                {(previewData.lineItems || []).map((item: any, idx: number) => (
                  <div className="eb-doc-item" key={idx}>
                    <div>
                      {item.sectionTitle && <p className="eb-doc-sec">{item.sectionTitle}</p>}
                      <p className="eb-doc-desc">{item.description}</p>
                      {Number(item.quantity) !== 1 && <p className="lv-small">{item.quantity} × {money(item.rate)}</p>}
                    </div>
                    <span className="lv-num eb-doc-amt">{money(item.total)}</span>
                  </div>
                ))}
              </div>

              <div className="eb-doc-sum">
                <div className="row"><span>Subtotal</span><span className="lv-num">{money(previewSubtotal)}</span></div>
                {Number(previewData.taxRate) > 0 && <div className="row"><span>Tax ({previewData.taxRate}%)</span><span className="lv-num">{money(previewTax)}</span></div>}
                <div className="row total"><span>Total</span><span className="lv-num">{money(previewTotal)}</span></div>
                {previewDeposit > 0 && (
                  <>
                    <div className="row"><span>Deposit due at signing</span><span className="lv-num">{money(previewDeposit)}</span></div>
                    <div className="row balance"><span>Balance on completion</span><span className="lv-num">{money(previewTotal - previewDeposit)}</span></div>
                  </>
                )}
              </div>

              {estimatePhotos.length > 0 && (
                <div className="eb-doc-photos">
                  <span className="lv-eyebrow">Project photos</span>
                  <div className="eb-photo-grid">
                    {estimatePhotos.map(photo => (
                      <figure key={photo.id}>
                        <img src={photo.fileUrl} alt={photoCaptions[photo.id] || 'Project photo'} />
                        {photoCaptions[photo.id] && <figcaption>{photoCaptions[photo.id]}</figcaption>}
                      </figure>
                    ))}
                  </div>
                </div>
              )}

              <p className="eb-doc-thanks">We appreciate the opportunity to work with you. Thanks for considering us.</p>
            </div>
          </div>

          <footer className="eb-foot">
            <div className="lv-actions">
              <button className="lv-btn quiet lv-hide-mobile" onClick={onClose}>Close</button>
              <div className="spacer" />
              <button className="lv-btn sec" onClick={() => { setShowPreview(false); setIsReadOnly(false); }}><Edit size={16} /> Edit</button>
              {canConvert && <button className="lv-btn sec" onClick={handleConvert}><FileText size={16} /> Convert to invoice</button>}
              <button className="lv-btn pri span" onClick={handlePreviewSend} disabled={isSaving}><Send size={16} /> Send to client</button>
            </div>
          </footer>
        </div>

        {showSendModal && savedEstimateData && (
          <SendEstimateModal estimateData={savedEstimateData} onClose={handleSendModalClose} onSuccess={handleSendSuccess} />
        )}
      </div>
    );
  }

  /* ------------------------------------------------------------------
     The builder.
     ------------------------------------------------------------------ */
  const summary = (
    <div className="eb-sum">
      <div className="eb-sum-head">
        <span className="lv-eyebrow">Totals</span>
        <span className="lv-small">{itemCount} {itemCount === 1 ? 'item' : 'items'}</span>
      </div>
      <div className="eb-sum-row"><span>Subtotal</span><span className="lv-num">{money(subtotal)}</span></div>
      <div className="eb-sum-row">
        <span>Tax</span>
        <span className="eb-tax">
          <input type="number" inputMode="decimal" className="lv-input num eb-tax-in" value={taxRate} onChange={(e) => setTaxRate(parseFloat(e.target.value) || 0)} onFocus={(e) => e.target.select()} disabled={isReadOnly} aria-label="Tax rate percent" />
          <span className="lv-small">%</span>
          <b className="lv-num">{money(tax)}</b>
        </span>
      </div>
      <div className="eb-sum-row total"><span>Total</span><span className="lv-num">{money(total)}</span></div>
      <div className="eb-sum-row">
        <span>Deposit</span>
        <input type="number" inputMode="decimal" className="lv-input num eb-dep-in" value={deposit} onChange={(e) => setDeposit(parseFloat(e.target.value) || 0)} onFocus={(e) => e.target.select()} disabled={isReadOnly} aria-label="Deposit amount" />
      </div>
      <div className="eb-sum-row balance"><span>Balance due</span><span className="lv-num">{money(balanceDue)}</span></div>
    </div>
  );

  return (
    <div className="lv-scrim eb-scrim">
      <div className="eb-shell">

        <header className="eb-head-bar">
          <div className="eb-head-l">
            <span className="lv-eyebrow">{isReadOnly ? 'Estimate' : existingEstimate ? 'Editing estimate' : 'New estimate'}</span>
            <h2 className="lv-h2">{projectName?.trim() || (clientName?.trim() ? clientName : 'Untitled estimate')}</h2>
          </div>
          <div className="lv-inline">
            <span className="eb-head-total lv-num lv-hide-mobile">{money(total)}</span>
            {isReadOnly && (
              <button className="lv-btn sec sm" onClick={() => setIsReadOnly(false)}><Edit size={15} /> Edit</button>
            )}
            <button className="lv-icon-btn" onClick={onClose} aria-label="Close"><X size={20} /></button>
          </div>
        </header>

        <div className="eb-body">
          <div className="eb-col">

            {/* --- who it's for --- */}
            <section className="lv-card eb-sec">
              <div className="eb-sec-head">
                <h3 className="lv-h3">Client</h3>
                {!isReadOnly && clients.length > 0 && (
                  <div className="eb-picker" ref={clientPickerRef}>
                    <button type="button" className="lv-btn sec sm" onClick={() => setShowClientPicker(!showClientPicker)}>
                      <Users size={15} /> Saved clients
                    </button>
                    {showClientPicker && (
                      <div className="lv-pop eb-client-pop">
                        <div className="lv-pop-head"><span className="lv-eyebrow">Choose a client</span></div>
                        {clients.map((c) => (
                          <button key={c.id} type="button" onClick={() => { setClientName(c.name); setClientEmail(c.email || ''); setClientPhone(c.phone || ''); setShowClientPicker(false); }}>
                            {c.name}
                            {(c.email || c.phone) && <small>{[c.email, c.phone].filter(Boolean).join(' · ')}</small>}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
              <div className="eb-sec-body">
                <div className="eb-client-grid">
                  <label className="lv-field eb-rel">
                    <span className="lv-label">Name *</span>
                    <input
                      className="lv-input"
                      value={clientName}
                      onChange={(e) => { setClientName(e.target.value); setShowClientSuggest(true); }}
                      onFocus={() => setShowClientSuggest(true)}
                      onBlur={() => setTimeout(() => setShowClientSuggest(false), 150)}
                      placeholder="Maria Keller"
                      disabled={isReadOnly}
                    />
                    {showClientSuggest && filteredClients.length > 0 && (
                      <div className="lv-pop">
                        {filteredClients.map((c) => (
                          <button key={c.id} type="button" onMouseDown={(e) => { e.preventDefault(); setClientName(c.name); setClientEmail(c.email || ''); setClientPhone(c.phone || ''); setShowClientSuggest(false); }}>
                            {c.name}{c.email && <small>{c.email}</small>}
                          </button>
                        ))}
                      </div>
                    )}
                  </label>
                  <label className="lv-field">
                    <span className="lv-label">Email</span>
                    <input className="lv-input" type="email" inputMode="email" value={clientEmail} onChange={(e) => setClientEmail(e.target.value)} placeholder="client@email.com" disabled={isReadOnly} />
                  </label>
                  <label className="lv-field">
                    <span className="lv-label">Phone</span>
                    <input className="lv-input" type="tel" inputMode="tel" value={clientPhone} onChange={(e) => setClientPhone(e.target.value)} placeholder="(555) 123-4567" disabled={isReadOnly} />
                  </label>
                  <label className="lv-field eb-rel eb-span">
                    <span className="lv-label">Project *</span>
                    <input
                      className="lv-input"
                      value={projectName}
                      onChange={(e) => { setProjectName(e.target.value); setShowProjectSuggest(true); }}
                      onFocus={() => setShowProjectSuggest(true)}
                      onBlur={() => setTimeout(() => setShowProjectSuggest(false), 150)}
                      placeholder="Exterior repaint"
                      disabled={isReadOnly}
                    />
                    {showProjectSuggest && filteredProjectNames.length > 0 && (
                      <div className="lv-pop">
                        {filteredProjectNames.map((p, i) => (
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
                <h3 className="lv-h3">The work</h3>
                {!isReadOnly && (
                  <button className="lv-btn sec sm" onClick={addLineItem}><Plus size={15} /> Add item</button>
                )}
              </div>
              <div className="eb-sec-body eb-items">
                {lineItems.map((item, idx) => renderItem(item, idx))}
                {!isReadOnly && (
                  <button className="eb-add" onClick={addLineItem}><Plus size={16} /> Add another item</button>
                )}
              </div>
            </section>

            {/* --- totals, on mobile only; the desktop copy is the sticky rail --- */}
            <div className="eb-sum-mobile">{summary}</div>

            {/* --- photos --- */}
            {existingEstimate?.id && (
              <section className="lv-card eb-sec">
                <div className="eb-sec-head">
                  <h3 className="lv-h3"><ImageIcon size={16} style={{ verticalAlign: '-3px', marginRight: 6, color: 'var(--lv-faint)' }} />Project photos</h3>
                  <PhotoUpload estimateId={existingEstimate.id} onPhotoUploaded={handleEstimatePhotoUploaded} />
                </div>
                <div className="eb-sec-body">
                  {estimatePhotos.length === 0 ? (
                    <p className="lv-small eb-nophotos">No photos yet. Add job-site photos and they go out with the estimate.</p>
                  ) : (
                    <div className="eb-photo-grid edit">
                      {estimatePhotos.map(photo => (
                        <figure key={photo.id}>
                          <div className="eb-photo">
                            <img src={photo.fileUrl} alt={photoCaptions[photo.id] || 'Project photo'} />
                            <button className="eb-photo-del" onClick={() => handleEstimatePhotoDeleted(photo.id)} aria-label="Delete photo"><Trash2 size={13} /></button>
                          </div>
                          <input
                            className="lv-input eb-cap"
                            value={photoCaptions[photo.id] || ''}
                            onChange={(e) => setPhotoCaptions(prev => ({ ...prev, [photo.id]: e.target.value }))}
                            onBlur={(e) => handleCaptionSave(photo.id, e.target.value)}
                            placeholder="Add a label"
                          />
                        </figure>
                      ))}
                    </div>
                  )}
                </div>
              </section>
            )}
          </div>

          <aside className="eb-rail">{summary}</aside>
        </div>

        {/* --- the action bar: everything that finishes this estimate, together --- */}
        <footer className="eb-foot">
          <div className="lv-actions">
            <button className="lv-btn quiet lv-hide-mobile" onClick={onClose}>{isReadOnly ? 'Close' : 'Cancel'}</button>
            <div className="spacer" />
            {isReadOnly ? (
              <>
                <button className="lv-btn sec" onClick={() => setIsReadOnly(false)}><Edit size={16} /> Edit</button>
                {canConvert && <button className="lv-btn sec" onClick={handleConvert}><FileText size={16} /> Convert to invoice</button>}
                <button className="lv-btn pri span" onClick={handleSendEstimate} disabled={isSaving}><Send size={16} /> {isSaving ? 'Saving…' : 'Send to client'}</button>
              </>
            ) : (
              <>
                <button className="lv-btn sec" onClick={handleDone} disabled={isSaving} title="Save and see it the way your client will"><Eye size={16} /> Preview</button>
                {canConvert && <button className="lv-btn sec" onClick={handleConvert}><FileText size={16} /> Convert to invoice</button>}
                <button className="lv-btn dark" onClick={handleSave} disabled={isSaving}>{isSaving ? 'Saving…' : 'Save'}</button>
                <button className="lv-btn pri" onClick={handleSendEstimate} disabled={isSaving}><Send size={16} /> {isSaving ? 'Saving…' : 'Send to client'}</button>
              </>
            )}
          </div>
        </footer>
      </div>

      {showSendModal && savedEstimateData && (
        <SendEstimateModal estimateData={savedEstimateData} onClose={handleSendModalClose} onSuccess={handleSendSuccess} />
      )}
    </div>
  );
};
