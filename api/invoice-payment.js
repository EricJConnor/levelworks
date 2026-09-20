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
 *   { action: 'create',  invoiceId, viewToken, method, customerName, customerEmail }
 *     → { clientSecret, paymentIntentId, stripeAccountId, amount, method, allowed }
 *   { action: 'confirm', invoiceId, viewToken, paymentIntentId }
 *     → { ok, amountPaid, status } or { ok, pending: true } for a bank debit
 *   { action: 'sync',    invoiceId, viewToken }
 *     → { ok, changed, amountPaid, status, pending }
 *
 * The amount is always computed here from the invoice row — the browser never
 * decides what it owes. `confirm` re-reads the PaymentIntent from Stripe before
 * marking anything paid, and stamps `recorded` on it so a repeat call cannot
 * count the same payment twice.
 *
 * CARD OR BANK, the contractor's choice per invoice. A card costs him 2.9% plus
 * 30c; a bank debit costs 0.8% capped at $5, so on a $20,000 roof it is $580
 * against $5. The choice rides on the line items as `payMethods`, the same way
 * `hidePrice` does, so it needed no migration. LevelWorks adds nothing to
 * either: taking a cut of the method people choose to avoid fees would defeat
 * the point of offering it.
 *
 * A bank debit does not settle at the counter. Stripe returns `processing` and
 * takes about four business days. Instead of running a webhook, the payment is
 * written to `payment_history` with `pending: true` and `sync` re-checks it
 * whenever the invoice is opened, by either side. Self-healing, nothing to
 * configure. Bank debit does have to be switched on once in the platform's
 * Stripe dashboard; until it is, `create` answers `bank_not_enabled` in plain
 * words rather than leaking a Stripe error onto a client's screen.
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
  const action = ['confirm', 'sync'].includes(body.action) ? body.action : 'create';
  const invoiceId = clean(body.invoiceId, 64);
  const viewToken = clean(body.viewToken, 128);
  if (!UUID.test(invoiceId) || !viewToken) return json(res, 400, { error: 'bad_request', message: 'Missing invoice or link.' });

  const db = admin();
  // The link token is the client's only credential: no token, no invoice.
  const { data: inv, error: invErr } = await db
    .from('invoices')
    .select('id, user_id, invoice_number, project_name, client_name, client_email, total, amount_paid, payment_history, status, line_items')
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

  /**
   * Which ways this invoice may be paid, stamped on its line items by the
   * builder. Anything written before that existed has no stamp and means card,
   * which is all those invoices ever offered.
   */
  const rawItems = Array.isArray(inv.line_items)
    ? inv.line_items
    : (() => { try { return JSON.parse(inv.line_items || '[]'); } catch { return []; } })();
  const allowed = (() => {
    for (const i of rawItems) {
      if (['card', 'bank', 'both'].includes(i?.payMethods)) return i.payMethods;
    }
    return 'card';
  })();

  if (action === 'create') {
    if (dueCents < 50) return json(res, 409, { error: 'already_paid', message: 'There is nothing left to pay on this invoice.' });
    // A bank transfer costs the contractor 0.8% capped at $5 against 2.9% plus
    // 30c on a card, which is why he gets to say which the client may use.
    const wantsBank = body.method === 'bank';
    if (wantsBank && allowed === 'card') return json(res, 409, { error: 'method_not_allowed', message: 'This invoice is card only.' });
    if (!wantsBank && allowed === 'bank') return json(res, 409, { error: 'method_not_allowed', message: 'This invoice is bank transfer only.' });
    const customerEmail = clean(body.customerEmail) || inv.client_email || undefined;
    const customerName = clean(body.customerName, 120) || inv.client_name || '';
    const who = prof?.company_name ? ` — ${prof.company_name}` : '';
    try {
      const pi = await stripe.paymentIntents.create({
        amount: dueCents,
        currency: 'usd',
        payment_method_types: [wantsBank ? 'us_bank_account' : 'card'],
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
      return json(res, 200, { clientSecret: pi.client_secret, paymentIntentId: pi.id, stripeAccountId, amount: dueCents / 100, method: wantsBank ? 'bank' : 'card', allowed });
    } catch (e) {
      // Bank debit has to be switched on once in the platform's Stripe
      // dashboard. Until it is, Stripe refuses the payment method type, and a
      // raw Stripe error on a client's invoice page is useless to everyone.
      const notEnabled = wantsBank && /payment method type|us_bank_account|invalid.*payment_method_types/i.test(e.message || '');
      if (notEnabled) return json(res, 409, { error: 'bank_not_enabled', message: 'Bank transfers are not switched on for this account yet.' });
      return json(res, 502, { error: 'stripe', message: e.message });
    }
  }

  /**
   * sync: settle anything still in flight. A card is instant, but a bank debit
   * sits in `processing` for about four business days before Stripe knows
   * whether it cleared. Rather than run a webhook, every pending payment is
   * written into `payment_history` with `pending: true` and re-checked here
   * whenever the invoice is opened — by the client on the public link or by the
   * contractor in his list. Self-healing, and nothing to configure.
   */
  if (action === 'sync') {
    const history = Array.isArray(inv.payment_history) ? inv.payment_history : [];
    const pending = history.filter((h) => h && h.pending && /^pi_[A-Za-z0-9]+$/.test(String(h.paymentIntentId || '')));
    if (!pending.length) return json(res, 200, { ok: true, changed: false, amountPaid: paid, status: inv.status, pending: 0 });

    let next = [...history];
    let newPaid = paid;
    let changed = false;
    for (const entry of pending) {
      let p;
      try { p = await stripe.paymentIntents.retrieve(entry.paymentIntentId, {}, { stripeAccount: stripeAccountId }); }
      catch { continue; }
      if (p.metadata?.invoice_id !== inv.id) continue;
      if (p.status === 'processing') continue;
      changed = true;
      if (p.status === 'succeeded') {
        // Capped at the total on purpose. If the contractor marked the invoice
        // paid by hand while the transfer was still clearing — he was handed a
        // cheque, or he just did not want to wait — adding the bank amount on
        // top would show the client as having overpaid. An invoice can never
        // be more than settled.
        const got = (Number(p.amount_received) || 0) / 100;
        newPaid = Math.min(Math.round((newPaid + got) * 100) / 100, Math.round(total * 100) / 100);
        next = next.map((h) => (h.paymentIntentId === p.id ? { ...h, pending: false, amount: got, settledAt: new Date().toISOString() } : h));
      } else {
        // Failed or cancelled: the money never moved, so the record should not
        // imply it did. Keep it, marked, so the client is not left wondering.
        next = next.map((h) => (h.paymentIntentId === p.id ? { ...h, pending: false, failed: true, amount: 0, note: `Bank transfer ${p.status}` } : h));
      }
    }
    if (!changed) return json(res, 200, { ok: true, changed: false, amountPaid: paid, status: inv.status, pending: pending.length });

    const newStatus = newPaid >= total - 0.005 ? 'paid' : newPaid > 0 ? 'partially_paid' : inv.status;
    const { error: sErr } = await db.from('invoices').update({ amount_paid: newPaid, status: newStatus, payment_history: next }).eq('id', inv.id);
    if (sErr) return json(res, 503, { error: 'db', message: sErr.message });
    return json(res, 200, { ok: true, changed: true, amountPaid: newPaid, status: newStatus, pending: next.filter((h) => h.pending).length });
  }

  // confirm: the browser says the card went through; believe Stripe, not the browser.
  const paymentIntentId = clean(body.paymentIntentId, 128);
  if (!/^pi_[A-Za-z0-9]+$/.test(paymentIntentId)) return json(res, 400, { error: 'bad_request', message: 'Missing payment reference.' });
  let pi;
  try { pi = await stripe.paymentIntents.retrieve(paymentIntentId, {}, { stripeAccount: stripeAccountId }); }
  catch (e) { return json(res, 502, { error: 'stripe', message: e.message }); }
  if (pi.metadata?.invoice_id !== inv.id) return json(res, 400, { error: 'mismatch', message: 'That payment is not for this invoice.' });
  if (pi.metadata?.recorded === '1') return json(res, 200, { ok: true, already: true, amountPaid: paid, status: inv.status });

  /**
   * A bank debit does not succeed at the counter. Stripe accepts it, returns
   * `processing`, and takes about four business days to say whether it cleared.
   * Treating that as failure would tell a client who has just paid that they
   * have not. Record it as pending instead: it does not count toward the amount
   * paid and does not mark the invoice settled, and `sync` finishes the job
   * when the money lands.
   */
  if (pi.status === 'processing') {
    const historyP = Array.isArray(inv.payment_history) ? inv.payment_history : [];
    if (historyP.some((h) => h && h.paymentIntentId === pi.id)) {
      return json(res, 200, { ok: true, pending: true, already: true, amountPaid: paid, status: inv.status });
    }
    const pendingEntry = {
      amount: (Number(pi.amount) || 0) / 100,
      date: new Date().toISOString(),
      note: 'Bank transfer (Stripe) — clearing',
      method: 'bank',
      paymentIntentId: pi.id,
      pending: true,
    };
    const { error: pErr } = await db.from('invoices').update({ payment_history: [...historyP, pendingEntry] }).eq('id', inv.id);
    if (pErr) return json(res, 503, { error: 'db', message: pErr.message });
    return json(res, 200, { ok: true, pending: true, amountPaid: paid, status: inv.status });
  }

  if (pi.status !== 'succeeded') return json(res, 409, { error: 'not_paid', message: `Payment status is ${pi.status}.`, status: pi.status });

  const received = (Number(pi.amount_received) || 0) / 100;
  const newPaid = Math.round((paid + received) * 100) / 100;
  const newStatus = newPaid >= total - 0.005 ? 'paid' : newPaid > 0 ? 'partially_paid' : inv.status;
  const history = Array.isArray(inv.payment_history) ? inv.payment_history : [];
  const viaBank = (pi.payment_method_types || []).includes('us_bank_account');
  const entry = { amount: received, date: new Date().toISOString(), note: viaBank ? 'Bank transfer (Stripe)' : 'Card payment (Stripe)', method: viaBank ? 'bank' : 'card', paymentIntentId: pi.id };
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
