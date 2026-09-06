import React, { useState, useEffect } from 'react';
import { X, Loader2, CheckCircle, Send } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from './ui/accordion';
import { supabase } from '@/lib/supabase';
import { toast } from '@/components/ui/use-toast';

const FAQS = [
  {
    q: 'How do I create an estimate?',
    a: 'From the Dashboard or Estimates tab, click "+ Estimate", pick or add a client, and add your line items. You can send it to the client by email or text as soon as it\'s ready.',
  },
  {
    q: 'How do I turn an estimate into an invoice?',
    a: 'Open an approved estimate and use "Convert to Invoice" — it carries over the client and line items so you don\'t have to re-enter anything.',
  },
  {
    q: 'How do clients pay me?',
    a: 'Connect your bank account under Dashboard > Set Up Payments (powered by Stripe). Once connected, clients can pay invoices online and funds go straight to your account.',
  },
  {
    q: 'How do I send job photos or progress updates?',
    a: 'Use the Photos tab to upload photos to a job, then send an update to your client by email or text with a link to view them.',
  },
  {
    q: 'How does billing work?',
    a: 'LevelWorks is $5/month after your free trial. You can view your plan status or cancel anytime from Account > Billing.',
  },
];

interface HelpModalProps {
  onClose: () => void;
}

export const HelpModal: React.FC<HelpModalProps> = ({ onClose }) => {
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
      toast({ title: 'Missing info', description: 'Please enter your email and a message.', variant: 'destructive' });
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
      toast({ title: 'Failed to send', description: err.message || 'Please try again.', variant: 'destructive' });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="lv-scrim" onClick={onClose}>
      <div className="lv-modal" onClick={e => e.stopPropagation()}>

        <div className="lv-modal-head">
          <div>
            <span className="lv-eyebrow">Support</span>
            <h2 className="lv-h2">{showForm ? 'Contact us' : 'Help and FAQs'}</h2>
          </div>
          <button className="lv-icon-btn" onClick={onClose} aria-label="Close">
            <X size={20} />
          </button>
        </div>

        <div className="lv-modal-body">
          {!showForm && (
            <>
              <Accordion type="single" collapsible>
                {FAQS.map((item, i) => (
                  <AccordionItem key={i} value={`faq-${i}`}>
                    <AccordionTrigger className="lv-h3">{item.q}</AccordionTrigger>
                    <AccordionContent className="lv-sub">{item.a}</AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
              <p className="lv-small" style={{ marginTop: 18 }}>
                Still need help? Send us a message and we'll get back to you.
              </p>
            </>
          )}

          {showForm && !sent && (
            <div className="lv-stack">
              <p className="lv-sub">Tell us what's going on and we'll come back to you by email.</p>
              <div>
                <label className="lv-field">
                  <span className="lv-label">Your name</span>
                  <input
                    className="lv-input"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    autoComplete="name"
                    placeholder="Eric Connor"
                    disabled={sending}
                  />
                </label>
                <label className="lv-field">
                  <span className="lv-label">Your email</span>
                  <input
                    className="lv-input"
                    type="email"
                    inputMode="email"
                    autoComplete="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="you@email.com"
                    disabled={sending}
                  />
                </label>
                <label className="lv-field">
                  <span className="lv-label">Message</span>
                  <textarea
                    className="lv-textarea"
                    value={message}
                    onChange={e => setMessage(e.target.value)}
                    rows={5}
                    placeholder="What can we help with?"
                    disabled={sending}
                  />
                </label>
              </div>
            </div>
          )}

          {showForm && sent && (
            <div className="lv-empty">
              <CheckCircle size={40} style={{ color: 'var(--lv-green)' }} />
              <h3>Message sent</h3>
              <p>We'll get back to you at {email.trim() || 'your email'} as soon as we can.</p>
            </div>
          )}
        </div>

        <div className="lv-modal-foot">
          {!showForm ? (
            <div className="lv-actions">
              <button className="lv-btn quiet" onClick={onClose}>Close</button>
              <span className="spacer" />
              <button className="lv-btn pri" onClick={() => setShowForm(true)}>Contact us</button>
            </div>
          ) : sent ? (
            <div className="lv-actions">
              <span className="spacer" />
              <button className="lv-btn pri span" onClick={onClose}>Close</button>
            </div>
          ) : (
            <div className="lv-actions">
              <button className="lv-btn quiet" onClick={() => setShowForm(false)} disabled={sending}>Back</button>
              <span className="spacer" />
              <button className="lv-btn pri" onClick={handleSend} disabled={sending}>
                {sending
                  ? <><Loader2 size={16} className="animate-spin" /> Sending…</>
                  : <><Send size={16} /> Send message</>}
              </button>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
