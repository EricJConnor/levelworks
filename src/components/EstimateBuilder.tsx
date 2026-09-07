import React, { useState, useEffect, useRef } from 'react';
import { useData } from '@/contexts/DataContext';
import { useProfile } from '@/contexts/ProfileContext';
import { toast } from '@/components/ui/use-toast';
import { SendEstimateModal } from './SendEstimateModal';
import { supabase } from '@/lib/supabase';
import { X, Plus, Trash2, Users, Edit, ImageIcon, Send, FileText, Eye, Check, ChevronDown, Tag, Languages, Loader2 } from 'lucide-react';
import { PhotoUpload } from './PhotoUpload';
import { autoGrowTextarea } from '@/lib/utils';
import { useT, useLang } from '@/i18n';
import { useTranslator } from './Translate';
import { looksSpanish } from '@/lib/translate';

interface LineItem {
  id: string; description: string; quantity: number; rate: number; total: number; sectionTitle?: string;
  /** What he typed before translating — see DataContext's LineItem. */
  sourceText?: string; sourceLang?: 'en' | 'es'; sourceStale?: boolean;
}
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
  const t = useT();
  const { lang } = useLang();
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

  // Translation of what the contractor typed. Never applied without him
  // seeing it first — a document that goes to a client is one he has read.

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
    if (!confirm(t('est.deletePhotoConfirm'))) return;
    try {
      const { error } = await supabase.from('project_photos').delete().eq('id', photoId);
      if (error) throw error;
      setEstimatePhotos(prev => prev.filter(p => p.id !== photoId));
      setPhotoCaptions(prev => { const n = { ...prev }; delete n[photoId]; return n; });
    } catch (e: any) {
      toast({ title: t('e.somethingWrong'), description: e.message, variant: 'destructive' });
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

  /**
   * Several fields at once. `updateItem` maps over the current render's array,
   * so two calls in one handler would lose the first — editing the original
   * changes both the text and its stale flag, and needs them in one write.
   */
  const patchItem = (id: string, patch: Partial<LineItem>) => {
    setLineItems(prev => prev.map(item => (item.id === id ? { ...item, ...patch } : item)));
  };

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
    if (!clientName.trim()) { toast({ title: t('est.clientNameNeeded'), description: t('est.clientNameNeededBody'), variant: 'destructive' }); return null; }
    if (!projectName.trim()) { toast({ title: t('est.projectNameNeeded'), description: t('est.projectNameNeededBody'), variant: 'destructive' }); return null; }
    if (forSending && !clientEmail.trim()) { toast({ title: t('est.clientEmailNeeded'), description: t('est.clientEmailNeededBody'), variant: 'destructive' }); return null; }

    setIsSaving(true);
    try {
      const existingToken = existingEstimate?.viewToken || existingEstimate?.view_token;
      const viewToken = (existingToken && String(existingToken).trim() !== '') ? existingToken : crypto.randomUUID();

      const validItems = lineItems
        .map((item, index) => cleanLineItem(item, index))
        .filter((item): item is LineItem => item !== null);

      if (validItems.length === 0) {
        toast({ title: t('est.addALineItem'), description: t('est.addALineItemBody'), variant: 'destructive' });
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
      toast({ title: t('est.couldNotSave'), description: error.message || t('est.couldNotSaveBody'), variant: 'destructive' });
      return null;
    } finally {
      setIsSaving(false);
    }
  };

  const handleSave = async () => {
    const result = await saveEstimate(false);
    if (result) { toast({ title: t('est.saved'), description: t('est.savedBody') }); onClose(); }
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
      toast({ title: t('est.couldNotSend'), description: t('est.couldNotSendBody'), variant: 'destructive' });
    }
  };

  const handlePreviewSend = async () => {
    setSavedEstimateData(previewData);
    setShowSendModal(true);
  };

  const handleConvert = () => onConvertToInvoice?.({ clientName, clientEmail, clientPhone, projectName, lineItems, taxRate, deposit });

  const handleSendModalClose = () => { setShowSendModal(false); setSavedEstimateData(null); };
  const handleSendSuccess = () => { setShowSendModal(false); setSavedEstimateData(null); onClose(); };

  /**
   * Which copy of the work he is looking at.
   *
   * A contractor who wrote this estimate in Spanish and translated it for a
   * client must not come back to a document he cannot read. So once a line
   * carries an original, the builder opens on **his** words, and the client's
   * copy is one tap away. Editing his original never changes what the client
   * already has — only translating again does.
   */
  const hasSource = lineItems.some(i => !!i.sourceText);
  const sourceLang = (lineItems.find(i => i.sourceLang)?.sourceLang) || (lang === 'es' ? 'es' : 'en');
  const [view, setView] = useState<'source' | 'client'>('client');
  useEffect(() => {
    if (hasSource) setView('source');
  }, [hasSource]);
  const showingSource = hasSource && view === 'source';
  const staleCount = lineItems.filter(i => i.sourceStale).length;

  /** The text on a line right now, in the copy he is looking at. */
  const lineText = (i: LineItem) => (showingSource ? (i.sourceText ?? i.description) : i.description);

  // Everything on this estimate a client will read, translated in one pass.
  // Once a line has an original, only the ones he has since edited (and any
  // new line) need translating — re-running the rest would quietly reword work
  // the client has already read, and cost money to do it.
  const needsTranslating = (i: LineItem) => !!i.sourceStale || !i.sourceText;

  const translator = useTranslator({
    pieces: (showingSource ? lineItems.filter(needsTranslating) : lineItems)
      .filter(i => safeString(lineText(i)).trim())
      .map(i => ({ id: i.id, text: safeString(lineText(i)) })),
    emptyTitle: showingSource ? t('tr.allCurrent') : undefined,
    emptyBody: showingSource ? t('tr.allCurrentBody') : undefined,
    projectName: safeString(projectName),
    onApply: (map) => {
      setLineItems(prev => prev.map(i => {
        if (!map.has(i.id)) return i;
        // Translating from his original just refreshes the client's copy.
        if (showingSource) return { ...i, description: map.get(i.id)!, sourceStale: undefined };
        // Translating the client's copy for the first time: keep what he wrote,
        // in the language he wrote it, before the translation replaces it.
        return {
          ...i,
          description: map.get(i.id)!,
          sourceText: i.sourceText ?? i.description,
          sourceLang: i.sourceLang ?? (looksSpanish(i.description) ? 'es' : 'en'),
          sourceStale: undefined,
        };
      }));
      if (!showingSource) setView('source');
    },
  });

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
          item.sectionTitle ? <span className="lv-pill blue">{item.sectionTitle}</span> : <span className="lv-small">{t('est.item')}</span>
        ) : (
          <div className="eb-title-wrap" ref={openTitlePicker === item.id ? titlePickerRef : undefined}>
            <button
              type="button"
              className={`eb-title-btn${item.sectionTitle ? ' has' : ''}`}
              onClick={() => setOpenTitlePicker(openTitlePicker === item.id ? null : item.id)}
            >
              <Tag size={13} />
              {item.sectionTitle || t('est.addSection')}
              <ChevronDown size={13} />
            </button>
            {openTitlePicker === item.id && (
              <div className="lv-pop eb-title-pop">
                <div className="lv-pop-head">
                  <span className="lv-eyebrow">{t('est.savedSections')}</span>
                  <button type="button" className="lv-btn quiet sm" onClick={() => setShowNewTitleInput(true)}>{t('est.newSection')}</button>
                </div>
                {showNewTitleInput && (
                  <div className="eb-title-new">
                    <input
                      className="lv-input"
                      value={newTitleInput}
                      onChange={(e) => setNewTitleInput(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') addNewTitle(item.id); }}
                      placeholder={t('est.sectionPlaceholder')}
                      autoFocus
                    />
                    <button type="button" className="lv-btn pri sm" onClick={() => addNewTitle(item.id)}>{t('a.add')}</button>
                  </div>
                )}
                {savedTitles.length === 0 ? (
                  <p className="lv-small eb-pop-empty">{t('est.noSavedSections')}</p>
                ) : (
                  savedTitles.map((t, i) => (
                    <button key={i} type="button" onClick={() => applyTitle(item.id, t)}>
                      {t}{item.sectionTitle === t && <Check size={14} style={{ float: 'right', color: 'var(--lv-blue)' }} />}
                    </button>
                  ))
                )}
                {item.sectionTitle && (
                  <button type="button" className="eb-title-clear" onClick={() => { updateItem(item.id, 'sectionTitle', undefined); setOpenTitlePicker(null); }}>
                    {t('est.removeSection')}
                  </button>
                )}
              </div>
            )}
          </div>
        )}
        <div className="eb-item-total lv-num">{money(item.total)}</div>
        {!isReadOnly && lineItems.length > 1 && (
          <button className="lv-icon-btn eb-del" onClick={() => removeItem(item.id)} title={t('est.removeItem')} aria-label={t('est.removeItemN', { n: idx + 1 })}>
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
            // His words changed, so the client's copy is now behind.
            patchItem(item.id, { sourceText: e.target.value, sourceStale: true });
          } else {
            updateItem(item.id, 'description', e.target.value);
          }
          autoGrowTextarea(e.target);
        }}
        placeholder={t('est.describePlaceholder')}
        disabled={isReadOnly || (hasSource && !showingSource)}
      />
      {showingSource && item.sourceStale && (
        <span className="lv-pill amber eb-stale">{t('tr.needsTranslating')}</span>
      )}

      <div className="eb-qr">
        <label className="lv-field">
          <span className="lv-label">{t('m.qty')}</span>
          <input type="number" inputMode="decimal" className="lv-input num" value={item.quantity} onChange={(e) => updateItem(item.id, 'quantity', parseFloat(e.target.value) || 0)} onFocus={(e) => e.target.select()} disabled={isReadOnly} />
        </label>
        <label className="lv-field">
          <span className="lv-label">{t('m.rate')}</span>
          <input type="number" inputMode="decimal" className="lv-input num" value={item.rate} onChange={(e) => updateItem(item.id, 'rate', parseFloat(e.target.value) || 0)} onFocus={(e) => e.target.select()} disabled={isReadOnly} />
        </label>
        <div className="lv-field">
          <span className="lv-label">{t('m.lineTotal')}</span>
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
              <span className="lv-eyebrow">{t('est.clientView')}</span>
              <h2 className="lv-h2">{previewData.projectName || t('m.estimate')}</h2>
            </div>
            <div className="lv-inline">
              <span className="lv-pill blue lv-hide-mobile">{t('est.whatClientSees')}</span>
              <button className="lv-icon-btn" onClick={onClose} aria-label={t('a.close')}><X size={20} /></button>
            </div>
          </header>

          <div className="eb-body eb-body-preview">
            <div className="eb-doc">
              <div className="eb-doc-top">
                <div className="eb-doc-biz">
                  {profile?.profile_photo_url && <img src={profile.profile_photo_url} alt="" className="eb-doc-logo" />}
                  <div>
                    <p className="eb-doc-name">{profile?.company_name || profile?.full_name || t('est.yourBusiness')}</p>
                    {profile?.phone_number && <p className="lv-small">{profile.phone_number}</p>}
                    {profile?.business_address && <p className="lv-small">{profile.business_address}</p>}
                  </div>
                </div>
                <div className="eb-doc-meta">
                  <p className="eb-doc-num">{t('est.estimateNumber', { n: safeString(previewData.id).slice(-6).toUpperCase() || t('est.draftRef') })}</p>
                  <p className="lv-small">{previewData.createdAt ? new Date(previewData.createdAt).toLocaleDateString() : new Date().toLocaleDateString()}</p>
                </div>
              </div>

              <div className="eb-doc-for">
                <span className="lv-eyebrow">{t('est.preparedFor')}</span>
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
                <div className="row"><span>{t('m.subtotal')}</span><span className="lv-num">{money(previewSubtotal)}</span></div>
                {Number(previewData.taxRate) > 0 && <div className="row"><span>{t('est.taxPercent', { p: previewData.taxRate })}</span><span className="lv-num">{money(previewTax)}</span></div>}
                <div className="row total"><span>{t('m.total')}</span><span className="lv-num">{money(previewTotal)}</span></div>
                {previewDeposit > 0 && (
                  <>
                    <div className="row"><span>{t('est.depositAtSigning')}</span><span className="lv-num">{money(previewDeposit)}</span></div>
                    <div className="row balance"><span>{t('est.balanceOnCompletion')}</span><span className="lv-num">{money(previewTotal - previewDeposit)}</span></div>
                  </>
                )}
              </div>

              {estimatePhotos.length > 0 && (
                <div className="eb-doc-photos">
                  <span className="lv-eyebrow">{t('est.projectPhotos')}</span>
                  <div className="eb-photo-grid">
                    {estimatePhotos.map(photo => (
                      <figure key={photo.id}>
                        <img src={photo.fileUrl} alt={photoCaptions[photo.id] || t('est.projectPhoto')} />
                        {photoCaptions[photo.id] && <figcaption>{photoCaptions[photo.id]}</figcaption>}
                      </figure>
                    ))}
                  </div>
                </div>
              )}

              <p className="eb-doc-thanks">{t('est.thanks')}</p>
            </div>
          </div>

          <footer className="eb-foot">
            <div className="lv-actions">
              <button className="lv-btn quiet lv-hide-mobile" onClick={onClose}>{t('a.close')}</button>
              <div className="spacer" />
              <button className="lv-btn sec" onClick={() => { setShowPreview(false); setIsReadOnly(false); }}><Edit size={16} /> {t('a.edit')}</button>
              {canConvert && <button className="lv-btn sec" onClick={handleConvert}><FileText size={16} /> {t('est.convertToInvoice')}</button>}
              <button className="lv-btn pri span" onClick={handlePreviewSend} disabled={isSaving}><Send size={16} /> {t('est.sendToClient')}</button>
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
        <span className="lv-eyebrow">{t('est.totals')}</span>
        <span className="lv-small">{itemCount === 1 ? t('est.itemCount', { n: itemCount }) : t('est.itemsCount', { n: itemCount })}</span>
      </div>
      <div className="eb-sum-row"><span>{t('m.subtotal')}</span><span className="lv-num">{money(subtotal)}</span></div>
      <div className="eb-sum-row">
        <span>{t('m.tax')}</span>
        <span className="eb-tax">
          <input type="number" inputMode="decimal" className="lv-input num eb-tax-in" value={taxRate} onChange={(e) => setTaxRate(parseFloat(e.target.value) || 0)} onFocus={(e) => e.target.select()} disabled={isReadOnly} aria-label={t('est.taxRatePercent')} />
          <span className="lv-small">%</span>
          <b className="lv-num">{money(tax)}</b>
        </span>
      </div>
      <div className="eb-sum-row total"><span>{t('m.total')}</span><span className="lv-num">{money(total)}</span></div>
      <div className="eb-sum-row">
        <span>{t('m.deposit')}</span>
        <input type="number" inputMode="decimal" className="lv-input num eb-dep-in" value={deposit} onChange={(e) => setDeposit(parseFloat(e.target.value) || 0)} onFocus={(e) => e.target.select()} disabled={isReadOnly} aria-label={t('est.depositAmount')} />
      </div>
      <div className="eb-sum-row balance"><span>{t('m.balanceDue')}</span><span className="lv-num">{money(balanceDue)}</span></div>
    </div>
  );

  return (
    <div className="lv-scrim eb-scrim">
      <div className="eb-shell">

        <header className="eb-head-bar">
          <div className="eb-head-l">
            <span className="lv-eyebrow">{isReadOnly ? t('m.estimate') : existingEstimate ? t('est.editingEstimate') : t('nav.newEstimate')}</span>
            <h2 className="lv-h2">{projectName?.trim() || (clientName?.trim() ? clientName : t('est.untitled'))}</h2>
          </div>
          <div className="lv-inline">
            <span className="eb-head-total lv-num lv-hide-mobile">{money(total)}</span>
            {isReadOnly && (
              <button className="lv-btn sec sm" onClick={() => setIsReadOnly(false)}><Edit size={15} /> {t('a.edit')}</button>
            )}
            <button className="lv-icon-btn" onClick={onClose} aria-label={t('a.close')}><X size={20} /></button>
          </div>
        </header>

        <div className="eb-body">
          <div className="eb-col">

            {/* --- who it's for --- */}
            <section className="lv-card eb-sec">
              <div className="eb-sec-head">
                <h3 className="lv-h3">{t('m.client')}</h3>
                {!isReadOnly && clients.length > 0 && (
                  <div className="eb-picker" ref={clientPickerRef}>
                    <button type="button" className="lv-btn sec sm" onClick={() => setShowClientPicker(!showClientPicker)}>
                      <Users size={15} /> {t('est.savedClients')}
                    </button>
                    {showClientPicker && (
                      <div className="lv-pop eb-client-pop">
                        <div className="lv-pop-head"><span className="lv-eyebrow">{t('est.chooseClient')}</span></div>
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
                    <span className="lv-label">{t('m.name')} *</span>
                    <input
                      className="lv-input"
                      value={clientName}
                      onChange={(e) => { setClientName(e.target.value); setShowClientSuggest(true); }}
                      onFocus={() => setShowClientSuggest(true)}
                      onBlur={() => setTimeout(() => setShowClientSuggest(false), 150)}
                      placeholder={t('est.clientNamePlaceholder')}
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
                    <span className="lv-label">{t('m.email')}</span>
                    <input className="lv-input" type="email" inputMode="email" value={clientEmail} onChange={(e) => setClientEmail(e.target.value)} placeholder={t('est.emailPlaceholder')} disabled={isReadOnly} />
                  </label>
                  <label className="lv-field">
                    <span className="lv-label">{t('m.phone')}</span>
                    <input className="lv-input" type="tel" inputMode="tel" value={clientPhone} onChange={(e) => setClientPhone(e.target.value)} placeholder={t('est.phonePlaceholder')} disabled={isReadOnly} />
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
                <h3 className="lv-h3">{t('est.theWork')}</h3>
                {!isReadOnly && (
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
                )}
              </div>
              <div className="eb-sec-body eb-items">
                {hasSource && (
                  <p className={`eb-view-note${staleCount && showingSource ? ' warn' : ''}`}>
                    {showingSource
                      ? (staleCount
                        ? t('tr.editedSince')
                        : t('tr.editingYours'))
                      : t('tr.clientCopyReadOnly')}
                  </p>
                )}
                {lineItems.map((item, idx) => renderItem(item, idx))}
                {!isReadOnly && (
                  <button className="eb-add" onClick={addLineItem}><Plus size={16} /> {t('est.addAnotherItem')}</button>
                )}
              </div>
            </section>

            {/* --- totals, on mobile only; the desktop copy is the sticky rail --- */}
            <div className="eb-sum-mobile">{summary}</div>

            {/* --- photos --- */}
            {existingEstimate?.id && (
              <section className="lv-card eb-sec">
                <div className="eb-sec-head">
                  <h3 className="lv-h3"><ImageIcon size={16} style={{ verticalAlign: '-3px', marginRight: 6, color: 'var(--lv-faint)' }} />{t('est.projectPhotos')}</h3>
                  <PhotoUpload estimateId={existingEstimate.id} onPhotoUploaded={handleEstimatePhotoUploaded} />
                </div>
                <div className="eb-sec-body">
                  {estimatePhotos.length === 0 ? (
                    <p className="lv-small eb-nophotos">{t('est.noPhotos')}</p>
                  ) : (
                    <div className="eb-photo-grid edit">
                      {estimatePhotos.map(photo => (
                        <figure key={photo.id}>
                          <div className="eb-photo">
                            <img src={photo.fileUrl} alt={photoCaptions[photo.id] || t('est.projectPhoto')} />
                            <button className="eb-photo-del" onClick={() => handleEstimatePhotoDeleted(photo.id)} aria-label={t('est.deletePhoto')}><Trash2 size={13} /></button>
                          </div>
                          <input
                            className="lv-input eb-cap"
                            value={photoCaptions[photo.id] || ''}
                            onChange={(e) => setPhotoCaptions(prev => ({ ...prev, [photo.id]: e.target.value }))}
                            onBlur={(e) => handleCaptionSave(photo.id, e.target.value)}
                            placeholder={t('est.photoLabelPlaceholder')}
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
            <button className="lv-btn quiet lv-hide-mobile" onClick={onClose}>{isReadOnly ? t('a.close') : t('a.cancel')}</button>
            <div className="spacer" />
            {isReadOnly ? (
              <>
                <button className="lv-btn sec" onClick={() => setIsReadOnly(false)}><Edit size={16} /> {t('a.edit')}</button>
                {canConvert && <button className="lv-btn sec" onClick={handleConvert}><FileText size={16} /> {t('est.convertToInvoice')}</button>}
                <button className="lv-btn pri span" onClick={handleSendEstimate} disabled={isSaving}><Send size={16} /> {isSaving ? t('a.saving') : t('est.sendToClient')}</button>
              </>
            ) : (
              <>
                <button className="lv-btn sec" onClick={handleDone} disabled={isSaving} title={t('est.previewHint')}><Eye size={16} /> {t('a.preview')}</button>
                {canConvert && <button className="lv-btn sec" onClick={handleConvert}><FileText size={16} /> {t('est.convertToInvoice')}</button>}
                <button className="lv-btn dark" onClick={handleSave} disabled={isSaving}>{isSaving ? t('a.saving') : t('a.save')}</button>
                <button className="lv-btn pri" onClick={handleSendEstimate} disabled={isSaving}><Send size={16} /> {isSaving ? t('a.saving') : t('est.sendToClient')}</button>
              </>
            )}
          </div>
        </footer>
      </div>

      {translator.panel}

      {showSendModal && savedEstimateData && (
        <SendEstimateModal estimateData={savedEstimateData} onClose={handleSendModalClose} onSuccess={handleSendSuccess} />
      )}
    </div>
  );
};
