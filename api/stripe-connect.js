/**
 * POST /api/stripe-connect   { code }   with  Authorization: Bearer <Supabase access token>
 *
 * The last step of "Set up payments". Stripe sends the contractor back to
 * /stripe-connect-callback with a one-time code; this swaps it for his Stripe
 * account id and writes it onto HIS profile. It replaced a Supabase edge
 * function (`connect-stripe-account`) that reported success without the id
 * ever landing on the profile, so the dashboard kept asking him to set up
 * payments he had already set up.
 *
 * Who the account belongs to is decided by the session token, never by the
 * `state` in the URL: a code could otherwise be attached to any user id.
 *
 *   → 200 { ok, accountId, chargesEnabled, payoutsEnabled }
 *   → 401 signed out, 400 bad or reused code, 409 platform account, 503 config/db
 *
 * Needs the same two Vercel env vars as /api/invoice-payment: STRIPE_SECRET_KEY
 * and SUPABASE_SERVICE_ROLE_KEY.
 */
import Stripe from 'stripe';
import { json, readBody, admin, missingEnv } from './_lib/annual.js';

const clean = (v, max = 200) => (typeof v === 'string' ? v.trim().slice(0, max) : '');

export default async function handler(req, res) {
  if (req.method !== 'POST') return json(res, 405, { error: 'method_not_allowed' });
  const missing = missingEnv('STRIPE_SECRET_KEY', 'SUPABASE_SERVICE_ROLE_KEY');
  if (missing.length) return json(res, 503, { error: 'not_configured', message: `Missing in Vercel: ${missing.join(', ')}` });

  // 1. Who is asking. The token comes from the app's own session.
  const auth = req.headers.authorization || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7).trim() : '';
  if (!token) return json(res, 401, { error: 'signed_out', message: 'You are signed out. Sign in and try again.' });
  const db = admin();
  const { data: userData, error: userErr } = await db.auth.getUser(token);
  const user = userData?.user;
  if (userErr || !user) return json(res, 401, { error: 'signed_out', message: 'Your session has expired. Sign in and try again.' });

  // 2. The one-time code from Stripe.
  let body = {};
  try { body = JSON.parse((await readBody(req)).toString('utf8') || '{}'); } catch { return json(res, 400, { error: 'bad_json' }); }
  const code = clean(body.code, 256);
  if (!/^ac_[A-Za-z0-9]+$/.test(code)) return json(res, 400, { error: 'bad_request', message: 'Stripe did not send a valid code. Start again from Set up payments.' });

  // 3. Swap it for the account id.
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  let accountId = '';
  try {
    const tok = await stripe.oauth.token({ grant_type: 'authorization_code', code });
    accountId = clean(tok?.stripe_user_id, 64);
  } catch (e) {
    // A code is single-use; a reload of the callback page lands here.
    const reused = /invalid_grant|already been used|expired/i.test(e?.message || '') || e?.code === 'invalid_grant';
    return json(res, 400, {
      error: reused ? 'code_used' : 'stripe',
      message: reused
        ? 'That link from Stripe was already used. Start again from Set up payments.'
        : `Stripe said: ${e?.message || 'unknown error'}`,
    });
  }
  if (!/^acct_[A-Za-z0-9]+$/.test(accountId)) return json(res, 502, { error: 'stripe', message: 'Stripe did not return an account id.' });

  // 4. Never let the platform's own account be connected to a member.
  let chargesEnabled = false;
  let payoutsEnabled = false;
  try {
    const platform = await stripe.accounts.retrieve();
    if (platform?.id === accountId) return json(res, 409, { error: 'platform_account', message: 'That is the LevelWorks Stripe account itself. Connect the business’s own Stripe account.' });
  } catch { /* not fatal: Stripe itself refuses to connect a platform to itself */ }
  try {
    const acct = await stripe.accounts.retrieve(accountId);
    chargesEnabled = !!acct?.charges_enabled;
    payoutsEnabled = !!acct?.payouts_enabled;
  } catch { /* status is informational; the id is what unlocks payments */ }

  // 5. Write it on his profile. Upsert: a brand-new member may have no row yet.
  const { error: upErr } = await db
    .from('profiles')
    .upsert({ user_id: user.id, stripe_account_id: accountId, updated_at: new Date().toISOString() }, { onConflict: 'user_id' });
  if (upErr) return json(res, 503, { error: 'db', message: `Stripe connected but the account could not be saved: ${upErr.message}` });

  // 6. Read it back so "ok" means it is really there.
  const { data: prof, error: readErr } = await db
    .from('profiles')
    .select('stripe_account_id')
    .eq('user_id', user.id)
    .maybeSingle();
  if (readErr || prof?.stripe_account_id !== accountId) {
    return json(res, 503, { error: 'db', message: 'Stripe connected but the account did not save. Try again.' });
  }

  return json(res, 200, { ok: true, accountId, chargesEnabled, payoutsEnabled });
}

export const config = { api: { bodyParser: false } };
