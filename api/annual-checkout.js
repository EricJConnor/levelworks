/**
 * POST /api/annual-checkout
 * Body: { lang: 'en'|'es', email?: string, utm?: { source, medium, campaign, content } }
 * Creates a one-time $49 Stripe Checkout Session and returns { url }.
 *
 * No signup form before payment: Stripe collects the email, and the webhook
 * creates the account. 409 when the 500 spots are gone.
 */
import Stripe from 'stripe';
import { json, readBody, normalizeLang, claimedCount, ANNUAL_CAP, SITE_URL, missingEnv } from './_lib/annual.js';

const clean = (v, max = 120) => (typeof v === 'string' ? v.trim().slice(0, max) : '');

export default async function handler(req, res) {
  if (req.method !== 'POST') return json(res, 405, { error: 'method_not_allowed' });
  const missing = missingEnv('STRIPE_SECRET_KEY', 'STRIPE_PRICE_ANNUAL_49', 'SUPABASE_SERVICE_ROLE_KEY');
  if (missing.length) return json(res, 503, { error: 'not_configured', message: `Missing in Vercel: ${missing.join(', ')}` });

  let body = {};
  try { body = JSON.parse((await readBody(req)).toString('utf8') || '{}'); } catch { /* empty body is fine */ }
  const lang = normalizeLang(body.lang);
  const email = clean(body.email, 200);
  const utm = body.utm && typeof body.utm === 'object' ? body.utm : {};

  let count = 0;
  try { count = await claimedCount(); } catch (e) { return json(res, 503, { error: 'db', message: e.message }); }
  if (count >= ANNUAL_CAP) return json(res, 409, { error: 'sold_out', count });

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  const base = lang === 'es' ? `${SITE_URL}/es/annual` : `${SITE_URL}/annual`;
  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: [{ price: process.env.STRIPE_PRICE_ANNUAL_49, quantity: 1 }],
      locale: lang,
      allow_promotion_codes: true,
      ...(email ? { customer_email: email } : {}),
      customer_creation: 'always',
      success_url: `${SITE_URL}${lang === 'es' ? '/es' : ''}/annual/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: base,
      metadata: {
        plan: 'annual_49',
        lang,
        utm_source: clean(utm.source), utm_medium: clean(utm.medium),
        utm_campaign: clean(utm.campaign), utm_content: clean(utm.content),
      },
      payment_intent_data: { description: 'LevelWorks Annual (1 year)', metadata: { plan: 'annual_49', lang } },
    });
    return json(res, 200, { url: session.url, id: session.id });
  } catch (e) {
    return json(res, 502, { error: 'stripe', message: e.message });
  }
}

export const config = { api: { bodyParser: false } };
