import React, { useState, useEffect } from 'react';
import { X, Loader2, CheckCircle, Send } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from './ui/accordion';
import { supabase } from '@/lib/supabase';
import { toast } from '@/components/ui/use-toast';
import { useT } from '@/i18n';

type T = (key: string, vars?: Record<string, string | number>) => string;

const faqs = (t: T) => [
  { q: t('mod.faqCreateEstimateQ'), a: t('mod.faqCreateEstimateA') },
  { q: t('mod.faqConvertToInvoiceQ'), a: t('mod.faqConvertToInvoiceA') },
  { q: t('mod.faqHowClientsPayQ'), a: t('mod.faqHowClientsPayA') },
  { q: t('mod.faqJobPhotosQ'), a: t('mod.faqJobPhotosA') },
  { q: t('mod.faqBillingQ'), a: t('mod.faqBillingA') },
];

interface HelpModalProps {
  onClose: () => void;
}

export const HelpModal: React.FC<HelpModalProps> = ({ onClose }) => {
  const t = useT();
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user?.email) setEmail(user.email);
    });
  }, []);

  const handleSend = async () => {
    if (!email.trim() || !message.trim()) {
      toast({ title: t('mod.missingInfo'), description: t('mod.enterEmailAndMessage'), variant: 'destructive' });
      return;
    }
    setSending(true);
    try {
      const { error } = await supabase.functions.invoke('send-contact-email', {
        body: { name: name.trim(), email: email.trim(), message: message.trim() },
      });
      if (error) throw error;
      setSent(true);
    } catch (err: any) {
      toast({ title: t('mod.failedToSend'), description: err.message || t('e.tryAgain'), variant: 'destructive' });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="lv-scrim" onClick={onClose}>
      <div className="lv-modal" onClick={e => e.stopPropagation()}>

        <div className="lv-modal-head">
          <div>
            <span className="lv-eyebrow">{t('mod.support')}</span>
            <h2 className="lv-h2">{showForm ? t('mod.contactUs') : t('mod.helpAndFaqs')}</h2>
          </div>
          <button className="lv-icon-btn" onClick={onClose} aria-label={t('a.close')}>
            <X size={20} />
          </button>
        </div>

        <div className="lv-modal-body">
          {!showForm && (
            <>
              <Accordion type="single" collapsible>
                {faqs(t).map((item, i) => (
                  <AccordionItem key={i} value={`faq-${i}`}>
                    <AccordionTrigger className="lv-h3">{item.q}</AccordionTrigger>
                    <AccordionContent className="lv-sub">{item.a}</AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
              <p className="lv-small" style={{ marginTop: 18 }}>
                {t('mod.stillNeedHelp')}
              </p>
            </>
          )}

          {showForm && !sent && (
            <div className="lv-stack">
              <p className="lv-sub">{t('mod.tellUsWhatsGoingOn')}</p>
              <div>
                <label className="lv-field">
                  <span className="lv-label">{t('mod.yourName')}</span>
                  <input
                    className="lv-input"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    autoComplete="name"
                    placeholder={t('mod.yourNamePlaceholder')}
                    disabled={sending}
                  />
                </label>
                <label className="lv-field">
                  <span className="lv-label">{t('mod.yourEmail')}</span>
                  <input
                    className="lv-input"
                    type="email"
                    inputMode="email"
                    autoComplete="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder={t('mod.emailPlaceholder')}
                    disabled={sending}
                  />
                </label>
                <label className="lv-field">
                  <span className="lv-label">{t('mod.message')}</span>
                  <textarea
                    className="lv-textarea"
                    value={message}
                    onChange={e => setMessage(e.target.value)}
                    rows={5}
                    placeholder={t('mod.whatCanWeHelpWith')}
                    disabled={sending}
                  />
                </label>
              </div>
            </div>
          )}

          {showForm && sent && (
            <div className="lv-empty">
              <CheckCircle size={40} style={{ color: 'var(--lv-green)' }} />
              <h3>{t('mod.messageSent')}</h3>
              <p>{t('mod.weWillGetBackToYouAt', { email: email.trim() || t('mod.yourEmailFallback') })}</p>
            </div>
          )}
        </div>

        <div className="lv-modal-foot">
          {!showForm ? (
            <div className="lv-actions">
              <button className="lv-btn quiet" onClick={onClose}>{t('a.close')}</button>
              <span className="spacer" />
              <button className="lv-btn pri" onClick={() => setShowForm(true)}>{t('mod.contactUs')}</button>
            </div>
          ) : sent ? (
            <div className="lv-actions">
              <span className="spacer" />
              <button className="lv-btn pri span" onClick={onClose}>{t('a.close')}</button>
            </div>
          ) : (
            <div className="lv-actions">
              <button className="lv-btn quiet" onClick={() => setShowForm(false)} disabled={sending}>{t('a.back')}</button>
              <span className="spacer" />
              <button className="lv-btn pri" onClick={handleSend} disabled={sending}>
                {sending
                  ? <><Loader2 size={16} className="animate-spin" /> {t('a.sending')}</>
                  : <><Send size={16} /> {t('mod.sendMessage')}</>}
              </button>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
