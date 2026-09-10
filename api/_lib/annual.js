/**
 * Shared server-side pieces for the $49 annual launch.
 *
 * Files under api/_lib are helpers, not routes: Vercel does not deploy an
 * underscore-prefixed folder as functions.
 *
 * Environment (Vercel → Settings → Environment Variables):
 *   STRIPE_SECRET_KEY              live secret key
 *   STRIPE_PRICE_ANNUAL_49         price_… for the $49 one-time product
 *   STRIPE_ANNUAL_WEBHOOK_SECRET   whsec_… from the /api/stripe-annual-webhook endpoint
 *   SUPABASE_SERVICE_ROLE_KEY      a Supabase secret key (sb_secret_… or the legacy service_role JWT)
 *   META_CAPI_TOKEN                Conversions API token for pixel 2017000758930909
 *   META_TEST_EVENT_CODE           optional, only while checking Test Events in Events Manager
 *   RESEND_API_KEY                 optional; when set, mail goes out as Eric directly. Without it
 *                                  the existing send-email edge function is used.
 *   CRON_SECRET                    Vercel sets the Authorization header on cron calls with this
 *   SITE_URL                       optional, defaults to https://levelworks.org
 */
import { createClient } from '@supabase/supabase-js';
import { createHash } from 'node:crypto';

export const SUPABASE_URL = 'https://djrsmuafbbzxpbdibolq.supabase.co';
export const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRqcnNtdWFmYmJ6eHBiZGlib2xxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ5ODE1OTIsImV4cCI6MjA5MDU1NzU5Mn0.vIKq1NjFXX3w7Jj09AEU8F4KLxG9O6TA-bsDl7vFKlw';
export const PIXEL_ID = '2017000758930909';
export const ANNUAL_CAP = 500;
// www is the canonical host: the bare domain 307-redirects, and Stripe's webhook
// delivery and some mail clients do not follow redirects.
export const SITE_URL = (process.env.SITE_URL || 'https://www.levelworks.org').replace(/\/$/, '');
export const ERIC_REPLY_TO = 'eric@ec-homes.com';

export function missingEnv(...names) {
  return names.filter(n => !process.env[n]);
}

let _admin;
export function admin() {
  if (!_admin) {
    _admin = createClient(SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return _admin;
}

export function json(res, status, body) {
  res.status(status).setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(body));
}

export function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', c => chunks.push(c));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

export function normalizeLang(l) {
  return String(l || '').toLowerCase().startsWith('es') ? 'es' : 'en';
}

/** How many real, non-refunded annual purchases exist. */
export async function claimedCount() {
  const { data, error } = await admin().rpc('annual_claimed_count');
  if (error) throw new Error('annual_claimed_count: ' + error.message);
  return Number(data) || 0;
}

/**
 * Find the auth user for an email, or create one. Returns { user, created }.
 * Supabase has no "get user by email" on the admin API; generateLink on an
 * existing address returns the user, and on a missing one errors — which is
 * exactly the branch we need.
 */
export async function findOrCreateUser(email, lang) {
  const a = admin();
  const probe = await a.auth.admin.generateLink({ type: 'magiclink', email });
  if (!probe.error && probe.data?.user) {
    // generateLink creates a missing user on the fly, so "new" is decided by
    // the clock: created in the last two minutes and never signed in.
    const u = probe.data.user;
    const created = !u.last_sign_in_at && Date.now() - new Date(u.created_at).getTime() < 120000;
    if (created) await a.auth.admin.updateUserById(u.id, { user_metadata: { ...(u.user_metadata || {}), lang, source: 'annual_49_launch' } });
    return { user: u, created };
  }
  const made = await a.auth.admin.createUser({
    email,
    email_confirm: true,
    user_metadata: { lang, source: 'annual_49_launch' },
  });
  if (made.error) {
    // Race: created between the probe and now. Probe again.
    const again = await a.auth.admin.generateLink({ type: 'magiclink', email });
    if (!again.error && again.data?.user) return { user: again.data.user, created: false };
    throw new Error('createUser: ' + made.error.message);
  }
  return { user: made.data.user, created: true };
}

/** A one-tap login link that lands on New Estimate. */
export async function magicLink(email, path = '/app?new=estimate') {
  const { data, error } = await admin().auth.admin.generateLink({
    type: 'magiclink',
    email,
    options: { redirectTo: `${SITE_URL}${path}` },
  });
  if (error) throw new Error('magiclink: ' + error.message);
  return data.properties.action_link;
}

/** Give a user the annual plan for a year from now (or extend a live one). */
export async function grantAnnual(userId, lang) {
  const a = admin();
  const { data: p } = await a.from('profiles').select('plan, plan_expires_at').eq('user_id', userId).maybeSingle();
  const now = Date.now();
  const base = p?.plan === 'annual' && p.plan_expires_at && new Date(p.plan_expires_at).getTime() > now
    ? new Date(p.plan_expires_at).getTime() : now;
  const expires = new Date(base + 365 * 86400 * 1000).toISOString();
  const row = { user_id: userId, plan: 'annual', plan_expires_at: expires, plan_source: 'annual_49_launch', lang };
  const { error } = p
    ? await a.from('profiles').update(row).eq('user_id', userId)
    : await a.from('profiles').insert(row);
  if (error) throw new Error('grantAnnual: ' + error.message);
  return expires;
}

export async function revokeAnnual(userId) {
  const { error } = await admin().from('profiles')
    .update({ plan: null, plan_expires_at: null, plan_source: null })
    .eq('user_id', userId).eq('plan', 'annual');
  if (error) throw new Error('revokeAnnual: ' + error.message);
}

// ---------------------------------------------------------------- email
const escapeHtml = s => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/**
 * Send one email. Resend directly when the key is present (so it comes from
 * Eric, with replies to his inbox); otherwise through the app's existing
 * send-email edge function, which already holds a Resend key.
 */
export async function sendMail({ to, subject, html, text }) {
  if (process.env.RESEND_API_KEY) {
    const r = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: 'Eric at LevelWorks <eric@levelworks.org>', to: [to], reply_to: ERIC_REPLY_TO, subject, html, text }),
    });
    if (!r.ok) throw new Error('resend: ' + (await r.text()));
    return { via: 'resend' };
  }
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || SUPABASE_ANON_KEY;
  const r = await fetch(`${SUPABASE_URL}/functions/v1/send-email`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, apikey: key, 'Content-Type': 'application/json' },
    body: JSON.stringify({ to, subject, html }),
  });
  if (!r.ok) throw new Error('send-email: ' + (await r.text()));
  return { via: 'edge' };
}

/** Plain, short, from Eric. One column, one button, no header graphic. */
export function layout({ lang, lines, cta, ctaUrl, ps, image, unsubscribe }) {
  const btn = cta ? `<p style="margin:26px 0"><a href="${ctaUrl}" style="display:inline-block;background:#2563eb;color:#fff;text-decoration:none;font-weight:600;font-size:16px;padding:14px 22px;border-radius:10px">${escapeHtml(cta)}</a></p>` : '';
  const img = image ? `<p style="margin:22px 0"><img src="${image}" alt="" width="360" style="width:100%;max-width:360px;border:1px solid #e6e9ef;border-radius:12px;display:block"></p>` : '';
  const body = lines.map(l => `<p style="margin:0 0 16px;font-size:16px;line-height:1.55;color:#0b1220">${l}</p>`).join('');
  const psHtml = ps ? `<p style="margin:26px 0 0;font-size:14px;line-height:1.5;color:#5b6472">${ps}</p>` : '';
  // Broadcasts carry Resend's unsubscribe link; the placeholder is filled per recipient at send time.
  const unsub = unsubscribe
    ? ` · <a href="{{{RESEND_UNSUBSCRIBE_URL}}}" style="color:#8a93a3">${lang === 'es' ? 'Cancelar suscripción' : 'Unsubscribe'}</a>`
    : '';
  const foot = (lang === 'es'
    ? 'LevelWorks · Wyncote, PA · Responde a este correo y te llega a Eric.'
    : 'LevelWorks · Wyncote, PA · Reply to this email and it reaches Eric.') + unsub;
  return `<!doctype html><html lang="${lang}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;background:#f5f7fb;font-family:Inter,-apple-system,Segoe UI,Roboto,sans-serif">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f5f7fb;padding:28px 12px"><tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#fff;border:1px solid #e6e9ef;border-radius:14px"><tr><td style="padding:30px 28px">
${body}${img}${btn}${psHtml}
<p style="margin:30px 0 0;font-size:16px;color:#0b1220">Eric</p>
</td></tr></table>
<p style="margin:16px 0 0;font-size:12px;color:#8a93a3">${foot}</p>
</td></tr></table></body></html>`;
}

// ---------------------------------------------------------------- Meta Conversions API
const sha = v => createHash('sha256').update(String(v).trim().toLowerCase()).digest('hex');

/**
 * Server-side Purchase, same event_id as the browser pixel so Meta dedupes.
 * Never throws: a Meta hiccup must not fail the webhook and re-run the grant.
 */
export async function capiPurchase({ eventId, email, value = 49, sourceUrl, ip, ua, eventTime }) {
  const token = process.env.META_CAPI_TOKEN;
  if (!token) return { skipped: 'no META_CAPI_TOKEN' };
  const payload = {
    data: [{
      event_name: 'Purchase',
      event_time: Math.floor((eventTime || Date.now() / 1000)),
      event_id: eventId,
      action_source: 'website',
      event_source_url: sourceUrl || `${SITE_URL}/annual/success`,
      user_data: { em: [sha(email)], ...(ip ? { client_ip_address: ip } : {}), ...(ua ? { client_user_agent: ua } : {}) },
      custom_data: { currency: 'USD', value, content_name: 'LevelWorks Annual', content_ids: ['annual_49'], num_items: 1 },
    }],
    ...(process.env.META_TEST_EVENT_CODE ? { test_event_code: process.env.META_TEST_EVENT_CODE } : {}),
  };
  try {
    const r = await fetch(`https://graph.facebook.com/v21.0/${PIXEL_ID}/events?access_token=${encodeURIComponent(token)}`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload),
    });
    const out = await r.json();
    return r.ok ? { ok: true, ...out } : { error: out };
  } catch (e) {
    return { error: String(e) };
  }
}

// ---------------------------------------------------------------- fulfilment
/**
 * Turn a paid Checkout Session into an account, a year, a counter row, a
 * Purchase event and a welcome email. Idempotent per session: the
 * annual_purchases insert (unique on stripe_session_id) is the lock, so the
 * webhook and the success page can both call this and only one does the work.
 * Returns { user, created, expires, alreadyDone }.
 */
export async function fulfilSession(s, { sendWelcome = true } = {}) {
  const a = admin();
  const email = String(s.customer_details?.email || s.customer_email || '').trim().toLowerCase();
  if (!email) throw new Error('session has no email');
  const lang = normalizeLang(s.metadata?.lang);
  const row = {
    email, stripe_session_id: s.id,
    stripe_payment_intent: typeof s.payment_intent === 'string' ? s.payment_intent : s.payment_intent?.id || null,
    amount: s.amount_total ?? 4900, currency: s.currency || 'usd', lang,
    utm_source: s.metadata?.utm_source || null, utm_medium: s.metadata?.utm_medium || null,
    utm_campaign: s.metadata?.utm_campaign || null, utm_content: s.metadata?.utm_content || null,
  };
  const ins = await a.from('annual_purchases').insert(row).select('id').maybeSingle();
  if (ins.error) {
    if (String(ins.error.code) !== '23505') throw new Error('annual_purchases: ' + ins.error.message);
    // Already fulfilled (or in progress): return the user without granting again.
    const { user, created } = await findOrCreateUser(email, lang);
    const { data: p } = await a.from('profiles').select('plan_expires_at').eq('user_id', user.id).maybeSingle();
    return { user, created, expires: p?.plan_expires_at || null, alreadyDone: true, email, lang };
  }
  const { user, created } = await findOrCreateUser(email, lang);
  const expires = await grantAnnual(user.id, lang);
  await a.from('annual_purchases').update({ user_id: user.id }).eq('id', ins.data.id);
  const capi = await capiPurchase({
    eventId: s.id, email, value: (s.amount_total ?? 4900) / 100,
    sourceUrl: `${SITE_URL}${lang === 'es' ? '/es' : ''}/annual/success`, eventTime: s.created,
  });
  let mail = { skipped: true };
  if (sendWelcome) {
    try {
      const { EMAILS, fmtDate } = await import('./emails.js');
      const m = created
        ? EMAILS.annualWelcomeNew[lang](await magicLink(email))
        : EMAILS.annualWelcomeExisting[lang](fmtDate(expires, lang));
      mail = await sendMail({ to: email, ...m });
    } catch (e) { console.error('[fulfil] welcome mail failed', e); mail = { error: e.message }; }
  }
  return { user, created, expires, alreadyDone: false, email, lang, capi, mail };
}
