export interface TradeConfig {
  slug: string;
  trade: string;
  seoTitle: string;
  seoDescription: string;
  badge: string;
  headlineLine1: string;
  headlineLine2: string;
  subheadline: string;
  testimonial: { quote: string; name: string; trade: string };
}

export const tradeLandingConfig: Record<string, TradeConfig> = {
  roofing: {
    slug: 'roofing',
    trade: 'Roofing Contractors',
    seoTitle: 'Estimate & Invoicing Software for Roofing Contractors | LevelWorks',
    seoDescription:
      'Send professional roof estimates, capture job-site photos for insurance claims, and get paid online — all for $5/month. Built by a contractor for roofers.',
    badge: 'Built for roofing contractors',
    headlineLine1: 'Run your roofing business.',
    headlineLine2: 'Not your paperwork.',
    subheadline:
      'Professional UNLIMITED estimates, digital signatures, invoicing, client payments, your branded logo, and before/during/after job-site photos for insurance documentation — everything for $5 a month.',
    testimonial: {
      quote: 'My clients love that they can sign from their phone and pay instantly. I close jobs faster now.',
      name: 'Dave T.',
      trade: 'Roofing Contractor',
    },
  },
  electrical: {
    slug: 'electrical',
    trade: 'Electrical Contractors',
    seoTitle: 'Estimate & Invoicing Software for Electricians | LevelWorks',
    seoDescription:
      'Send professional electrical estimates, invoice clients in one tap, and get paid online — all for $5/month. Built by a contractor for electricians.',
    badge: 'Built for electrical contractors',
    headlineLine1: 'Run your electrical business.',
    headlineLine2: 'Not your paperwork.',
    subheadline:
      'Professional UNLIMITED estimates, digital signatures, invoicing, client payments, and your branded logo on every job — everything for $5 a month.',
    testimonial: {
      quote: "Simple, fast, does what I need. I don't need a complicated system.",
      name: 'Carlos M.',
      trade: 'Electrical Contractor',
    },
  },
  plumbing: {
    slug: 'plumbing',
    trade: 'Plumbing Contractors',
    seoTitle: 'Estimate & Invoicing Software for Plumbers | LevelWorks',
    seoDescription:
      'Send professional plumbing estimates, invoice clients in one tap, and get paid online — all for $5/month. Built by a contractor for plumbers.',
    badge: 'Built for plumbing contractors',
    headlineLine1: 'Run your plumbing business.',
    headlineLine2: 'Not your paperwork.',
    subheadline:
      'Professional UNLIMITED estimates, digital signatures, invoicing, client payments, and job notes that sync across every device — everything for $5 a month.',
    testimonial: {
      quote: 'I was paying $99 a month for another app. This does everything I need for $5. No brainer.',
      name: 'Mike R.',
      trade: 'General Contractor',
    },
  },
  'general-contracting': {
    slug: 'general-contracting',
    trade: 'General Contractors',
    seoTitle: 'Estimate & Invoicing Software for General Contractors | LevelWorks',
    seoDescription:
      'Send professional estimates, track jobs, and get paid online — all for $5/month. Built by a contractor for general contractors.',
    badge: 'Built for general contractors',
    headlineLine1: 'Run your contracting business.',
    headlineLine2: 'Not your paperwork.',
    subheadline:
      'Professional UNLIMITED estimates, digital signatures, invoicing, client payments, your branded logo, and a searchable client database — everything for $5 a month.',
    testimonial: {
      quote: 'I was paying $99 a month for another app. This does everything I need for $5. No brainer.',
      name: 'Mike R.',
      trade: 'General Contractor',
    },
  },
};
