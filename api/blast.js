/**
 * One-off email broadcast to everyone who signed up, through Resend Broadcasts.
 *
 *   GET /api/blast?key=<CRON_SECRET>&which=annualBlast            preview: the HTML of both
 *                                                                  languages and who would get it
 *   GET /api/blast?key=<CRON_SECRET>&which=annualBlast&send=1     syncs the audiences, creates one
 *                                                                  broadcast per language, sends
 *
 * A broadcast is named "<which> · <lang>" and never sent twice: if Resend already
 * has one by that name, that language is skipped. Copy lives in emails.js.
 */
import { json, missingEnv, ERIC_REPLY_TO, SITE_URL } from './_lib/annual.js';
import { EMAILS } from './_lib/emails.js';
import { syncAudience, AUDIENCES, resend } from './_lib/audience.js';

const FROM = 'Eric at LevelWorks <eric@levelworks.org>';

export default async function handler(req, res) {
  const url = new URL(req.url, 'http://x');
  const given = url.searchParams.get('key') || '';
  const cron = process.env.CRON_SECRET || '';
  if (!cron || (given !== cron && given !== cron.trim())) return json(res, 401, { error: 'unauthorized' });
  const missing = missingEnv('SUPABASE_SERVICE_ROLE_KEY', 'RESEND_API_KEY');
  if (missing.length) return json(res, 503, { error: 'not_configured', message: `Missing in Vercel: ${missing.join(', ')}` });

  const which = url.searchParams.get('which') || 'annualBlast';
  const mail = EMAILS[which];
  if (!mail || !mail.en || !mail.es || mail.en.length) return json(res, 400, { error: 'unknown_email', message: `No broadcast copy called "${which}"` });
  const send = url.searchParams.get('send') === '1';
  const lang = url.searchParams.get('lang'); // preview one language as a page

  if (!send && lang && mail[lang]) {
    res.status(200).setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.end(mail[lang]().html);
  }

  const report = { which, send, audience: null, broadcasts: {}, errors: [] };
  try {
    report.audience = await syncAudience({ dry: !send });
    const audiences = await resend('/audiences');
    const existing = await resend('/broadcasts');
    for (const l of ['en', 'es']) {
      const name = `${which} · ${l}`;
      const aud = (audiences.data || []).find(a => a.name === AUDIENCES[l]);
      if (!aud) { report.broadcasts[l] = { skipped: 'no audience yet' }; continue; }
      const prior = (existing.data || []).find(b => b.name === name && b.status !== 'draft');
      if (prior) { report.broadcasts[l] = { skipped: 'already sent', id: prior.id, status: prior.status }; continue; }
      const m = mail[l]();
      if (!send) {
        report.broadcasts[l] = { would: 'create and send', audience: aud.name, subject: m.subject, preview: `${SITE_URL}/api/blast?key=…&which=${which}&lang=${l}` };
        continue;
      }
      const made = await resend('/broadcasts', { method: 'POST', body: JSON.stringify({
        name, audience_id: aud.id, from: FROM, reply_to: ERIC_REPLY_TO, subject: m.subject, html: m.html,
      }) });
      await resend(`/broadcasts/${made.id}/send`, { method: 'POST', body: '{}' });
      report.broadcasts[l] = { sent: true, id: made.id, audience: aud.name, subject: m.subject };
    }
  } catch (e) {
    report.errors.push(e.message);
  }
  return json(res, report.errors.length ? 500 : 200, { ok: !report.errors.length, ...report });
}
