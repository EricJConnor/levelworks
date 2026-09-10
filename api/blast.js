/**
 * Email broadcast to everyone who signed up, through Resend Broadcasts.
 *
 *   GET /api/blast?key=<CRON_SECRET>&which=annualBlast          what would happen, sends nothing
 *   GET /api/blast?key=<CRON_SECRET>&which=annualBlast&lang=en  the email itself, as a page
 *   GET /api/blast?key=<CRON_SECRET>&which=annualBlast&send=1   sync the audiences, then send
 *
 * The daily cron already drafts the broadcasts in Resend, where Eric can press
 * Send without any key. See api/_lib/broadcasts.js.
 */
import { json, missingEnv } from './_lib/annual.js';
import { syncAudience } from './_lib/audience.js';
import { runBroadcast, broadcastCopy } from './_lib/broadcasts.js';

export default async function handler(req, res) {
  const url = new URL(req.url, 'http://x');
  const given = url.searchParams.get('key') || '';
  const cron = process.env.CRON_SECRET || '';
  if (!cron || (given !== cron && given !== cron.trim())) return json(res, 401, { error: 'unauthorized' });
  const missing = missingEnv('SUPABASE_SERVICE_ROLE_KEY', 'RESEND_API_KEY');
  if (missing.length) return json(res, 503, { error: 'not_configured', message: `Missing in Vercel: ${missing.join(', ')}` });

  const which = url.searchParams.get('which') || 'annualBlast';
  const mail = broadcastCopy(which);
  if (!mail) return json(res, 400, { error: 'unknown_email', message: `No broadcast copy called "${which}"` });
  const send = url.searchParams.get('send') === '1';
  const lang = url.searchParams.get('lang');

  if (!send && lang && mail[lang]) {
    res.status(200).setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.end(mail[lang]().html);
  }

  const report = { which, send, audience: null, broadcasts: {}, errors: [] };
  try {
    report.audience = await syncAudience({ dry: !send });
    report.broadcasts = await runBroadcast(which, send ? 'send' : 'dry');
  } catch (e) {
    report.errors.push(e.message);
  }
  console.log('blast', JSON.stringify(report));
  return json(res, report.errors.length ? 500 : 200, { ok: !report.errors.length, ...report });
}
