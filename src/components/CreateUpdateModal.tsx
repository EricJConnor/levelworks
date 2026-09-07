import React, { useState, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useProfile } from '@/contexts/ProfileContext';
import { toast } from '@/components/ui/use-toast';
import { X, Send, Camera, Upload, Loader2, Copy, Check, Trash2, Mail, MessageSquare, AlertCircle, CheckCircle, ChevronRight } from 'lucide-react';
import { useT } from '@/i18n';
import { useTranslator } from './Translate';

interface Props {
  onClose: () => void;
  onCreated: () => void;
}

interface Photo {
  id: string;
  fileUrl: string;
  caption: string;
}

type SendStep = 'compose' | 'choose' | 'email' | 'text';

export const CreateUpdateModal: React.FC<Props> = ({ onClose, onCreated }) => {
  const { profile } = useProfile();
  const t = useT();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [captions, setCaptions] = useState<Record<string, string>>({});
  const [updateId, setUpdateId] = useState<string | null>(null);
  const [viewToken, setViewToken] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [sending, setSending] = useState(false);
  const [step, setStep] = useState<SendStep>('compose');

  /**
   * A job update is written for the client too, so it gets the same flow: the
   * title, the message and every photo caption in one pass.
   */
  const translator = useTranslator({
    pieces: [
      ...(name.trim() ? [{ id: 'name', text: name, label: t('mod.updateName') }] : []),
      ...(description.trim() ? [{ id: 'description', text: description, label: t('mod.messageToClientOptional') }] : []),
      ...photos
        .filter(p => (captions[p.id] || '').trim())
        .map(p => ({ id: `caption-${p.id}`, text: captions[p.id], label: t('mod.photoLabel') })),
    ],
    projectName: name,
    onApply: (map) => {
      if (map.has('name')) setName(map.get('name')!);
      if (map.has('description')) setDescription(map.get('description')!);
      photos.forEach(p => {
        const next = map.get(`caption-${p.id}`);
        // Captions are saved on blur, so a translated one has to be saved too.
        if (next !== undefined) {
          setCaptions(prev => ({ ...prev, [p.id]: next }));
          handleCaptionSave(p.id, next);
        }
      });
    },
  });
  const [linkCopied, setLinkCopied] = useState(false);
  const [sendSuccess, setSendSuccess] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const ensureUpdateRecord = async (): Promise<{ id: string; token: string }> => {
    const newToken = crypto.randomUUID();
    if (updateId && viewToken) {
      // Update name/description in case they changed since photos were uploaded
      await supabase.from('job_updates').update({
        name: name.trim() || 'Project Update',
        description: description.trim() || null,
        view_token: newToken,
        sent_at: new Date().toISOString(),
      }).eq('id', updateId);
      setViewToken(newToken);
      return { id: updateId, token: newToken };
    }
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');
    const { data, error } = await supabase
      .from('job_updates')
      .insert({
        user_id: user.id,
        name: name.trim() || 'Project Update',
        description: description.trim() || null,
        view_token: newToken,
        sent_at: new Date().toISOString(),
      })
      .select('id')
      .single();
    if (error) throw error;
    setUpdateId(data.id);
    setViewToken(newToken);
    return { id: data.id, token: newToken };
  };

  const ensureUpdateRecordForUpload = async (): Promise<string> => {
    if (updateId) return updateId;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');
    const { data, error } = await supabase
      .from('job_updates')
      .insert({ user_id: user.id, name: name.trim() || 'Project Update', description: description.trim() || null })
      .select('id')
      .single();
    if (error) throw error;
    setUpdateId(data.id);
    return data.id;
  };

  const uploadPhoto = async (file: File) => {
    setUploading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');
      const uid = await ensureUpdateRecordForUpload();
      const fileExt = (file.name.split('.').pop() || 'jpg').toLowerCase();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;
      const mimeMap: Record<string, string> = { jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', gif: 'image/gif', webp: 'image/webp', heic: 'image/heic', heif: 'image/heif' };
      const mimeType = (file.type && file.type.startsWith('image/')) ? file.type : (mimeMap[fileExt] || 'image/jpeg');
      const typedBlob = new Blob([file], { type: mimeType });
      const { error: uploadError } = await supabase.storage.from('project-photos').upload(fileName, typedBlob, { cacheControl: '3600', upsert: false, contentType: mimeType });
      if (uploadError) throw uploadError;
      const { data: { publicUrl } } = supabase.storage.from('project-photos').getPublicUrl(fileName);
      const { data, error } = await supabase.from('project_photos').insert({ user_id: user.id, update_id: uid, file_path: fileName, file_url: publicUrl }).select().single();
      if (error) throw error;
      const p = { id: data.id, fileUrl: publicUrl, caption: '' };
      setPhotos(prev => [...prev, p]);
      setCaptions(prev => ({ ...prev, [p.id]: '' }));
    } catch (e: any) {
      toast({ title: t('mod.uploadFailed'), description: e.message, variant: 'destructive' });
    } finally {
      setUploading(false);
    }
  };

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    files.forEach(file => uploadPhoto(file));
    e.target.value = '';
  };

  const handleDeletePhoto = async (photoId: string) => {
    try {
      const { error } = await supabase.from('project_photos').delete().eq('id', photoId);
      if (error) throw error;
      setPhotos(prev => prev.filter(p => p.id !== photoId));
      setCaptions(prev => { const n = { ...prev }; delete n[photoId]; return n; });
    } catch (e: any) {
      toast({ title: t('e.somethingWrong'), description: e.message, variant: 'destructive' });
    }
  };

  const handleCaptionSave = async (photoId: string, caption: string) => {
    try { await supabase.from('project_photos').update({ caption }).eq('id', photoId); }
    catch (e) { console.error(e); }
  };

  const handleProceedToSend = () => {
    if (!name.trim()) {
      toast({ title: t('mod.addAName'), description: t('mod.addANameSub'), variant: 'destructive' });
      return;
    }
    setStep('choose');
  };

  const handleSendEmail = async () => {
    if (!clientEmail.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clientEmail.trim())) {
      toast({ title: t('mod.invalidEmail'), description: t('mod.enterValidEmail'), variant: 'destructive' });
      return;
    }
    setSending(true);
    setSendError(null);
    try {
      const { token } = await ensureUpdateRecord();
      const updateUrl = `${window.location.origin}/view-update/${token}`;
      const contractorName = profile?.full_name || profile?.company_name || 'Your Contractor';
      const { data: result, error } = await supabase.functions.invoke('send-update-email', {
        body: { to: clientEmail.trim(), contractorName, updateName: name.trim(), message: description.trim() || null, updateUrl },
      });
      if (error || result?.success === false) {
        const msg = error?.message || result?.error || t('mod.failedToSendEmail');
        setSendError(msg);
        toast({ title: t('mod.failedToSend'), description: msg, variant: 'destructive' });
        return;
      }
      setSendSuccess(true);
      toast({ title: t('mod.updateSent'), description: t('mod.emailSentTo', { email: clientEmail.trim() }) });
    } catch (e: any) {
      const msg = e.message || t('mod.unexpectedError');
      setSendError(msg);
      toast({ title: t('e.somethingWrong'), description: msg, variant: 'destructive' });
    } finally {
      setSending(false);
    }
  };

  const handleCopyLink = async () => {
    try {
      const { token } = await ensureUpdateRecord();
      const url = `${window.location.origin}/view-update/${token}`;
      await navigator.clipboard.writeText(url);
      setLinkCopied(true);
      toast({ title: t('a.copied'), description: t('mod.openTextsAndPaste') });
    } catch (e: any) {
      toast({ title: t('e.somethingWrong'), description: e.message, variant: 'destructive' });
    }
  };

  return (
    <div className="lv-scrim">
      <div className="lv-modal">

        <div className="lv-modal-head">
          <div>
            <span className="lv-eyebrow">{t('mod.photoUpdate')}</span>
            <h2 className="lv-h2">
              {step === 'compose' ? t('mod.newUpdate') : sendSuccess ? t('mod.updateSentHeading') : t('mod.sendThisUpdate')}
            </h2>
          </div>
          <button className="lv-icon-btn" onClick={onClose} disabled={sending} aria-label={t('a.close')}>
            <X size={20} />
          </button>
        </div>

        <div className="lv-modal-body">

          {/* STEP: compose */}
          {step === 'compose' && (
            <div className="lv-stack">
              <div>
                <label className="lv-field">
                  <span className="lv-label">{t('mod.updateName')}</span>
                  <input
                    className="lv-input"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder={t('mod.updateNamePlaceholder')}
                  />
                </label>
                <label className="lv-field">
                  <span className="lv-label">{t('mod.messageToClientOptional')}</span>
                  <textarea
                    className="lv-textarea"
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    placeholder={t('mod.updateMessagePlaceholder')}
                    rows={3}
                  />
                </label>
                <div className="lv-inline" style={{ justifyContent: 'flex-end' }}>
                  {translator.button}
                </div>
              </div>

              <div>
                <span className="lv-label">{t('m.photos')}</span>
                <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={handleFile} style={{ display: 'none' }} />
                <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" onChange={handleFile} style={{ display: 'none' }} />
                <div className="lv-inline" style={{ marginBottom: 12 }}>
                  <button type="button" className="lv-btn sec sm" onClick={() => cameraInputRef.current?.click()} disabled={uploading}>
                    {uploading ? <Loader2 size={15} className="animate-spin" /> : <Camera size={15} />} {t('a.camera')}
                  </button>
                  <button type="button" className="lv-btn sec sm" onClick={() => fileInputRef.current?.click()} disabled={uploading}>
                    {uploading ? <Loader2 size={15} className="animate-spin" /> : <Upload size={15} />} {t('mod.gallery')}
                  </button>
                </div>

                {photos.length > 0 ? (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
                    {photos.map(photo => (
                      <div key={photo.id}>
                        <div style={{ position: 'relative' }}>
                          <img
                            src={photo.fileUrl}
                            alt={captions[photo.id] || t('mod.jobPhoto')}
                            style={{ width: '100%', aspectRatio: '1', objectFit: 'cover', borderRadius: 'var(--lv-r)', border: '1px solid var(--lv-line)', display: 'block' }}
                          />
                          <button
                            type="button"
                            className="lv-icon-btn"
                            onClick={() => handleDeletePhoto(photo.id)}
                            aria-label={t('mod.removePhoto')}
                            style={{ position: 'absolute', top: 5, right: 5, width: 28, height: 28, background: 'var(--lv-surface)', border: '1px solid var(--lv-line)', color: 'var(--lv-red)' }}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                        <input
                          className="lv-input"
                          value={captions[photo.id] || ''}
                          onChange={e => setCaptions(prev => ({ ...prev, [photo.id]: e.target.value }))}
                          onBlur={e => handleCaptionSave(photo.id, e.target.value)}
                          placeholder={t('mod.photoLabel')}
                          style={{ marginTop: 6, height: 36, padding: '0 10px' }}
                        />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="lv-empty">
                    <Camera size={28} />
                    <h3>{t('mod.noPhotosYet')}</h3>
                    <p>{t('mod.noPhotosYetSub')}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* STEP: choose email or text */}
          {step === 'choose' && (
            <div className="lv-stack">
              <p className="lv-sub">{t('mod.howToGetThisToClient')}</p>
              <div className="lv-card">
                <button type="button" className="lv-row" onClick={() => setStep('email')}>
                  <span className="lv-inline" style={{ flexWrap: 'nowrap', minWidth: 0 }}>
                    <Mail size={18} style={{ color: 'var(--lv-blue)', flexShrink: 0 }} />
                    <span>
                      <span className="lv-row-t" style={{ display: 'block' }}>{t('mod.emailIt')}</span>
                      <span className="lv-row-s" style={{ display: 'block' }}>{t('mod.emailItSub')}</span>
                    </span>
                  </span>
                  <ChevronRight size={18} style={{ color: 'var(--lv-faint)', flexShrink: 0 }} />
                </button>
                <button type="button" className="lv-row" onClick={() => setStep('text')}>
                  <span className="lv-inline" style={{ flexWrap: 'nowrap', minWidth: 0 }}>
                    <MessageSquare size={18} style={{ color: 'var(--lv-blue)', flexShrink: 0 }} />
                    <span>
                      <span className="lv-row-t" style={{ display: 'block' }}>{t('mod.textIt')}</span>
                      <span className="lv-row-s" style={{ display: 'block' }}>{t('mod.textItSub')}</span>
                    </span>
                  </span>
                  <ChevronRight size={18} style={{ color: 'var(--lv-faint)', flexShrink: 0 }} />
                </button>
              </div>
            </div>
          )}

          {/* STEP: email */}
          {step === 'email' && !sendSuccess && (
            <div className="lv-stack">
              {sendError && (
                <div
                  className="lv-card lv-card-pad"
                  style={{ background: 'var(--lv-red-soft)', borderColor: 'var(--lv-red)', display: 'flex', gap: 10, alignItems: 'flex-start' }}
                >
                  <AlertCircle size={18} style={{ color: 'var(--lv-red)', flexShrink: 0, marginTop: 2 }} />
                  <p className="lv-small" style={{ color: 'var(--lv-red)' }}>
                    {t('mod.updateDidNotGoOut', { reason: sendError })}
                  </p>
                </div>
              )}
              <div>
                <label className="lv-field">
                  <span className="lv-label">{t('mod.clientEmailAddress')}</span>
                  <input
                    className="lv-input"
                    value={clientEmail}
                    onChange={e => setClientEmail(e.target.value)}
                    type="email"
                    inputMode="email"
                    autoComplete="email"
                    placeholder={t('mod.clientEmailPlaceholder')}
                    disabled={sending}
                  />
                </label>
              </div>
              <p className="lv-small">{t('mod.theyGetLinkToUpdate', { name: name.trim() || t('mod.thisUpdate') })}</p>
            </div>
          )}

          {/* Email success */}
          {step === 'email' && sendSuccess && (
            <div className="lv-empty">
              <CheckCircle size={40} style={{ color: 'var(--lv-green)' }} />
              <h3>{t('mod.updateSentHeading')}</h3>
              <p>{t('mod.willHaveItInAMoment', { who: clientEmail.trim() || t('mod.yourClient') })}</p>
            </div>
          )}

          {/* STEP: text / copy link */}
          {step === 'text' && (
            <div className="lv-stack">
              <div className="lv-card lv-card-pad">
                <h3 className="lv-h3">{t('mod.sendItInAText')}</h3>
                <p className="lv-sub" style={{ marginTop: 6 }}>
                  {t('mod.copyThenPasteToClient')}
                </p>
              </div>
              {linkCopied && (
                <p className="lv-small lv-inline" style={{ color: 'var(--lv-green)' }}>
                  <Check size={16} /> {t('mod.linkCopiedPaste')}
                </p>
              )}
            </div>
          )}

        </div>

        <div className="lv-modal-foot">
          {step === 'compose' && (
            <div className="lv-actions">
              <button className="lv-btn quiet" onClick={onClose}>{t('a.cancel')}</button>
              <span className="spacer" />
              <button className="lv-btn pri" onClick={handleProceedToSend} disabled={!name.trim()}>
                <Send size={16} /> {t('mod.sendUpdate')}
              </button>
            </div>
          )}

          {step === 'choose' && (
            <div className="lv-actions">
              <button className="lv-btn quiet span" onClick={() => setStep('compose')}>{t('a.back')}</button>
            </div>
          )}

          {step === 'email' && !sendSuccess && (
            <div className="lv-actions">
              <button className="lv-btn quiet" onClick={() => setStep('choose')} disabled={sending}>{t('a.back')}</button>
              <span className="spacer" />
              <button className="lv-btn go" onClick={handleSendEmail} disabled={sending}>
                {sending
                  ? <><Loader2 size={16} className="animate-spin" /> {t('a.sending')}</>
                  : <><Mail size={16} /> {t('mod.sendUpdate')}</>}
              </button>
            </div>
          )}

          {step === 'email' && sendSuccess && (
            <div className="lv-actions">
              <span className="spacer" />
              <button className="lv-btn pri span" onClick={onCreated}>{t('a.done')}</button>
            </div>
          )}

          {step === 'text' && (
            <div className="lv-actions">
              <button
                className="lv-btn quiet"
                onClick={linkCopied ? onCreated : () => setStep('choose')}
                disabled={sending}
              >
                {linkCopied ? t('a.done') : t('a.back')}
              </button>
              <span className="spacer" />
              <button className="lv-btn pri" onClick={handleCopyLink} disabled={sending}>
                {sending
                  ? <><Loader2 size={16} className="animate-spin" /> {t('mod.preparing')}</>
                  : linkCopied
                    ? <><Check size={16} /> {t('mod.linkCopied')}</>
                    : <><Copy size={16} /> {t('a.copyLink')}</>}
              </button>
            </div>
          )}
        </div>

      {translator.panel}
      </div>
    </div>
  );
};
