import { supabase } from './supabase';

/**
 * How the contractor's connected Stripe account pays him, read from
 * `api/stripe-payouts.js`. A "manual" interval means Stripe holds every payment
 * until he presses Pay out himself, which is how a real payment once sat for
 * five days. Cached for a day per account so the dashboard does not ask Stripe
 * on every load; a change made in Stripe shows up by the next day, or at once
 * after a sign-out.
 */
export interface PayoutInfo {
  interval: 'manual' | 'daily' | 'weekly' | 'monthly' | '';
  delayDays: number;
  payoutsEnabled: boolean;
  bankLast4: string;
}

const KEY = 'lw-payouts';
const TTL = 24 * 60 * 60 * 1000;

/** Stripe's own page for the schedule. Same URL on every Standard account. */
export const STRIPE_PAYOUT_SETTINGS = 'https://dashboard.stripe.com/settings/payouts';

export async function fetchPayoutInfo(accountId: string, force = false): Promise<PayoutInfo | null> {
  try {
    if (!force) {
      const raw = localStorage.getItem(KEY);
      if (raw) {
        const c = JSON.parse(raw);
        if (c?.accountId === accountId && Date.now() - (c.at || 0) < TTL && c.info) return c.info as PayoutInfo;
      }
    }
  } catch { /* storage is a convenience */ }
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) return null;
  const r = await fetch('/api/stripe-payouts', { headers: { Authorization: `Bearer ${session.access_token}` } });
  if (!r.ok) return null;
  const d = await r.json().catch(() => null);
  if (!d?.ok || !d.connected) return null;
  const info: PayoutInfo = {
    interval: d.interval || '',
    delayDays: Number(d.delayDays) || 0,
    payoutsEnabled: !!d.payoutsEnabled,
    bankLast4: d.bankLast4 || '',
  };
  try { localStorage.setItem(KEY, JSON.stringify({ accountId, at: Date.now(), info })); } catch { /* fine */ }
  return info;
}
