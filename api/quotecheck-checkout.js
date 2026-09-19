/**
 * POST /api/quotecheck-checkout   Body: { id, email, utm? }
 * A $79 one-time Stripe Checkout for one review. The price is built inline so
 * no Stripe product or env var has to exist first. Returns { url }.
 */
import Stripe from 'stripe';
import { json, readBody, missingEnv, SITE_URL } from './_lib/annual.js';
import { loadReview, saveReview, PRICE_CENTS, PAGE } from './_lib/quotecheck.js';

const clean = (v, max = 120) => (typeof v === 'string' ? v.trim().slice(0, max) : '');

export default async function handler(req, res) {
  if (req.method !== 'POST') return json(res, 405, { error: 'method_not_allowed' });
  const missing = missingEnv('STRIPE_SECRET_KEY', 'SUPABASE_SERVICE_ROLE_KEY');
  if (missing.length) return json(res, 503, { error: 'not_configured', message: `Missing in Vercel: ${missing.join(', ')}` });

  let body = {};
  try { body = JSON.parse((await readBody(req)).toString('utf8') || '{}'); } catch { /* fine */ }
  const id = clean(body.id, 24);
  const review = await loadReview(id);
  if (!review) return json(res, 404, { error: 'not_found', message: 'That review has expired. Upload the quote again.' });
  if (!review.result?.readable) return json(res, 400, { error: 'unreadable', message: 'We could not read that quote, so there is nothing to pay for.' });
  const email = clean(body.email, 200).toLowerCase() || review.email || '';
  const utm = body.utm && typeof body.utm === 'object' ? body.utm : {};
  if (email && email !== review.email) { review.email = email; await saveReview(id, review); }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: [{
        quantity: 1,
        price_data: {
          currency: 'usd', unit_amount: PRICE_CENTS,
          product_data: { name: 'Quote Check', description: `A contractor's review of your ${review.result.trade || 'contractor'} quote` },
        },
      }],
      ...(email ? { customer_email: email } : {}),
      success_url: `${PAGE}/result?id=${id}&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${PAGE}?id=${id}`,
      metadata: {
        plan: 'quotecheck', review: id,
        utm_source: clean(utm.source), utm_medium: clean(utm.medium), utm_campaign: clean(utm.campaign), utm_content: clean(utm.content),
      },
      payment_intent_data: { description: 'Quote Check review', metadata: { plan: 'quotecheck', review: id } },
    });
    return json(res, 200, { url: session.url });
  } catch (e) {
    return json(res, 502, { error: 'stripe', message: e.message });
  }
}

export const config = { api: { bodyParser: false } };
