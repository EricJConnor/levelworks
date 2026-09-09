/**
 * POST /api/annual-session
 * Body: { session_id, password? }
 *
 * The screen after paying. Looks the Checkout Session up with Stripe (never
 * trusts the browser), makes sure the purchase is fulfilled (idempotent with
 * the webhook, so it works even if Stripe's message is late), and:
 *
 *   no password  → { email, canSetPassword }   the page decides what to show
 *   password     → sets it on the account and returns { ok, email }; the page
 *                  then signs in with it and goes to the app.
 *
 * Setting a password from a session id is allowed only for an account this
 * purchase created and that has never signed in. An existing account keeps its
 * password; that person signs in as usual and the year is already on it.
 */
import Stripe from 'stripe';
import { admin, json, readBody, fulfilSession, missingEnv } from './_lib/annual.js';

export const config = { api: { bodyParser: false } };
const WINDOW_H = 72;   // hours after payment during which the set-password screen works

export default async function handler(req, res) {
  if (req.method !== 'POST') return json(res, 405, { error: 'method_not_allowed' });
  const missing = missingEnv('STRIPE_SECRET_KEY', 'SUPABASE_SERVICE_ROLE_KEY');
  if (missing.length) return json(res, 503, { error: 'not_configured', message: `Missing in Vercel: ${missing.join(', ')}` });

  let body = {};
  try { body = JSON.parse((await readBody(req)).toString('utf8') || '{}'); } catch { /* fallthrough */ }
  const sid = typeof body.session_id === 'string' ? body.session_id.trim() : '';
  const password = typeof body.password === 'string' ? body.password : '';
  if (!/^cs_(live|test)_[A-Za-z0-9]+$/.test(sid)) return json(res, 400, { error: 'bad_session' });

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  let s;
  try { s = await stripe.checkout.sessions.retrieve(sid); }
  catch (e) { return json(res, 404, { error: 'not_found', message: e.message }); }
  if (s.metadata?.plan !== 'annual_49') return json(res, 400, { error: 'not_annual' });
  if (s.payment_status !== 'paid' && s.amount_total !== 0) return json(res, 402, { error: 'unpaid', status: s.payment_status });
  if (Date.now() / 1000 - s.created > WINDOW_H * 3600) return json(res, 410, { error: 'expired' });

  let r;
  try { r = await fulfilSession(s); }
  catch (e) { return json(res, 500, { error: 'fulfil', message: e.message }); }

  const u = r.user;
  const fresh = u.user_metadata?.source === 'annual_49_launch' && !u.last_sign_in_at;
  if (!password) return json(res, 200, { email: r.email, lang: r.lang, canSetPassword: fresh, expires: r.expires });

  if (!fresh) return json(res, 403, { error: 'existing_account', email: r.email });
  if (password.length < 8) return json(res, 400, { error: 'weak_password' });
  const upd = await admin().auth.admin.updateUserById(u.id, { password, email_confirm: true });
  if (upd.error) return json(res, 500, { error: 'password', message: upd.error.message });
  return json(res, 200, { ok: true, email: r.email, lang: r.lang });
}
