/**
 * POST /api/quotecheck-save   Body: { email, utm? }
 * "Estimate coming? Save this page." Adds the address to the Resend audience
 * "Quote Check · leads" and sends one email with the link and the five red
 * flags, so the page is in their inbox the day the estimate arrives.
 * Marketing mail, so it carries the unsubscribe link and headers.
 */
import { json, readBody, missingEnv, sendMail, layout } from './_lib/annual.js';
import { resend } from './_lib/audience.js';
import { PAGE } from './_lib/quotecheck.js';
import { recordLead, LEADS_LEADS_AUDIENCE, FROM } from './_lib/quotecheckDrip.js';

const clean = (v, max = 120) => (typeof v === 'string' ? v.trim().slice(0, max) : '');

async function audienceId() {
  const list = await resend('/audiences');
  const hit = (list.data || []).find(a => a.name === LEADS_AUDIENCE);
  if (hit) return hit.id;
  const made = await resend('/audiences', { method: 'POST', body: JSON.stringify({ name: LEADS_AUDIENCE }) });
  return made.id;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return json(res, 405, { error: 'method_not_allowed' });
  const missing = missingEnv('RESEND_API_KEY');
  if (missing.length) return json(res, 503, { error: 'not_configured', message: `Missing in Vercel: ${missing.join(', ')}` });
  let body = {};
  try { body = JSON.parse((await readBody(req)).toString('utf8') || '{}'); } catch { /* fine */ }
  const email = clean(body.email, 200).toLowerCase();
  if (!/.+@.+\..+/.test(email)) return json(res, 400, { error: 'bad_email', message: 'Enter the email you want the link sent to.' });
  const utm = body.utm && typeof body.utm === 'object' ? body.utm : {};

  try {
    const id = await audienceId();
    // Resend answers 409-ish text for a duplicate; a repeat visitor is fine either way.
    await resend(`/audiences/${id}/contacts`, { method: 'POST', body: JSON.stringify({ email, unsubscribed: false, first_name: clean(utm.content, 40) || undefined }) }).catch(() => {});
    const link = `${PAGE}?utm_source=email&utm_medium=save&utm_campaign=quotecheck`;
    const html = layout({
      lang: 'en',
      lines: [
        'Here is your Quote Check link, so it is in your inbox the day the estimate lands:',
        `<a href="${link}" style="color:#2563eb;font-weight:600">${PAGE.replace('https://', '')}</a>`,
        'Until then, five things on any estimate that should make you slow down:',
        '<b>1. More than a third down.</b> Ten to thirty percent is normal. Materials arrive the day the crew does.',
        '<b>2. A cash discount.</b> It usually means the job is not going on the books, which can mean no permit and no insurance.',
        '<b>3. "Materials" with no list.</b> One line, one number, no brands. That is where the extra money lives.',
        '<b>4. Price good for 7 days.</b> Pressure, not a cost. Prices do not move that fast.',
        '<b>5. No licence number, no insurance certificate.</b> If someone falls, it is your homeowner\'s policy.',
        'When the estimate comes, take a photo of it and upload it. You see the verdict free. The full report, priced for your ZIP, is $79.',
      ],
      cta: 'Open Quote Check', ctaUrl: link,
      unsubscribe: true,
    });
    const text = `Your Quote Check link: ${link}\n\nFive things on any estimate that should make you slow down:\n1. More than a third down.\n2. A cash discount.\n3. "Materials" with no list.\n4. Price good for 7 days.\n5. No licence number, no insurance certificate.\n\nWhen the estimate comes, take a photo and upload it. You see the verdict free. The full report is $79.`;
    await sendMail({ to: email, from: FROM, subject: 'Your Quote Check link, and five red flags to watch for', html, text, unsubscribe: 'en' });
    await recordLead(email, utm).catch(e => console.error('[quotecheck-save] lead', e.message));
    return json(res, 200, { ok: true });
  } catch (e) {
    console.error('[quotecheck-save]', e.message);
    return json(res, 502, { error: 'failed', message: 'Could not send the link right now. Try again in a minute.' });
  }
}

export const config = { api: { bodyParser: false } };
