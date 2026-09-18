/**
 * POST /api/send-document   { type: 'estimate' | 'invoice', id, to? }
 *   with  Authorization: Bearer <Supabase access token>
 *
 * Emails an estimate or invoice to its client, from the contractor, by name. The old
 * path was a fixed edge-function template that was never told the company name, so the
 * client got "you have a new invoice" from nobody in particular and did not click (the
 * roofer's note, Sep 17). Now the sender reads "Sen Roofing LLC via LevelWorks", the
 * subject says who sent what for how much, replies go to the contractor, and the body
 * is the document's own header block with one button.
 *
 * The contractor is identified by his session token; the document must be his. The
 * address is the one on the document row, never one the browser supplies. Transactional
 * mail: no unsubscribe link, on purpose.
 */
import { json, readBody, missingEnv, admin, SITE_URL } from './_lib/annual.js';

const FROM_ADDR = 'documents@levelworks.org';
const money = (n) => '$' + (Number(n) || 0).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const fmtDate = (iso, lang) => { try { return new Date(iso).toLocaleDateString(lang === 'es' ? 'es-MX' : 'en-US', { month: 'long', day: 'numeric', year: 'numeric' }); } catch { return ''; } };

const T = {
  en: {
    estimate: { subject: (co, proj, amt) => `${co} sent you an estimate for ${proj} (${amt})`, lead: (co, proj) => `${co} has prepared an estimate for ${proj}.`, btn: 'View and sign the estimate', total: 'Total', hint: 'Open it to see the details and approve it with a signature, right from your phone.' },
    invoice: { subject: (co, proj, amt, n) => `${co} sent you an invoice for ${proj} (${amt} due)`, lead: (co, proj, n) => `${co} has sent you invoice ${n ? '#' + n + ' ' : ''}for ${proj}.`, btn: 'View and pay the invoice', total: 'Amount due', hint: 'Open it to see the details and pay by card, right from your phone.' },
    hi: (name) => `Hi ${name},`, due: (d) => `Due ${d}`,
    reply: (who) => `Questions? Reply to this email and it goes straight to ${who}.`,
    foot: 'Sent with LevelWorks',
  },
  es: {
    estimate: { subject: (co, proj, amt) => `${co} le envió un presupuesto para ${proj} (${amt})`, lead: (co, proj) => `${co} preparó un presupuesto para ${proj}.`, btn: 'Ver y firmar el presupuesto', total: 'Total', hint: 'Ábralo para ver los detalles y aprobarlo con su firma, desde su teléfono.' },
    invoice: { subject: (co, proj, amt, n) => `${co} le envió una factura por ${proj} (${amt} por pagar)`, lead: (co, proj, n) => `${co} le envió la factura ${n ? '#' + n + ' ' : ''}por ${proj}.`, btn: 'Ver y pagar la factura', total: 'Saldo por pagar', hint: 'Ábrala para ver los detalles y pagar con tarjeta, desde su teléfono.' },
    hi: (name) => `Hola ${name}:`, due: (d) => `Vence el ${d}`,
    reply: (who) => `¿Preguntas? Responda a este correo y le llega directo a ${who}.`,
    foot: 'Enviado con LevelWorks',
  },
};

function html({ lang, type, company, contact, logo, clientName, project, number, amount, dueLine, url }) {
  const t = T[lang]; const d = t[type];
  const logoHtml = logo ? `<img src="${esc(logo)}" alt="" width="56" height="56" style="width:56px;height:56px;border-radius:12px;object-fit:contain;border:1px solid #e6e9ef;background:#fff;display:block;margin-bottom:14px">` : '';
  return `<!doctype html><html lang="${lang}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;background:#f5f7fb;font-family:Inter,-apple-system,Segoe UI,Roboto,sans-serif">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f5f7fb;padding:28px 12px"><tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#fff;border:1px solid #e6e9ef;border-radius:14px"><tr><td style="padding:30px 28px">
${logoHtml}<p style="margin:0 0 4px;font-size:18px;font-weight:700;color:#0b1220">${esc(company)}</p>
${contact ? `<p style="margin:0 0 22px;font-size:13px;line-height:1.5;color:#5b6472">${esc(contact)}</p>` : '<div style="height:18px"></div>'}
<p style="margin:0 0 12px;font-size:16px;line-height:1.55;color:#0b1220">${esc(t.hi(clientName))}</p>
<p style="margin:0 0 18px;font-size:16px;line-height:1.55;color:#0b1220">${esc(d.lead(company, project, number))}</p>
<table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;background:#f5f7fb;border-radius:12px;margin:0 0 22px"><tr>
<td style="padding:16px 18px;font-size:14px;color:#5b6472">${esc(d.total)}${dueLine ? `<br><span style="font-size:13px">${esc(dueLine)}</span>` : ''}</td>
<td style="padding:16px 18px;text-align:right;font-size:26px;font-weight:700;letter-spacing:-.02em;color:#0b1220;white-space:nowrap">${esc(amount)}</td></tr></table>
<p style="margin:0 0 8px"><a href="${esc(url)}" style="display:inline-block;background:#2563eb;color:#fff;text-decoration:none;font-weight:600;font-size:16px;padding:14px 22px;border-radius:10px">${esc(d.btn)}</a></p>
<p style="margin:0 0 26px;font-size:14px;line-height:1.5;color:#5b6472">${esc(d.hint)}</p>
<p style="margin:0;font-size:14px;line-height:1.5;color:#5b6472">${esc(t.reply(contact ? company : company))}</p>
</td></tr></table>
<p style="margin:16px 0 0;font-size:12px;color:#8a93a3">${esc(t.foot)} · <a href="${SITE_URL}" style="color:#8a93a3">levelworks.org</a></p>
</td></tr></table></body></html>`;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return json(res, 405, { error: 'method_not_allowed' });
  const missing = missingEnv('SUPABASE_SERVICE_ROLE_KEY', 'RESEND_API_KEY');
  if (missing.length) return json(res, 503, { error: 'not_configured', message: `Missing in Vercel: ${missing.join(', ')}` });
  const auth = req.headers.authorization || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7).trim() : '';
  if (!token) return json(res, 401, { error: 'signed_out' });
  let body = {};
  try { body = JSON.parse((await readBody(req)).toString('utf8') || '{}'); } catch { /* fallthrough */ }
  const type = body.type === 'invoice' ? 'invoice' : body.type === 'estimate' ? 'estimate' : '';
  const id = String(body.id || '').trim();
  if (!type || !id) return json(res, 400, { error: 'bad_request' });

  const db = admin();
  const { data: userData, error: userErr } = await db.auth.getUser(token);
  if (userErr || !userData?.user) return json(res, 401, { error: 'signed_out' });
  const uid = userData.user.id;

  const table = type === 'invoice' ? 'invoices' : 'estimates';
  const { data: doc, error: docErr } = await db.from(table).select('*').eq('id', id).eq('user_id', uid).maybeSingle();
  if (docErr) return json(res, 500, { error: 'db', message: docErr.message });
  if (!doc) return json(res, 404, { error: 'not_found' });
  const asked = String(body.to || '').trim().toLowerCase();
  const to = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(asked) ? asked : String(doc.client_email || '').trim();
  if (!to || !to.includes('@')) return json(res, 400, { error: 'no_client_email', message: 'This client has no email address on the document.' });
  if (!doc.view_token) return json(res, 400, { error: 'no_link', message: 'This document has no share link yet. Save it and try again.' });

  const { data: prof } = await db.from('profiles').select('company_name, full_name, phone_number, business_email, business_address, profile_photo_url, lang').eq('user_id', uid).maybeSingle();
  const company = (prof?.company_name || prof?.full_name || userData.user.user_metadata?.full_name || 'Your contractor').trim();
  const lang = prof?.lang === 'es' ? 'es' : 'en';
  const replyTo = (prof?.business_email || userData.user.email || '').trim();
  const contact = [prof?.phone_number, prof?.business_address].filter(Boolean).join(' · ');

  const url = `${SITE_URL}/${type === 'invoice' ? 'view-invoice' : 'view-estimate'}/${doc.view_token}`;
  const amountNum = type === 'invoice' ? Math.max(0, (Number(doc.total) || 0) - (Number(doc.amount_paid) || 0)) : (Number(doc.total) || 0);
  const amount = money(amountNum);
  const project = doc.project_name || (type === 'invoice' ? 'your project' : 'your project');
  const number = type === 'invoice' ? String(doc.invoice_number || '').replace(/^#/, '') : '';
  const dueLine = type === 'invoice' && doc.due_date ? T[lang].due(fmtDate(doc.due_date, lang)) : '';
  const clientName = (doc.client_name || '').trim() || (lang === 'es' ? 'estimado cliente' : 'there');
  const subject = T[lang][type].subject(company, project, amount, number);
  const text = `${T[lang].hi(clientName)}\n\n${T[lang][type].lead(company, project, number)}\n${T[lang][type].total}: ${amount}${dueLine ? ' · ' + dueLine : ''}\n\n${T[lang][type].btn}: ${url}\n\n${T[lang].reply(company)}\n\n${T[lang].foot}`;
  const fromName = `${company} via LevelWorks`.replace(/[\r\n"<>]/g, '');

  const r = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: `${fromName} <${FROM_ADDR}>`, to: [to], reply_to: replyTo || undefined, subject, text,
      html: html({ lang, type, company, contact, logo: prof?.profile_photo_url || '', clientName, project, number, amount, dueLine, url }),
      tags: [{ name: 'kind', value: type }],
    }),
  });
  if (!r.ok) {
    const why = await r.text();
    console.error('send-document', type, id, r.status, why.slice(0, 300));
    return json(res, 502, { error: 'mail', message: 'The email did not go out. Try again, or send the link by text.' });
  }
  const stamp = { sent_at: new Date().toISOString() };
  if (to !== String(doc.client_email || '').trim()) stamp.client_email = to;
  if (type === 'estimate' && doc.status === 'draft') stamp.status = 'sent';
  await db.from(table).update(stamp).eq('id', id).eq('user_id', uid);
  return json(res, 200, { ok: true, to, subject });
}
