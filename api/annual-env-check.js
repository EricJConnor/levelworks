/**
 * GET /api/annual-env-check?key=<CRON_SECRET>
 * Reports, for each launch variable, only its length, a short fingerprint
 * and whether it carries whitespace or non-ASCII characters. Never the value.
 * Exists because a pasted secret with a stray space or an ellipsis fails in
 * ways that look like a network error (the Resend key lesson).
 */
import { createHash } from 'node:crypto';
import { json } from './_lib/annual.js';

const NAMES = ['STRIPE_SECRET_KEY', 'STRIPE_PRICE_ANNUAL_49', 'STRIPE_ANNUAL_WEBHOOK_SECRET', 'SUPABASE_SERVICE_ROLE_KEY', 'META_CAPI_TOKEN', 'CRON_SECRET', 'RESEND_API_KEY'];

export default async function handler(req, res) {
  const url = new URL(req.url, 'http://x');
  const given = url.searchParams.get('key') || '';
  const cron = process.env.CRON_SECRET || '';
  // Accept the trimmed secret too, so a stray space on CRON_SECRET itself does not lock the check out.
  if (!given || (given !== cron && given !== cron.trim())) return json(res, 401, { error: 'unauthorized' });
  const out = {};
  for (const n of NAMES) {
    const v = process.env[n];
    if (v === undefined) { out[n] = { set: false }; continue; }
    out[n] = {
      set: true, length: v.length,
      fingerprint: createHash('sha256').update(v).digest('hex').slice(0, 8),
      trimmedFingerprint: createHash('sha256').update(v.trim()).digest('hex').slice(0, 8),
      leadingOrTrailingWhitespace: v !== v.trim(),
      nonAscii: /[^\x20-\x7e]/.test(v),
      startsWith: v.slice(0, 8),
    };
  }
  return json(res, 200, out);
}
