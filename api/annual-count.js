/**
 * GET /api/annual-count → { count, cap, left, soldOut }
 * Real purchases only (refunds excluded). The landing page reads this on load
 * and every 30 seconds. Cached at the edge for 15s so a burst of traffic is
 * one database call.
 */
import { json, claimedCount, ANNUAL_CAP, missingEnv } from './_lib/annual.js';

export default async function handler(req, res) {
  if (missingEnv('SUPABASE_SERVICE_ROLE_KEY').length) return json(res, 503, { error: 'not_configured' });
  try {
    const count = await claimedCount();
    res.setHeader('Cache-Control', 's-maxage=15, stale-while-revalidate=60');
    return json(res, 200, { count, cap: ANNUAL_CAP, left: Math.max(0, ANNUAL_CAP - count), soldOut: count >= ANNUAL_CAP });
  } catch (e) {
    return json(res, 503, { error: 'db', message: e.message });
  }
}
