/**
 * POST /api/annual-broadcast   Authorization: Bearer <CRON_SECRET>
 * Body: { "mode": "dry" | "test" | "send" }
 *   dry  → who would get it (counts and masked addresses), sends nothing
 *   test → the English and Spanish versions to Eric only
 *   send → everyone except Eric (he already has the test copy)
 *   tiptest (+ "n": 1) → feature tip n, English and Spanish, to Eric only
 * Runs on Vercel so the mail goes out through RESEND_API_KEY as "Eric at LevelWorks".
 */
import { json, readBody, missingEnv } from './_lib/annual.js';
import { recipients, sendNote, ERIC } from './_lib/broadcast.js';
import { tipMail, TIPS } from './_lib/tips.js';
import { sendMail } from './_lib/annual.js';

export const config = { api: { bodyParser: false }, maxDuration: 120 };

export default async function handler(req, res) {
  if (req.method !== 'POST') return json(res, 405, { error: 'method_not_allowed' });
  const auth = req.headers.authorization || '';
  if (!process.env.CRON_SECRET || auth !== `Bearer ${process.env.CRON_SECRET}`) return json(res, 401, { error: 'unauthorized' });
  const missing = missingEnv('SUPABASE_SERVICE_ROLE_KEY', 'RESEND_API_KEY');
  if (missing.length) return json(res, 503, { error: 'not_configured', message: `Missing in Vercel: ${missing.join(', ')}` });
  let body = {};
  try { body = JSON.parse((await readBody(req)).toString('utf8') || '{}'); } catch { /* fallthrough */ }
  const mode = body.mode || 'dry';

  if (mode === 'tiptest') {
    const n = Math.min(Math.max(Number(body.n) || 1, 1), TIPS.length);
    const out = [];
    for (const lang of ['en', 'es']) { const m = tipMail(n, lang); out.push({ lang, ...(await sendMail({ to: ERIC[0], ...m, unsubscribe: lang })) }); }
    return json(res, 200, { mode, n, of: TIPS.length, to: ERIC[0], sent: out });
  }
  if (mode === 'test') {
    const out = [];
    for (const to of ERIC) out.push({ to, lang: 'en', ...(await sendNote(to, 'en')) });
    out.push({ to: ERIC[0], lang: 'es', ...(await sendNote(ERIC[0], 'es')) });
    return json(res, 200, { mode, sent: out });
  }
  const list = await recipients({ excludeEric: mode === 'send' });
  if (mode === 'dry') return json(res, 200, { mode, count: list.length, es: list.filter(r => r.lang === 'es').length, sample: list.map(r => `${r.lang} ${r.email.slice(0, 3)}***`) });
  if (mode !== 'send') return json(res, 400, { error: 'bad_mode' });
  let sent = 0; const failed = [];
  for (const r of list) {
    try { await sendNote(r.email, r.lang); sent++; } catch (e) { failed.push(`${r.email.slice(0, 3)}***: ${e.message}`); }
    await new Promise(s => setTimeout(s, 550));   // Resend allows 2 requests a second
  }
  return json(res, 200, { mode, sent, of: list.length, failed });
}
