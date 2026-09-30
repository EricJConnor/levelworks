/**
 * Scheduled one-off notes from Eric to every member, sent by the daily cron.
 *
 * A note has a `sendAt`; the first cron run at or after it sends the note to
 * everyone (English or Spanish by the member's language) and records the note's
 * key in auth `app_metadata.notes_sent`, so nobody gets it twice and a member
 * who joins later never gets an old one. Unsubscribed members, `@levelworks.org`
 * and anyone in SKIP are left out. Every note carries the unsubscribe link and
 * headers (sendMail does that).
 *
 * Preview any note without sending: GET /api/note-preview?which=<key>&lang=en|es
 *
 * Adding a note: one entry here, both languages, a sendAt in the future. Keep
 * the app's exact button labels (from the dictionaries, not from memory).
 */
import { layout, sendMail, SITE_URL } from './annual.js';

const IMG = (name, alt) => `<img src="${SITE_URL}/email/${name}.png" alt="${alt}" width="464" style="width:100%;max-width:464px;border:1px solid #e6e9ef;border-radius:12px;display:block">`;
const utm = (path, content) => `${SITE_URL}${path}?utm_source=email&utm_medium=email&utm_campaign=notes&utm_content=${content}`;

export const NOTES = {
  stripePayouts: {
    // Oct 1 2026, 9am ET. Written after a real payment sat in a connected
    // account for five days because its payout schedule was set to manual.
    sendAt: '2026-10-01T12:00:00Z',
    en: {
      subject: 'Where the money goes after a client pays you (read this once)',
      lines: [
        'Hi, it’s Eric. This one is about what happens to the money after a client pays an invoice, because I got caught by it myself this week and I do not want it to happen to you.',
        '<b>What happened to me.</b> A customer paid my own company’s invoice by card on a Friday. I opened Stripe from my LevelWorks dashboard, saw the payment, and waited. Five days later nothing had reached my bank. The money was sitting in my Stripe account the whole time, because that account’s payout schedule was set to <b>manual</b>. I pressed one button and it arrived the next business day. That button is the whole story of this email.',
        '<b>How the money moves.</b> When a client taps Pay on your invoice, the money goes into <b>your</b> Stripe account, not ours. LevelWorks never holds it and takes nothing from it. Stripe then sends it from your Stripe balance to your bank on a schedule that you control. So there are two steps: client to Stripe, which is instant, and Stripe to your bank, which is the part to understand.',
        '<b>1. How to know a client paid.</b> Two ways. In LevelWorks, the invoice turns <b>Paid</b> in your Invoices list. And starting today, <b>you get an email the moment a payment lands</b> on any of your invoices, with the amount, the client and the invoice. A bank transfer sends two: one when the client pays, one when it clears. You no longer have to go looking.',
        '<b>2. How to see it in Stripe.</b> On your LevelWorks dashboard, press <b>Open Stripe</b> on the green payments card. You do not need to go anywhere else. <b>Balance</b> shows two numbers: <b>Available</b>, money Stripe can send to your bank now, and <b>Pending</b>, money still clearing. <b>Payments</b> lists every payment with the client’s name and the invoice number.',
        '<b>3. Make sure payouts are automatic.</b> This is the one that cost me five days. In Stripe go to <b>Settings</b>, then <b>Payouts</b>. The button at the bottom of this email opens that page. Under <b>Payout schedule</b> pick <b>Automatic</b> and <b>Every day</b>. If it says Manual, that is why money sits there. Your LevelWorks dashboard now checks this too and shows a yellow warning on the payments card if your account is set to manual.',
        '<b>4. Pay yourself out by hand.</b> If money is sitting in Available and you want it now, or your schedule is still manual: in Stripe open <b>Balance</b>, press <b>Pay out funds</b>, enter the amount, press <b>Pay out</b>. It lands in your bank in about two business days. On some accounts Stripe also offers <b>Instant payout</b> to a debit card, in minutes, for a 1.5% fee. If you see that option it works the same way.',
        '<b>5. How long it takes.</b> A card payment becomes Available about two business days after the client pays, and on an automatic schedule Stripe sends it that day. The very first payout on a brand new Stripe account takes about seven days while they verify you. A bank transfer (the client pays from their checking account) takes about four business days to clear before any of that starts. Weekends and bank holidays do not count. So a card payment on a Friday reaches your bank on Tuesday or Wednesday, not Saturday.',
        '<b>6. Fees, so there are no surprises.</b> Card: 2.9% plus 30 cents, taken by Stripe before the money reaches you. Bank transfer: 0.8%, capped at $5, so a $20,000 job costs $5. LevelWorks takes 0% on both. You choose which one a client may use on each invoice, under the total in the invoice builder.',
        '<b>7. Let Stripe tell you too.</b> In Stripe, under your name at the top right, <b>Profile</b>, then <b>Notifications</b>, turn on the emails for payments and payouts. The Stripe app on your phone does the same with a push. Between that and the LevelWorks email, you will never wonder again.',
        'If anything in Stripe looks different from what I described, or a payment is not where you expect it, reply to this email with what the screen says. I answer these myself.',
      ],
      cta: 'Check your payout schedule', ctaUrl: 'https://dashboard.stripe.com/settings/payouts',
      ps: 'P.S. A full year of LevelWorks is $49 at levelworks.org/annual. One payment, no auto-renew. If you’d rather not hear from me, there’s an unsubscribe link at the bottom.',
    },
    es: {
      subject: 'A dónde va el dinero cuando un cliente te paga (léelo una vez)',
      lines: [
        'Hola, soy Eric. Este correo es sobre qué pasa con el dinero después de que un cliente paga una factura, porque a mí me pasó esta semana y no quiero que te pase a ti.',
        '<b>Lo que me pasó.</b> Un cliente pagó con tarjeta una factura de mi propia empresa un viernes. Abrí Stripe desde mi Inicio de LevelWorks, vi el pago y esperé. Cinco días después no había llegado nada a mi banco. El dinero estuvo todo ese tiempo en mi cuenta de Stripe, porque el calendario de depósitos de esa cuenta estaba en <b>manual</b>. Toqué un botón y llegó al siguiente día hábil. Ese botón es toda la historia de este correo.',
        '<b>Cómo se mueve el dinero.</b> Cuando un cliente toca Pagar en tu factura, el dinero entra a <b>tu</b> cuenta de Stripe, no a la nuestra. LevelWorks nunca lo retiene ni se queda con nada. Después Stripe lo manda de tu saldo de Stripe a tu banco según un calendario que tú controlas. Son dos pasos: del cliente a Stripe, que es instantáneo, y de Stripe a tu banco, que es la parte que hay que entender.',
        '<b>1. Cómo saber que un cliente pagó.</b> De dos formas. En LevelWorks, la factura cambia a <b>Pagada</b> en tu lista de Facturas. Y desde hoy, <b>te llega un correo en el momento en que entra un pago</b> en cualquiera de tus facturas, con el monto, el cliente y la factura. Una transferencia bancaria manda dos: uno cuando el cliente paga y otro cuando se acredita. Ya no tienes que andar buscando.',
        '<b>2. Cómo verlo en Stripe.</b> En tu Inicio de LevelWorks, toca <b>Abrir Stripe</b> en la tarjeta verde de pagos. No necesitas ir a ningún otro lado. <b>Balance</b> muestra dos números: <b>Available</b>, dinero que Stripe ya puede mandar a tu banco, y <b>Pending</b>, dinero que todavía se está acreditando. <b>Payments</b> lista cada pago con el nombre del cliente y el número de factura.',
        '<b>3. Asegúrate de que los depósitos sean automáticos.</b> Esto es lo que me costó cinco días. En Stripe ve a <b>Settings</b>, luego <b>Payouts</b>. El botón al final de este correo abre esa página. En <b>Payout schedule</b> elige <b>Automatic</b> y <b>Every day</b>. Si dice Manual, por eso el dinero se queda ahí. Tu Inicio de LevelWorks ahora también lo revisa y muestra un aviso amarillo en la tarjeta de pagos si tu cuenta está en manual.',
        '<b>4. Depositarte tú mismo.</b> Si hay dinero en Available y lo quieres ya, o tu calendario sigue en manual: en Stripe abre <b>Balance</b>, toca <b>Pay out funds</b>, escribe el monto y toca <b>Pay out</b>. Llega a tu banco en unos dos días hábiles. En algunas cuentas Stripe también ofrece <b>Instant payout</b> a una tarjeta de débito, en minutos, por una comisión del 1.5%. Si ves esa opción, funciona igual.',
        '<b>5. Cuánto tarda.</b> Un pago con tarjeta pasa a Available unos dos días hábiles después de que el cliente paga, y con el calendario automático Stripe lo manda ese mismo día. El primer depósito de una cuenta de Stripe nueva tarda unos siete días mientras te verifican. Una transferencia bancaria (el cliente paga desde su cuenta de cheques) tarda unos cuatro días hábiles en acreditarse antes de que empiece todo eso. Los fines de semana y días festivos no cuentan. Así que un pago con tarjeta un viernes llega a tu banco el martes o miércoles, no el sábado.',
        '<b>6. Comisiones, para que no haya sorpresas.</b> Tarjeta: 2.9% más 30 centavos, que Stripe descuenta antes de que el dinero te llegue. Transferencia bancaria: 0.8%, con tope de $5, así que un trabajo de $20,000 cuesta $5. LevelWorks cobra 0% en las dos. Tú eliges cuál puede usar el cliente en cada factura, debajo del total en el editor de facturas.',
        '<b>7. Deja que Stripe también te avise.</b> En Stripe, bajo tu nombre arriba a la derecha, <b>Profile</b>, luego <b>Notifications</b>, activa los correos de pagos y depósitos. La app de Stripe en tu teléfono hace lo mismo con una notificación. Entre eso y el correo de LevelWorks, no vuelves a quedarte con la duda.',
        'Si algo en Stripe se ve distinto a lo que describí, o un pago no está donde esperas, responde a este correo con lo que dice la pantalla. Yo mismo contesto.',
      ],
      cta: 'Revisar tu calendario de depósitos', ctaUrl: 'https://dashboard.stripe.com/settings/payouts',
      ps: 'P.D. Un año completo de LevelWorks cuesta $49 en levelworks.org/es/annual. Un solo pago, sin renovación automática. Si prefieres no recibir correos míos, abajo hay un enlace para cancelar.',
    },
  },
  stripeTutorial: {
    // The 9am ET cron runs at 13:00 UTC; anything at or before that sends on Sep 17.
    sendAt: '2026-09-17T12:00:00Z',
    en: {
      subject: 'How to get paid by card in LevelWorks (ten minutes, one time)',
      lines: [
        'Hi, it’s Eric. This one is a full walkthrough of setting up card payments, because it is the feature that changes how fast you get paid, and the setup has a couple of spots where people give up. I did it myself this week. Here is exactly what to expect.',
        '<b>Why bother.</b> A client who gets an invoice by text and can tap Pay pays that day. One who has to mail a check pays when they get to it. The money goes straight to your bank. LevelWorks takes nothing on it; Stripe charges its standard card fee, 2.9% plus 30 cents per payment.',
        '<b>Step 1. In the app.</b> Open <b>Dashboard</b>. Near the top there is a card that says <b>Get paid by card</b>. Tap <b>Set up payments</b>. It takes you to Stripe, the company that moves the money; it is the same processor behind the card payments in a lot of the apps on your phone.',
        IMG('stripe-1-en', 'The Get paid by card card on the Dashboard, with the Set up payments button'),
        '<b>Step 2. On Stripe.</b> Sign in, or create a Stripe login with your email. Stripe makes everyone set up two-step sign-in: it texts you a code, and it may offer an authenticator app, which you can skip in favor of the text. Then it asks for basic information about you and the business:',
        '• Your name, address, date of birth and phone.<br>• If you are a sole proprietor, the last four of your Social. If you are an LLC or incorporated, your EIN.<br>• Your bank. Pick it from the list, or search for it if it is not there. Sign in to it and choose which account the money should land in.<br>• Tap <b>Connect</b>.',
        '<b>If it fails the first time, try again.</b> It did for me. That is on Stripe’s side and it happens; the second time went straight through and nothing was lost. Back in LevelWorks, tap <b>Set up payments</b> once more and Stripe picks up where you left off.',
        '<b>Step 3. You are done when the card turns green.</b> Back on Dashboard it now says <b>You take card payments</b>. That is it. You never do this again.',
        IMG('stripe-2-en', 'The green You take card payments card on the Dashboard'),
        '<b>What your client sees.</b> Send an invoice the way you already do, by text or email. They open the link, see the invoice, and at the bottom there is <b>Pay invoice</b>. Name, email for their receipt, card, then <b>Pay now</b>. The invoice shows <b>Paid</b> in your Invoices list.',
        IMG('stripe-3-en', 'The Pay invoice form a client sees on their phone'),
        '<b>When the money arrives.</b> Stripe holds the very first payout about seven days while it verifies the account. After that, payments land in your bank about two business days after the client pays. Every payout is listed in Stripe; the <b>Open Stripe</b> link is on the same green card.',
        'Connecting Stripe also unlocks <b>recurring billing</b>: bill the same client every month automatically, for maintenance work. That one is coming up in the tips series.',
        'If you get stuck anywhere, reply to this email with what the screen said. I answer these myself.',
      ],
      cta: 'Set up payments', ctaUrl: utm('/app', 'stripe-tutorial'),
      ps: 'P.S. A full year of LevelWorks is $49 right now at levelworks.org/annual. One payment, no auto-renew. The $5 a month plan is the same app. If you’d rather not hear from me, there’s an unsubscribe link at the bottom.',
    },
    es: {
      subject: 'Cómo cobrar con tarjeta en LevelWorks (diez minutos, una sola vez)',
      lines: [
        'Hola, soy Eric. Este correo es una guía completa para activar los pagos con tarjeta, porque es la función que cambia qué tan rápido te pagan, y la configuración tiene un par de puntos donde la gente se rinde. Yo mismo la hice esta semana. Esto es exactamente lo que vas a ver.',
        '<b>Para qué sirve.</b> Un cliente que recibe la factura por mensaje y puede tocar Pagar, paga ese mismo día. Uno que tiene que mandar un cheque paga cuando le toca. El dinero va directo a tu banco. LevelWorks no cobra nada por eso; Stripe cobra su tarifa normal por tarjeta, 2.9% más 30 centavos por pago.',
        '<b>Paso 1. En la app.</b> Abre <b>Inicio</b>. Arriba hay una tarjeta que dice <b>Cobra con tarjeta</b>. Toca <b>Configurar los pagos</b>. Te lleva a Stripe, la empresa que mueve el dinero; es el mismo procesador detrás de los pagos con tarjeta en muchas de las apps de tu teléfono.',
        IMG('stripe-1-es', 'La tarjeta Cobra con tarjeta en Inicio, con el botón Configurar los pagos'),
        '<b>Paso 2. En Stripe.</b> Inicia sesión o crea una cuenta de Stripe con tu correo. Stripe obliga a todos a activar la verificación en dos pasos: te manda un código por mensaje de texto, y puede ofrecerte una app de autenticación, que puedes saltarte y quedarte con el mensaje. Después te pide información básica tuya y del negocio:',
        '• Tu nombre, dirección, fecha de nacimiento y teléfono.<br>• Si trabajas por tu cuenta (sole proprietor), los últimos cuatro dígitos de tu Social. Si tienes LLC o corporación, tu EIN.<br>• Tu banco. Elígelo de la lista, o búscalo si no aparece. Inicia sesión en él y elige a qué cuenta debe llegar el dinero.<br>• Toca <b>Connect</b>.',
        '<b>Si falla la primera vez, inténtalo otra vez.</b> A mí me pasó. Eso es del lado de Stripe y a veces ocurre; la segunda vez pasó directo y no se perdió nada. De vuelta en LevelWorks, toca <b>Configurar los pagos</b> una vez más y Stripe sigue donde te quedaste.',
        '<b>Paso 3. Terminaste cuando la tarjeta se pone verde.</b> De vuelta en Inicio ahora dice <b>Ya cobras con tarjeta</b>. Eso es todo. No vuelves a hacerlo nunca.',
        IMG('stripe-2-es', 'La tarjeta verde Ya cobras con tarjeta en Inicio'),
        '<b>Lo que ve tu cliente.</b> Manda la factura como ya lo haces, por mensaje o por correo. Abre el enlace, ve la factura y abajo aparece <b>Pagar la factura</b>. Nombre, correo para su recibo, tarjeta, y <b>Pagar ahora</b>. La factura aparece como <b>Pagada</b> en tu lista de Facturas.',
        IMG('stripe-3-es', 'El formulario Pagar la factura que ve el cliente en su teléfono'),
        '<b>Cuándo llega el dinero.</b> Stripe retiene el primer depósito unos siete días mientras verifica la cuenta. Después, los pagos llegan a tu banco unos dos días hábiles después de que el cliente paga. Cada depósito aparece en Stripe; el enlace <b>Abrir Stripe</b> está en la misma tarjeta verde.',
        'Conectar Stripe también activa los <b>cobros recurrentes</b>: cobrarle al mismo cliente cada mes en automático, para trabajos de mantenimiento. Ese viene pronto en la serie de tips.',
        'Si te atoras en cualquier punto, responde a este correo con lo que decía la pantalla. Yo mismo contesto.',
      ],
      cta: 'Configurar los pagos', ctaUrl: utm('/app', 'stripe-tutorial'),
      ps: 'P.D. Un año completo de LevelWorks cuesta $49 ahora en levelworks.org/es/annual. Un solo pago, sin renovación automática. El plan de $5 al mes es la misma app. Si prefieres no recibir correos míos, abajo hay un enlace para cancelar.',
    },
  },
};

const strip = h => String(h).replace(/<img[^>]*>/gi, '').replace(/<br\s*\/?>/gi, '\n').replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').trim();

/** Subject, HTML and plain text of one note in one language. */
export function noteMail(which, lang = 'en') {
  const note = NOTES[which];
  if (!note) throw new Error(`No note called "${which}"`);
  const c = note[lang === 'es' ? 'es' : 'en'];
  const html = layout({ lang, lines: c.lines, cta: c.cta, ctaUrl: c.ctaUrl, ps: c.ps, unsubscribe: true });
  const text = c.lines.map(strip).filter(Boolean).join('\n\n')
    + `\n\n${c.cta}: ${c.ctaUrl}\n\n${strip(c.ps)}\n\nEric\n\n${lang === 'es' ? 'Cancelar suscripción' : 'Unsubscribe'}: {{{RESEND_UNSUBSCRIBE_URL}}}`;
  return { subject: c.subject, html, text };
}

/** Which notes are due at `now` (sendAt reached). */
export function dueNotes(now = Date.now()) {
  return Object.entries(NOTES).filter(([, n]) => new Date(n.sendAt).getTime() <= now).map(([k]) => k);
}

/**
 * Send every due note to every member who has not had it. Idempotent through
 * app_metadata.notes_sent. Returns who got what; `dry` reports without sending.
 */
export async function sendNotes({ a, users, langOf, skip, dry = false, now = Date.now(), budget = 300 }) {
  const report = { sent: [], errors: [], due: dueNotes(now) };
  for (const which of report.due) {
    for (const u of users) {
      if (budget <= 0) return report;
      const email = String(u.email || '').trim().toLowerCase();
      if (!email || email.endsWith('@levelworks.org') || skip.has(email)) continue;
      const meta = u.app_metadata || {};
      const had = Array.isArray(meta.notes_sent) ? meta.notes_sent : [];
      if (had.includes(which)) continue;
      const lang = langOf(u);
      if (!dry) {
        try {
          await sendMail({ to: email, ...noteMail(which, lang), unsubscribe: lang });
          const { error } = await a.auth.admin.updateUserById(u.id, { app_metadata: { ...meta, notes_sent: [...had, which] } });
          if (error) report.errors.push(`note mark ${email}: ${error.message}`);
        } catch (e) { report.errors.push(`note ${which} ${email}: ${e.message}`); continue; }
        await new Promise(s => setTimeout(s, 550));   // Resend allows 2 requests a second
      }
      report.sent.push({ email, which, lang });
      budget--;
    }
  }
  return report;
}
