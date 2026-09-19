/**
 * POST /api/quotecheck-upload
 * Body (JSON): { file: { base64, mediaType, name }, zip, about, notes, email }
 * Reads the quote right away and stores the full review; answers { id, teaser }.
 * Nothing is unlocked until /api/quotecheck-result sees a paid Stripe session.
 */
import { json, readBody, missingEnv } from './_lib/annual.js';
import { newId, putFile, saveReview, reviewQuote, teaserOf } from './_lib/quotecheck.js';

const TYPES = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'application/pdf': 'pdf' };
const MAX_BYTES = 3.5 * 1024 * 1024;
const clean = (v, max) => (typeof v === 'string' ? v.trim().slice(0, max) : '');

export default async function handler(req, res) {
  if (req.method !== 'POST') return json(res, 405, { error: 'method_not_allowed' });
  const missing = missingEnv('ANTHROPIC_API_KEY', 'SUPABASE_SERVICE_ROLE_KEY');
  if (missing.length) return json(res, 503, { error: 'not_configured', message: `Missing in Vercel: ${missing.join(', ')}` });

  let body;
  try { body = JSON.parse((await readBody(req)).toString('utf8')); } catch { return json(res, 400, { error: 'bad_request', message: 'Nothing was uploaded.' }); }
  const f = body?.file || {};
  const ext = TYPES[f.mediaType];
  if (!ext || typeof f.base64 !== 'string' || !f.base64) return json(res, 400, { error: 'bad_file', message: 'Send a photo (JPG, PNG) or a PDF of the quote.' });
  const bytes = Buffer.from(f.base64, 'base64');
  if (bytes.length < 1000) return json(res, 400, { error: 'bad_file', message: 'That file is empty. Try the photo again.' });
  if (bytes.length > MAX_BYTES) return json(res, 413, { error: 'too_big', message: 'That file is too big. A photo of each page works best.' });

  const zip = clean(body.zip, 10).replace(/[^0-9]/g, '').slice(0, 5);
  const about = clean(body.about, 300);
  const notes = clean(body.notes, 600);
  const email = clean(body.email, 200).toLowerCase();

  const id = newId();
  try {
    await putFile(`${id}/quote.${ext}`, bytes, f.mediaType);
    const result = await reviewQuote({ file: { base64: f.base64, mediaType: f.mediaType }, zip, about, homeownerNotes: notes });
    const review = { id, createdAt: new Date().toISOString(), zip, about, notes, email, file: `quote.${ext}`, paid: false, emailed: false, result };
    await saveReview(id, review);
    return json(res, 200, { id, teaser: teaserOf(review) });
  } catch (e) {
    console.error('[quotecheck-upload]', e);
    const status = e?.status;
    if (status === 429) return json(res, 429, { error: 'busy', message: 'Too many quotes at once. Give it a minute and try again.' });
    return json(res, 502, { error: 'failed', message: `Could not read the quote right now: ${e.message || e}` });
  }
}

export const config = { api: { bodyParser: false }, maxDuration: 120 };
