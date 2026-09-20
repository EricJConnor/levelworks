/**
 * POST /api/quotecheck-range   — the free three-tap read
 * Body (JSON): { trade, amount, zip }
 * Answers { ticket, range }.
 *
 * GET  /api/quotecheck-range?ticket=xxxx — reopen a ticket
 * Answers the same { ticket, range } so a link brings somebody back to their
 * own answer days later.
 *
 * No file, no email, no name. That is the point: the upload is a two-minute
 * job and this is ten seconds, so it catches the curious as well as the
 * committed. The ticket is the thread back — it is the coat-check idea the
 * page already runs on. Check the number in, get a ticket, come back with the
 * estimate when you have it in your hand.
 *
 * The ticket is 96 random bits and holds nothing personal: a trade, a price
 * and a ZIP. Losing the link costs somebody a free answer, nothing more.
 */
import { json, readBody, missingEnv } from './_lib/annual.js';
import { newId, putJson, getJson, rangeCheck } from './_lib/quotecheck.js';

const clean = (v, max) => (typeof v === 'string' ? v.trim().slice(0, max) : '');
const TICKET = /^[a-f0-9]{24}$/;

export default async function handler(req, res) {
  const missing = missingEnv('ANTHROPIC_API_KEY', 'SUPABASE_SERVICE_ROLE_KEY');
  if (missing.length) return json(res, 503, { error: 'not_configured', message: `Missing in Vercel: ${missing.join(', ')}` });

  // Reopening a ticket.
  if (req.method === 'GET') {
    const ticket = String(req.query?.ticket || '');
    if (!TICKET.test(ticket)) return json(res, 400, { error: 'bad_ticket' });
    const saved = await getJson(`range/${ticket}.json`);
    if (!saved) return json(res, 404, { error: 'not_found', message: 'That ticket has expired or was never used.' });
    return json(res, 200, { ticket, range: saved.range, asked: saved.asked });
  }

  if (req.method !== 'POST') return json(res, 405, { error: 'method_not_allowed' });

  let body;
  try { body = JSON.parse((await readBody(req)).toString('utf8')); } catch { return json(res, 400, { error: 'bad_request' }); }

  const trade = clean(body.trade, 120);
  const zip = clean(body.zip, 10).replace(/[^0-9]/g, '').slice(0, 5);
  const amount = Math.round(Number(String(body.amount ?? '').replace(/[^0-9.]/g, '')) || 0);

  if (!trade) return json(res, 400, { error: 'bad_request', message: 'Tell us what the job is.' });
  if (!(amount > 0)) return json(res, 400, { error: 'bad_request', message: 'Tell us what they quoted you.' });
  // A builder's whole house is a different product; a $20 job is not a job.
  if (amount > 5_000_000) return json(res, 400, { error: 'bad_request', message: 'That number looks wrong. Enter the total they quoted you.' });

  try {
    const range = await rangeCheck({ trade, amount, zip });
    if (!range.understood) {
      return json(res, 200, { understood: false, message: 'That does not look like a home repair or building job. Try naming the trade, like roofing or HVAC.' });
    }
    const ticket = newId();
    const asked = { trade, amount, zip, at: new Date().toISOString() };
    // Stored so the ticket can be reopened. Best effort: if the write fails the
    // answer is still returned, the link just will not come back to life.
    try { await putJson(`range/${ticket}.json`, { ticket, asked, range }); } catch (e) { console.error('[quotecheck-range] save', e); }
    return json(res, 200, { ticket, asked, range });
  } catch (e) {
    console.error('[quotecheck-range]', e);
    if (e?.status === 429) return json(res, 429, { error: 'busy', message: 'Too many at once. Give it a few seconds and try again.' });
    return json(res, 502, { error: 'failed', message: 'Could not work that one out right now. Try again in a moment.' });
  }
}

export const config = { api: { bodyParser: false }, maxDuration: 60 };
