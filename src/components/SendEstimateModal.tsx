import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useData } from '@/contexts/DataContext';
import { useProfile } from '@/contexts/ProfileContext';
import { toast } from '@/components/ui/use-toast';
import { X, Mail, MessageSquare, Loader2, AlertCircle, CheckCircle, Copy, Check, ChevronRight } from 'lucide-react';
import { useT } from '@/i18n';

interface Props {
  estimateData?: any;
  estimate?: any;
  onClose: () => void;
  onSuccess?: () => void;
}

type SendMethod = null | 'email' | 'text';

export const SendEstimateModal: React.FC<Props> = ({ estimateData, estimate, onClose, onSuccess }) => {
  const data = estimateData || estimate;
  const { refreshEstimates } = useData();
  const { profile } = useProfile();
  const t = useT();
  const [sendMethod, setSendMethod] = useState<SendMethod>(null);
  const [clientEmail, setClientEmail] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [viewToken, setViewToken] = useState<string | null>(null);
  const [isGeneratingToken, setIsGeneratingToken] = useState(false);
  const [sendStatus, setSendStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [linkCopied, setLinkCopied] = useState(false);

  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => { isMountedRef.current = false; };
  }, []);

  const generateAndSaveViewToken = async () => {
    if (!data?.id) return;
    setIsGeneratingToken(true);
    try {
      const newToken = crypto.randomUUID();
      const { error } = await supabase
        .from('estimates')
        .update({ view_token: newToken })
        .eq('id', data.id);
      if (!error && isMountedRef.current) {
        setViewToken(newToken);
        refreshEstimates().catch(() => {});
      }
    } catch (err) {
      console.error('Token generation error:', err);
    } finally {
      if (isMountedRef.current) setIsGeneratingToken(false);
    }
  };

  useEffect(() => {
    if (data) {
      setClientEmail(data.clientEmail || data.client_email || '');
      const token = data.viewToken || data.view_token;
      if (token && typeof token === 'string' && token.trim()) {
        setViewToken(token);
      } else {
        generateAndSaveViewToken();
      }
    }
  }, [data]);

  if (!data) return null;

  const projectName = data.projectName || data.project_name || t('m.project');
  const clientName = data.clientName || data.client_name || t('m.client');
  const totalAmount = Number(data.total) || 0;
  const estimateId = data.id;
  const estimateUrl = viewToken ? `${window.location.origin}/view-estimate/${viewToken}` : '';

  const handleCopyLink = async () => {
    if (!estimateUrl) return;
    try {
      await navigator.clipboard.writeText(estimateUrl);
      setLinkCopied(true);
      toast({ title: t('a.copied'), description: t('mod.pasteIntoMessagesApp') });
      if (estimateId) {
        await supabase
          .from('estimates')
          .update({ status: 'sent', sent_at: new Date().toISOString() })
          .eq('id', estimateId);
        refreshEstimates().catch(() => {});
      }
      setTimeout(() => { if (isMountedRef.current) setLinkCopied(false); }, 3000);
    } catch (err) {
      toast({ title: t('e.somethingWrong'), description: t('mod.couldNotCopyLink'), variant: 'destructive' });
    }
  };

  const handleSendEmail = async () => {
    if (!clientEmail.trim()) {
      toast({ title: t('e.somethingWrong'), description: t('mod.enterClientEmail'), variant: 'destructive' });
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(clientEmail.trim())) {
      toast({ title: t('e.somethingWrong'), description: t('mod.enterValidEmail'), variant: 'destructive' });
      return;
    }
    if (!viewToken) {
      toast({ title: t('e.somethingWrong'), description: t('mod.couldNotMakeLink'), variant: 'destructive' });
      return;
    }

    setIsSending(true);
    setSendStatus('sending');
    setErrorMessage(null);

    const contractorName = profile?.full_name || profile?.company_name || 'Your Contractor';

    try {
      const { data: result, error } = await supabase.functions.invoke('send-email', {
        body: {
          to: clientEmail.trim(),
          templateType: 'estimate_sent',
          data: { clientName, projectName, amount: totalAmount.toFixed(2), estimateUrl, contractorName }
        }
      });

      if (!isMountedRef.current) return;

      if (error || result?.success === false) {
        const errorMsg = error?.message || result?.error || t('mod.failedToSendEmail');
        setErrorMessage(errorMsg);
        setSendStatus('error');
        setIsSending(false);
        toast({ title: t('mod.failedToSend'), description: errorMsg, variant: 'destructive' });
        return;
      }

      setSendStatus('success');
      setIsSending(false);
      toast({ title: t('mod.estimateSent'), description: t('mod.emailSentTo', { email: clientEmail.trim() }), duration: 5000 });

      if (estimateId) {
        await supabase
          .from('estimates')
          .update({ status: 'sent', sent_at: new Date().toISOString(), client_email: clientEmail.trim() })
          .eq('id', estimateId);
        refreshEstimates().catch(() => {});
      }

      onSuccess?.();
      setTimeout(() => { if (isMountedRef.current) onClose(); }, 1500);

    } catch (err: any) {
      if (!isMountedRef.current) return;
      setIsSending(false);
      const errorMsg = err?.message || t('mod.unexpectedError');
      setErrorMessage(errorMsg);
      setSendStatus('error');
      toast({ title: t('e.somethingWrong'), description: errorMsg, variant: 'destructive' });
    }
  };

  const money = `$${totalAmount.toFixed(2)}`;

  return (
    <div className="lv-scrim">
      <div className="lv-modal">

        <div className="lv-modal-head">
          <div>
            <span className="lv-eyebrow">{t('m.estimate')}</span>
            <h2 className="lv-h2">{t('mod.sendToYourClient')}</h2>
          </div>
          <button className="lv-icon-btn" onClick={onClose} disabled={isSending} aria-label={t('a.close')}>
            <X size={20} />
          </button>
        </div>

        <div className="lv-modal-body">
          <div className="lv-stack">

            <div className="lv-card">
              <div className="lv-row">
                <div style={{ minWidth: 0 }}>
                  <div className="lv-row-t">{projectName}</div>
                  <div className="lv-row-s">{clientName}</div>
                </div>
                <div className="lv-row-r lv-num">{money}</div>
              </div>
            </div>

            {isGeneratingToken && (
              <p className="lv-small lv-inline">
                <Loader2 size={16} className="animate-spin" /> {t('mod.gettingLinkReady')}
              </p>
            )}

            {!sendMethod && !isGeneratingToken && sendStatus !== 'success' && (
              <div className="lv-card">
                <button type="button" className="lv-row" onClick={() => setSendMethod('email')}>
                  <span className="lv-inline" style={{ flexWrap: 'nowrap', minWidth: 0 }}>
                    <Mail size={18} style={{ color: 'var(--lv-blue)', flexShrink: 0 }} />
                    <span>
                      <span className="lv-row-t" style={{ display: 'block' }}>{t('mod.emailIt')}</span>
                      <span className="lv-row-s" style={{ display: 'block' }}>{t('mod.emailItSub')}</span>
                    </span>
                  </span>
                  <ChevronRight size={18} style={{ color: 'var(--lv-faint)', flexShrink: 0 }} />
                </button>
                <button type="button" className="lv-row" onClick={() => setSendMethod('text')}>
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
            )}

            {sendMethod === 'email' && sendStatus !== 'success' && (
              <>
                {sendStatus === 'error' && errorMessage && (
                  <div
                    className="lv-card lv-card-pad"
                    style={{ background: 'var(--lv-red-soft)', borderColor: 'var(--lv-red)', display: 'flex', gap: 10, alignItems: 'flex-start' }}
                  >
                    <AlertCircle size={18} style={{ color: 'var(--lv-red)', flexShrink: 0, marginTop: 2 }} />
                    <p className="lv-small" style={{ color: 'var(--lv-red)' }}>
                      {t('mod.estimateDidNotGoOut', { reason: errorMessage })}
                    </p>
                  </div>
                )}

                <div>
                  <label className="lv-field">
                    <span className="lv-label">{t('mod.clientEmailAddress')}</span>
                    <input
                      className="lv-input"
                      value={clientEmail}
                      onChange={(e) => setClientEmail(e.target.value)}
                      type="email"
                      inputMode="email"
                      autoComplete="email"
                      placeholder={t('mod.clientEmailPlaceholder')}
                      disabled={isSending}
                    />
                  </label>
                </div>
                <p className="lv-small">{t('mod.clientGetsLinkToApprove')}</p>
              </>
            )}

            {sendStatus === 'success' && (
              <div className="lv-empty">
                <CheckCircle size={40} style={{ color: 'var(--lv-green)' }} />
                <h3>{t('mod.estimateSentHeading')}</h3>
                <p>{t('mod.willHaveItInAMoment', { who: clientEmail.trim() || t('mod.yourClient') })}</p>
              </div>
            )}

            {sendMethod === 'text' && sendStatus !== 'success' && (
              <>
                <div className="lv-card lv-card-pad">
                  <h3 className="lv-h3">{t('mod.sendItInAText')}</h3>
                  <p className="lv-sub" style={{ marginTop: 6 }}>
                    {t('mod.copyThenPasteToClient')}
                  </p>
                  {estimateUrl && (
                    <p className="lv-small" style={{ marginTop: 10, wordBreak: 'break-all', color: 'var(--lv-faint)' }}>
                      {estimateUrl}
                    </p>
                  )}
                </div>
                {linkCopied && (
                  <p className="lv-small lv-inline" style={{ color: 'var(--lv-green)' }}>
                    <Check size={16} /> {t('mod.linkCopiedPaste')}
                  </p>
                )}
              </>
            )}

          </div>
        </div>

        <div className="lv-modal-foot">
          {sendStatus === 'success' ? (
            <div className="lv-actions">
              <span className="spacer" />
              <button className="lv-btn pri span" onClick={onClose}>{t('a.done')}</button>
            </div>
          ) : sendMethod === 'email' ? (
            <div className="lv-actions">
              <button className="lv-btn quiet" onClick={() => setSendMethod(null)} disabled={isSending}>{t('a.back')}</button>
              <span className="spacer" />
              <button
                className="lv-btn go"
                onClick={handleSendEmail}
                disabled={isSending || !viewToken || isGeneratingToken}
              >
                {isSending
                  ? <><Loader2 size={16} className="animate-spin" /> {t('a.sending')}</>
                  : <><Mail size={16} /> {t('mod.sendEstimate')}</>}
              </button>
            </div>
          ) : sendMethod === 'text' ? (
            <div className="lv-actions">
              <button className="lv-btn quiet" onClick={onClose}>{t('a.done')}</button>
              <span className="spacer" />
              <button
                className="lv-btn pri"
                onClick={handleCopyLink}
                disabled={!viewToken || isGeneratingToken}
              >
                {linkCopied ? <><Check size={16} /> {t('mod.linkCopied')}</> : <><Copy size={16} /> {t('a.copyLink')}</>}
              </button>
            </div>
          ) : (
            <div className="lv-actions">
              <button className="lv-btn quiet span" onClick={onClose} disabled={isSending}>{t('a.cancel')}</button>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
