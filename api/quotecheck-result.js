/**
 * GET /api/quotecheck-result?id=…&session_id=…
 * With a paid Stripe session for this id: marks the review paid (once), emails
 * it (once), and returns the full review. Already paid: returns it again with
 * no session needed (the id is 96 random bits, the link is the key). Otherwise
 * only the teaser.
 */
import Stripe from 'stripe';
import { json, missingEnv, sendMail } from './_lib/annual.js';
import { loadReview, saveReview, teaserOf, reviewEmail } from './_lib/quotecheck.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') return json(res, 405, { error: 'method_not_allowed' });
  const missing = missingEnv('STRIPE_SECRET_KEY', 'SUPABASE_SERVICE_ROLE_KEY');
  if (missing.length) return json(res, 503, { error: 'not_configured', message: `Missing in Vercel: ${missing.join(', ')}` });

  const q = new URL(req.url, 'http://x').searchParams;
  const id = String(q.get('id') || '');
  const sessionId = String(q.get('session_id') || '');
  const review = await loadReview(id);
  if (!review) return json(res, 404, { error: 'not_found', message: 'That review has expired. Upload the quote again.' });

  if (!review.paid && sessionId) {
    try {
      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
      const s = await stripe.checkout.sessions.retrieve(sessionId);
      const ok = s && s.metadata?.review === id && (s.payment_status === 'paid' || s.amount_total === 0);
      if (ok) {
        review.paid = true;
        review.paidAt = new Date().toISOString();
        review.sessionId = s.id;
        review.email = (s.customer_details?.email || s.customer_email || review.email || '').toLowerCase();
        await saveReview(id, review);
      }
    } catch (e) {
      console.error('[quotecheck-result] stripe', e.message);
    }
  }

  if (!review.paid) return json(res, 402, { error: 'unpaid', teaser: teaserOf(review) });

  if (!review.emailed && review.email) {
    try {
      const m = reviewEmail(id, review);
      await sendMail({ to: review.email, ...m });
      review.emailed = true;
      review.emailedAt = new Date().toISOString();
      await saveReview(id, review);
    } catch (e) {
      console.error('[quotecheck-result] mail', e.message);
    }
  }

  const { result, email, paidAt, createdAt, emailed, zip, about } = review;
  return json(res, 200, { id, result, email, paidAt, createdAt, emailed, zip, about });
}
