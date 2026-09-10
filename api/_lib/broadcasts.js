/**
 * Broadcasts in Resend, one per language, from the copy in emails.js.
 *
 * The daily cron drafts them (creates each once, never sends), so Eric opens
 * Resend → Broadcasts, reads it, and presses Send himself. /api/blast can also
 * send in one go for a key holder. A broadcast is named "<which> · <lang>" and
 * that name is the lock: nothing is created or sent twice.
 */
import { ERIC_REPLY_TO } from './annual.js';
import { EMAILS } from './emails.js';
import { AUDIENCES, resend } from './audience.js';

export const FROM = 'Eric at LevelWorks <eric@levelworks.org>';
export const DOMAIN = 'levelworks.org';

/** Resend's open and click tracking on the sending domain; Eric asked for it (Sep 10). Idempotent. */
export async function ensureTracking() {
  const list = await resend('/domains');
  const d = (list.data || []).find(x => x.name === DOMAIN);
  if (!d) return { domain: DOMAIN, found: false };
  const full = await resend(`/domains/${d.id}`);
  const before = { open: !!full.open_tracking, click: !!full.click_tracking };
  if (before.open && before.click) return { domain: DOMAIN, found: true, tracking: before, changed: false };
  await resend(`/domains/${d.id}`, { method: 'PATCH', body: JSON.stringify({ open_tracking: true, click_tracking: true }) });
  return { domain: DOMAIN, found: true, tracking: { open: true, click: true }, changed: true, before };
}
export const BROADCASTS = ['annualBlast'];

export function broadcastCopy(which) {
  const mail = EMAILS[which];
  if (!mail || !mail.en || !mail.es || mail.en.length) return null;
  return mail;
}

/**
 * mode "draft": create anything missing, send nothing.
 * mode "send": create anything missing and send whatever is still a draft.
 * mode "dry": report only.
 */
export async function runBroadcast(which, mode = 'draft') {
  const mail = broadcastCopy(which);
  if (!mail) throw new Error(`No broadcast copy called "${which}"`);
  const audiences = await resend('/audiences');
  const existing = await resend('/broadcasts');
  const out = {};
  for (const l of ['en', 'es']) {
    const name = `${which} · ${l}`;
    const aud = (audiences.data || []).find(a => a.name === AUDIENCES[l]);
    if (!aud) { out[l] = { skipped: 'no audience yet' }; continue; }
    const m = mail[l]();
    let b = (existing.data || []).find(x => x.name === name);
    if (b && b.status !== 'draft') { out[l] = { skipped: 'already sent', id: b.id, status: b.status }; continue; }
    if (mode === 'dry') { out[l] = { would: b ? 'send the draft' : 'create a draft', audience: aud.name, subject: m.subject }; continue; }
    if (!b) {
      b = await resend('/broadcasts', { method: 'POST', body: JSON.stringify({
        name, audience_id: aud.id, from: FROM, reply_to: ERIC_REPLY_TO, subject: m.subject, html: m.html,
      }) });
      out[l] = { drafted: true, id: b.id, audience: aud.name, subject: m.subject };
    } else {
      out[l] = { draft: true, id: b.id, audience: aud.name, subject: m.subject };
    }
    if (mode === 'send') {
      await resend(`/broadcasts/${b.id}/send`, { method: 'POST', body: '{}' });
      out[l].sent = true;
    }
  }
  return out;
}
