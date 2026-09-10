/**
 * GET /api/sync-audience?key=<CRON_SECRET>        run the Resend audience sync now
 * GET /api/sync-audience?key=<CRON_SECRET>&dry=1  show what it would add, add nothing
 *
 * The daily cron (/api/cron-annual) runs the same sync, so this exists for a
 * first load and for checking. See api/_lib/audience.js.
 */
import { json, missingEnv } from './_lib/annual.js';
import { syncAudience } from './_lib/audience.js';

export default async function handler(req, res) {
  const url = new URL(req.url, 'http://x');
  const given = url.searchParams.get('key') || '';
  const cron = process.env.CRON_SECRET || '';
  const bearer = req.headers.authorization === `Bearer ${cron}`;
  if (!cron || (!bearer && given !== cron && given !== cron.trim())) return json(res, 401, { error: 'unauthorized' });
  const missing = missingEnv('SUPABASE_SERVICE_ROLE_KEY', 'RESEND_API_KEY');
  if (missing.length) return json(res, 503, { error: 'not_configured', message: `Missing in Vercel: ${missing.join(', ')}` });
  try {
    const report = await syncAudience({ dry: url.searchParams.get('dry') === '1' });
    return json(res, 200, { ok: true, ...report });
  } catch (e) {
    return json(res, 500, { ok: false, error: e.message });
  }
}
