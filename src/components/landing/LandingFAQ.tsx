
import { useState } from 'react';
import { ChevronDown, Gift } from 'lucide-react';

const faqs = [
  { q: 'How much does it cost?', a: 'Level costs just $5/month with all features included. Once you lock in your rate, it never changes! We also offer a 30-day free trial so you can try everything before committing.' },
  { q: 'How does the referral program work?', a: 'Once you\'re a subscriber, you get a unique referral link to share with friends. When someone signs up using your link, you BOTH get a free month added to your subscription. There\'s no limit - refer 10 friends and get 10 free months!', highlight: true, icon: 'gift' },
  { q: 'How do push notifications work?', a: 'When you enable push notifications, you\'ll receive instant alerts on your device whenever a client views your estimate, signs it, or when someone uses your referral code.' },
  { q: 'Can clients sign estimates on their phone?', a: 'Yes! Clients can view and sign estimates on any device - phone, tablet, or computer. They simply draw their signature with their finger or mouse.' },
  { q: 'How do I send invoices to clients?', a: 'When you send an invoice, your customer receives a link to view the invoice details. You can track when they view it and follow up as needed.' },
  { q: 'Is my data secure?', a: 'Absolutely. We use bank-level 256-bit encryption for all data. Your information is stored securely and protected with industry-standard security practices.' },
  { q: 'Can I try it before paying?', a: 'Yes! We offer a 30-day free trial with full access to all features. If you sign up with a referral link, you get 60 days free!' },
  { q: 'What kind of questions can I ask the AI?', a: 'The AI assistant can help with building codes, material recommendations, pricing guidance, best practices, and general contractor questions. It\'s like having an expert consultant available 24/7.' }
];

export default function LandingFAQ() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section className="container mx-auto px-6 py-20 border-t border-blue-900/30">
      <div className="text-center mb-16">
        <h2 className="text-4xl font-bold text-white mb-4">Frequently Asked Questions</h2>
        <p className="text-xl text-blue-200">Got questions? We've got answers.</p>
      </div>
      <div className="max-w-3xl mx-auto space-y-4">
        {faqs.map((faq, i) => (
          <div key={i} className={`bg-slate-900/50 border rounded-xl overflow-hidden ${faq.highlight ? 'border-purple-500/50' : 'border-blue-900/30'}`}>
            <button onClick={() => setOpen(open === i ? null : i)} className="w-full flex items-center justify-between p-5 text-left">
              <span className="font-semibold text-white flex items-center gap-2">
                {faq.icon === 'gift' && <Gift className="w-4 h-4 text-purple-400" />}
                {faq.q}
              </span>
              <ChevronDown className={`w-5 h-5 text-blue-400 transition-transform ${open === i ? 'rotate-180' : ''}`} />
            </button>
            {open === i && <div className="px-5 pb-5 text-blue-200">{faq.a}</div>}
          </div>
        ))}
      </div>
    </section>
  );
}
