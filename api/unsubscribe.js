/**
 * GET or POST /api/unsubscribe?e=<base64url email>&t=<signature>&l=<en|es>
 *
 * The link at the bottom of every marketing email. No login: the address is in the
 * URL and the signature (see unsubscribeToken) proves we made the link. It marks the
 * contact unsubscribed in both Resend audiences, which every sender (broadcasts,
 * nudges, notes from Eric) reads before mailing. POST is the one-click form Gmail and
 * Apple Mail send from their own Unsubscribe button (List-Unsubscribe-Post), so it
 * answers with a bare 200 instead of a page.
 */
import { unsubscribeToken, missingEnv } from './_lib/annual.js';
import { markUnsubscribed } from './_lib/audience.js';

const T = {
  en: {
    title: 'You’re unsubscribed',
    body: 'You won’t get any more marketing email from LevelWorks. Account email, like an estimate a client signed or a receipt, still comes through.',
    bad: 'That link didn’t check out. Reply to any LevelWorks email with “stop” and Eric will take you off by hand.',
    down: 'We couldn’t record that right now. Reply to any LevelWorks email with “stop” and Eric will take you off by hand.',
  },
  es: {
    title: 'Suscripción cancelada',
    body: 'No recibirás más correos de marketing de LevelWorks. Los correos de tu cuenta, como un presupuesto firmado por un cliente o un recibo, siguen llegando.',
    bad: 'Ese enlace no es válido. Responde a cualquier correo de LevelWorks con “stop” y Eric te quita de la lista a mano.',
    down: 'No pudimos registrarlo ahora mismo. Responde a cualquier correo de LevelWorks con “stop” y Eric te quita de la lista a mano.',
  },
};

function page(lang, title, body) {
  return `<!doctype html><html lang="${lang}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>${title} · LevelWorks</title></head>
<body style="margin:0;background:#f5f7fb;font-family:Inter,-apple-system,Segoe UI,Roboto,sans-serif;color:#0b1220">
<div style="max-width:520px;margin:48px auto;padding:0 16px"><div style="background:#fff;border:1px solid #e6e9ef;border-radius:14px;padding:30px 28px">
<h1 style="font-size:22px;margin:0 0 10px">${title}</h1><p style="font-size:16px;line-height:1.55;margin:0;color:#5b6472">${body}</p>
<p style="margin:26px 0 0"><a href="https://levelworks.org" style="color:#2563eb;text-decoration:none;font-weight:600">levelworks.org</a></p>
</div></div></body></html>`;
}

export default async function handler(req, res) {
  const q = req.query || {};
  const lang = q.l === 'es' ? 'es' : 'en';
  const t = T[lang];
  const send = (status, title, body) => {
    if (req.method === 'POST') { res.status(status).setHeader('Content-Type', 'text/plain'); return res.end(title); }
    res.status(status).setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.end(page(lang, title, body));
  };
  let email = '';
  try { email = Buffer.from(String(q.e || ''), 'base64url').toString('utf8').trim().toLowerCase(); } catch { email = ''; }
  if (!email || !email.includes('@') || String(q.t || '') !== unsubscribeToken(email)) return send(400, lang === 'es' ? 'Enlace no válido' : 'That link didn’t work', t.bad);
  if (missingEnv('RESEND_API_KEY').length) return send(503, lang === 'es' ? 'Inténtalo más tarde' : 'Try again later', t.down);
  try {
    await markUnsubscribed(email);
    return send(200, t.title, t.body);
  } catch (e) {
    console.error('unsubscribe', email.slice(0, 3) + '***', e.message);
    return send(503, lang === 'es' ? 'Inténtalo más tarde' : 'Try again later', t.down);
  }
}
