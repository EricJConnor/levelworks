/**
 * GET /api/stripe-payouts   with  Authorization: Bearer <Supabase access token>
 *
 * How the signed-in contractor's Stripe account pays him. Built after a real
 * payment sat in a connected account for five days: the account's payout
 * schedule was set to manual, so Stripe held the money until somebody pressed
 * "Pay out". LevelWorks never touches payouts (the charge is made inside his
 * own Stripe account) and, on a Standard account, cannot change the schedule
 * either. All it can do is read it and say so on the dashboard.
 *
 *   → 200 { ok, interval: 'manual'|'daily'|'weekly'|'monthly'|'', delayDays, payoutsEnabled, bankLast4 }
 *   → 200 { ok: true, connected: false } when no Stripe account is on the profile
 *   → 401 signed out, 502 Stripe refused, 503 config
 */
import Stripe from 'stripe';
import { json, admin, missingEnv } from './_lib/annual.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') return json(res, 405, { error: 'method_not_allowed' });
  const missing = missingEnv('STRIPE_SECRET_KEY', 'SUPABASE_SERVICE_ROLE_KEY');
  if (missing.length) return json(res, 503, { error: 'not_configured', message: `Missing in Vercel: ${missing.join(', ')}` });

  const auth = req.headers.authorization || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7).trim() : '';
  if (!token) return json(res, 401, { error: 'signed_out' });
  const db = admin();
  const { data: userData, error: userErr } = await db.auth.getUser(token);
  const user = userData?.user;
  if (userErr || !user) return json(res, 401, { error: 'signed_out' });

  const { data: prof } = await db.from('profiles').select('stripe_account_id').eq('user_id', user.id).maybeSingle();
  const accountId = String(prof?.stripe_account_id || '');
  if (!/^acct_[A-Za-z0-9]+$/.test(accountId)) return json(res, 200, { ok: true, connected: false });

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  let acct;
  try { acct = await stripe.accounts.retrieve(accountId); }
  catch (e) { return json(res, 502, { error: 'stripe', message: e?.message || 'Stripe did not answer.' }); }

  const sched = acct?.settings?.payouts?.schedule || {};
  const bank = (acct?.external_accounts?.data || []).find((x) => x?.object === 'bank_account');
  res.setHeader('Cache-Control', 'no-store');
  return json(res, 200, {
    ok: true,
    connected: true,
    interval: String(sched.interval || ''),
    delayDays: Number(sched.delay_days) || 0,
    payoutsEnabled: !!acct?.payouts_enabled,
    bankLast4: bank?.last4 || '',
  });
}
