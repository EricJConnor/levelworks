/**
 * POST /api/invoice-payment
 *
 * The client's "Pay by card" on a public invoice link. The old app called a
 * Supabase edge function (`create-invoice-payment`) that was never deployed, so
 * every card payment failed for every contractor. This route lives on Vercel
 * next to the $49 checkout, where STRIPE_SECRET_KEY and the Supabase service
 * key already are — nothing new to configure.
 *
 * The charge is made ON THE CONTRACTOR'S OWN STRIPE ACCOUNT (Stripe Connect,
 * `stripeAccount` header), the same way recurring billing does it, so the money
 * lands in his account and his name is on the client's statement. LevelWorks
 * takes no fee: the $5 plan is the revenue.
 *
 *   { action: 'create',  invoiceId, viewToken, customerName, customerEmail }
 *     → { clientSecret, paymentIntentId, stripeAccountId, amount }
 *   { action: 'confirm', invoiceId, viewToken, paymentIntentId }
 *     → { ok, amountPaid, status }
 *
 * The amount is always computed here from the invoice row — the browser never
 * decides what it owes. `confirm` re-reads the PaymentIntent from Stripe before
 * marking anything paid, and stamps `recorded` on it so a repeat call cannot
 * count the same payment twice.
 */
import Stripe from 'stripe';
import { json, readBody, admin, missingEnv } from './_lib/annual.js';

const clean = (v, max = 200) => (typeof v === 'string' ? v.trim().slice(0, max) : '');
const UUID = /^[0-9a-f-]{8,64}$/i;

export default async function handler(req, res) {
  if (req.method !== 'POST') return json(res, 405, { error: 'method_not_allowed' });
  const missing = missingEnv('STRIPE_SECRET_KEY', 'SUPABASE_SERVICE_ROLE_KEY');
  if (missing.length) return json(res, 503, { error: 'not_configured', message: `Missing in Vercel: ${missing.join(', ')}` });

  let body = {};
  try { body = JSON.parse((await readBody(req)).toString('utf8') || '{}'); } catch { return json(res, 400, { error: 'bad_json' }); }
  const action = body.action === 'confirm' ? 'confirm' : 'create';
  const invoiceId = clean(body.invoiceId, 64);
  const viewToken = clean(body.viewToken, 128);
  if (!UUID.test(invoiceId) || !viewToken) return json(res, 400, { error: 'bad_request', message: 'Missing invoice or link.' });

  const db = admin();
  // The link token is the client's only credential: no token, no invoice.
  const { data: inv, error: invErr } = await db
    .from('invoices')
    .select('id, user_id, invoice_number, project_name, client_name, client_email, total, amount_paid, payment_history, status')
    .eq('id', invoiceId)
    .eq('view_token', viewToken)
    .maybeSingle();
  if (invErr) return json(res, 503, { error: 'db', message: invErr.message });
  if (!inv) return json(res, 404, { error: 'not_found', message: 'Invoice not found.' });

  const { data: prof } = await db
    .from('profiles')
    .select('stripe_account_id, company_name')
    .eq('user_id', inv.user_id)
    .maybeSingle();
  const stripeAccountId = prof?.stripe_account_id || '';
  if (!stripeAccountId) return json(res, 409, { error: 'not_set_up', message: 'This business is not taking card payments yet.' });

  const total = Number(inv.total) || 0;
  const paid = Number(inv.amount_paid) || 0;
  const dueCents = Math.round((total - paid) * 100);
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

  if (action === 'create') {
    if (dueCents < 50) return json(res, 409, { error: 'already_paid', message: 'There is nothing left to pay on this invoice.' });
    const customerEmail = clean(body.customerEmail) || inv.client_email || undefined;
    const customerName = clean(body.customerName, 120) || inv.client_name || '';
    const who = prof?.company_name ? ` — ${prof.company_name}` : '';
    try {
      const pi = await stripe.paymentIntents.create({
        amount: dueCents,
        currency: 'usd',
        payment_method_types: ['card'],
        description: `Invoice ${inv.invoice_number || inv.id.slice(-6)}${who}`.slice(0, 500),
        ...(customerEmail ? { receipt_email: customerEmail } : {}),
        metadata: {
          invoice_id: inv.id,
          invoice_number: String(inv.invoice_number || ''),
          project: String(inv.project_name || '').slice(0, 200),
          payer_name: customerName.slice(0, 200),
          source: 'levelworks',
        },
      }, { stripeAccount: stripeAccountId });
      return json(res, 200, { clientSecret: pi.client_secret, paymentIntentId: pi.id, stripeAccountId, amount: dueCents / 100 });
    } catch (e) {
      return json(res, 502, { error: 'stripe', message: e.message });
    }
  }

  // confirm: the browser says the card went through; believe Stripe, not the browser.
  const paymentIntentId = clean(body.paymentIntentId, 128);
  if (!/^pi_[A-Za-z0-9]+$/.test(paymentIntentId)) return json(res, 400, { error: 'bad_request', message: 'Missing payment reference.' });
  let pi;
  try { pi = await stripe.paymentIntents.retrieve(paymentIntentId, {}, { stripeAccount: stripeAccountId }); }
  catch (e) { return json(res, 502, { error: 'stripe', message: e.message }); }
  if (pi.metadata?.invoice_id !== inv.id) return json(res, 400, { error: 'mismatch', message: 'That payment is not for this invoice.' });
  if (pi.status !== 'succeeded') return json(res, 409, { error: 'not_paid', message: `Payment status is ${pi.status}.`, status: pi.status });
  if (pi.metadata?.recorded === '1') return json(res, 200, { ok: true, already: true, amountPaid: paid, status: inv.status });

  const received = (Number(pi.amount_received) || 0) / 100;
  const newPaid = Math.round((paid + received) * 100) / 100;
  const newStatus = newPaid >= total - 0.005 ? 'paid' : newPaid > 0 ? 'partially_paid' : inv.status;
  const history = Array.isArray(inv.payment_history) ? inv.payment_history : [];
  const entry = { amount: received, date: new Date().toISOString(), note: 'Card payment (Stripe)', method: 'card', paymentIntentId: pi.id };
  const { error: upErr } = await db
    .from('invoices')
    .update({ amount_paid: newPaid, status: newStatus, payment_history: [...history, entry] })
    .eq('id', inv.id);
  if (upErr) return json(res, 503, { error: 'db', message: upErr.message });

  // Stripe is the idempotency store: a second confirm for this intent is a no-op above.
  try { await stripe.paymentIntents.update(pi.id, { metadata: { recorded: '1' } }, { stripeAccount: stripeAccountId }); } catch { /* the invoice is already marked; this only guards a retry */ }
  return json(res, 200, { ok: true, amountPaid: newPaid, status: newStatus });
}

export const config = { api: { bodyParser: false } };
