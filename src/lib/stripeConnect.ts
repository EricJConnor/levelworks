import { supabase } from '@/lib/supabase';

/**
 * Stripe Connect for the contractor's own account.
 *
 * One place for the authorize URL — it used to be pasted into two components,
 * and the callback that saves the result lives on Vercel (`api/stripe-connect.js`)
 * where the Stripe secret and the Supabase service key already are. The
 * redirect URI is registered with Stripe exactly as written; do not change it
 * without changing it there too.
 */
const CLIENT_ID = 'ca_T3ss3sYTBR7iYQrEPRYmsQYyo8BI5XVA';
const REDIRECT_URI = 'https://levelworks.org/stripe-connect-callback';

/** Sends the signed-in contractor to Stripe to connect (or reconnect) an account. */
export async function startStripeConnect(): Promise<boolean> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;
  const q = new URLSearchParams({
    response_type: 'code',
    client_id: CLIENT_ID,
    scope: 'read_write',
    redirect_uri: REDIRECT_URI,
    state: user.id,
  });
  window.location.href = `https://connect.stripe.com/oauth/authorize?${q.toString()}`;
  return true;
}

export interface ConnectResult {
  ok: boolean;
  accountId?: string;
  chargesEnabled?: boolean;
  error?: string;
  message?: string;
}

/**
 * Hands Stripe's one-time code to our server, which swaps it for the account id
 * and writes it onto the signed-in user's profile. The user is identified by
 * their session token, never by anything in the URL.
 */
export async function finishStripeConnect(code: string): Promise<ConnectResult> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) return { ok: false, error: 'signed_out' };
  const res = await fetch('/api/stripe-connect', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
    body: JSON.stringify({ code }),
  });
  let body: any = {};
  try { body = await res.json(); } catch { /* fall through to a plain error */ }
  if (!res.ok) return { ok: false, error: body.error || `http_${res.status}`, message: body.message };
  return { ok: true, accountId: body.accountId, chargesEnabled: !!body.chargesEnabled };
}
