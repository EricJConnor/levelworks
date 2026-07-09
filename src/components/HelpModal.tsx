import React from 'react';
import { X } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from './ui/accordion';
import { Button } from './ui/button';

const SUPPORT_EMAIL = 'help@levelworks.org';
const SUPPORT_MAILTO = `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent('LevelWorks Help')}`;

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
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }} onClick={onClose}>
      <div
        style={{ background: '#fff', borderRadius: '14px', maxWidth: '480px', width: '100%', maxHeight: '85vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 20px', borderBottom: '0.5px solid #e4e4e7' }}>
          <h2 style={{ fontSize: '18px', fontWeight: '600', color: '#18181b', margin: 0 }}>Help &amp; FAQs</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#71717a', cursor: 'pointer', padding: '4px' }}>
            <X size={20} />
          </button>
        </div>

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
          <Button asChild style={{ width: '100%' }}>
            <a href={SUPPORT_MAILTO}>Contact Us</a>
          </Button>
        </div>
      </div>
    </div>
  );
};
