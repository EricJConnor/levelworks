/**
 * GET /api/cron-quotecheck   (Vercel cron, daily 14:00 UTC = 10am ET)
 * Sends the next Quote Check lead email to anyone whose last was 3+ days ago.
 * Report goes to the Vercel log as one line: cron-quotecheck {...}.
 * ?dry=1 with the secret reports without sending.
 */
import { json, missingEnv } from './_lib/annual.js';
import { sendDrips } from './_lib/quotecheckDrip.js';

export default async function handler(req, res) {
  const secret = process.env.CRON_SECRET;
  const url = new URL(req.url || '/', 'http://x');
  const key = url.searchParams.get('key');
  if (secret && req.headers.authorization !== `Bearer ${secret}` && key !== secret) return json(res, 401, { error: 'unauthorized' });
  const missing = missingEnv('RESEND_API_KEY', 'SUPABASE_SERVICE_ROLE_KEY');
  if (missing.length) return json(res, 503, { error: 'not_configured', message: `Missing in Vercel: ${missing.join(', ')}` });
  try {
    const out = await sendDrips({ dry: url.searchParams.get('dry') === '1' });
    console.log('cron-quotecheck', JSON.stringify(out));
    return json(res, 200, { ok: true, ...out });
  } catch (e) {
    console.error('[cron-quotecheck]', e);
    return json(res, 500, { error: 'failed', message: e.message });
  }
}

export const config = { maxDuration: 120 };
