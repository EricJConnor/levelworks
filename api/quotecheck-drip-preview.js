/**
 * GET /api/quotecheck-drip-preview?n=0   (0 to 7)
 * Renders one email of the Quote Check lead series as HTML, so Eric can read
 * it in a browser. Sends nothing. The unsubscribe placeholder is a dead link.
 */
import { DRIPS, dripMail } from './_lib/quotecheckDrip.js';

export default function handler(req, res) {
  const url = new URL(req.url || '/', 'http://x');
  const n = Number(url.searchParams.get('n') || 0);
  const m = dripMail(n);
  if (!m) {
    res.status(404).setHeader('Content-Type', 'text/plain; charset=utf-8');
    return res.end(`No email ${n}. The series has ${DRIPS.length}: ${DRIPS.map((d, i) => `${i} ${d.key}`).join(', ')}`);
  }
  const html = m.html.split('{{{RESEND_UNSUBSCRIBE_URL}}}').join('#unsubscribe-link-filled-per-recipient');
  res.status(200).setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Robots-Tag', 'noindex');
  res.end(`<!-- ${n + 1} of ${DRIPS.length} · subject: ${m.subject.replace(/--/g, '-')} -->\n${html}`);
}
