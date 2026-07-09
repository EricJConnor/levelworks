import React, { useState, useEffect } from 'react';
import { X, Loader2 } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from './ui/accordion';
import { Button } from './ui/button';
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
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }} onClick={onClose}>
      <div
        style={{ background: '#fff', borderRadius: '14px', maxWidth: '480px', width: '100%', maxHeight: '85vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 20px', borderBottom: '0.5px solid #e4e4e7' }}>
          <h2 style={{ fontSize: '18px', fontWeight: '600', color: '#18181b', margin: 0 }}>{showForm ? 'Contact Us' : 'Help & FAQs'}</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#71717a', cursor: 'pointer', padding: '4px' }}>
            <X size={20} />
          </button>
        </div>

        {!showForm && (
          <>
            <div style={{ padding: '8px 20px', overflowY: 'auto' }}>
              <Accordion type="single" collapsible>
                {FAQS.map((item, i) => (
                  <AccordionItem key={i} value={`faq-${i}`}>
                    <AccordionTrigger style={{ fontSize: '14px', color: '#18181b' }}>{item.q}</AccordionTrigger>
                    <AccordionContent style={{ fontSize: '13px' }}>{item.a}</AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>

            <div style={{ padding: '16px 20px', borderTop: '0.5px solid #e4e4e7', textAlign: 'center' }}>
              <p style={{ fontSize: '13px', color: '#71717a', margin: '0 0 10px' }}>Still need help?</p>
              <Button style={{ width: '100%' }} onClick={() => setShowForm(true)}>Contact Us</Button>
            </div>
          </>
        )}

        {showForm && (
          <div style={{ padding: '20px' }}>
            {sent ? (
              <div style={{ textAlign: 'center', padding: '20px 0' }}>
                <p style={{ fontSize: '15px', color: '#18181b', fontWeight: '500', marginBottom: '6px' }}>Message sent</p>
                <p style={{ fontSize: '13px', color: '#71717a', marginBottom: '20px' }}>We'll get back to you as soon as we can.</p>
                <Button style={{ width: '100%' }} onClick={onClose}>Close</Button>
              </div>
            ) : (
              <>
                <div style={{ marginBottom: '12px' }}>
                  <label style={{ fontSize: '13px', color: '#52525b', display: 'block', marginBottom: '4px' }}>Name</label>
                  <input
                    value={name}
                    onChange={e => setName(e.target.value)}
                    style={{ width: '100%', padding: '9px 12px', border: '1px solid #e4e4e7', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box' }}
                  />
                </div>
                <div style={{ marginBottom: '12px' }}>
                  <label style={{ fontSize: '13px', color: '#52525b', display: 'block', marginBottom: '4px' }}>Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    style={{ width: '100%', padding: '9px 12px', border: '1px solid #e4e4e7', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box' }}
                  />
                </div>
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ fontSize: '13px', color: '#52525b', display: 'block', marginBottom: '4px' }}>Message</label>
                  <textarea
                    value={message}
                    onChange={e => setMessage(e.target.value)}
                    rows={4}
                    style={{ width: '100%', padding: '9px 12px', border: '1px solid #e4e4e7', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box', resize: 'vertical' }}
                  />
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <Button variant="outline" style={{ flex: 1 }} onClick={() => setShowForm(false)} disabled={sending}>Back</Button>
                  <Button style={{ flex: 1 }} onClick={handleSend} disabled={sending}>
                    {sending ? <Loader2 size={16} className="animate-spin" /> : 'Send'}
                  </Button>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
