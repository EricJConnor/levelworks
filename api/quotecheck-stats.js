/**
 * GET /api/quotecheck-stats — public, counts only, for the morning report.
 * Walks the bucket's top-level folders (one per upload) and reads each
 * review.json. Fine at test scale; make it a table if it ever passes a few
 * thousand.
 */
import { json, missingEnv, admin } from './_lib/annual.js';
import { BUCKET, getJson } from './_lib/quotecheck.js';

export default async function handler(req, res) {
  const missing = missingEnv('SUPABASE_SERVICE_ROLE_KEY');
  if (missing.length) return json(res, 503, { error: 'not_configured' });
  const { data, error } = await admin().storage.from(BUCKET).list('', { limit: 1000 });
  if (error) return json(res, 200, { uploads: 0, paid: 0, note: error.message });
  const ids = (data || []).map(d => d.name).filter(n => /^[a-f0-9]{24}$/.test(n));
  const reviews = (await Promise.all(ids.map(id => getJson(`${id}/review.json`)))).filter(Boolean);
  const dayAgo = Date.now() - 86400e3;
  const weekAgo = Date.now() - 7 * 86400e3;
  const since = (t, k) => reviews.filter(r => r[k] && new Date(r[k]).getTime() > t).length;
  const byVerdict = {};
  for (const r of reviews) { const v = r.result?.verdict || 'unreadable'; byVerdict[v] = (byVerdict[v] || 0) + 1; }
  const trades = {};
  for (const r of reviews) { const t = r.result?.trade || 'unknown'; trades[t] = (trades[t] || 0) + 1; }
  return json(res, 200, {
    uploads: reviews.length, paid: reviews.filter(r => r.paid).length,
    revenue: reviews.filter(r => r.paid).length * 79,
    last24h: { uploads: since(dayAgo, 'createdAt'), paid: since(dayAgo, 'paidAt') },
    last7d: { uploads: since(weekAgo, 'createdAt'), paid: since(weekAgo, 'paidAt') },
    unreadable: reviews.filter(r => !r.result?.readable).length,
    byVerdict, trades,
  });
}
