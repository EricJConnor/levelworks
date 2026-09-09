/**
 * POST /api/stripe-annual-webhook   (Stripe → here)
 * Events: checkout.session.completed, charge.refunded
 *
 * Signature is verified against STRIPE_ANNUAL_WEBHOOK_SECRET. Idempotent by
 * event id: the first thing we do is insert the id into stripe_events, and a
 * duplicate delivery stops there.
 *
 * On a paid annual session:
 *   1. find or create the user for the email Stripe collected
 *   2. plan = annual, expires a year out
 *   3. one row in annual_purchases (the counter)
 *   4. Purchase to Meta's Conversions API, event_id = session id (dedupes with the pixel)
 *   5. welcome email: a one-tap login link for a new account, a receipt-style note for an old one
 */
import Stripe from 'stripe';
import { admin, json, readBody, revokeAnnual, fulfilSession, missingEnv } from './_lib/annual.js';

export const config = { api: { bodyParser: false } };

export default async function handler(req, res) {
  if (req.method !== 'POST') return json(res, 405, { error: 'method_not_allowed' });
  const missing = missingEnv('STRIPE_SECRET_KEY', 'STRIPE_ANNUAL_WEBHOOK_SECRET', 'SUPABASE_SERVICE_ROLE_KEY');
  if (missing.length) return json(res, 503, { error: 'not_configured', message: `Missing in Vercel: ${missing.join(', ')}` });

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  const raw = await readBody(req);
  let event;
  try {
    event = stripe.webhooks.constructEvent(raw, req.headers['stripe-signature'], process.env.STRIPE_ANNUAL_WEBHOOK_SECRET);
  } catch (e) {
    return json(res, 400, { error: 'bad_signature', message: e.message });
  }

  // Idempotency: claim the event id first.
  const a = admin();
  const claim = await a.from('stripe_events').insert({ id: event.id, type: event.type });
  if (claim.error) {
    if (String(claim.error.code) === '23505') return json(res, 200, { ok: true, duplicate: true });
    return json(res, 500, { error: 'db', message: claim.error.message });
  }

  try {
    if (event.type === 'checkout.session.completed') {
      const s = event.data.object;
      if (s.metadata?.plan !== 'annual_49') return json(res, 200, { ok: true, ignored: 'not annual' });
      if (s.payment_status !== 'paid' && s.amount_total !== 0) return json(res, 200, { ok: true, ignored: s.payment_status });
      const out = await fulfil(stripe, s);
      return json(res, 200, { ok: true, ...out });
    }
    if (event.type === 'charge.refunded') {
      const ch = event.data.object;
      const out = await refund(ch);
      return json(res, 200, { ok: true, ...out });
    }
    return json(res, 200, { ok: true, ignored: event.type });
  } catch (e) {
    // Release the id so Stripe's retry can do the work.
    await a.from('stripe_events').delete().eq('id', event.id);
    console.error('[annual-webhook]', event.type, e);
    return json(res, 500, { error: 'handler', message: e.message });
  }
}

async function fulfil(stripe, s) {
  const r = await fulfilSession(s);
  return { user_id: r.user.id, created: r.created, expires: r.expires, alreadyDone: r.alreadyDone, capi: r.capi, mail: r.mail };
}

async function refund(ch) {
  const a = admin();
  const pi = typeof ch.payment_intent === 'string' ? ch.payment_intent : ch.payment_intent?.id;
  if (!pi) return { ignored: 'no payment_intent' };
  const { data: p } = await a.from('annual_purchases').select('id, user_id, refunded_at').eq('stripe_payment_intent', pi).maybeSingle();
  if (!p) return { ignored: 'not an annual purchase' };
  if (p.refunded_at) return { already: true };
  const upd = await a.from('annual_purchases').update({ refunded_at: new Date().toISOString() }).eq('id', p.id);
  if (upd.error) throw new Error('refund update: ' + upd.error.message);
  if (p.user_id) await revokeAnnual(p.user_id);
  return { refunded: p.id, user_id: p.user_id };
}
