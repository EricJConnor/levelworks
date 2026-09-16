import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useInvoices } from '@/contexts/InvoiceContext';
import { sendInvoiceEmail } from '@/lib/edgeFunctions';
import { toast } from '@/components/ui/use-toast';
import { X, Mail, MessageSquare, Loader2, AlertCircle, CheckCircle, Copy, Check, ChevronRight, Send } from 'lucide-react';
import { useT } from '@/i18n';
import { canOpenMessagesApp, openMessagesApp } from '@/lib/smsLink';

/**
 * The invoice twin of SendEstimateModal: email it, or text it from his own
 * phone, or copy the link. Opens right after an estimate is converted so the
 * invoice can go out in the same breath instead of from the Invoices list.
 * The invoice must already be saved; `invoice` is the camelCase row.
 */
interface Props {
  invoice: any;
  onClose: () => void;
  onSuccess?: () => void;
}

type SendMethod = null | 'email' | 'text';

export const SendInvoiceModal: React.FC<Props> = ({ invoice, onClose, onSuccess }) => {
  const { updateInvoice } = useInvoices();
  const t = useT();
  const [sendMethod, setSendMethod] = useState<SendMethod>(null);
  const [clientEmail, setClientEmail] = useState(invoice?.clientEmail || '');
  const [clientPhone, setClientPhone] = useState(invoice?.clientPhone || '');
  const [isSending, setIsSending] = useState(false);
  const [sendStatus, setSendStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [linkCopied, setLinkCopied] = useState(false);
  const onPhone = canOpenMessagesApp();

  const isMountedRef = useRef(true);
  useEffect(() => {
    isMountedRef.current = true;
    return () => { isMountedRef.current = false; };
  }, []);

  if (!invoice) return null;

  const projectName = invoice.projectName || t('m.project');
  const clientName = invoice.clientName || t('m.client');
  const total = Number(invoice.total) || 0;
  const amountDue = total - (Number(invoice.amountPaid) || 0);
  const viewToken: string = invoice.viewToken || '';
  const invoiceUrl = viewToken ? `${window.location.origin}/view-invoice/${viewToken}` : '';

  const markSent = async () => {
    try { await updateInvoice(invoice.id, { sentAt: new Date().toISOString() }); }
    catch (err) { console.error('Could not mark invoice sent:', err); }
  };

  /** The words that land in his Messages app. He can edit them before sending. */
  const smsBody = () => t('mod.invoiceSmsBody', {
    name: (clientName || '').split(' ')[0] || clientName,
    project: projectName,
    url: invoiceUrl,
  });

  const handleOpenMessages = async () => {
    if (!invoiceUrl) return;
    openMessagesApp(clientPhone, smsBody());
    await markSent();
  };

  const handleCopyLink = async () => {
    if (!invoiceUrl) return;
    try {
      await navigator.clipboard.writeText(invoiceUrl);
      setLinkCopied(true);
      toast({ title: t('a.copied'), description: t('mod.pasteIntoMessagesApp') });
      await markSent();
      setTimeout(() => { if (isMountedRef.current) setLinkCopied(false); }, 3000);
    } catch {
      toast({ title: t('e.somethingWrong'), description: t('mod.couldNotCopyLink'), variant: 'destructive' });
    }
  };

  const handleSendEmail = async () => {
    const email = clientEmail.trim();
    if (!email) {
      toast({ title: t('e.somethingWrong'), description: t('mod.enterClientEmail'), variant: 'destructive' });
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
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

    try {
      const { data: { user } } = await supabase.auth.getUser();
      const result = await sendInvoiceEmail({
        invoiceId: invoice.id,
        clientEmail: email,
        invoiceData: {
          invoiceNumber: invoice.invoiceNumber,
          clientName,
          clientEmail: email,
          clientPhone,
          projectName,
          total,
          amountDue,
          issueDate: invoice.issueDate || new Date().toISOString(),
          dueDate: invoice.dueDate || undefined,
          notes: invoice.notes || undefined,
          viewToken,
        },
        userId: user?.id,
      });

      if (!isMountedRef.current) return;

      const failed = result.error || result.data?.success === false;
      if (failed) {
        const errorMsg = result.error?.message || result.data?.error || t('mod.failedToSendEmail');
        setErrorMessage(errorMsg);
        setSendStatus('error');
        setIsSending(false);
        toast({ title: t('mod.failedToSend'), description: errorMsg, variant: 'destructive' });
        return;
      }

      setSendStatus('success');
      setIsSending(false);
      toast({ title: t('inv.sent'), description: t('mod.emailSentTo', { email }), duration: 5000 });

      try { await updateInvoice(invoice.id, { sentAt: new Date().toISOString(), clientEmail: email }); }
      catch (err) { console.error('Could not mark invoice sent:', err); }

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

  const money = `$${total.toFixed(2)}`;

  return (
    <div className="lv-scrim">
      <div className="lv-modal">

        <div className="lv-modal-head">
          <div>
            <span className="lv-eyebrow">{t('m.invoice')}</span>
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

            {!sendMethod && sendStatus !== 'success' && (
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
                      {t('mod.invoiceDidNotGoOut', { reason: errorMessage })}
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
                <p className="lv-small">{t('mod.clientGetsLinkToPay')}</p>
              </>
            )}

            {sendStatus === 'success' && (
              <div className="lv-empty">
                <CheckCircle size={40} style={{ color: 'var(--lv-green)' }} />
                <h3>{t('inv.sent')}</h3>
                <p>{t('mod.willHaveItInAMoment', { who: clientEmail.trim() || t('mod.yourClient') })}</p>
              </div>
            )}

            {sendMethod === 'text' && sendStatus !== 'success' && (
              <>
                <div className="lv-card lv-card-pad">
                  <h3 className="lv-h3">{onPhone ? t('mod.textFromYourPhone') : t('mod.sendItInAText')}</h3>
                  <p className="lv-sub" style={{ marginTop: 6 }}>
                    {onPhone ? t('mod.textFromYourPhoneSub') : t('mod.copyThenPasteToClient')}
                  </p>

                  {onPhone && (
                    <>
                      <label className="lv-field" style={{ marginTop: 14 }}>
                        <span className="lv-label">{t('m.phone')}</span>
                        <input
                          className="lv-input"
                          type="tel"
                          inputMode="tel"
                          value={clientPhone}
                          onChange={(e) => setClientPhone(e.target.value)}
                          placeholder={t('est.phonePlaceholder')}
                        />
                      </label>
                      <p className="lv-small" style={{ marginTop: 8 }}>
                        {clientPhone.trim() ? t('mod.smsPreviewHint') : t('mod.smsNoNumberHint')}
                      </p>
                      <div className="lv-card" style={{ marginTop: 10, padding: 12, background: 'var(--lv-surface-2)' }}>
                        <p className="lv-small" style={{ color: 'var(--lv-ink-2)', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                          {smsBody()}
                        </p>
                      </div>
                    </>
                  )}

                  {!onPhone && invoiceUrl && (
                    <p className="lv-small" style={{ marginTop: 10, wordBreak: 'break-all', color: 'var(--lv-faint)' }}>
                      {invoiceUrl}
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
              <button className="lv-btn go" onClick={handleSendEmail} disabled={isSending || !viewToken}>
                {isSending
                  ? <><Loader2 size={16} className="animate-spin" /> {t('a.sending')}</>
                  : <><Mail size={16} /> {t('inv.sendInvoice')}</>}
              </button>
            </div>
          ) : sendMethod === 'text' ? (
            <div className="lv-actions">
              <button className="lv-btn quiet" onClick={onClose}>{t('a.done')}</button>
              <span className="spacer" />
              <button className="lv-btn sec" onClick={handleCopyLink} disabled={!viewToken}>
                {linkCopied ? <><Check size={16} /> {t('mod.linkCopied')}</> : <><Copy size={16} /> {t('a.copyLink')}</>}
              </button>
              {onPhone && (
                <button className="lv-btn pri span" onClick={handleOpenMessages} disabled={!viewToken}>
                  <Send size={16} /> {t('mod.openMessages')}
                </button>
              )}
            </div>
          ) : (
            <div className="lv-actions">
              <button className="lv-btn quiet span" onClick={onClose} disabled={isSending}>{t('mod.sendLater')}</button>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
