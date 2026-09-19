/**
 * Quote Check leads: the every-three-days series.
 *
 * Someone saves the page ("estimate coming next week"), gets the link and five
 * red flags at once, and then one email every three days: Quote Check, then
 * LevelWorks for people who send estimates themselves, then the web studio,
 * with estimate-reading tips in between that say enough to be useful and
 * never enough to replace the report (Eric: "don't give away too much").
 *
 * Progress lives next to the reports, in the same private bucket:
 * quotecheck/leads/<sha1 of email>.json = { email, createdAt, stage, lastAt }.
 * stage = how many of DRIPS have gone out. No migration.
 *
 * Adding one: append to DRIPS, never reorder (stage is an index).
 */
import { createHash } from 'node:crypto';
import { admin, sendMail, layout, SITE_URL } from './annual.js';
import { resend, unsubscribedEmails } from './audience.js';
import { BUCKET, getJson, putJson, PAGE } from './quotecheck.js';

export const LEADS_AUDIENCE = 'Quote Check · leads';
export const FROM = 'Eric at Quote Check <eric@levelworks.org>';
export const EVERY_HOURS = 70; // "every 3 days" with the cron's own drift allowed for
const QC = `${PAGE}?utm_source=email&utm_medium=drip&utm_campaign=quotecheck`;
const LW = `${SITE_URL}/?utm_source=email&utm_medium=drip&utm_campaign=quotecheck`;
const EC = 'https://ecwd1.com/?utm_source=email&utm_medium=drip&utm_campaign=quotecheck';

const leadKey = email => `leads/${createHash('sha1').update(String(email).trim().toLowerCase()).digest('hex')}.json`;
export const loadLead = email => getJson(leadKey(email));
export const saveLead = (email, lead) => putJson(leadKey(email), lead);

/** Called by the save route once the welcome mail is out. */
export async function recordLead(email, utm = {}) {
  const now = new Date().toISOString();
  const had = await loadLead(email);
  if (had) return had;
  const lead = { email: String(email).trim().toLowerCase(), createdAt: now, stage: 0, lastAt: now, utm };
  await saveLead(email, lead);
  return lead;
}

export const DRIPS = [
  {
    key: 'howPriced',
    subject: 'How a contractor actually prices your job',
    lines: [
      'Every estimate you will ever get is built the same way, whether the contractor shows you or not.',
      '<b>Materials</b> at whatever the supply house charged that week. <b>Labor</b>: crew size, times days, times a rate that depends on your area. <b>The other stuff</b>: permit, dumpster, equipment. Then <b>overhead and profit</b> on top, which is a percentage, and every trade has a normal range for it.',
      'That last number is the one nobody tells you. A good contractor deserves it. An expensive one is quietly taking more of it. You cannot tell which from the total.',
      'The report does that math for your ZIP and shows you where your estimate lands against the normal range. You see the verdict before you pay a cent.',
    ],
    cta: 'Check an estimate', ctaUrl: QC,
  },
  {
    key: 'allowances',
    subject: 'The word on an estimate that means "this number will grow"',
    lines: [
      'Look for the word <b>allowance</b>.',
      'An allowance is a placeholder: "tile allowance $1,200", "fixture allowance $800". It is the contractor saying "I have not priced this yet, here is a guess." Fine in itself. The problem is that the guess is usually low, because a low guess makes the total look better, and the difference lands on you at the end.',
      'One question fixes it: "What does that allowance actually buy at the place you shop?" If the answer is "the basic stuff", the real number is higher.',
      'The report flags every allowance and every line that is not really priced, and tells you what to ask about each one.',
    ],
    cta: 'Check an estimate', ctaUrl: QC,
  },
  {
    key: 'levelworks',
    subject: 'Do you ever send an estimate yourself?',
    lines: [
      'Side work, a rental you manage, a cleaning or landscaping business, a handyman gig on weekends. If you ever have to put a price in writing and get paid for it, this is what I built first.',
      '<b>LevelWorks</b> makes a clean estimate on your phone in about two minutes, turns it into an invoice with one tap, and lets the customer pay by card from a link. Unlimited estimates and invoices, recurring billing, English and Spanish.',
      '$5 a month, and the first 30 days are free. No card to start.',
    ],
    cta: 'Try LevelWorks free', ctaUrl: LW,
  },
  {
    key: 'lowBid',
    subject: 'Why the lowest bid is not the safe one',
    lines: [
      'Three bids come in: $14,000, $16,500 and $18,000. Most people take the $14,000 and feel smart.',
      'Here is what a contractor sees in that number: something got left out. Thinner underlayment nobody will ever see. No permit, so no inspection. A crew that is not on the books, so if someone gets hurt on your property, it is your homeowner\'s policy. Or a new company pricing at cost to get work, which is fine, if the warranty is in writing.',
      'The low bid can be the right one. You just need to know which of those it is before you sign.',
      'Every report has a section for exactly this: what could justify a higher price on your job, and what usually explains a lower one.',
    ],
    cta: 'Check an estimate', ctaUrl: QC,
  },
  {
    key: 'ecwd1',
    subject: 'The shop behind Quote Check builds websites too',
    lines: [
      'Quote Check and LevelWorks came out of a small studio outside Philadelphia called <b>Eric Connor Web Design</b>. Websites, business apps and branding for small businesses, built by people who answer the phone.',
      'If you run a business and your website is embarrassing, slow on a phone, or invisible on Google, that is the kind of thing we fix. You see a live preview before anything is finished.',
      'No pitch beyond that. Reply to this email if you want to talk, or have a look at the site.',
    ],
    cta: 'See the studio', ctaUrl: EC,
  },
  {
    key: 'deposits',
    subject: 'The one number on an estimate you should always negotiate',
    lines: [
      'The deposit.',
      'A contractor needs some money down. Materials get ordered, the crew gets scheduled. But materials usually arrive the day the crew does, and a deposit of half the job is not about materials. It is about the contractor\'s cash flow, and it puts all the risk on you.',
      'Ten to thirty percent is normal for most trades. A few states cap it by law. Anything more than a third is worth a conversation, and the conversation is easy: "I\'m comfortable with 25% down and the rest when the job is done."',
      'The report checks the deposit and the whole payment schedule against what is normal for your trade and your state, and writes the script for you.',
    ],
    cta: 'Check an estimate', ctaUrl: QC,
  },
  {
    key: 'payments',
    subject: 'Get paid by card, without chasing anyone',
    lines: [
      'If you send invoices for anything, here is the part of LevelWorks people end up using most.',
      'Send the invoice from your phone. The customer opens the link and pays by card. For work that repeats, monthly cleaning, lawn care, a retainer, <b>recurring billing</b> charges the card on schedule and you stop asking for money.',
      'Unlimited estimates and invoices, $5 a month, 30 days free to start.',
    ],
    cta: 'Try LevelWorks free', ctaUrl: LW,
  },
  {
    key: 'whatHappened',
    subject: 'What happened with the estimate?',
    lines: [
      'You saved the Quote Check page a few weeks ago. I am curious what happened.',
      'Did the estimate come in? Did you sign it, negotiate it, or walk? If you ran it through the report, was it worth the $79? Hit reply. I read every one, and it is how the thing gets better.',
      'And if the estimate is still on the counter, unsigned, you know where the link is.',
    ],
    cta: 'Check an estimate', ctaUrl: QC,
  },
];

export function dripMail(n) {
  const d = DRIPS[n];
  if (!d) return null;
  const html = layout({ lang: 'en', lines: d.lines, cta: d.cta, ctaUrl: d.ctaUrl, unsubscribe: true });
  const text = d.lines.map(l => l.replace(/<[^>]+>/g, '')).join('\n\n') + `\n\n${d.cta}: ${d.ctaUrl}`;
  return { subject: d.subject, html, text };
}

/** Everyone in the leads audience who has not unsubscribed. */
async function liveLeads() {
  const list = await resend('/audiences');
  const aud = (list.data || []).find(a => a.name === LEADS_AUDIENCE);
  if (!aud) return [];
  const contacts = await resend(`/audiences/${aud.id}/contacts`);
  const gone = await unsubscribedEmails().catch(() => new Set());
  return (contacts.data || [])
    .filter(c => !c.unsubscribed)
    .map(c => String(c.email || '').toLowerCase())
    .filter(e => e && !gone.has(e) && !e.endsWith('@levelworks.org'));
}

/**
 * Send the next drip to every lead whose last mail was EVERY_HOURS+ ago.
 * A lead with no record (saved before this existed) starts from stage 0 now.
 */
export async function sendDrips({ dry = false, now = Date.now(), budget = 200 } = {}) {
  const emails = await liveLeads();
  const out = { leads: emails.length, sent: [], skipped: 0, done: 0, errors: [] };
  for (const email of emails) {
    if (out.sent.length >= budget) break;
    let lead = await loadLead(email);
    if (!lead) lead = { email, createdAt: new Date(now).toISOString(), stage: 0, lastAt: new Date(now).toISOString() };
    if (lead.stage >= DRIPS.length) { out.done++; continue; }
    const due = now - new Date(lead.lastAt).getTime() >= EVERY_HOURS * 3600e3;
    if (!due) { out.skipped++; continue; }
    const m = dripMail(lead.stage);
    if (dry) { out.sent.push({ email, drip: DRIPS[lead.stage].key, dry: true }); continue; }
    try {
      await sendMail({ to: email, from: FROM, ...m, unsubscribe: 'en' });
      lead.stage += 1; lead.lastAt = new Date(now).toISOString();
      await saveLead(email, lead);
      out.sent.push({ email, drip: DRIPS[lead.stage - 1].key });
    } catch (e) {
      out.errors.push({ email, error: e.message });
    }
  }
  return out;
}

export { BUCKET, admin };
