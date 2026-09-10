/**
 * Keeps two Resend audiences in step with the app's users, so Eric can send a
 * broadcast (an update, an offer) from the Resend dashboard to everyone who
 * has ever signed up, in their own language.
 *
 *   "LevelWorks users · English"
 *   "LevelWorks users · Español"
 *
 * Rules:
 *  - Every auth user with an email goes in, except @levelworks.org (demo and
 *    test accounts) and anyone Resend already has. Existing contacts are never
 *    touched, so an unsubscribe in Resend sticks.
 *  - Language comes from profiles.lang, then the sign-up metadata, else English.
 *  - Runs from the daily cron and from GET /api/sync-audience?key=<CRON_SECRET>.
 */
import { admin, normalizeLang } from './annual.js';

const RESEND = 'https://api.resend.com';
export const AUDIENCES = {
  en: 'LevelWorks users · English',
  es: 'LevelWorks users · Español',
};

async function resend(path, init = {}) {
  const r = await fetch(RESEND + path, {
    ...init,
    headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json', ...(init.headers || {}) },
  });
  const text = await r.text();
  let body = {};
  try { body = text ? JSON.parse(text) : {}; } catch { body = { raw: text }; }
  if (!r.ok) throw new Error(`resend ${init.method || 'GET'} ${path}: ${r.status} ${body.message || text}`);
  return body;
}

async function audienceId(name) {
  const list = await resend('/audiences');
  const hit = (list.data || []).find(a => a.name === name);
  if (hit) return hit.id;
  const made = await resend('/audiences', { method: 'POST', body: JSON.stringify({ name }) });
  return made.id;
}

async function existingEmails(id) {
  const list = await resend(`/audiences/${id}/contacts`);
  return new Set((list.data || []).map(c => String(c.email || '').toLowerCase()));
}

function splitName(full) {
  const parts = String(full || '').trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return {};
  return { first_name: parts[0], last_name: parts.slice(1).join(' ') || undefined };
}

/** Adds every eligible user to the right audience. Returns a small report. */
export async function syncAudience({ dry = false } = {}) {
  if (!process.env.RESEND_API_KEY) throw new Error('Missing in Vercel: RESEND_API_KEY');
  const a = admin();

  const users = [];
  for (let page = 1; page <= 50; page++) {
    const { data, error } = await a.auth.admin.listUsers({ page, perPage: 200 });
    if (error) throw new Error('listUsers: ' + error.message);
    users.push(...(data?.users || []));
    if (!data?.users?.length || data.users.length < 200) break;
  }

  const ids = users.map(u => u.id);
  const { data: profiles } = await a.from('profiles').select('user_id, lang, full_name')
    .in('user_id', ids.length ? ids : ['00000000-0000-0000-0000-000000000000']);
  const byId = new Map((profiles || []).map(p => [p.user_id, p]));

  const report = { dry, total: users.length, skipped: 0, added: { en: 0, es: 0 }, already: { en: 0, es: 0 }, errors: [] };
  const buckets = { en: [], es: [] };
  for (const u of users) {
    const email = String(u.email || '').trim().toLowerCase();
    if (!email || email.endsWith('@levelworks.org')) { report.skipped++; continue; }
    const p = byId.get(u.id) || {};
    const lang = normalizeLang(p.lang || u.user_metadata?.lang);
    buckets[lang].push({ email, ...splitName(p.full_name || u.user_metadata?.full_name) });
  }

  for (const lang of ['en', 'es']) {
    if (!buckets[lang].length) continue;
    const id = await audienceId(AUDIENCES[lang]);
    const have = await existingEmails(id);
    for (const c of buckets[lang]) {
      if (have.has(c.email)) { report.already[lang]++; continue; }
      if (dry) { report.added[lang]++; continue; }
      try {
        await resend(`/audiences/${id}/contacts`, { method: 'POST', body: JSON.stringify({ ...c, unsubscribed: false }) });
        report.added[lang]++;
      } catch (e) { report.errors.push(`${c.email}: ${e.message}`); }
    }
  }
  return report;
}
