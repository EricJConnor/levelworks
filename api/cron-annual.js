/**
 * GET /api/cron-annual   (Vercel cron, daily; see vercel.json)
 *
 * 1. Flag annual users within 14 days of expiry (expiring_flagged_at).
 *    No renewal flow yet, just the flag, per Eric.
 * 2. Nudges for anyone without a first estimate: day 1, day 3, day 7.
 * 3. Day 30 check-in for annual buyers.
 * 4. Day 25 of a free trial: the $49 year, to people who are not annual and
 *    have no active monthly subscription in Stripe.
 *
 * Every send moves profiles.nudge_stage forward so nothing goes twice.
 * Vercel calls this with "Authorization: Bearer <CRON_SECRET>"; anything else is refused.
 * Add ?dry=1 to see what would be sent without sending.
 */
import Stripe from 'stripe';
import { admin, json, sendMail, missingEnv, normalizeLang } from './_lib/annual.js';
import { EMAILS } from './_lib/emails.js';

const DAY = 86400 * 1000;

export default async function handler(req, res) {
  const secret = process.env.CRON_SECRET;
  if (secret && req.headers.authorization !== `Bearer ${secret}`) return json(res, 401, { error: 'unauthorized' });
  const missing = missingEnv('SUPABASE_SERVICE_ROLE_KEY');
  if (missing.length) return json(res, 503, { error: 'not_configured', message: `Missing in Vercel: ${missing.join(', ')}` });
  const dry = req.query?.dry === '1' || String(req.url || '').includes('dry=1');

  const a = admin();
  const now = Date.now();
  const report = { flagged: 0, sent: [], errors: [] };

  // 1. expiry flag
  const soon = new Date(now + 14 * DAY).toISOString();
  const { data: expiring } = await a.from('profiles').select('user_id')
    .eq('plan', 'annual').is('expiring_flagged_at', null)
    .gt('plan_expires_at', new Date(now).toISOString()).lte('plan_expires_at', soon);
  if (expiring?.length && !dry) {
    await a.from('profiles').update({ expiring_flagged_at: new Date(now).toISOString() })
      .in('user_id', expiring.map(p => p.user_id));
  }
  report.flagged = expiring?.length || 0;

  // Users: auth admin list (small base; paginate anyway)
  const users = [];
  for (let page = 1; page <= 20; page++) {
    const { data, error } = await a.auth.admin.listUsers({ page, perPage: 200 });
    if (error) { report.errors.push('listUsers: ' + error.message); break; }
    users.push(...(data?.users || []));
    if (!data?.users?.length || data.users.length < 200) break;
  }
  const ids = users.map(u => u.id);
  const { data: profiles } = await a.from('profiles')
    .select('user_id, plan, plan_expires_at, activated_at, nudge_stage, lang, created_at')
    .in('user_id', ids.length ? ids : ['00000000-0000-0000-0000-000000000000']);
  const byId = new Map((profiles || []).map(p => [p.user_id, p]));
  const { data: purchases } = await a.from('annual_purchases').select('user_id, created_at').is('refunded_at', null);
  const boughtAt = new Map((purchases || []).map(p => [p.user_id, new Date(p.created_at).getTime()]));

  const stripe = process.env.STRIPE_SECRET_KEY ? new Stripe(process.env.STRIPE_SECRET_KEY) : null;
  async function hasMonthly(email) {
    if (!stripe) return false;
    try {
      const cs = await stripe.customers.list({ email, limit: 5 });
      for (const c of cs.data) {
        const subs = await stripe.subscriptions.list({ customer: c.id, status: 'all', limit: 5 });
        if (subs.data.some(s => ['active', 'trialing', 'past_due'].includes(s.status))) return true;
      }
    } catch (e) { report.errors.push('stripe: ' + e.message); }
    return false;
  }

  let budget = 150; // sends per run, so one bad day cannot spam
  for (const u of users) {
    if (budget <= 0) break;
    const email = (u.email || '').toLowerCase();
    if (!email) continue;
    const p = byId.get(u.id) || {};
    const lang = normalizeLang(p.lang || u.user_metadata?.lang);
    const ageDays = (now - new Date(u.created_at).getTime()) / DAY;
    const stage = p.nudge_stage || 0;
    const isAnnual = p.plan === 'annual' && p.plan_expires_at && new Date(p.plan_expires_at).getTime() > now;

    let pick = null, next = stage;
    if (!p.activated_at) {
      if (ageDays >= 7 && stage < 7) { pick = 'nudge7'; next = 7; }
      else if (ageDays >= 3 && stage < 3) { pick = 'nudge3'; next = 3; }
      else if (ageDays >= 1 && stage < 1) { pick = 'nudge1'; next = 1; }
    }
    if (!pick && isAnnual && boughtAt.has(u.id) && (now - boughtAt.get(u.id)) / DAY >= 30 && stage < 30) { pick = 'day30'; next = 30; }
    if (!pick && !isAnnual && ageDays >= 25 && ageDays < 40 && stage < 25 && !(await hasMonthly(email))) { pick = 'trialOffer'; next = 25; }
    if (!pick) continue;

    const m = EMAILS[pick][lang]();
    if (!dry) {
      try {
        await sendMail({ to: email, ...m });
        const write = byId.has(u.id)
          ? a.from('profiles').update({ nudge_stage: Math.max(next, stage) }).eq('user_id', u.id)
          : a.from('profiles').insert({ user_id: u.id, nudge_stage: next });
        const { error } = await write;
        if (error) report.errors.push(`stage ${email}: ${error.message}`);
      } catch (e) { report.errors.push(`${pick} ${email}: ${e.message}`); continue; }
    }
    report.sent.push({ email, pick, lang });
    budget--;
  }
  return json(res, 200, { ok: true, dry, ...report });
}
