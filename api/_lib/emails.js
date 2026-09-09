/**
 * Every launch email, both languages, written as Eric would write them.
 * Short, plain, one ask each. No exclamation marks, no "The LevelWorks Team".
 */
import { layout, SITE_URL } from './annual.js';

const NEW_ESTIMATE = `${SITE_URL}/app?new=estimate`;
const EXAMPLE_IMG = `${SITE_URL}/marketing/estimate-example.png`;

export const EMAILS = {
  /** Paid, brand-new account: the one-tap login link. */
  annualWelcomeNew: {
    en: (link) => ({
      subject: 'You’re in. Here’s your LevelWorks login',
      html: layout({ lang: 'en', lines: [
        'Thanks for grabbing a year of LevelWorks. Your account is ready and your year is paid for, nothing else to set up.',
        'Here’s the first thing to do: create an estimate. Takes 2 minutes, and you’ll see right away how the app works.',
        'The button below logs you in on this phone. It works once, so if you want the app on another device, just sign in there with this email and set a password from Settings.',
      ], cta: 'Open LevelWorks and start an estimate', ctaUrl: link,
      ps: 'Want it in Spanish? The language switch is at the top of every screen.' }),
    }),
    es: (link) => ({
      subject: 'Ya estás dentro. Aquí tienes tu acceso a LevelWorks',
      html: layout({ lang: 'es', lines: [
        'Gracias por tomar un año de LevelWorks. Tu cuenta ya está lista y tu año está pagado, no hay nada más que configurar.',
        'Lo primero que te recomiendo: crea un presupuesto. Toma 2 minutos y vas a ver enseguida cómo funciona la app.',
        'El botón de abajo te inicia sesión en este teléfono. Funciona una sola vez; si quieres la app en otro dispositivo, entra ahí con este correo y crea una contraseña desde Ajustes.',
      ], cta: 'Abrir LevelWorks y hacer un presupuesto', ctaUrl: link,
      ps: '¿La quieres en inglés? El cambio de idioma está arriba en cada pantalla.' }),
    }),
  },

  /** Paid, already had an account. */
  annualWelcomeExisting: {
    en: (expires) => ({
      subject: 'Your year of LevelWorks is on',
      html: layout({ lang: 'en', lines: [
        `Got it, thanks. Your account is now on the annual plan through <b>${expires}</b>. Nothing else changes: same login, same estimates, same clients.`,
        'If you were on the monthly plan, that stops now; you won’t be charged twice.',
      ], cta: 'Open LevelWorks', ctaUrl: `${SITE_URL}/app` }),
    }),
    es: (expires) => ({
      subject: 'Tu año de LevelWorks ya está activo',
      html: layout({ lang: 'es', lines: [
        `Listo, gracias. Tu cuenta ya está en el plan anual hasta el <b>${expires}</b>. Nada más cambia: mismo acceso, mismos presupuestos, mismos clientes.`,
        'Si estabas en el plan mensual, ese se detiene ahora; no te vamos a cobrar dos veces.',
      ], cta: 'Abrir LevelWorks', ctaUrl: `${SITE_URL}/app` }),
    }),
  },

  /** Day 1 without an estimate. */
  nudge1: {
    en: () => ({
      subject: 'Need a hand getting your first estimate in?',
      html: layout({ lang: 'en', lines: [
        'You signed up for LevelWorks yesterday and haven’t built an estimate yet. Totally normal, everyone’s busy.',
        'Fastest way to see if it’s for you: open it, add a client, type three lines of work. Two minutes. If you get stuck anywhere, reply and tell me where.',
      ], cta: 'Start an estimate', ctaUrl: NEW_ESTIMATE }),
    }),
    es: () => ({
      subject: '¿Te ayudo con tu primer presupuesto?',
      html: layout({ lang: 'es', lines: [
        'Te registraste en LevelWorks ayer y todavía no has hecho un presupuesto. Es normal, todos andamos ocupados.',
        'La forma más rápida de ver si te sirve: ábrela, agrega un cliente y escribe tres partidas de trabajo. Dos minutos. Si te atoras en algo, responde y dime dónde.',
      ], cta: 'Hacer un presupuesto', ctaUrl: NEW_ESTIMATE }),
    }),
  },

  /** Day 3: one picture. */
  nudge3: {
    en: () => ({
      subject: 'Yours can look like this today',
      html: layout({ lang: 'en', lines: [
        'This is what a finished LevelWorks estimate looks like on the client’s phone. Your business name at the top, the work laid out line by line, a deposit, and a button for them to sign.',
        'Yours can look like this today. Same two minutes.',
      ], image: EXAMPLE_IMG, cta: 'Build mine', ctaUrl: NEW_ESTIMATE }),
    }),
    es: () => ({
      subject: 'El tuyo puede verse así hoy',
      html: layout({ lang: 'es', lines: [
        'Así se ve un presupuesto terminado de LevelWorks en el teléfono del cliente. El nombre de tu negocio arriba, el trabajo partida por partida, un anticipo y un botón para que firme.',
        'El tuyo puede verse así hoy. Los mismos dos minutos.',
      ], image: EXAMPLE_IMG, cta: 'Hacer el mío', ctaUrl: NEW_ESTIMATE }),
    }),
  },

  /** Day 7: honest question. Replies go to Eric. */
  nudge7: {
    en: () => ({
      subject: 'What’s stopping you?',
      html: layout({ lang: 'en', lines: [
        'A week in and no estimate yet, so I’m guessing something got in the way. Wrong tool for your trade, confusing screen, just no time?',
        'Reply and tell me. I read every one, and if it’s something in the app I’ll fix it.',
      ] }),
    }),
    es: () => ({
      subject: '¿Qué te está frenando?',
      html: layout({ lang: 'es', lines: [
        'Ya pasó una semana y todavía no hay presupuesto, así que supongo que algo se atravesó. ¿No es para tu oficio, una pantalla confusa, o simplemente no hay tiempo?',
        'Responde y cuéntame. Leo cada correo, y si es algo de la app, lo arreglo.',
      ] }),
    }),
  },

  /** Day 30 for annual buyers: a check-in, no offer. */
  day30: {
    en: () => ({
      subject: 'One month in',
      html: layout({ lang: 'en', lines: [
        'You’ve had LevelWorks for a month now. Quick check: is it doing the job? Anything you wish it did?',
        'Reply with one line. Good or bad, it helps.',
      ] }),
    }),
    es: () => ({
      subject: 'Un mes ya',
      html: layout({ lang: 'es', lines: [
        'Ya llevas un mes con LevelWorks. Pregunta rápida: ¿te está funcionando? ¿Hay algo que quisieras que hiciera?',
        'Responde con una línea. Bueno o malo, ayuda.',
      ] }),
    }),
  },

  /** Day 25 of a free trial: the year for $49, while it exists. */
  trialOffer: {
    en: () => ({
      subject: 'Your trial ends soon. A year for $49, if you want it',
      html: layout({ lang: 'en', lines: [
        'Your free month of LevelWorks is almost up. After that it’s $5 a month, and that’s fine.',
        'But while it lasts, there’s a better deal: a full year for $49, one payment, no auto-renew. It’s for the first 500 contractors and it comes off the page when they’re gone.',
      ], cta: 'Claim a year for $49', ctaUrl: `${SITE_URL}/annual?utm_source=email&utm_medium=email&utm_campaign=lw49&utm_content=trial25` }),
    }),
    es: () => ({
      subject: 'Tu prueba termina pronto. Un año por $49, si lo quieres',
      html: layout({ lang: 'es', lines: [
        'Tu mes gratis de LevelWorks está por terminar. Después son $5 al mes, y está bien.',
        'Pero mientras dure, hay algo mejor: un año completo por $49, un solo pago, sin renovación automática. Es para los primeros 500 contratistas y desaparece de la página cuando se acaben.',
      ], cta: 'Reclamar un año por $49', ctaUrl: `${SITE_URL}/es/annual?utm_source=email&utm_medium=email&utm_campaign=lw49&utm_content=trial25` }),
    }),
  },
};

export function fmtDate(iso, lang) {
  return new Date(iso).toLocaleDateString(lang === 'es' ? 'es-MX' : 'en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}
