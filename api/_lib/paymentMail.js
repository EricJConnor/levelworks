/**
 * "You got paid": one email to the contractor the moment a client's payment is
 * recorded on an invoice, and, for a bank transfer, again when it clears. Built
 * after Eric waited five days on a payment he did not know had arrived.
 *
 * Transactional, so no unsubscribe link, on purpose. Never throws: a mail
 * hiccup must not fail the payment that was just recorded.
 *
 *   kind: 'card'     a card payment succeeded; money is in his Stripe balance
 *         'pending'  a bank debit was accepted and is clearing (~4 business days)
 *         'settled'  that bank debit cleared
 */
import { sendMail, SITE_URL } from './annual.js';

const money = (n) => '$' + (Number(n) || 0).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const PAYOUTS = 'https://dashboard.stripe.com/settings/payouts';
const BALANCE = 'https://dashboard.stripe.com/balance/overview';

const T = {
  en: {
    subject: {
      card: (amt, who) => `${who} paid you ${amt}`,
      pending: (amt, who) => `${who} sent you ${amt} by bank transfer (clearing)`,
      settled: (amt, who) => `${who}’s ${amt} bank transfer cleared`,
    },
    lead: {
      card: (amt, who, inv) => `${who} just paid <b>${amt}</b> by card on invoice ${inv}. The invoice is marked paid in LevelWorks.`,
      pending: (amt, who, inv) => `${who} just paid <b>${amt}</b> by bank transfer on invoice ${inv}. A bank transfer takes about four business days to clear, so the invoice shows the payment as clearing until then. You will get another email when it does.`,
      settled: (amt, who, inv) => `The <b>${amt}</b> bank transfer from ${who} on invoice ${inv} has cleared. The invoice is marked paid in LevelWorks.`,
    },
    where: (kind) => kind === 'pending'
      ? 'Nothing to do yet. Once it clears, the money sits in your Stripe balance and Stripe sends it to your bank on your payout schedule.'
      : 'The money is now in your Stripe balance. Stripe sends it to your bank on your payout schedule: on the automatic setting that is about two business days from now, and the very first payout on a new account takes about seven days.',
    manual: `If you ever see money sitting in Stripe and nothing arriving, check that your payout schedule is set to <b>automatic</b>, not manual. On manual, Stripe holds every payment until you press Pay out yourself.`,
    see: 'See it in Stripe', schedule: 'Check your payout schedule',
    foot: 'LevelWorks sends this the moment a payment is recorded on one of your invoices.',
  },
  es: {
    subject: {
      card: (amt, who) => `${who} te pagó ${amt}`,
      pending: (amt, who) => `${who} te mandó ${amt} por transferencia bancaria (en proceso)`,
      settled: (amt, who) => `Se acreditó la transferencia de ${amt} de ${who}`,
    },
    lead: {
      card: (amt, who, inv) => `${who} acaba de pagar <b>${amt}</b> con tarjeta en la factura ${inv}. La factura ya aparece como pagada en LevelWorks.`,
      pending: (amt, who, inv) => `${who} acaba de pagar <b>${amt}</b> por transferencia bancaria en la factura ${inv}. Una transferencia tarda unos cuatro días hábiles en acreditarse, así que la factura muestra el pago en proceso hasta entonces. Te llegará otro correo cuando se acredite.`,
      settled: (amt, who, inv) => `La transferencia de <b>${amt}</b> de ${who} en la factura ${inv} ya se acreditó. La factura aparece como pagada en LevelWorks.`,
    },
    where: (kind) => kind === 'pending'
      ? 'Por ahora no hay nada que hacer. Cuando se acredite, el dinero queda en tu saldo de Stripe y Stripe lo manda a tu banco según tu calendario de depósitos.'
      : 'El dinero ya está en tu saldo de Stripe. Stripe lo manda a tu banco según tu calendario de depósitos: en automático, en unos dos días hábiles; el primer depósito de una cuenta nueva tarda unos siete días.',
    manual: `Si alguna vez ves dinero en Stripe y nada llega a tu banco, revisa que tu calendario de depósitos esté en <b>automático</b>, no en manual. En manual, Stripe retiene cada pago hasta que tú mismo toques Pay out.`,
    see: 'Verlo en Stripe', schedule: 'Revisar tu calendario de depósitos',
    foot: 'LevelWorks manda este correo en cuanto se registra un pago en una de tus facturas.',
  },
};

function build({ lang, kind, amount, payer, invoiceLabel }) {
  const t = T[lang === 'es' ? 'es' : 'en'];
  const amt = money(amount);
  const who = esc(payer);
  const inv = esc(invoiceLabel);
  const paras = [t.lead[kind](amt, who, inv), t.where(kind), t.manual];
  const btn = (href, label) => `<a href="${href}" style="display:inline-block;background:#2563eb;color:#fff;text-decoration:none;font-weight:600;font-size:15px;padding:12px 18px;border-radius:10px;margin:0 8px 8px 0">${label}</a>`;
  const html = `<!doctype html><html lang="${lang}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;background:#f5f7fb;font-family:Inter,-apple-system,Segoe UI,Roboto,sans-serif">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f5f7fb;padding:28px 12px"><tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#fff;border:1px solid #e6e9ef;border-radius:14px"><tr><td style="padding:30px 28px">
<p style="margin:0 0 18px;font-size:28px;font-weight:700;color:#16a34a">${amt}</p>
${paras.map((p) => `<p style="margin:0 0 16px;font-size:16px;line-height:1.55;color:#0b1220">${p}</p>`).join('')}
<p style="margin:22px 0 0">${btn(BALANCE, t.see)}${btn(PAYOUTS, t.schedule)}</p>
<p style="margin:26px 0 0;font-size:14px;line-height:1.5;color:#5b6472"><a href="${SITE_URL}/app" style="color:#2563eb">LevelWorks</a></p>
</td></tr></table>
<p style="margin:16px 0 0;font-size:12px;color:#8a93a3">${t.foot}</p>
</td></tr></table></body></html>`;
  const strip = (h) => String(h).replace(/<[^>]+>/g, '');
  const text = `${amt}\n\n${paras.map(strip).join('\n\n')}\n\n${t.see}: ${BALANCE}\n${t.schedule}: ${PAYOUTS}\n\n${t.foot}`;
  return { subject: t.subject[kind](amt, who), html, text };
}

/**
 * Tell the contractor. `db` is the admin client; `inv` the invoice row; `prof`
 * his profile (lang, business_email). Returns true if a mail went out.
 */
export async function notifyPaid({ db, inv, prof, kind, amount }) {
  try {
    let email = String(prof?.business_email || '').trim().toLowerCase();
    if (!email) {
      const { data } = await db.auth.admin.getUserById(inv.user_id);
      email = String(data?.user?.email || '').trim().toLowerCase();
    }
    if (!email || !email.includes('@')) return false;
    const lang = prof?.lang === 'es' ? 'es' : 'en';
    const number = String(inv.invoice_number || '').replace(/^#/, '');
    const invoiceLabel = (number ? `#${number}` : '') + (inv.project_name ? `${number ? ' · ' : ''}${inv.project_name}` : '') || inv.id.slice(-6);
    const payer = String(inv.client_name || '').trim() || (lang === 'es' ? 'Tu cliente' : 'Your client');
    const m = build({ lang, kind, amount, payer, invoiceLabel });
    await sendMail({ to: email, ...m, from: 'LevelWorks <documents@levelworks.org>' });
    return true;
  } catch (e) {
    console.error('paymentMail', kind, inv?.id, e?.message || e);
    return false;
  }
}
