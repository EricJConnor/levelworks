/**
 * GET /api/note-preview?which=stripeTutorial&lang=en|es
 *
 * Renders a scheduled note (api/_lib/notes.js) as the HTML the member will get,
 * so Eric can read it in a browser before the cron sends it. Read-only, sends
 * nothing, and the copy is marketing that goes to the whole list anyway. The
 * unsubscribe placeholder is shown as a dead link.
 */
import { NOTES, noteMail } from './_lib/notes.js';

export default function handler(req, res) {
  const url = new URL(req.url || '/', 'http://x');
  const which = url.searchParams.get('which') || '';
  const lang = url.searchParams.get('lang') === 'es' ? 'es' : 'en';
  if (!NOTES[which]) {
    res.status(404).setHeader('Content-Type', 'text/plain; charset=utf-8');
    return res.end(`No note called "${which}". Known: ${Object.keys(NOTES).join(', ')}`);
  }
  const m = noteMail(which, lang);
  const html = m.html.split('{{{RESEND_UNSUBSCRIBE_URL}}}').join('#unsubscribe-link-filled-per-recipient');
  res.status(200).setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Robots-Tag', 'noindex');
  res.end(`<!-- subject: ${m.subject.replace(/--/g, '-')} -->\n${html}`);
}
