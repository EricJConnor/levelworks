/**
 * Settle bank transfers that have cleared, once a day.
 *
 * A US bank transfer (ACH) is a batch system, not a card network: the money
 * moves overnight in scheduled runs and Stripe cannot say whether it cleared
 * for about four business days. That delay is the payment rail, not anything
 * LevelWorks chose, and QuickBooks has exactly the same wait.
 *
 * While it is in flight the payment sits in `payment_history` with
 * `pending: true`, counting toward neither paid nor unpaid, because saying
 * either would be a lie: the client has paid, and the contractor has not been
 * paid. `api/invoice-payment.js` re-checks it whenever somebody opens the
 * invoice, which covers the common case. This is the backstop for the one it
 * misses: an invoice nobody opens again. Without it a settled payment could sit
 * marked "clearing" indefinitely while the money was already in his Stripe
 * account.
 *
 * Runs in the daily cron. Reads only invoices that actually have something
 * pending, so on a normal morning it does nothing and costs nothing.
 */
import Stripe from 'stripe';

const PI = /^pi_[A-Za-z0-9]+$/;

export async function settlePending({ a, dry = false }) {
  const out = { looked: 0, cleared: 0, failed: 0, stillWaiting: 0, errors: [] };
  if (!process.env.STRIPE_SECRET_KEY) return out;
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

  // Postgres cannot index into a JSONB array cheaply here, so narrow on the
  // rows that could possibly have one: anything not already settled.
  const { data: rows, error } = await a
    .from('invoices')
    .select('id, user_id, total, amount_paid, status, payment_history')
    .neq('status', 'paid')
    .limit(2000);
  if (error) { out.errors.push('invoices: ' + error.message); return out; }

  const waiting = (rows || []).filter((r) => {
    const h = Array.isArray(r.payment_history) ? r.payment_history : [];
    return h.some((x) => x && x.pending && PI.test(String(x.paymentIntentId || '')));
  });
  out.looked = waiting.length;
  if (!waiting.length) return out;

  // One profile lookup per contractor, not per invoice.
  const ids = [...new Set(waiting.map((r) => r.user_id))];
  const { data: profs } = await a.from('profiles').select('user_id, stripe_account_id').in('user_id', ids);
  const acct = new Map((profs || []).map((p) => [p.user_id, p.stripe_account_id]));

  for (const inv of waiting) {
    const stripeAccount = acct.get(inv.user_id);
    if (!stripeAccount) { out.errors.push(`no stripe account for invoice ${inv.id}`); continue; }

    const history = Array.isArray(inv.payment_history) ? inv.payment_history : [];
    let next = [...history];
    let paid = Number(inv.amount_paid) || 0;
    let changed = false;

    for (const entry of history.filter((x) => x && x.pending && PI.test(String(x.paymentIntentId || '')))) {
      let pi;
      try { pi = await stripe.paymentIntents.retrieve(entry.paymentIntentId, {}, { stripeAccount }); }
      catch (e) { out.errors.push(`${entry.paymentIntentId}: ${e.message}`); continue; }
      if (pi.metadata?.invoice_id !== inv.id) continue;
      if (pi.status === 'processing') { out.stillWaiting++; continue; }
      changed = true;
      if (pi.status === 'succeeded') {
        // Capped: see the same note in api/invoice-payment.js. A contractor who
        // marked it paid by hand mid-clearing must not end up showing an
        // overpayment when the transfer lands.
        const got = (Number(pi.amount_received) || 0) / 100;
        paid = Math.min(Math.round((paid + got) * 100) / 100, Math.round((Number(inv.total) || 0) * 100) / 100);
        next = next.map((h) => (h.paymentIntentId === pi.id ? { ...h, pending: false, amount: got, settledAt: new Date().toISOString() } : h));
        out.cleared++;
      } else {
        // A bank transfer can bounce days later, usually for insufficient
        // funds. The record stays, marked, so nobody is left wondering where a
        // payment went, and the invoice goes back to owing the money.
        next = next.map((h) => (h.paymentIntentId === pi.id ? { ...h, pending: false, failed: true, amount: 0, note: `Bank transfer ${pi.status}` } : h));
        out.failed++;
      }
    }

    if (!changed || dry) continue;
    const total = Number(inv.total) || 0;
    const status = paid >= total - 0.005 ? 'paid' : paid > 0 ? 'partially_paid' : inv.status;
    const { error: upErr } = await a.from('invoices').update({ amount_paid: paid, status, payment_history: next }).eq('id', inv.id);
    if (upErr) out.errors.push(`update ${inv.id}: ${upErr.message}`);
  }

  return out;
}
