/**
 * The one-off note from Eric to every LevelWorks account (Sep 14 2026): thanks for signing up,
 * what the app does, one question ("what would make you use it every day?"), reply to answer.
 * Sent through /api/annual-broadcast so it goes out from Vercel with the Resend key; the
 * send-email edge function only knows fixed templates and cannot carry a free-form note.
 */
import { layout, sendMail, admin } from './annual.js';

export const ERIC = ['ejc1273@gmail.com', '7echome@gmail.com'];
const SKIP = new Set(['demo.lw49@levelworks.org']);

const COPY = {
  en: {
    subject: 'Thanks for signing up for LevelWorks. One question for you',
    lines: [
      'Hi, it’s Eric. I’m the contractor who built LevelWorks, and I saw you signed up. Thank you. I mean that; every account is a person who decided to give it a shot.',
      'In case you haven’t had a minute to dig in, here’s what it does: write an estimate on your phone in about a minute, send it by text or email, the client signs it from theirs, then turn it into an invoice and get paid by card straight to your bank. Recurring billing for the maintenance jobs, your logo on everything, photo updates to the client from the site, and the whole thing works in English or Spanish.',
      'One question, and I’d honestly like the answer: <b>what would make you use it every day?</b> Something missing, something confusing, something that annoyed you. Hit reply and tell me. I read every one and I fix things fast.',
      'And if you already use it, tell me what job you did with it. That makes my week.',
    ],
    cta: 'Open LevelWorks', ctaUrl: 'https://levelworks.org/app',
    ps: 'P.S. If you’d rather pay once and forget it: a full year is $49 right now at levelworks.org/annual. No pressure, the $5 a month plan is the same app. If you’d rather not hear from me, reply “stop” and I’ll take you off.',
  },
  es: {
    subject: 'Gracias por registrarte en LevelWorks. Una pregunta',
    lines: [
      'Hola, soy Eric. Soy el contratista que hizo LevelWorks y vi que te registraste. Gracias, de verdad; cada cuenta es una persona que decidió probarlo.',
      'Por si no has tenido un minuto para verla: haces un presupuesto en tu teléfono en un minuto, lo mandas por texto o correo, el cliente lo firma desde el suyo, lo conviertes en factura y te pagan con tarjeta directo a tu banco. Cobros recurrentes para los trabajos de mantenimiento, tu logo en todo, fotos de avance para el cliente desde la obra, y todo funciona en español o en inglés.',
      'Una pregunta, y de verdad quiero la respuesta: <b>¿qué haría que la usaras todos los días?</b> Algo que falta, algo confuso, algo que te molestó. Responde a este correo y cuéntame. Leo cada uno y arreglo las cosas rápido.',
      'Y si ya la usas, cuéntame en qué trabajo. Eso me alegra la semana.',
    ],
    cta: 'Abrir LevelWorks', ctaUrl: 'https://levelworks.org/app',
    ps: 'P.D. Si prefieres pagar una vez y olvidarte: un año completo cuesta $49 ahora en levelworks.org/es/annual. Sin presión, el plan de $5 al mes es la misma app. Si prefieres no recibir correos míos, responde “stop” y te quito de la lista.',
  },
};


export async function recipients({ excludeEric = false } = {}) {
  const a = admin();
  const users = [];
  for (let page = 1; ; page++) {
    const { data, error } = await a.auth.admin.listUsers({ page, perPage: 200 });
    if (error) throw error;
    users.push(...data.users); if (data.users.length < 200) break;
  }
  const { data: profiles } = await a.from('profiles').select('id,lang');
  const plang = new Map((profiles || []).map(p => [p.id, p.lang]));
  return users
    .filter(u => u.email && !SKIP.has(u.email) && !u.email.endsWith('@levelworks.org') && !(excludeEric && ERIC.includes(u.email)))
    .map(u => ({ email: u.email, lang: (plang.get(u.id) || u.user_metadata?.lang || 'en') === 'es' ? 'es' : 'en' }));
}

export async function sendNote(to, lang) {
  const c = COPY[lang] || COPY.en;
  const html = layout({ lang, lines: c.lines, cta: c.cta, ctaUrl: c.ctaUrl, ps: c.ps });
  const text = c.lines.map(l => l.replace(/<[^>]+>/g, '')).join('\n\n') + `\n\n${c.cta}: ${c.ctaUrl}\n\n${c.ps.replace(/<[^>]+>/g, '')}\n\nEric`;
  return sendMail({ to, subject: c.subject, html, text });
}
