/**
 * GET /api/audience-status
 *
 * Public, read-only, no secret: is the Resend key present, how many contacts
 * are in each audience, and which broadcasts exist with what status. Counts
 * and names only, never an address. Exists so the state of the email list can
 * be checked from a chat session that holds no keys.
 */
import { json } from './_lib/annual.js';
import { AUDIENCES, resend } from './_lib/audience.js';
import { DOMAIN } from './_lib/broadcasts.js';

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  const out = { resendKey: !!process.env.RESEND_API_KEY, audiences: {}, broadcasts: [], errors: [] };
  if (!out.resendKey) return json(res, 200, out);
  try {
    const list = await resend('/audiences');
    for (const l of ['en', 'es']) {
      const a = (list.data || []).find(x => x.name === AUDIENCES[l]);
      if (!a) { out.audiences[l] = { exists: false }; continue; }
      const c = await resend(`/audiences/${a.id}/contacts`);
      const contacts = c.data || [];
      out.audiences[l] = { exists: true, contacts: contacts.length, unsubscribed: contacts.filter(x => x.unsubscribed).length };
    }
    const b = await resend('/broadcasts');
    out.broadcasts = (b.data || []).map(x => ({ name: x.name, status: x.status, created: x.created_at, sent: x.sent_at || null }));
    const doms = await resend('/domains');
    const d = (doms.data || []).find(x => x.name === DOMAIN);
    if (d) {
      const full = await resend(`/domains/${d.id}`);
      out.domain = { name: DOMAIN, status: full.status, openTracking: !!full.open_tracking, clickTracking: !!full.click_tracking };
    }
  } catch (e) {
    out.errors.push(e.message);
  }
  return json(res, 200, out);
}
