// Everything a search engine or an AI answer engine is told about LevelWorks
// lives here, once. The landing page reads it for the visible FAQ, and
// scripts/prerender.mjs reads it at build time for the structured data that
// goes into the shipped HTML, so the two can never say different things.

export const SITE = {
  name: 'LevelWorks',
  legalName: 'Level Works LLC',
  url: 'https://levelworks.org',
  email: 'support@levelworks.org',
  title: 'LevelWorks – Contractor Estimates, Invoices & Payments App | $5/month',
  description:
    'LevelWorks is contractor software for estimates, digital signatures, invoices, online card payments, automated recurring billing, client management and job-site photo updates. One flat $5/month plan with everything included. 30-day free trial, no credit card required.',
  tagline: 'Run your business. Not your paperwork.',
  priceUsd: 5,
  trialDays: 30,
};

export const FEATURES = [
  'Unlimited estimates',
  'Digital signatures from any device',
  'Invoicing (convert an estimate to an invoice in one tap)',
  'Online card payments (Visa, Mastercard, American Express, Apple Pay, Google Pay) paid straight to your bank',
  'Automated recurring billing for maintenance and service contracts',
  'Custom branding with your logo on every estimate and invoice',
  'Job-site photo updates sent to clients',
  'Client database',
  'Job notes synced across devices',
  'Email and text sending',
  'Push notifications when a client views or signs',
  'Referral program',
];

export const FAQS: { q: string; a: string }[] = [
  {
    q: 'What is LevelWorks?',
    a: 'LevelWorks is a web app for contractors and trades businesses that handles estimates, digital signatures, invoices, online card payments, recurring billing, client records, job notes and job-site photo updates in one place. It runs in the browser on any phone, tablet or computer, and can be added to your home screen like an app.',
  },
  {
    q: 'How much does LevelWorks cost?',
    a: '$5 a month, flat. Every feature is included, there are no tiers or add-ons, and you can cancel anytime. Most contractor estimating and invoicing apps charge $19 to $150 a month.',
  },
  {
    q: 'Is there a free trial?',
    a: 'Yes. Every new account gets a 30-day free trial with full access and no credit card required. Sign up through a referral link and the trial is 60 days.',
  },
  {
    q: 'Can my clients sign estimates on their phone?',
    a: 'Yes. You email or text a link, the client opens it on any device, reviews the estimate and signs with a finger or mouse. You are notified the moment they sign.',
  },
  {
    q: 'Can clients pay invoices online?',
    a: 'Yes. Clients pay by Visa, Mastercard, American Express, Apple Pay or Google Pay from the invoice link, and the money goes straight to your bank account. Payments are processed by Stripe and included with the $5 plan; Stripe’s standard card processing rates apply.',
  },
  {
    q: 'Does LevelWorks do recurring billing?',
    a: 'Yes. Put a client on any schedule, such as monthly, quarterly, every four months or yearly, and their card is charged automatically. Failed payments are retried, you get an instant alert, and the client is flagged past due on your dashboard.',
  },
  {
    q: 'Do I need to install an app?',
    a: 'No. LevelWorks runs in the browser on iPhone, Android and desktop. Add it to your home screen and it opens like a native app, with push notifications when a client views or signs an estimate.',
  },
  {
    q: 'Who is LevelWorks for?',
    a: 'Contractors, remodelers, painters, handymen, HVAC, plumbing, electrical, landscaping, cleaning and any service business that sends estimates and invoices. It was built by a working contractor for his own business first.',
  },
];
