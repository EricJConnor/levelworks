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
 *
 * THE LIST NEVER ENDS. Past the last tip it wraps to the first, so nobody stops
 * hearing from Eric just because they have been here a while. That is why no
 * subject carries a number any more: it is "Tip of the day", and a repeat five
 * weeks later reads as one rather than as tip 3 for the second time.
 *
 * Every third tip carries a short, clearly labelled note about Eric Connor Web
 * Design, his other company (see STUDIO below). It is separated by a rule and
 * says what it is. Do not disguise it as advice: what makes these emails work
 * is that they are useful and ask for nothing.
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
      subject: 'Tip of the day: an estimate in two minutes',
      lines: [
        'Hi, Eric here. Every other morning I’ll send one short how-to for one thing in LevelWorks. Two minutes to read, and you’ll know that feature cold. Here’s the first.',
        '<b>Write an estimate on your phone</b>',
        '1. Open LevelWorks and tap <b>New estimate</b>.<br>2. Type the client’s name. If you’ve used them before, they pop up; tap to fill the rest.<br>3. Give the job a name, like “Master bath remodel”.<br>4. Describe the first line of work, set the quantity and the rate. Tap <b>Add another item</b> for the next one.<br>5. Need money up front? Put it in <b>Deposit</b> at the bottom and the balance works itself out.<br>6. Tap <b>Preview</b> to see exactly what the client will see, or <b>Save</b> to finish later.',
        'That’s it. Next time: sending it, and how the client signs from their couch.',
      ],
    },
    es: {
      subject: 'Tip del día: un presupuesto en dos minutos',
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
      subject: 'Tip of the day: send it by text, get it signed',
      lines: [
        '<b>Send an estimate and get a signature</b>',
        '1. Open the estimate and tap <b>Send to client</b>.<br>2. Pick <b>Text it</b>. On your phone, your Messages app opens with the client already addressed and the link in the message. Tap send. (Or pick <b>Email it</b> and we send it for you.)<br>3. The client opens the link on their phone, sees the estimate with your name and logo, and signs with their finger. No account, no app, no password.<br>4. The moment they sign, the estimate turns <b>Approved</b> in your list, with their name and the time on it.',
        'Sending from your own number means they can text you back like they always do. Next time: turning the approved estimate into an invoice and getting paid by card.',
      ],
    },
    es: {
      subject: 'Tip del día: envíalo por mensaje y que lo firmen',
      lines: [
        '<b>Envía un presupuesto y consigue la firma</b>',
        '1. Abre el presupuesto y toca <b>Enviar al cliente</b>.<br>2. Elige <b>Por mensaje</b>. En tu teléfono se abre tu app de mensajes con el cliente ya puesto y el enlace en el texto. Toca enviar. (O elige <b>Por correo</b> y lo mandamos nosotros.)<br>3. El cliente abre el enlace en su teléfono, ve el presupuesto con tu nombre y tu logo, y firma con el dedo. Sin cuenta, sin app, sin contraseña.<br>4. En cuanto firma, el presupuesto aparece como <b>Aprobado</b> en tu lista, con su nombre y la hora.',
        'Como lo mandas desde tu propio número, te puede contestar como siempre. La próxima: convertir el presupuesto aprobado en factura y cobrar con tarjeta.',
      ],
    },
  },
  {
    en: {
      subject: 'Tip of the day: from estimate to paid invoice',
      lines: [
        '<b>Turn the estimate into an invoice and get paid by card</b>',
        'One-time setup first: on <b>Dashboard</b>, tap <b>Set up payments</b>. It walks you through connecting your bank with Stripe. Takes about five minutes and you only do it once.',
        '1. Open the approved estimate and tap <b>Convert to invoice</b>. Every line carries over.<br>2. Check the due date, add a note if you want, and send it the same way: text or email.<br>3. The client opens the link and pays with a card right there. The money goes to your bank, and the invoice marks itself <b>Paid</b>.',
        'If they pay you cash or check, open the invoice and record the payment by hand so your books stay right. Next time: showing one total instead of every line price.',
      ],
    },
    es: {
      subject: 'Tip del día: del presupuesto a la factura pagada',
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
      subject: 'Tip of the day: one total, no line prices',
      lines: [
        '<b>Show the client one price for the whole job</b>',
        'A lot of contractors quote lump sum: a priced line invites the client to shop it or cut it. LevelWorks can hide line prices for you.',
        '1. Open the estimate and scroll to the totals box at the bottom.<br>2. Switch off <b>Show line prices</b>.<br>3. Tap <b>Preview</b>. The client’s copy now shows your descriptions and one total. Deposit and balance still show.',
        'You still see every price on your side, and the setting carries over to the invoice. The app remembers your choice for the next estimate. And a line with no price never shows “$0.00” anymore. Next time: your logo.',
      ],
    },
    es: {
      subject: 'Tip del día: un solo total, sin precios por partida',
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
      subject: 'Tip of the day: your logo on everything',
      lines: [
        '<b>Put your logo on every estimate and invoice</b>',
        '1. Tap <b>More</b>, then <b>Account</b>.<br>2. On the <b>Profile</b> tab, tap <b>Upload logo</b> and pick a PNG or JPG from your phone. A photo of your truck door works fine if that’s what you have.<br>3. While you’re there, check your company name, phone and address. That block prints at the top of everything you send.',
        'From then on every estimate, invoice and client page carries it. Next time: sending the client photos from the job.',
      ],
    },
    es: {
      subject: 'Tip del día: tu logo en todo',
      lines: [
        '<b>Pon tu logo en cada presupuesto y factura</b>',
        '1. Toca <b>Más</b> y luego <b>Cuenta</b>.<br>2. En la pestaña <b>Perfil</b>, toca <b>Subir el logotipo</b> y elige un PNG o JPG de tu teléfono. Una foto de la puerta de tu camioneta sirve si es lo que tienes.<br>3. Ya que estás ahí, revisa el nombre de tu empresa, tu teléfono y tu dirección. Ese bloque sale arriba de todo lo que envías.',
        'Desde ese momento cada presupuesto, factura y página del cliente lo lleva. La próxima: mandarle al cliente fotos desde la obra.',
      ],
    },
  },
  {
    en: {
      subject: 'Tip of the day: photo updates from the job',
      lines: [
        '<b>Send the client progress photos with one link</b>',
        'Clients who see progress don’t call to ask about it, and they pay faster.',
        '1. Tap <b>Photos</b>, then <b>New update</b>.<br>2. Name it (“Week 2 progress”), write two lines about where things stand, and add photos straight from your camera.<br>3. Tap <b>Send this update</b> and send the link by text or email, same as an estimate.',
        'The client gets a clean page with your photos and your note. Next time: Spanish, and translating what you typed.',
      ],
    },
    es: {
      subject: 'Tip del día: fotos de avance desde la obra',
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
      subject: 'Tip of the day: English and Spanish',
      lines: [
        '<b>Work in one language, send in the other</b>',
        '1. The flag at the top of every screen switches the whole app between English and Spanish. Tap it, pick, done.<br>2. Inside an estimate, tap <b>Translate to Spanish</b> (or <b>Translate to English</b>). You see your original beside the translation and approve it before anything changes.<br>3. Your own words stay as you wrote them. The client’s copy is the translation.',
        'Numbers, measurements and brand names never change in translation. Next time: recurring billing for maintenance jobs.',
      ],
    },
    es: {
      subject: 'Tip del día: español e inglés',
      lines: [
        '<b>Trabaja en un idioma, envía en el otro</b>',
        '1. La bandera arriba de cada pantalla cambia toda la app entre español e inglés. Tócala, elige, listo.<br>2. Dentro de un presupuesto, toca <b>Traducir al inglés</b> (o <b>Traducir al español</b>). Ves tu original junto a la traducción y la apruebas antes de que cambie nada.<br>3. Tus palabras se quedan como las escribiste. La copia del cliente es la traducción.',
        'Los números, las medidas y las marcas nunca cambian al traducir. La próxima: cobros recurrentes para trabajos de mantenimiento.',
      ],
    },
  },
  {
    en: {
      subject: 'Tip of the day: bill the same client every month, automatically',
      lines: [
        '<b>Recurring billing for maintenance work</b>',
        'Lawn, snow, HVAC service, pool, cleaning: anything you do on a schedule can be charged on a schedule.',
        '1. Tap <b>Clients</b> and open the client. Make sure they have an email address on file.<br>2. Under <b>Recurring billing</b>, tap <b>Set up a schedule</b>.<br>3. Enter the amount and pick how often: monthly, every 2 months, quarterly, every 6 months, or yearly.<br>4. Enter the client’s card once, right there on your phone. They can read it to you or hand it over; Stripe stores it, we never see it. After that the charge runs itself and the money lands in your bank.',
        'You need card payments set up first (the one about card payments). That’s the series so far. Reply to any of these and tell me what to cover next.',
      ],
    },
    es: {
      subject: 'Tip del día: cóbrale al mismo cliente cada mes, en automático',
      lines: [
        '<b>Cobro recurrente para trabajos de mantenimiento</b>',
        'Jardín, nieve, servicio de aire acondicionado, alberca, limpieza: todo lo que haces con calendario se puede cobrar con calendario.',
        '1. Toca <b>Clientes</b> y abre al cliente. Asegúrate de que tenga un correo registrado.<br>2. En <b>Cobro recurrente</b>, toca <b>Configura un plan de cobro</b>.<br>3. Pon el monto y elige cada cuánto: mensual, cada 2 meses, trimestral, cada 6 meses o anual.<br>4. Registra la tarjeta del cliente una sola vez, ahí mismo en tu teléfono. Te la puede dictar o prestar; la guarda Stripe, nosotros nunca la vemos. Después el cobro corre solo y el dinero llega a tu banco.',
        'Necesitas tener los pagos con tarjeta configurados (the one about card payments). Responde a cualquiera de estos correos y dime qué quieres que explique después.',
      ],
    },
  },
  {
    en: {
      subject: 'Tip of the day: never type the same estimate twice',
      lines: [
        'Hi, Eric here. Two minutes, one thing you can use today.',
        '<b>Duplicate an estimate</b>',
        '1. Open <b>Estimates</b> and find one close to the job you are pricing.<br>2. Tap <b>Duplicate</b> on the row.<br>3. It opens with the same lines, prices, tax and deposit, and no client on it.<br>4. Change what is different, put the new client on, and save. The old one is untouched.',
        'If you quote the same kind of job over and over, this is your template. Build one good version of a roof, a bathroom, a service call, and duplicate it forever.',
      ],
    },
    es: {
      subject: 'Tip del día: nunca escribas el mismo presupuesto dos veces',
      lines: [
        'Hola, soy Eric. Dos minutos, una sola cosa que puedes usar hoy.',
        '<b>Duplica un presupuesto</b>',
        '1. Abre <b>Presupuestos</b> y busca uno parecido al trabajo que estás cotizando.<br>2. Toca <b>Duplicar</b> en el renglón.<br>3. Se abre con las mismas partidas, precios, impuesto y anticipo, y sin cliente.<br>4. Cambia lo que sea distinto, pon al cliente nuevo y guarda. El original no se toca.',
        'Si cotizas el mismo tipo de trabajo una y otra vez, esta es tu plantilla. Arma una buena versión de un techo, un baño o una visita de servicio, y duplícala siempre.',
      ],
    },
  },
  {
    en: {
      subject: 'Tip of the day: write the invoice now, send it when you get paid',
      lines: [
        'Hi, Eric here. This one came straight from a roofer and it is new this week.',
        '<b>Save an invoice without sending it</b>',
        '1. Tap <b>New invoice</b> and fill it in while the crew is still working.<br>2. Tap <b>Save</b> instead of <b>Send to client</b>. It closes and waits for you.<br>3. When the cheque is in your hand, open <b>Invoices</b> and tap <b>Mark paid</b>.<br>4. Now tap <b>Send</b>. The customer gets one email and it already says paid.',
        'Before this you had to send it, mark it paid, then send it again, and your customer got the same invoice twice. Now it goes out once, as a receipt.',
      ],
    },
    es: {
      subject: 'Tip del día: escribe la factura ahora, mándala cuando te paguen',
      lines: [
        'Hola, soy Eric. Este me lo pidió un techador y es nuevo de esta semana.',
        '<b>Guarda una factura sin enviarla</b>',
        '1. Toca <b>Nueva factura</b> y llénala mientras el equipo sigue trabajando.<br>2. Toca <b>Guardar</b> en vez de <b>Enviar al cliente</b>. Se cierra y ahí te espera.<br>3. Cuando tengas el cheque en la mano, abre <b>Facturas</b> y toca <b>Marcar pagada</b>.<br>4. Ahora toca <b>Enviar</b>. El cliente recibe un solo correo y ya dice pagada.',
        'Antes había que enviarla, marcarla pagada y volver a enviarla, y el cliente recibía la misma factura dos veces. Ahora sale una sola vez, como recibo.',
      ],
    },
  },
  {
    en: {
      subject: 'Tip of the day: fix an invoice without starting over',
      lines: [
        'Hi, Eric here. Two minutes.',
        '<b>Reopen an invoice and change it</b>',
        '1. Open <b>Invoices</b> and tap <b>Edit</b> on the one you need to fix.<br>2. Change any line, any price, the tax, the due date.<br>3. Tap <b>Save</b>. The client link updates itself, so anyone holding it sees the corrected version.',
        'The case I hear most: the estimate said plywood as needed, because nobody knows the count until the roof is stripped. Now you put the real number on the invoice. If money has already been paid against it, what is still owed recalculates on its own.',
      ],
    },
    es: {
      subject: 'Tip del día: corrige una factura sin empezar de cero',
      lines: [
        'Hola, soy Eric. Dos minutos.',
        '<b>Vuelve a abrir una factura y cámbiala</b>',
        '1. Abre <b>Facturas</b> y toca <b>Editar</b> en la que necesitas corregir.<br>2. Cambia la partida que sea, el precio, el impuesto, la fecha de vencimiento.<br>3. Toca <b>Guardar</b>. El enlace del cliente se actualiza solo, así que quien lo tenga ve la versión corregida.',
        'El caso que más me cuentan: el presupuesto decía madera la que se necesite, porque nadie sabe cuánta hasta que se destapa el techo. Ahora pones el número real en la factura. Si ya te pagaron algo, el saldo se recalcula solo.',
      ],
    },
  },
  {
    en: {
      subject: 'Tip of the day: stop paying card fees on big jobs',
      lines: [
        'Hi, Eric here. This one is worth real money on a big ticket.',
        '<b>Let the customer pay by bank transfer</b>',
        '1. In the invoice, look at the totals panel for <b>How they can pay</b>.<br>2. Choose <b>Card</b>, <b>Bank</b>, or <b>Both</b>. The fee for that exact invoice shows underneath.<br>3. Save and send as usual. The customer sees only what you allowed.',
        'A card costs about 2.9% plus 30 cents. A bank transfer is capped at $5 no matter the size. On a $20,000 roof that is roughly $580 against $5. LevelWorks takes nothing either way. Bank transfers take about four business days to clear, and the invoice tells you and the customer exactly where it stands.',
      ],
    },
    es: {
      subject: 'Tip del día: deja de pagar comisiones de tarjeta en trabajos grandes',
      lines: [
        'Hola, soy Eric. Este te ahorra dinero de verdad en un trabajo grande.',
        '<b>Deja que el cliente pague por transferencia bancaria</b>',
        '1. En la factura, busca en el panel de totales <b>Cómo pueden pagar</b>.<br>2. Elige <b>Tarjeta</b>, <b>Banco</b> o <b>Ambos</b>. La comisión de esa factura aparece abajo.<br>3. Guarda y envía como siempre. El cliente solo ve lo que tú permitiste.',
        'Una tarjeta cuesta cerca del 2.9% más 30 centavos. Una transferencia tiene tope de $5, no importa el monto. En un techo de $20,000 son unos $580 contra $5. LevelWorks no cobra nada en ninguno de los dos. La transferencia tarda unos cuatro días hábiles y la factura les dice a los dos cómo va.',
      ],
    },
  },
  {
    en: {
      subject: 'Tip of the day: get paid half of it before you start',
      lines: [
        'Hi, Eric here. Two minutes.',
        '<b>Ask for a deposit on the estimate</b>',
        '1. Build the estimate as normal.<br>2. At the bottom, put an amount in <b>Deposit</b>.<br>3. The client\'s copy then shows the total, the deposit, and the balance due, worked out for them.',
        'A deposit stated on the document is a different conversation from a deposit asked for on the phone. It reads as how you work, not as a favour. Check your state\'s rules on how much you may ask for before the job starts.',
      ],
    },
    es: {
      subject: 'Tip del día: cobra una parte antes de empezar',
      lines: [
        'Hola, soy Eric. Dos minutos.',
        '<b>Pide un anticipo en el presupuesto</b>',
        '1. Arma el presupuesto normal.<br>2. Abajo, pon una cantidad en <b>Anticipo</b>.<br>3. La copia del cliente muestra el total, el anticipo y el saldo, ya calculado.',
        'Un anticipo escrito en el documento es una conversación distinta a pedirlo por teléfono. Se lee como tu forma de trabajar, no como un favor. Revisa las reglas de tu estado sobre cuánto puedes pedir antes de empezar.',
      ],
    },
  },
  {
    en: {
      subject: 'Tip of the day: keep the client\'s details once, use them forever',
      lines: [
        'Hi, Eric here. Small one, saves you typing all year.',
        '<b>Your client list</b>',
        '1. Tap <b>Clients</b> to see everyone you have worked for.<br>2. Open one to see their email, phone and address, and what you have quoted them.<br>3. Next time you start an estimate, type the first letters of their name and tap them. Everything fills in, address included.',
        'The address matters more than it looks: it prints on the estimate and the invoice, which is what makes the document read like a contract rather than a note.',
      ],
    },
    es: {
      subject: 'Tip del día: guarda los datos del cliente una vez y úsalos siempre',
      lines: [
        'Hola, soy Eric. Cortito, y te ahorra escribir todo el año.',
        '<b>Tu lista de clientes</b>',
        '1. Toca <b>Clientes</b> para ver a todos para los que has trabajado.<br>2. Abre uno y verás su correo, teléfono y dirección, y lo que le has cotizado.<br>3. La próxima vez que empieces un presupuesto, escribe las primeras letras de su nombre y tócalo. Todo se llena solo, con dirección incluida.',
        'La dirección importa más de lo que parece: se imprime en el presupuesto y en la factura, y eso hace que el documento se lea como un contrato y no como una nota.',
      ],
    },
  },
  {
    en: {
      subject: 'Tip of the day: the notebook that stays yours',
      lines: [
        'Hi, Eric here. Two minutes.',
        '<b>Private notes</b>',
        '1. Tap <b>Notes</b>.<br>2. Write whatever you would write on the back of a business card. What the gate code is. Which supplier had the tile. What the homeowner is really worried about.<br>3. Search them later by any word in the note.',
        'Nobody sees these but you. No client, ever. That is why there is no translate button on them and no share link.',
      ],
    },
    es: {
      subject: 'Tip del día: la libreta que es solo tuya',
      lines: [
        'Hola, soy Eric. Dos minutos.',
        '<b>Notas privadas</b>',
        '1. Toca <b>Notas</b>.<br>2. Escribe lo que escribirías atrás de una tarjeta. El código del portón. Qué proveedor tenía el azulejo. Qué es lo que de verdad le preocupa al dueño.<br>3. Después las buscas por cualquier palabra de la nota.',
        'Nadie ve esto más que tú. Ningún cliente, nunca. Por eso no tienen botón de traducir ni enlace para compartir.',
      ],
    },
  },
  {
    en: {
      subject: 'Tip of the day: put LevelWorks on your home screen',
      lines: [
        'Hi, Eric here. Takes ten seconds and it changes how often you use it.',
        '<b>Add the app to your phone</b>',
        '1. On Android or a laptop, open LevelWorks and tap <b>Add to phone</b>. One tap, no dialog.<br>2. On an iPhone you must be in <b>Safari</b>, not Chrome. Tap the share button, then scroll down to <b>"Add to Home Screen"</b>.',
        'Two reasons it is worth it. It opens like an app instead of a bookmark, and an installed app keeps you signed in. A site you only visit in Safari can log you out after about a week, because Apple clears storage. Installed, it does not.',
      ],
    },
    es: {
      subject: 'Tip del día: pon LevelWorks en la pantalla de inicio',
      lines: [
        'Hola, soy Eric. Son diez segundos y cambia qué tanto lo usas.',
        '<b>Agrega la app a tu teléfono</b>',
        '1. En Android o en una laptop, abre LevelWorks y toca <b>Agregar al teléfono</b>. Un toque, sin ventanas.<br>2. En iPhone tienes que estar en <b>Safari</b>, no en Chrome. Toca el botón de compartir y baja hasta <b>"Add to Home Screen"</b>.',
        'Dos razones. Se abre como app y no como marcador, y una app instalada te mantiene con la sesión abierta. Un sitio que solo visitas en Safari te puede cerrar la sesión como a la semana, porque Apple borra el almacenamiento. Instalada, no.',
      ],
    },
  },
  {
    en: {
      subject: 'Tip of the day: send the link, skip the email',
      lines: [
        'Hi, Eric here. Two minutes.',
        '<b>Copy the link and send it your own way</b>',
        '1. On any estimate or invoice, tap <b>Copy link</b>.<br>2. Paste it into a text, WhatsApp, wherever you already talk to that customer.<br>3. They open it on their phone, no app, no login, no account.',
        'A text gets opened. An email from a company they do not recognise often does not. The link is the same document either way, and they can sign or pay straight from it.',
      ],
    },
    es: {
      subject: 'Tip del día: manda el enlace y olvídate del correo',
      lines: [
        'Hola, soy Eric. Dos minutos.',
        '<b>Copia el enlace y mándalo a tu manera</b>',
        '1. En cualquier presupuesto o factura, toca <b>Copiar enlace</b>.<br>2. Pégalo en un mensaje, en WhatsApp, donde ya hablas con ese cliente.<br>3. Lo abre en su teléfono, sin app, sin contraseña, sin cuenta.',
        'Un mensaje de texto se abre. Un correo de una empresa que no reconocen, muchas veces no. El enlace es el mismo documento y desde ahí pueden firmar o pagar.',
      ],
    },
  },
  {
    en: {
      subject: 'Tip of the day: take part of the money now',
      lines: [
        'Hi, Eric here. Last one for a while on invoices.',
        '<b>Record a partial payment</b>',
        '1. Open <b>Invoices</b> and tap the invoice.<br>2. Tap <b>Record payment</b> and put in what you actually received, cash or cheque included.<br>3. The invoice moves to partly paid and shows the balance still owed.',
        'Use <b>Mark as paid</b> only when it is settled in full. Recording the real amounts as they come in means the list always tells you the truth about who still owes you what.',
      ],
    },
    es: {
      subject: 'Tip del día: registra lo que ya te pagaron',
      lines: [
        'Hola, soy Eric. El último por ahora sobre facturas.',
        '<b>Registra un pago parcial</b>',
        '1. Abre <b>Facturas</b> y toca la factura.<br>2. Toca <b>Registrar pago</b> y pon lo que de verdad recibiste, incluido efectivo o cheque.<br>3. La factura pasa a parcialmente pagada y muestra el saldo.',
        'Usa <b>Marcar como pagada</b> solo cuando esté saldada por completo. Si registras los montos reales conforme llegan, la lista siempre te dice la verdad de quién te debe qué.',
      ],
    },
  },
];

const strip = (h) => String(h).replace(/<br>/g, '\n').replace(/<[^>]+>/g, '');

/**
 * Eric's other business, on every third tip.
 *
 * He asked for this to be slipped in. It is not slipped in: it sits at the
 * bottom, separated by a rule, and says plainly that it is his other company.
 * A promotion dressed up as advice would cost him the thing that makes these
 * emails work, which is that they are useful and ask for nothing. Labelled and
 * occasional also happens to sell better than disguised and constant.
 *
 * Every third tip, so roughly once a week rather than every other morning, and
 * the wording rotates so it never reads as the same boilerplate twice.
 */
const STUDIO = {
  en: [
    'One more thing, and then back to the tools. Besides LevelWorks I run <b>Eric Connor Web Design</b> out of Wyncote. We build websites and custom apps for trades businesses, the kind that actually ring the phone. If yours is doing nothing for you, have a look at <a href="https://ecwd1.com">ecwd1.com</a> or call (267) 971-8425.',
    'From my other desk. <b>Eric Connor Web Design</b> also sets up AI agents that answer calls and messages, so a job does not go to whoever picked up first. Websites and business apps too. <a href="https://ecwd1.com">ecwd1.com</a>, (267) 971-8425.',
    'Once in a while I mention the other thing I do. My studio, <b>Eric Connor Web Design</b>, builds the website and the back office for contractors, and the same number answers when you call. <a href="https://ecwd1.com">ecwd1.com</a>, (267) 971-8425.',
    'If your website still looks like 2011, that is the other half of my week. <b>Eric Connor Web Design</b>, Wyncote PA. Sites, custom apps, AI that picks up the phone. <a href="https://ecwd1.com">ecwd1.com</a>.',
  ],
  es: [
    'Una cosa más y volvemos a las herramientas. Además de LevelWorks tengo <b>Eric Connor Web Design</b>, en Wyncote. Hacemos sitios web y apps a la medida para negocios de oficios, de los que sí hacen sonar el teléfono. Si el tuyo no te está sirviendo, mira <a href="https://ecwd1.com">ecwd1.com</a> o llama al (267) 971-8425.',
    'Desde mi otro escritorio. <b>Eric Connor Web Design</b> también instala agentes de inteligencia artificial que contestan llamadas y mensajes, para que un trabajo no se lo lleve el que contestó primero. También sitios web y apps. <a href="https://ecwd1.com">ecwd1.com</a>, (267) 971-8425.',
    'De vez en cuando menciono lo otro que hago. Mi estudio, <b>Eric Connor Web Design</b>, arma el sitio web y la parte administrativa para contratistas, y contesta el mismo número. <a href="https://ecwd1.com">ecwd1.com</a>, (267) 971-8425.',
    'Si tu sitio web todavía parece de 2011, esa es la otra mitad de mi semana. <b>Eric Connor Web Design</b>, Wyncote PA. Sitios, apps a la medida e inteligencia artificial que contesta el teléfono. <a href="https://ecwd1.com">ecwd1.com</a>.',
  ],
};

const studioNote = (n, lang) => {
  if (n % 3 !== 0) return null;
  const set = STUDIO[lang === 'es' ? 'es' : 'en'];
  const pick = set[Math.floor((n - 1) / 3) % set.length];
  return `<span style="display:block;border-top:1px solid #e6e9ef;padding-top:14px;color:#5b6472;font-size:14px">${pick}</span>`;
};

/** The email for tip `n` (1-based) in a language, ready for sendMail. */
export function tipMail(n, lang) {
  const tip = TIPS[n - 1]; if (!tip) return null;
  const c = tip[lang === 'es' ? 'es' : 'en'];
  const cta = lang === 'es' ? 'Abrir LevelWorks' : 'Open LevelWorks';
  const note = studioNote(n, lang);
  const lines = note ? [...c.lines, note] : c.lines;
  const html = layout({ lang, lines, cta, ctaUrl: APP, unsubscribe: true });
  const text = lines.map(strip).join('\n\n') + `\n\n${cta}: ${APP}\n\nEric\n\n${lang === 'es' ? 'Cancelar suscripción' : 'Unsubscribe'}: {{{RESEND_UNSUBSCRIBE_URL}}}`;
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
    // No end. Eric: "I want this thing to just keep going forever until I say
    // stop." Past the last tip it wraps to the first, so the email never goes
    // quiet on a member who has been here a while. tip_stage keeps counting up
    // so the cadence and the catch-up logic are unchanged; only the tip it
    // picks wraps. With 18 tips at every other morning a repeat comes round
    // about every five weeks, which is why the subjects no longer carry a
    // number: it reads as the tip of the day, not as tip 3 again.
    const gap = meta.observer && stage < crowd ? CATCHUP_HOURS : GAP_HOURS;
    if (meta.tip_at && now - new Date(meta.tip_at).getTime() < gap * 3600 * 1000) continue;
    const n = (stage % TIPS.length) + 1; const lang = langOf(u);
    const m = tipMail(n, lang);
    if (!dry) {
      try {
        await sendMail({ to: email, ...m, unsubscribe: lang });
        const { error } = await a.auth.admin.updateUserById(u.id, { app_metadata: { ...meta, tip_stage: stage + 1, tip_at: new Date(now).toISOString() } });
        if (error) report.errors.push(`tip stage ${email}: ${error.message}`);
      } catch (e) { report.errors.push(`tip ${n} ${email}: ${e.message}`); continue; }
      await new Promise(s => setTimeout(s, 550));   // Resend allows 2 requests a second
    }
    report.sent.push({ email, n, stage: stage + 1, lang });
    budget--;
  }
  return report;
}
