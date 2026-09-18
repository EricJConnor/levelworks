/**
 * The every-other-morning feature tips (Eric, Sep 14 2026: "an email every other morning with
 * a very simple, but detailed instruction on how to use a particular feature").
 *
 * One feature per email, numbered steps, the button names exactly as they read in the app,
 * in the member's language. Everyone walks the same series from tip 1 at their own pace:
 * progress lives in auth `app_metadata.tip_stage` / `tip_at` (no migration; the service key
 * can write it), the daily cron sends the next tip to anyone whose last one is 40+ hours old,
 * and the series simply stops at the end until more are written. Unsubscribed members and
 * anyone who got a nudge in the same run are skipped, so nobody gets two emails in a morning.
 *
 * Adding a tip: append to TIPS (en + es). Never reorder or remove: stage numbers are positions.
 */
import { layout, sendMail, SITE_URL } from './annual.js';

const APP = `${SITE_URL}/app`;
const GAP_HOURS = 40;
// An observer (app_metadata.observer, e.g. a funder Eric added to the list) who joined late
// catches up one tip a day until level with the members, then rides the normal cadence.
const CATCHUP_HOURS = 20;

export const TIPS = [
  {
    en: {
      subject: 'LevelWorks tip 1: an estimate in two minutes',
      lines: [
        'Hi, Eric here. Every other morning I’ll send one short how-to for one thing in LevelWorks. Two minutes to read, and you’ll know that feature cold. Here’s the first.',
        '<b>Write an estimate on your phone</b>',
        '1. Open LevelWorks and tap <b>New estimate</b>.<br>2. Type the client’s name. If you’ve used them before, they pop up; tap to fill the rest.<br>3. Give the job a name, like “Master bath remodel”.<br>4. Describe the first line of work, set the quantity and the rate. Tap <b>Add another item</b> for the next one.<br>5. Need money up front? Put it in <b>Deposit</b> at the bottom and the balance works itself out.<br>6. Tap <b>Preview</b> to see exactly what the client will see, or <b>Save</b> to finish later.',
        'That’s it. Next time: sending it, and how the client signs from their couch.',
      ],
    },
    es: {
      subject: 'Tip 1 de LevelWorks: un presupuesto en dos minutos',
      lines: [
        'Hola, soy Eric. Cada dos mañanas te mando una guía corta de una sola cosa de LevelWorks. Dos minutos de lectura y esa función ya la dominas. Aquí va la primera.',
        '<b>Haz un presupuesto desde tu teléfono</b>',
        '1. Abre LevelWorks y toca <b>Nuevo presupuesto</b>.<br>2. Escribe el nombre del cliente. Si ya trabajaste con él, aparece; tócalo y se llena el resto.<br>3. Ponle nombre al trabajo, por ejemplo “Remodelación de baño”.<br>4. Describe la primera partida, pon la cantidad y el precio. Toca <b>Agregar otra partida</b> para la siguiente.<br>5. ¿Necesitas dinero por adelantado? Ponlo en <b>Anticipo</b>, abajo, y el saldo se calcula solo.<br>6. Toca <b>Vista previa</b> para ver exactamente lo que verá el cliente, o <b>Guardar</b> para terminarlo después.',
        'Eso es todo. La próxima: cómo enviarlo y cómo lo firma el cliente desde su sofá.',
      ],
    },
  },
  {
    en: {
      subject: 'LevelWorks tip 2: send it by text, get it signed',
      lines: [
        '<b>Send an estimate and get a signature</b>',
        '1. Open the estimate and tap <b>Send to client</b>.<br>2. Pick <b>Text it</b>. On your phone, your Messages app opens with the client already addressed and the link in the message. Tap send. (Or pick <b>Email it</b> and we send it for you.)<br>3. The client opens the link on their phone, sees the estimate with your name and logo, and signs with their finger. No account, no app, no password.<br>4. The moment they sign, the estimate turns <b>Approved</b> in your list, with their name and the time on it.',
        'Sending from your own number means they can text you back like they always do. Next time: turning the approved estimate into an invoice and getting paid by card.',
      ],
    },
    es: {
      subject: 'Tip 2 de LevelWorks: envíalo por mensaje y que lo firmen',
      lines: [
        '<b>Envía un presupuesto y consigue la firma</b>',
        '1. Abre el presupuesto y toca <b>Enviar al cliente</b>.<br>2. Elige <b>Por mensaje</b>. En tu teléfono se abre tu app de mensajes con el cliente ya puesto y el enlace en el texto. Toca enviar. (O elige <b>Por correo</b> y lo mandamos nosotros.)<br>3. El cliente abre el enlace en su teléfono, ve el presupuesto con tu nombre y tu logo, y firma con el dedo. Sin cuenta, sin app, sin contraseña.<br>4. En cuanto firma, el presupuesto aparece como <b>Aprobado</b> en tu lista, con su nombre y la hora.',
        'Como lo mandas desde tu propio número, te puede contestar como siempre. La próxima: convertir el presupuesto aprobado en factura y cobrar con tarjeta.',
      ],
    },
  },
  {
    en: {
      subject: 'LevelWorks tip 3: from estimate to paid invoice',
      lines: [
        '<b>Turn the estimate into an invoice and get paid by card</b>',
        'One-time setup first: on <b>Dashboard</b>, tap <b>Set up payments</b>. It walks you through connecting your bank with Stripe. Takes about five minutes and you only do it once.',
        '1. Open the approved estimate and tap <b>Convert to invoice</b>. Every line carries over.<br>2. Check the due date, add a note if you want, and send it the same way: text or email.<br>3. The client opens the link and pays with a card right there. The money goes to your bank, and the invoice marks itself <b>Paid</b>.',
        'If they pay you cash or check, open the invoice and record the payment by hand so your books stay right. Next time: showing one total instead of every line price.',
      ],
    },
    es: {
      subject: 'Tip 3 de LevelWorks: del presupuesto a la factura pagada',
      lines: [
        '<b>Convierte el presupuesto en factura y cobra con tarjeta</b>',
        'Primero, una sola vez: en <b>Inicio</b>, toca <b>Configurar los pagos</b>. Te guía para conectar tu banco con Stripe. Toma unos cinco minutos y no se repite.',
        '1. Abre el presupuesto aprobado y toca <b>Convertir en factura</b>. Todas las partidas pasan solas.<br>2. Revisa la fecha de vencimiento, agrega una nota si quieres, y envíala igual: por mensaje o por correo.<br>3. El cliente abre el enlace y paga con tarjeta ahí mismo. El dinero va a tu banco y la factura se marca <b>Pagada</b> sola.',
        'Si te pagan en efectivo o con cheque, abre la factura y registra el pago a mano para que tus cuentas cuadren. La próxima: mostrar un solo total en vez del precio de cada partida.',
      ],
    },
  },
  {
    en: {
      subject: 'LevelWorks tip 4: one total, no line prices',
      lines: [
        '<b>Show the client one price for the whole job</b>',
        'A lot of contractors quote lump sum: a priced line invites the client to shop it or cut it. LevelWorks can hide line prices for you.',
        '1. Open the estimate and scroll to the totals box at the bottom.<br>2. Switch off <b>Show line prices</b>.<br>3. Tap <b>Preview</b>. The client’s copy now shows your descriptions and one total. Deposit and balance still show.',
        'You still see every price on your side, and the setting carries over to the invoice. The app remembers your choice for the next estimate. And a line with no price never shows “$0.00” anymore. Next time: your logo.',
      ],
    },
    es: {
      subject: 'Tip 4 de LevelWorks: un solo total, sin precios por partida',
      lines: [
        '<b>Muéstrale al cliente un solo precio por todo el trabajo</b>',
        'Muchos contratistas cotizan a precio cerrado: una partida con precio invita al cliente a regatearla o quitarla. LevelWorks puede ocultar los precios por partida.',
        '1. Abre el presupuesto y baja hasta la caja de totales.<br>2. Apaga <b>Mostrar precios por partida</b>.<br>3. Toca <b>Vista previa</b>. La copia del cliente ahora muestra tus descripciones y un solo total. El anticipo y el saldo siguen apareciendo.',
        'Tú sigues viendo todos los precios de tu lado, y el ajuste pasa a la factura. La app recuerda tu elección para el siguiente presupuesto. Y una partida sin precio ya nunca muestra “$0.00”. La próxima: tu logo.',
      ],
    },
  },
  {
    en: {
      subject: 'LevelWorks tip 5: your logo on everything',
      lines: [
        '<b>Put your logo on every estimate and invoice</b>',
        '1. Tap <b>More</b>, then <b>Account</b>.<br>2. On the <b>Profile</b> tab, tap <b>Upload logo</b> and pick a PNG or JPG from your phone. A photo of your truck door works fine if that’s what you have.<br>3. While you’re there, check your company name, phone and address. That block prints at the top of everything you send.',
        'From then on every estimate, invoice and client page carries it. Next time: sending the client photos from the job.',
      ],
    },
    es: {
      subject: 'Tip 5 de LevelWorks: tu logo en todo',
      lines: [
        '<b>Pon tu logo en cada presupuesto y factura</b>',
        '1. Toca <b>Más</b> y luego <b>Cuenta</b>.<br>2. En la pestaña <b>Perfil</b>, toca <b>Subir el logotipo</b> y elige un PNG o JPG de tu teléfono. Una foto de la puerta de tu camioneta sirve si es lo que tienes.<br>3. Ya que estás ahí, revisa el nombre de tu empresa, tu teléfono y tu dirección. Ese bloque sale arriba de todo lo que envías.',
        'Desde ese momento cada presupuesto, factura y página del cliente lo lleva. La próxima: mandarle al cliente fotos desde la obra.',
      ],
    },
  },
  {
    en: {
      subject: 'LevelWorks tip 6: photo updates from the job',
      lines: [
        '<b>Send the client progress photos with one link</b>',
        'Clients who see progress don’t call to ask about it, and they pay faster.',
        '1. Tap <b>Photos</b>, then <b>New update</b>.<br>2. Name it (“Week 2 progress”), write two lines about where things stand, and add photos straight from your camera.<br>3. Tap <b>Send this update</b> and send the link by text or email, same as an estimate.',
        'The client gets a clean page with your photos and your note. Next time: Spanish, and translating what you typed.',
      ],
    },
    es: {
      subject: 'Tip 6 de LevelWorks: fotos de avance desde la obra',
      lines: [
        '<b>Mándale al cliente fotos del avance con un solo enlace</b>',
        'El cliente que ve el avance no llama a preguntar, y paga más rápido.',
        '1. Toca <b>Fotos</b> y luego <b>Nuevo avance</b>.<br>2. Ponle nombre (“Avance semana 2”), escribe dos líneas de cómo va todo y agrega fotos directo de tu cámara.<br>3. Toca <b>Enviar este avance</b> y manda el enlace por mensaje o correo, igual que un presupuesto.',
        'El cliente recibe una página limpia con tus fotos y tu nota. La próxima: el español, y traducir lo que escribiste.',
      ],
    },
  },
  {
    en: {
      subject: 'LevelWorks tip 7: English and Spanish',
      lines: [
        '<b>Work in one language, send in the other</b>',
        '1. The flag at the top of every screen switches the whole app between English and Spanish. Tap it, pick, done.<br>2. Inside an estimate, tap <b>Translate to Spanish</b> (or <b>Translate to English</b>). You see your original beside the translation and approve it before anything changes.<br>3. Your own words stay as you wrote them. The client’s copy is the translation.',
        'Numbers, measurements and brand names never change in translation. Next time: recurring billing for maintenance jobs.',
      ],
    },
    es: {
      subject: 'Tip 7 de LevelWorks: español e inglés',
      lines: [
        '<b>Trabaja en un idioma, envía en el otro</b>',
        '1. La bandera arriba de cada pantalla cambia toda la app entre español e inglés. Tócala, elige, listo.<br>2. Dentro de un presupuesto, toca <b>Traducir al inglés</b> (o <b>Traducir al español</b>). Ves tu original junto a la traducción y la apruebas antes de que cambie nada.<br>3. Tus palabras se quedan como las escribiste. La copia del cliente es la traducción.',
        'Los números, las medidas y las marcas nunca cambian al traducir. La próxima: cobros recurrentes para trabajos de mantenimiento.',
      ],
    },
  },
  {
    en: {
      subject: 'LevelWorks tip 8: bill the same client every month, automatically',
      lines: [
        '<b>Recurring billing for maintenance work</b>',
        'Lawn, snow, HVAC service, pool, cleaning: anything you do on a schedule can be charged on a schedule.',
        '1. Tap <b>Clients</b> and open the client. Make sure they have an email address on file.<br>2. Under <b>Recurring billing</b>, tap <b>Set up a schedule</b>.<br>3. Enter the amount and pick how often: monthly, every 2 months, quarterly, every 6 months, or yearly.<br>4. Enter the client’s card once, right there on your phone. They can read it to you or hand it over; Stripe stores it, we never see it. After that the charge runs itself and the money lands in your bank.',
        'You need card payments set up first (tip 3). That’s the series so far. Reply to any of these and tell me what to cover next.',
      ],
    },
    es: {
      subject: 'Tip 8 de LevelWorks: cóbrale al mismo cliente cada mes, en automático',
      lines: [
        '<b>Cobro recurrente para trabajos de mantenimiento</b>',
        'Jardín, nieve, servicio de aire acondicionado, alberca, limpieza: todo lo que haces con calendario se puede cobrar con calendario.',
        '1. Toca <b>Clientes</b> y abre al cliente. Asegúrate de que tenga un correo registrado.<br>2. En <b>Cobro recurrente</b>, toca <b>Configura un plan de cobro</b>.<br>3. Pon el monto y elige cada cuánto: mensual, cada 2 meses, trimestral, cada 6 meses o anual.<br>4. Registra la tarjeta del cliente una sola vez, ahí mismo en tu teléfono. Te la puede dictar o prestar; la guarda Stripe, nosotros nunca la vemos. Después el cobro corre solo y el dinero llega a tu banco.',
        'Necesitas tener los pagos con tarjeta configurados (tip 3). Hasta aquí la serie. Responde a cualquiera de estos correos y dime qué quieres que explique después.',
      ],
    },
  },
];

const strip = (h) => String(h).replace(/<br>/g, '\n').replace(/<[^>]+>/g, '');

/** The email for tip `n` (1-based) in a language, ready for sendMail. */
export function tipMail(n, lang) {
  const tip = TIPS[n - 1]; if (!tip) return null;
  const c = tip[lang === 'es' ? 'es' : 'en'];
  const cta = lang === 'es' ? 'Abrir LevelWorks' : 'Open LevelWorks';
  const html = layout({ lang, lines: c.lines, cta, ctaUrl: APP, unsubscribe: true });
  const text = c.lines.map(strip).join('\n\n') + `\n\n${cta}: ${APP}\n\nEric\n\n${lang === 'es' ? 'Cancelar suscripción' : 'Unsubscribe'}: {{{RESEND_UNSUBSCRIBE_URL}}}`;
  return { subject: c.subject, html, text };
}

/**
 * Sends the next tip to every member who is due one. `users` are auth users, `langOf(u)`
 * gives the language, `skip` is a Set of lowercase emails to leave alone this run
 * (unsubscribed, or already emailed this morning). Returns a small report.
 */
export async function sendTips({ a, users, langOf, skip, dry = false, now = Date.now(), budget = 200 }) {
  const report = { sent: [], done: 0, errors: [] };
  const crowd = Math.max(0, ...users.filter(u => !(u.app_metadata || {}).observer).map(u => Number((u.app_metadata || {}).tip_stage) || 0));
  for (const u of users) {
    if (budget <= 0) break;
    const email = String(u.email || '').trim().toLowerCase();
    if (!email || email.endsWith('@levelworks.org') || skip.has(email)) continue;
    const meta = u.app_metadata || {};
    const stage = Number(meta.tip_stage) || 0;
    if (stage >= TIPS.length) { report.done++; continue; }
    const gap = meta.observer && stage < crowd ? CATCHUP_HOURS : GAP_HOURS;
    if (meta.tip_at && now - new Date(meta.tip_at).getTime() < gap * 3600 * 1000) continue;
    const n = stage + 1; const lang = langOf(u);
    const m = tipMail(n, lang);
    if (!dry) {
      try {
        await sendMail({ to: email, ...m, unsubscribe: lang });
        const { error } = await a.auth.admin.updateUserById(u.id, { app_metadata: { ...meta, tip_stage: n, tip_at: new Date(now).toISOString() } });
        if (error) report.errors.push(`tip stage ${email}: ${error.message}`);
      } catch (e) { report.errors.push(`tip ${n} ${email}: ${e.message}`); continue; }
      await new Promise(s => setTimeout(s, 550));   // Resend allows 2 requests a second
    }
    report.sent.push({ email, n, lang });
    budget--;
  }
  return report;
}
