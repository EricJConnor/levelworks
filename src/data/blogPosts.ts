export interface BlogPost {
  slug: string;
  title: string;
  description: string;
  publishDate: string;
  readTime: string;
  paragraphs: { heading?: string; text: string }[];
}

export const blogPosts: BlogPost[] = [
  {
    slug: 'how-to-write-a-contractor-estimate-that-gets-approved-fast',
    title: 'How to Write a Contractor Estimate That Gets Approved Fast',
    description:
      'The difference between an estimate that gets signed same-day and one that sits in an inbox for weeks usually comes down to five things.',
    publishDate: '2026-01-15',
    readTime: '4 min read',
    paragraphs: [
      {
        text: "Every contractor knows the feeling: you send an estimate, and then you wait. And wait. Meanwhile the client is comparing your number to two other bids sitting in the same inbox. The estimates that get approved fast aren't necessarily the cheapest — they're the clearest.",
      },
      {
        heading: 'Break down line items, not just the total',
        text: "A single number with no explanation makes a client nervous. Separate materials, labor, and any permit or disposal fees so they can see exactly what they're paying for. It builds trust and heads off the 'why does this cost so much' conversation before it starts.",
      },
      {
        heading: 'Make it easy to say yes on the spot',
        text: 'If a client has to print, sign, scan, and email a PDF back to you, you will lose deals to whoever made it a one-tap decision. Digital signature links that work from a phone remove the single biggest source of estimate drop-off.',
      },
      {
        heading: 'Include your branding',
        text: 'A branded, professional-looking estimate signals that you run a real business — not a side gig. Your logo, consistent formatting, and clear contact info all reduce the perceived risk of hiring you.',
      },
      {
        heading: 'Follow up within 48 hours',
        text: "Most lost bids aren't lost on price — they're lost to whoever followed up first. A quick text or call after sending the estimate keeps you top of mind while the client is still deciding.",
      },
    ],
  },
  {
    slug: 'contractor-invoicing-101-get-paid-faster',
    title: 'Contractor Invoicing 101: Get Paid Faster On Every Job',
    description:
      'Late payments are one of the biggest cash flow problems in the trades. Here is what actually speeds up how fast clients pay.',
    publishDate: '2026-02-03',
    readTime: '3 min read',
    paragraphs: [
      {
        text: 'Slow-paying clients are a cash flow problem, not a client problem — most delays come down to friction in how the invoice was sent, not unwillingness to pay.',
      },
      {
        heading: 'Send the invoice the moment the job is done',
        text: "Every day between finishing a job and sending the invoice is a day added to your payment timeline. Converting a signed estimate straight into an invoice removes the re-typing step that causes delays.",
      },
      {
        heading: 'Let clients pay online, not by check',
        text: "A client who has to write, address, stamp, and mail a check will put it off for a week. A client who can tap 'pay now' from a text message will often pay within the hour.",
      },
      {
        heading: 'Keep a record of every job and client',
        text: 'When disputes come up months later, having organized job notes, photos, and signed documents tied to that client saves hours of digging through texts and emails.',
      },
    ],
  },
  {
    slug: 'estimate-template-vs-estimate-software',
    title: 'Free Estimate Template vs. Estimate Software: What Actually Saves Time',
    description:
      "Free templates look like the cheaper option, but here's the hidden cost most contractors don't account for.",
    publishDate: '2026-02-20',
    readTime: '3 min read',
    paragraphs: [
      {
        text: "A free Word or Excel estimate template costs nothing upfront, which makes it an easy first choice for a new contractor. But the real cost shows up later, in the hours spent re-formatting, re-typing client info, and manually tracking which estimates turned into invoices.",
      },
      {
        heading: 'Where templates fall apart',
        text: 'Templates don\'t track your client list, don\'t know which estimates are still pending, and don\'t let a client sign or pay from their phone. Every estimate starts from a blank slate.',
      },
      {
        heading: 'What software actually replaces',
        text: 'Purpose-built estimate software keeps a running client database, converts an approved estimate into an invoice in one tap, and lets clients sign and pay without printing anything. For $5-$15 a month, it usually pays for itself in the first job it helps you close faster.',
      },
    ],
  },
];
