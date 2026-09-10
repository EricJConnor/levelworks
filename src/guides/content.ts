/**
 * The guides: real answers to what a contractor types into Google.
 *
 * These are the site's search pages. A homepage never ranks for "how to write
 * an estimate" or "cuánto anticipo pedir"; a guide does, and every guide
 * carries the $5 offer. They are prerendered at build time
 * (scripts/prerender.mjs) so Google and link previews get finished HTML, in
 * the right language, on the first byte — the same trick as /es.
 *
 * Rules for the writing, in both languages:
 * - Plain contractor language. Sentence case. No exclamation marks.
 * - Facts a contractor could act on and get wrong (deposit caps, codes) are
 *   dated and say "check your state". Laws change; this file does not know.
 * - The only pricing that may appear is $5 a month with a 30-day free trial.
 * - Spanish is neutral Latin American, "tú". presupuesto, factura, anticipo,
 *   partida, obra. "estimado" appears only where a person would type it into
 *   Google; on the document the word is presupuesto.
 *
 * Each guide has an English and a Spanish slug — a translated URL ranks for
 * the translated search — and the two are linked by hreflang in the head.
 */

export type Lang = 'en' | 'es';

export interface Block {
  /** Section heading (h2). */
  h?: string;
  /** Paragraphs. */
  p?: string[];
  /** Bulleted list. */
  list?: string[];
  /** Numbered steps. */
  steps?: string[];
  /** One highlighted line, for the thing that saves them money or trouble. */
  tip?: string;
}

export interface GuideText {
  slug: string;
  /** Browser tab and search result title. Under 60 characters where possible. */
  title: string;
  /** Search result description. Under 160 characters. */
  description: string;
  /** On-page headline. Can be longer than the title. */
  h1: string;
  intro: string;
  blocks: Block[];
  faq: { q: string; a: string }[];
}

export interface Guide {
  id: string;
  /** ISO date of the last substantive edit. Shown on the page and in the sitemap. */
  updated: string;
  en: GuideText;
  es: GuideText;
}

export const GUIDES: Guide[] = [
  // ------------------------------------------------------------------
  {
    id: 'write-estimate',
    updated: '2026-09-10',
    en: {
      slug: 'how-to-write-a-contractor-estimate',
      title: 'How to write a contractor estimate that gets signed',
      description: 'What goes on a contractor estimate, in what order, and the mistakes that cost you the job. A working contractor\'s checklist, with an example.',
      h1: 'How to write a contractor estimate that gets signed',
      intro: 'A good estimate does two jobs. It tells the client exactly what they get for their money, and it protects you when the job changes. Most estimates that lose work fail at the first. Most that lose money fail at the second. Here is what goes on one and why.',
      blocks: [
        {
          h: 'What an estimate has to include',
          p: ['Every estimate, whatever the trade, needs these on it. Skip one and you will be answering questions instead of starting work.'],
          list: [
            'Your business name, phone, email and license number if your state issues one.',
            'The client\'s name, the job address and the date.',
            'A short description of the job in one or two sentences. "Replace rear deck, 12 by 16, pressure-treated frame with composite decking and rail."',
            'Line items: what you are doing, how much of it, and what each line costs. One line per piece of work or material, not one line for the whole job.',
            'Subtotal, tax if you charge it, and the total.',
            'The deposit you need to start and when the balance is due.',
            'How long the price is good for. Thirty days is normal. Material prices move.',
            'What is not included. Permits, haul-away, painting, anything the client might assume.',
            'A place to sign.',
          ],
        },
        {
          h: 'Line items: the part that wins or loses the job',
          p: [
            'A client comparing three estimates cannot tell which one is honest. They can tell which one they understand. The estimate with "Bathroom remodel, $14,500" loses to the one that lists demo, plumbing, tile, fixtures and paint with a number next to each, even when it is the same price.',
            'Write each line as work, quantity and rate. "Install tile, 120 sq ft, $9/sq ft" says more than "Tile $1,080". It also makes the change order easy later: if the bathroom turns out to be 140 square feet, the client already knows what the extra 20 cost.',
            'Group the lines under headings when the job has stages. Demo, rough-in, finish. It reads like a plan, and a plan is what they are buying.',
          ],
          tip: 'Put the thing the client cares most about at the top. If they called about the leak, the first line fixes the leak.',
        },
        {
          h: 'Pricing the lines',
          p: [
            'Materials at what they cost you plus your markup, labor at your day or hourly rate times the time it actually takes, and a line for the things every job needs that nobody bids: dump runs, fuel, the trip back for a part. Contractors who leave that off pay for it out of the profit.',
            'Do not price by feel. If you have done a similar job, use those numbers. If you have not, price the materials from the supply house that day, not from memory.',
          ],
        },
        {
          h: 'The deposit and the payment schedule',
          p: [
            'Say what you need to start and when the rest is due. For a small job, a deposit and the balance on completion. For a larger one, a deposit, a payment at a milestone and the balance at the end. Some states cap the deposit on home improvement work, so check yours before you write a number.',
          ],
        },
        {
          h: 'What to leave off',
          p: [
            'Your hourly rate as a bare number. Your cost of materials. Anything that invites the client to negotiate a line instead of the job. The estimate shows what each piece of work costs them, not what it costs you.',
          ],
        },
        {
          h: 'Send it the same day',
          p: [
            'The estimate that arrives that evening gets signed. The one that arrives Thursday competes with two others. Write it on your phone at the job, send it by text or email with a link they can sign on their screen, and follow up in two days if you have not heard back.',
          ],
        },
      ],
      faq: [
        { q: 'Is an estimate a contract?', a: 'Once the client signs it and you both act on it, in most states it is treated as one. That is why the scope, the exclusions and the payment terms belong on it. A quote you never had signed is much harder to enforce.' },
        { q: 'Should I charge for estimates?', a: 'For most residential work, no. Clients expect a free estimate and your competitors give one. For work that takes real design time, a paid consultation credited against the job is fair and clients accept it when you say so up front.' },
        { q: 'How long should an estimate be valid?', a: 'Thirty days is standard. Shorter if material prices are moving, which they usually are. Write the date on it.' },
      ],
    },
    es: {
      slug: 'como-hacer-un-presupuesto-de-construccion',
      title: 'Cómo hacer un presupuesto de construcción que el cliente firme',
      description: 'Qué lleva un presupuesto de contratista, en qué orden, y los errores que te cuestan el trabajo. La lista de un contratista que trabaja, con ejemplo.',
      h1: 'Cómo hacer un presupuesto de construcción que el cliente firme',
      intro: 'Un buen presupuesto hace dos cosas. Le dice al cliente exactamente qué recibe por su dinero, y te protege cuando el trabajo cambia. La mayoría de los presupuestos que pierden trabajos fallan en lo primero. La mayoría de los que pierden dinero fallan en lo segundo. Esto es lo que lleva uno y por qué. Si buscabas cómo hacer un estimado para un cliente, es lo mismo: en el documento se llama presupuesto.',
      blocks: [
        {
          h: 'Qué tiene que llevar un presupuesto',
          p: ['Todo presupuesto, sea el oficio que sea, necesita esto. Si falta algo, vas a estar contestando preguntas en vez de empezando la obra.'],
          list: [
            'El nombre de tu negocio, teléfono, correo y número de licencia si tu estado lo da.',
            'El nombre del cliente, la dirección de la obra y la fecha.',
            'Una descripción corta del trabajo en una o dos frases. "Reemplazar terraza trasera, 12 por 16, estructura de madera tratada con piso y baranda de material compuesto."',
            'Partidas: qué vas a hacer, cuánto, y cuánto cuesta cada línea. Una partida por cada trabajo o material, no una sola línea para toda la obra.',
            'Subtotal, impuesto si lo cobras, y el total.',
            'El anticipo que necesitas para empezar y cuándo se paga el resto.',
            'Hasta cuándo vale el precio. Treinta días es lo normal. Los materiales suben.',
            'Qué no está incluido. Permisos, retiro de escombro, pintura, cualquier cosa que el cliente pueda dar por hecha.',
            'Un lugar para firmar.',
          ],
        },
        {
          h: 'Las partidas: donde se gana o se pierde el trabajo',
          p: [
            'Un cliente que compara tres presupuestos no sabe cuál es el honesto. Sí sabe cuál entiende. El presupuesto que dice "Remodelación de baño, $14,500" pierde contra el que enlista demolición, plomería, azulejo, muebles y pintura con un número al lado de cada uno, aunque sea el mismo precio.',
            'Escribe cada partida como trabajo, cantidad y precio. "Instalar azulejo, 120 pies cuadrados, $9 por pie" dice más que "Azulejo $1,080". También te facilita el cambio después: si el baño resulta de 140 pies, el cliente ya sabe cuánto cuestan los 20 de más.',
            'Agrupa las partidas con títulos cuando la obra tiene etapas. Demolición, instalación, acabados. Se lee como un plan, y un plan es lo que están comprando.',
          ],
          tip: 'Pon arriba lo que más le importa al cliente. Si te llamó por la fuga, la primera partida arregla la fuga.',
        },
        {
          h: 'Cómo ponerle precio a las partidas',
          p: [
            'Materiales a lo que te cuestan más tu margen, mano de obra a tu tarifa por día u hora por el tiempo que de verdad toma, y una partida para lo que toda obra necesita y nadie cotiza: viajes al basurero, gasolina, la vuelta por una pieza. El contratista que no lo pone lo paga de su ganancia.',
            'No pongas precios a ojo. Si has hecho un trabajo parecido, usa esos números. Si no, cotiza los materiales en la tienda ese mismo día, no de memoria.',
          ],
        },
        {
          h: 'El anticipo y el calendario de pagos',
          p: [
            'Di qué necesitas para empezar y cuándo se paga el resto. En un trabajo chico, un anticipo y el saldo al terminar. En uno grande, un anticipo, un pago a la mitad y el saldo al final. Algunos estados limitan el anticipo en trabajos de mejoras del hogar, así que revisa el tuyo antes de escribir un número.',
          ],
        },
        {
          h: 'Qué no poner',
          p: [
            'Tu tarifa por hora como número suelto. Lo que te cuestan los materiales. Cualquier cosa que invite al cliente a negociar una partida en vez de la obra. El presupuesto muestra lo que cada trabajo le cuesta a él, no lo que te cuesta a ti.',
          ],
        },
        {
          h: 'Mándalo el mismo día',
          p: [
            'El presupuesto que llega esa noche se firma. El que llega el jueves compite con otros dos. Hazlo en el teléfono en la misma obra, mándalo por mensaje o correo con un enlace que puedan firmar en su pantalla, y da seguimiento a los dos días si no han contestado.',
          ],
        },
      ],
      faq: [
        { q: '¿Un presupuesto es un contrato?', a: 'Una vez que el cliente lo firma y los dos actúan sobre él, en la mayoría de los estados se trata como uno. Por eso el alcance, las exclusiones y las condiciones de pago van en él. Una cotización que nunca se firmó es mucho más difícil de hacer valer.' },
        { q: '¿Debo cobrar por el presupuesto?', a: 'En la mayoría del trabajo residencial, no. El cliente espera un presupuesto gratis y tu competencia lo da. Para trabajo que requiere diseño de verdad, una consulta pagada que se descuenta de la obra es justa, y el cliente la acepta si se lo dices desde el principio.' },
        { q: '¿Cuánto tiempo debe valer un presupuesto?', a: 'Treinta días es lo normal. Menos si los materiales están subiendo, que casi siempre es el caso. Escribe la fecha.' },
      ],
    },
  },

  // ------------------------------------------------------------------
  {
    id: 'estimate-vs-invoice',
    updated: '2026-09-10',
    en: {
      slug: 'estimate-vs-invoice',
      title: 'Estimate vs invoice: the difference, and when to send each',
      description: 'An estimate is what the job will cost. An invoice is what the client owes now. When each one goes out, what changes between them, and how a quote and a bid fit in.',
      h1: 'Estimate vs invoice: the difference, and when to send each',
      intro: 'Contractors use the words loosely and clients get confused, usually at the moment money is involved. The short version: an estimate is a promise about the price before the work. An invoice is a request for payment after it, or after part of it.',
      blocks: [
        {
          h: 'The estimate',
          p: [
            'Goes out before the job. It lists the work, the price of each part and the total, and it asks for a signature. Once signed, it is your agreement on scope and price. It does not ask for money by itself, though it usually says what deposit you need to start.',
            'Quote and bid mean nearly the same thing in the trades. A quote is usually a firm price. A bid is a price submitted against others, on commercial or public work. An estimate can be either, and on residential work it is the word clients know.',
          ],
        },
        {
          h: 'The invoice',
          p: [
            'Goes out when money is due. It says what was done, what it costs, what has already been paid, and what is owed now, with a due date and a way to pay. You might send one invoice at the end of a small job, or several across a big one: the deposit, a progress payment, the balance.',
            'An invoice can differ from the estimate, and often should. The change orders the client approved, the extra square footage, the item they added on Tuesday all belong on the invoice. What does not belong is a surprise: anything on the invoice that was not on the estimate should have been agreed before the work was done.',
          ],
          tip: 'The easiest way to keep them in step is to build the invoice from the signed estimate rather than from scratch. Same lines, same numbers, plus what changed.',
        },
        {
          h: 'When to send each',
          steps: [
            'Look at the job. Send the estimate that day.',
            'The client signs. If you need a deposit, send the deposit invoice now, before you order material.',
            'Work. If the scope changes, write it down and get it approved before you do it.',
            'Finish. Walk the job with the client, then send the final invoice the same day, while the work is fresh and the client is happy.',
          ],
        },
        {
          h: 'What each one needs on it',
          list: [
            'Both: your business details, the client\'s, the job address, a date, line items and a total.',
            'Estimate: how long the price is good for, what is excluded, the deposit and payment terms, a signature line.',
            'Invoice: an invoice number, what has been paid, the balance due, the due date, and how to pay. A card link gets you paid faster than "check or Zelle".',
          ],
        },
      ],
      faq: [
        { q: 'Can I invoice more than the estimate?', a: 'Only for work the client agreed to after the estimate. Put each change on its own line so the client can see where the difference came from. Invoicing more than the signed estimate with no agreed change is how disputes start.' },
        { q: 'Do I need both for a small job?', a: 'For a one-day repair, many contractors send a single document that acts as both: the price up front, then marked paid when it is done. It works until the scope changes. Two documents cost nothing extra with an app and keep the record clean.' },
        { q: 'Is a signed estimate a contract?', a: 'In most states, once both sides act on it, yes. Bigger jobs usually deserve a separate written contract with the estimate attached as the scope and price.' },
      ],
    },
    es: {
      slug: 'presupuesto-vs-factura',
      title: 'Presupuesto vs factura: la diferencia y cuándo mandar cada uno',
      description: 'El presupuesto es lo que va a costar la obra. La factura es lo que el cliente debe ahora. Cuándo sale cada uno, qué cambia entre los dos y qué es una cotización.',
      h1: 'Presupuesto vs factura: la diferencia y cuándo mandar cada uno',
      intro: 'Los contratistas usan las palabras a la ligera y el cliente se confunde, casi siempre en el momento en que hay dinero de por medio. En corto: el presupuesto es una promesa sobre el precio antes del trabajo. La factura es un cobro después del trabajo, o de una parte.',
      blocks: [
        {
          h: 'El presupuesto',
          p: [
            'Sale antes de la obra. Enlista el trabajo, el precio de cada parte y el total, y pide una firma. Una vez firmado, es tu acuerdo sobre alcance y precio. Por sí solo no pide dinero, aunque normalmente dice qué anticipo necesitas para empezar.',
            'Cotización y estimado son casi lo mismo en los oficios. En Estados Unidos mucha gente busca "estimado" en Google porque viene del inglés; en el documento la palabra es presupuesto, y es la que el cliente entiende.',
          ],
        },
        {
          h: 'La factura',
          p: [
            'Sale cuando hay que pagar. Dice qué se hizo, cuánto cuesta, qué ya se pagó y qué se debe ahora, con fecha límite y una forma de pagar. Puedes mandar una sola factura al final de una obra chica, o varias en una grande: el anticipo, un pago de avance, el saldo.',
            'La factura puede ser diferente al presupuesto, y muchas veces debe serlo. Los cambios que el cliente aprobó, los pies cuadrados de más, lo que agregó el martes, todo eso va en la factura. Lo que no va es una sorpresa: cualquier cosa en la factura que no estaba en el presupuesto debió acordarse antes de hacerla.',
          ],
          tip: 'La forma más fácil de que coincidan es armar la factura a partir del presupuesto firmado, no desde cero. Mismas partidas, mismos números, más lo que cambió.',
        },
        {
          h: 'Cuándo mandar cada uno',
          steps: [
            'Ve la obra. Manda el presupuesto ese mismo día.',
            'El cliente firma. Si necesitas anticipo, manda la factura del anticipo ahora, antes de pedir material.',
            'Trabaja. Si el alcance cambia, escríbelo y que lo aprueben antes de hacerlo.',
            'Termina. Recorre la obra con el cliente y manda la factura final el mismo día, con el trabajo fresco y el cliente contento.',
          ],
        },
        {
          h: 'Qué lleva cada uno',
          list: [
            'Los dos: los datos de tu negocio, los del cliente, la dirección de la obra, fecha, partidas y total.',
            'Presupuesto: hasta cuándo vale el precio, qué no incluye, el anticipo y las condiciones de pago, una línea para firmar.',
            'Factura: número de factura, qué ya se pagó, el saldo, la fecha límite y cómo pagar. Un enlace para pagar con tarjeta cobra más rápido que "cheque o Zelle".',
          ],
        },
      ],
      faq: [
        { q: '¿Puedo facturar más de lo que decía el presupuesto?', a: 'Solo por trabajo que el cliente aceptó después del presupuesto. Pon cada cambio en su propia partida para que el cliente vea de dónde salió la diferencia. Facturar más que el presupuesto firmado sin un cambio acordado es como empiezan los pleitos.' },
        { q: '¿Necesito los dos para una obra chica?', a: 'Para una reparación de un día, muchos contratistas mandan un solo documento que hace de los dos: el precio al principio, y marcado como pagado al terminar. Funciona hasta que el alcance cambia. Con una app, dos documentos no cuestan nada extra y el registro queda limpio.' },
        { q: '¿Un presupuesto firmado es un contrato?', a: 'En la mayoría de los estados, una vez que las dos partes actúan sobre él, sí. Las obras grandes normalmente merecen un contrato escrito aparte con el presupuesto anexo como alcance y precio.' },
      ],
    },
  },

  // ------------------------------------------------------------------
  {
    id: 'deposit',
    updated: '2026-09-10',
    en: {
      slug: 'how-much-deposit-should-a-contractor-ask-for',
      title: 'How much deposit should a contractor ask for?',
      description: 'What deposit is normal on residential work, which states cap it, how to word it on the estimate, and how to collect it the same day the client signs.',
      h1: 'How much deposit should a contractor ask for?',
      intro: 'Enough to cover the material you have to buy before the first day, and enough that the client is committed. For most residential jobs that lands between 10 and 30 percent. A few states put a legal ceiling on it, and those come first.',
      blocks: [
        {
          h: 'States that cap the deposit',
          p: ['These are the ones contractors run into most, as of September 2026. Laws change and this page is not legal advice: check your state\'s contractor board before you write a number.'],
          list: [
            'California: on a home improvement contract the down payment cannot exceed $1,000 or 10 percent of the contract price, whichever is less. Contractors State License Board rule.',
            'Maryland: a home improvement contractor cannot take more than one third of the contract price as a deposit.',
            'Massachusetts: the deposit on a home improvement contract cannot exceed one third of the total, apart from special-order materials.',
            'Most other states set no cap, but many require the deposit and the payment schedule to be written into the contract. Some require a registered contractor to hold deposits a certain way. Your state board\'s website will say.',
          ],
        },
        {
          h: 'What is normal where there is no cap',
          list: [
            'Small repairs, one or two days: often no deposit. You are not buying much ahead of time and the client pays on completion.',
            'Jobs with material you have to order, like cabinets, windows, a fence: the cost of the material as the deposit, which often works out to 30 to 50 percent. Say that is what it is for.',
            'Multi-week jobs: a deposit of 10 to 30 percent, then progress payments at milestones you can point to. Rough-in complete. Drywall hung. The balance at the walk-through.',
            'New clients you do not know: lean toward the higher end. Repeat clients: whatever has worked before.',
          ],
          tip: 'Never let the amount you are owed run far ahead of the work done. If the client walks at week three, you should be out a day, not a month.',
        },
        {
          h: 'How to word it on the estimate',
          p: [
            'One line, plain. "Deposit of $2,400 due at signing to order materials. Balance of $5,600 due on completion." Clients accept a deposit without argument when the estimate says what it is for. What they push back on is a number with no reason next to it.',
            'For a job with progress payments, list each one with what triggers it, so there is nothing to argue about on the day.',
          ],
        },
        {
          h: 'Collect it the same day',
          p: [
            'A deposit that is "coming" is not a deposit. Send the invoice for it the moment the estimate is signed, with a card link, so the client can pay from their phone in the driveway. Waiting for a check is how a Monday start becomes a Thursday start.',
          ],
        },
      ],
      faq: [
        { q: 'Can I ask for 50 percent up front?', a: 'Where the state allows it and the job has heavy material costs, yes, and many contractors do. Say what the money is for. In a capped state you cannot, whatever the material costs; you order later or the supplier bills the client directly.' },
        { q: 'Is the deposit refundable?', a: 'Say so on the estimate either way. A deposit spent on special-order material is normally not refundable once ordered; a deposit against labor usually is, less any work done. Write it down before it matters.' },
        { q: 'Should the deposit be a separate invoice?', a: 'Yes. It gives the client a record of what they paid and you a record of what is still owed, and the final invoice then shows the deposit as already paid.' },
      ],
    },
    es: {
      slug: 'cuanto-anticipo-pedir-como-contratista',
      title: '¿Cuánto anticipo debe pedir un contratista?',
      description: 'Qué anticipo es normal en trabajo residencial, qué estados lo limitan, cómo ponerlo en el presupuesto y cómo cobrarlo el mismo día que el cliente firma.',
      h1: '¿Cuánto anticipo debe pedir un contratista?',
      intro: 'Lo suficiente para cubrir el material que tienes que comprar antes del primer día, y lo suficiente para que el cliente esté comprometido. En la mayoría de las obras residenciales eso cae entre el 10 y el 30 por ciento. Algunos estados le ponen un tope legal, y esos van primero.',
      blocks: [
        {
          h: 'Estados que limitan el anticipo',
          p: ['Estos son los que más se encuentran los contratistas, a septiembre de 2026. Las leyes cambian y esta página no es asesoría legal: revisa la junta de contratistas de tu estado antes de escribir un número.'],
          list: [
            'California: en un contrato de mejoras del hogar el anticipo no puede pasar de $1,000 o del 10 por ciento del precio del contrato, lo que sea menor. Regla de la Contractors State License Board.',
            'Maryland: un contratista de mejoras del hogar no puede tomar más de un tercio del precio del contrato como anticipo.',
            'Massachusetts: el anticipo en un contrato de mejoras del hogar no puede pasar de un tercio del total, aparte de materiales de pedido especial.',
            'La mayoría de los demás estados no ponen tope, pero muchos exigen que el anticipo y el calendario de pagos estén escritos en el contrato. El sitio de la junta de tu estado lo dice.',
          ],
        },
        {
          h: 'Qué es normal donde no hay tope',
          list: [
            'Reparaciones chicas, uno o dos días: muchas veces sin anticipo. No compras casi nada por adelantado y el cliente paga al terminar.',
            'Obras con material que hay que pedir, como gabinetes, ventanas, una cerca: el costo del material como anticipo, que suele quedar entre el 30 y el 50 por ciento. Di que es para eso.',
            'Obras de varias semanas: un anticipo del 10 al 30 por ciento, luego pagos de avance en etapas que se puedan señalar. Instalación terminada. Tablaroca colocada. El saldo en el recorrido final.',
            'Clientes nuevos que no conoces: tira hacia arriba. Clientes de siempre: lo que haya funcionado antes.',
          ],
          tip: 'Nunca dejes que lo que te deben se adelante mucho al trabajo hecho. Si el cliente se va en la semana tres, debes perder un día, no un mes.',
        },
        {
          h: 'Cómo ponerlo en el presupuesto',
          p: [
            'Una línea, clara. "Anticipo de $2,400 al firmar para pedir materiales. Saldo de $5,600 al terminar." El cliente acepta un anticipo sin discutir cuando el presupuesto dice para qué es. Lo que discute es un número sin razón al lado.',
            'En una obra con pagos de avance, enlista cada uno con lo que lo activa, para que no haya nada que discutir ese día.',
          ],
        },
        {
          h: 'Cóbralo el mismo día',
          p: [
            'Un anticipo que "ya viene" no es un anticipo. Manda la factura del anticipo en cuanto se firme el presupuesto, con un enlace para pagar con tarjeta, para que el cliente pague desde su teléfono ahí mismo. Esperar un cheque es como un inicio de lunes se vuelve de jueves.',
          ],
        },
      ],
      faq: [
        { q: '¿Puedo pedir el 50 por ciento por adelantado?', a: 'Donde el estado lo permite y la obra tiene mucho material, sí, y muchos contratistas lo hacen. Di para qué es el dinero. En un estado con tope no puedes, cueste lo que cueste el material; pides después o el proveedor le cobra directo al cliente.' },
        { q: '¿El anticipo se devuelve?', a: 'Dilo en el presupuesto, sea cual sea la respuesta. Un anticipo gastado en material de pedido especial normalmente no se devuelve una vez pedido; uno contra mano de obra normalmente sí, menos el trabajo hecho. Escríbelo antes de que importe.' },
        { q: '¿El anticipo debe ir en una factura aparte?', a: 'Sí. Le da al cliente un registro de lo que pagó y a ti de lo que falta, y la factura final muestra el anticipo como ya pagado.' },
      ],
    },
  },

  // ------------------------------------------------------------------
  {
    id: 'get-paid-faster',
    updated: '2026-09-10',
    en: {
      slug: 'how-to-get-paid-faster-as-a-contractor',
      title: 'How to get paid faster as a contractor',
      description: 'Six habits that shorten the gap between finishing the job and the money landing: invoice the same day, take cards, set a due date, follow up on a schedule.',
      h1: 'How to get paid faster as a contractor',
      intro: 'The job is done. The client is happy. And the money shows up three weeks later, after two texts you did not want to send. Most of that delay is on the contractor\'s side, and most of it is fixable with habits, not software.',
      blocks: [
        {
          h: '1. Invoice the day you finish',
          p: [
            'The single biggest change. An invoice sent from the driveway, while the client is standing in the finished kitchen, gets paid. The same invoice sent Sunday night from the kitchen table competes with the mortgage and the car payment. Write it on your phone before you drive off.',
          ],
        },
        {
          h: '2. Take cards',
          p: [
            'A client who can tap a link and pay with a card, Apple Pay or Google Pay pays now. A client who has to find the checkbook pays Friday, maybe. Card fees are around 3 percent. Being paid three weeks sooner on a $6,000 invoice is worth more than $180 to most contractors, and you can build the fee into the price.',
          ],
        },
        {
          h: '3. Put a due date on it',
          p: [
            '"Due on receipt" for small jobs. "Due in 7 days" for bigger ones. An invoice with no date is a suggestion. An invoice with a date is a bill. Net 30 is for companies with an accounts payable department; a homeowner does not need a month.',
          ],
        },
        {
          h: '4. Get the deposit and the progress payments up front',
          p: [
            'The final invoice is easy to pay when it is 20 percent of the job, and hard when it is 100 percent. Collect a deposit at signing and a payment at each milestone, so the balance at the end is small. The guide on deposits covers what is normal and which states cap it.',
          ],
        },
        {
          h: '5. Make the invoice impossible to question',
          p: [
            'Line items that match the signed estimate, each approved change on its own line, the deposit shown as paid, the balance in bold. An invoice the client understands in ten seconds gets paid in ten seconds. One that raises a question sits until they get around to asking it.',
          ],
          tip: 'Photos of the finished work on the invoice end most "is it really done" questions before they are asked.',
        },
        {
          h: '6. Follow up on a schedule, not a mood',
          p: [
            'A reminder the day after the due date, friendly, with the pay link again. Another a week later. A phone call at two weeks. Written down as a rule, it is not awkward, it is your process, and clients respect a process. Waiting until you are annoyed makes the message worse and later.',
          ],
        },
        {
          h: 'For work that repeats',
          p: [
            'Maintenance contracts, lawn care, cleaning, an HVAC service plan: put the client\'s card on file once and charge it on a schedule. No invoice to send, no reminder to write, and a failed card gets retried and flagged without you doing anything.',
          ],
        },
      ],
      faq: [
        { q: 'Should I charge a late fee?', a: 'You can, if it is on the estimate and the invoice before the work starts. Something like 1.5 percent a month is common. In practice the fee matters less than the fact that it is written down: clients pay on time to avoid it far more often than they pay it.' },
        { q: 'Can I add the card fee to the invoice?', a: 'Rules vary by state and by card network, and some states restrict surcharges. The clean approach is to price the job so the fee is covered and give the client the choice of card, bank transfer or check.' },
        { q: 'What about a client who just will not pay?', a: 'A written demand with a deadline, then a mechanic\'s lien where your state allows one, then small claims. All of it goes better with a signed estimate, a clear invoice and a record of the reminders you sent.' },
      ],
    },
    es: {
      slug: 'como-cobrar-mas-rapido-como-contratista',
      title: 'Cómo cobrar más rápido como contratista',
      description: 'Seis hábitos que acortan el tiempo entre terminar la obra y ver el dinero: facturar el mismo día, aceptar tarjeta, poner fecha límite y dar seguimiento.',
      h1: 'Cómo cobrar más rápido como contratista',
      intro: 'La obra está terminada. El cliente está contento. Y el dinero llega tres semanas después, tras dos mensajes que no querías mandar. La mayor parte de esa demora está del lado del contratista, y la mayor parte se arregla con hábitos, no con programas.',
      blocks: [
        {
          h: '1. Factura el día que terminas',
          p: [
            'El cambio más grande de todos. Una factura mandada desde la camioneta, con el cliente parado en la cocina terminada, se paga. La misma factura mandada el domingo en la noche desde la mesa compite con la hipoteca y el pago del carro. Hazla en el teléfono antes de arrancar.',
          ],
        },
        {
          h: '2. Acepta tarjeta',
          p: [
            'Un cliente que puede tocar un enlace y pagar con tarjeta, Apple Pay o Google Pay, paga ahora. Un cliente que tiene que buscar la chequera paga el viernes, tal vez. La comisión de la tarjeta anda por el 3 por ciento. Cobrar tres semanas antes una factura de $6,000 vale más que $180 para casi cualquier contratista, y la comisión se puede meter en el precio.',
          ],
        },
        {
          h: '3. Ponle fecha límite',
          p: [
            '"Pago al recibir" para trabajos chicos. "Pago en 7 días" para los grandes. Una factura sin fecha es una sugerencia. Una factura con fecha es un cobro. Los 30 días son para empresas con departamento de cuentas por pagar; el dueño de una casa no necesita un mes.',
          ],
        },
        {
          h: '4. Cobra el anticipo y los avances por adelantado',
          p: [
            'La factura final es fácil de pagar cuando es el 20 por ciento de la obra, y difícil cuando es el 100. Cobra un anticipo al firmar y un pago en cada etapa, para que el saldo al final sea chico. La guía sobre anticipos dice qué es normal y qué estados lo limitan.',
          ],
        },
        {
          h: '5. Haz una factura que no se pueda cuestionar',
          p: [
            'Partidas que coinciden con el presupuesto firmado, cada cambio aprobado en su propia línea, el anticipo marcado como pagado, el saldo en negritas. Una factura que el cliente entiende en diez segundos se paga en diez segundos. Una que levanta una duda se queda ahí hasta que le da tiempo de preguntar.',
          ],
          tip: 'Las fotos del trabajo terminado en la factura acaban con casi todas las preguntas de "¿de verdad ya quedó?" antes de que las hagan.',
        },
        {
          h: '6. Da seguimiento con un calendario, no con el humor',
          p: [
            'Un recordatorio al día siguiente de la fecha límite, amable, con el enlace de pago otra vez. Otro a la semana. Una llamada a las dos semanas. Escrito como regla, no es incómodo, es tu proceso, y el cliente respeta un proceso. Esperar hasta estar molesto hace el mensaje peor y más tarde.',
          ],
        },
        {
          h: 'Para el trabajo que se repite',
          p: [
            'Contratos de mantenimiento, jardinería, limpieza, un plan de servicio de aire acondicionado: registra la tarjeta del cliente una vez y cóbrala con un calendario. Sin factura que mandar, sin recordatorio que escribir, y si la tarjeta falla se reintenta y te avisa sin que hagas nada.',
          ],
        },
      ],
      faq: [
        { q: '¿Debo cobrar recargo por pago tardío?', a: 'Puedes, si está en el presupuesto y en la factura antes de empezar el trabajo. Algo como 1.5 por ciento al mes es común. En la práctica el recargo importa menos que el hecho de que esté escrito: el cliente paga a tiempo para evitarlo mucho más seguido de lo que lo paga.' },
        { q: '¿Puedo agregar la comisión de la tarjeta a la factura?', a: 'Las reglas cambian por estado y por red de tarjetas, y algunos estados restringen los recargos. Lo limpio es poner el precio de la obra de modo que cubra la comisión y darle al cliente la opción de tarjeta, transferencia o cheque.' },
        { q: '¿Y el cliente que de plano no paga?', a: 'Un requerimiento por escrito con fecha límite, luego un gravamen de mecánico donde tu estado lo permita, luego la corte de reclamos menores. Todo sale mejor con un presupuesto firmado, una factura clara y un registro de los recordatorios que mandaste.' },
      ],
    },
  },

  // ------------------------------------------------------------------
  {
    id: 'send-by-text',
    updated: '2026-09-10',
    en: {
      slug: 'send-an-estimate-by-text',
      title: 'How to send an estimate by text message',
      description: 'Why texting an estimate beats emailing it, what to write in the message, and how to send one the client can read and sign on their phone without an attachment.',
      h1: 'How to send an estimate by text message',
      intro: 'Emails sit. Texts get opened within minutes, usually within seconds. If you want an estimate read and signed the same day, send it the way the client already talks to you.',
      blocks: [
        {
          h: 'Why text beats email for estimates',
          list: [
            'It is read. Nearly every text is opened, most in the first few minutes. Email gets opened when they get to it.',
            'It is the thread they already have with you. The estimate lands under the photos they sent and the "can you come Tuesday" message, so there is no searching for it later.',
            'They reply. A question about a line item is a two-line text back to you, not a formal email they put off.',
          ],
        },
        {
          h: 'Do not send a PDF',
          p: [
            'A PDF in a text is a thumbnail that needs pinching to read and cannot be signed. Send a link instead: the client taps it, sees the estimate laid out for a phone screen, and signs with a finger. You get told the moment they do. The link is also the record: it shows the same estimate, signed, when either of you opens it in six months.',
          ],
        },
        {
          h: 'What to write in the message',
          p: ['Short. Their name, what it is, what to do, and the link. Something like:'],
          list: [
            '"Hi Maria, here is the estimate for the deck. Tap the link to review and sign, and text me with any questions. [link]"',
            'Add the number if they need a reason to open it now: "Total comes to $7,850 with the composite rail."',
            'Add the deadline if the price has one: "Good for 30 days, material prices move."',
          ],
          tip: 'Send from your own phone number, not a service. The client sees a number they know, and their reply lands in your Messages like every other text.',
        },
        {
          h: 'Sending it from LevelWorks',
          p: [
            'Open the estimate on your phone, tap Send to client, then Text it. Your Messages app opens with the client\'s number and the message already written, link included. Read it, tap Send. That is the whole thing, and it works the same on iPhone and Android.',
          ],
        },
        {
          h: 'Follow up by text too',
          p: [
            'If it is not signed in two days: "Hi Maria, checking whether you had any questions on the deck estimate. Happy to walk through it." One message, no pressure. Clients who were going to say yes usually say it here.',
          ],
        },
      ],
      faq: [
        { q: 'Is a signature on a phone legally valid?', a: 'Yes. Electronic signatures have been valid for contracts in the US since 2000 under the federal E-SIGN Act, and every state has its own equivalent. What matters is a record of who signed, when, and what they saw, which a signed link keeps for you.' },
        { q: 'What if the client does not text?', a: 'Send the same link by email. The estimate is the same page either way; only the delivery changes. Some clients want both, the text to read now and the email to keep.' },
        { q: 'Can I text an invoice the same way?', a: 'Yes, and with a pay link in it the client can pay from the same message. It is the fastest way to get paid on a small job.' },
      ],
    },
    es: {
      slug: 'enviar-un-presupuesto-por-mensaje-de-texto',
      title: 'Cómo enviar un presupuesto por mensaje de texto',
      description: 'Por qué el mensaje le gana al correo, qué escribir y cómo mandar un presupuesto que el cliente pueda leer y firmar en su teléfono, sin archivo adjunto.',
      h1: 'Cómo enviar un presupuesto por mensaje de texto',
      intro: 'Los correos se quedan ahí. Los mensajes se abren en minutos, casi siempre en segundos. Si quieres que un presupuesto se lea y se firme el mismo día, mándalo por donde el cliente ya habla contigo.',
      blocks: [
        {
          h: 'Por qué el mensaje le gana al correo',
          list: [
            'Se lee. Casi todos los mensajes se abren, la mayoría en los primeros minutos. El correo se abre cuando les toca.',
            'Es la conversación que ya tienen contigo. El presupuesto cae debajo de las fotos que te mandaron y del "¿puedes venir el martes?", así que después no hay que buscarlo.',
            'Contestan. Una duda sobre una partida es un mensaje de dos líneas de vuelta, no un correo formal que van dejando.',
          ],
        },
        {
          h: 'No mandes un PDF',
          p: [
            'Un PDF en un mensaje es una miniatura que hay que agrandar para leer y que no se puede firmar. Manda un enlace: el cliente lo toca, ve el presupuesto acomodado para la pantalla del teléfono y firma con el dedo. A ti te avisa en cuanto lo hace. El enlace también es el registro: muestra el mismo presupuesto, firmado, cuando cualquiera de los dos lo abra en seis meses.',
          ],
        },
        {
          h: 'Qué escribir en el mensaje',
          p: ['Corto. Su nombre, qué es, qué hacer y el enlace. Algo así:'],
          list: [
            '"Hola María, aquí está el presupuesto de la terraza. Toca el enlace para revisarlo y firmar, y escríbeme con cualquier duda. [enlace]"',
            'Agrega el número si necesitan una razón para abrirlo ahora: "El total queda en $7,850 con la baranda de material compuesto."',
            'Agrega el plazo si el precio lo tiene: "Vale 30 días, los materiales suben."',
          ],
          tip: 'Manda desde tu propio número, no desde un servicio. El cliente ve un número que conoce, y su respuesta cae en tus mensajes como cualquier otro.',
        },
        {
          h: 'Cómo mandarlo desde LevelWorks',
          p: [
            'Abre el presupuesto en tu teléfono, toca Enviar al cliente y luego Enviar por mensaje. Se abre tu app de mensajes con el número del cliente y el mensaje ya escrito, con el enlace. Lo lees, tocas enviar. Eso es todo, y funciona igual en iPhone y Android.',
          ],
        },
        {
          h: 'Da seguimiento también por mensaje',
          p: [
            'Si a los dos días no está firmado: "Hola María, ¿tuviste alguna duda con el presupuesto de la terraza? Con gusto te lo explico." Un mensaje, sin presión. El cliente que iba a decir que sí normalmente lo dice aquí.',
          ],
        },
      ],
      faq: [
        { q: '¿Una firma en el teléfono es válida legalmente?', a: 'Sí. Las firmas electrónicas son válidas para contratos en Estados Unidos desde el año 2000 por la ley federal E-SIGN, y cada estado tiene su equivalente. Lo que importa es el registro de quién firmó, cuándo y qué vio, y eso lo guarda el enlace firmado.' },
        { q: '¿Y si el cliente no usa mensajes?', a: 'Manda el mismo enlace por correo. El presupuesto es la misma página de cualquier forma; solo cambia por dónde llega. Algunos clientes quieren los dos, el mensaje para leerlo ahora y el correo para guardarlo.' },
        { q: '¿Puedo mandar una factura igual?', a: 'Sí, y con un enlace de pago dentro el cliente puede pagar desde el mismo mensaje. Es la forma más rápida de cobrar un trabajo chico.' },
      ],
    },
  },

  // ------------------------------------------------------------------
  {
    id: 'building-codes',
    updated: '2026-09-10',
    en: {
      slug: 'where-to-find-building-codes-in-your-state',
      title: 'Where to find the building codes for your state, free',
      description: 'How building codes are adopted in the US, where to read the code that applies to your job without buying the book, and who to ask when the city amends it.',
      h1: 'Where to find the building codes for your state, free',
      intro: 'The code that applies to your job is decided by your state and then, very often, changed by your city or county. There is no single national code, but there is a single family of them, and you can read all of them online without paying for the book.',
      blocks: [
        {
          h: 'How codes work in the US',
          p: [
            'The International Code Council publishes the model codes most of the country uses: the International Residential Code for one- and two-family homes, the International Building Code for everything else, plus plumbing, mechanical, fuel gas, energy and existing-building codes. Electrical work follows the National Electrical Code, published by the NFPA.',
            'Each state adopts a version of these, often a few years behind the newest edition, and adds its own amendments. Then the city or county you are working in can amend it again. So the answer to "what code applies" is always: the state\'s adopted edition, as amended by the local building department that issues your permit.',
            'A few states write their own. California\'s Title 24 and the Florida Building Code are based on the ICC codes but published separately with substantial changes.',
          ],
        },
        {
          h: 'Where to read them free',
          list: [
            'ICC codes: codes.iccsafe.org has a free public-access version of every ICC code, including the editions your state adopted. Reading is free; printing and search need a paid account.',
            'The electrical code: nfpa.org offers free online access to the NEC with a free account. Same deal, read only.',
            'What your state adopted: iccsafe.org keeps an adoption map by state showing which edition of each code is in force. Your state\'s building or licensing board site says the same and lists the state amendments.',
            'Everything in one place by address: UpCodes (up.codes) lets you pick a state or city and browse the adopted codes with local amendments folded in. The browsing is free.',
            'Local amendments: your city or county building department, on its website under "building codes" or "adopted codes", and on the phone. This is the part no national site reliably has.',
          ],
          tip: 'Before pricing anything that needs a permit, call the building department and ask which code edition and which amendments they inspect to. Ten minutes, and it is the answer your inspector will use.',
        },
        {
          h: 'The parts that catch contractors most often',
          list: [
            'Deck ledger attachment, guard height and stair geometry, which changed between IRC editions.',
            'Egress window size in bedrooms, especially in basement finishes.',
            'GFCI and AFCI requirements, which have expanded with each NEC cycle.',
            'Energy code: insulation values and air sealing, where the state adopted a newer energy code than its building code.',
            'Smoke and carbon monoxide alarm placement when you touch a bedroom or a permit triggers an upgrade.',
          ],
        },
        {
          h: 'Put the code on the estimate',
          p: [
            'When a job has to meet a code that changes what you build, say so on the estimate. "Guard rail 36 inches per IRC as adopted by the county" tells the client why the rail is the height it is and tells the inspector you knew. It is also what stops a client asking for a shorter rail to save money.',
          ],
        },
      ],
      faq: [
        { q: 'Do I need to buy the code book?', a: 'For reading and checking, no; the free online versions are the same text. Contractors who work to a code every day usually buy the book or a subscription for search and bookmarks, and licensing exams often allow the printed book.' },
        { q: 'Which edition should I follow if the state and the city differ?', a: 'The one the permitting authority inspects to, which is normally the state edition with local amendments. When in doubt the building department that issues the permit is the answer.' },
        { q: 'Does this cover Canada or Mexico?', a: 'No. Canada uses the National Building Code of Canada, adopted by province. Mexico\'s codes are set by state and municipality. This page is about the United States.' },
      ],
    },
    es: {
      slug: 'donde-encontrar-los-codigos-de-construccion-de-tu-estado',
      title: 'Dónde encontrar los códigos de construcción de tu estado, gratis',
      description: 'Cómo se adoptan los códigos en Estados Unidos, dónde leer gratis el que aplica a tu obra sin comprar el libro, y a quién preguntar cuando la ciudad lo cambia.',
      h1: 'Dónde encontrar los códigos de construcción de tu estado, gratis',
      intro: 'El código que aplica a tu obra lo decide tu estado y luego, muy seguido, lo cambia tu ciudad o condado. No hay un solo código nacional, pero sí una sola familia de códigos, y todos se pueden leer en línea sin pagar el libro.',
      blocks: [
        {
          h: 'Cómo funcionan los códigos en Estados Unidos',
          p: [
            'El International Code Council (ICC) publica los códigos modelo que usa casi todo el país: el International Residential Code (IRC) para casas de una y dos familias, el International Building Code (IBC) para todo lo demás, más los de plomería, mecánica, gas, energía y edificios existentes. El trabajo eléctrico sigue el National Electrical Code (NEC), que publica la NFPA.',
            'Cada estado adopta una versión de estos, muchas veces unos años atrás de la edición más nueva, y agrega sus propias modificaciones. Luego la ciudad o el condado donde trabajas puede modificarlo otra vez. Así que la respuesta a "qué código aplica" siempre es: la edición adoptada por el estado, con las modificaciones del departamento de construcción local que da tu permiso.',
            'Algunos estados escriben el suyo. El Título 24 de California y el Florida Building Code se basan en los códigos del ICC pero se publican aparte con cambios importantes.',
          ],
        },
        {
          h: 'Dónde leerlos gratis',
          list: [
            'Códigos del ICC: codes.iccsafe.org tiene una versión gratuita de acceso público de todos los códigos del ICC, incluidas las ediciones que adoptó tu estado. Leer es gratis; imprimir y buscar requieren cuenta de pago.',
            'El código eléctrico: nfpa.org da acceso gratuito en línea al NEC con una cuenta gratis. Igual, solo lectura.',
            'Qué adoptó tu estado: iccsafe.org tiene un mapa de adopción por estado que muestra qué edición de cada código está vigente. El sitio de la junta de construcción o de licencias de tu estado dice lo mismo y enlista las modificaciones estatales.',
            'Todo en un lugar por dirección: UpCodes (up.codes) te deja escoger un estado o ciudad y ver los códigos adoptados con las modificaciones locales ya incluidas. Verlos es gratis.',
            'Modificaciones locales: el departamento de construcción de tu ciudad o condado, en su sitio bajo "building codes" o "adopted codes", y por teléfono. Esta es la parte que ningún sitio nacional tiene completa.',
          ],
          tip: 'Antes de cotizar cualquier cosa que necesite permiso, llama al departamento de construcción y pregunta con qué edición del código y qué modificaciones inspeccionan. Diez minutos, y es la respuesta que va a usar tu inspector.',
        },
        {
          h: 'Lo que más atrapa a los contratistas',
          list: [
            'La fijación del larguero de la terraza, la altura de la baranda y las medidas de escalera, que cambiaron entre ediciones del IRC.',
            'El tamaño de la ventana de salida en recámaras, sobre todo en sótanos terminados.',
            'Los requisitos de GFCI y AFCI, que se han ampliado con cada ciclo del NEC.',
            'El código de energía: valores de aislamiento y sellado de aire, donde el estado adoptó un código de energía más nuevo que su código de construcción.',
            'La ubicación de detectores de humo y de monóxido de carbono cuando tocas una recámara o un permiso obliga a actualizarlos.',
          ],
        },
        {
          h: 'Pon el código en el presupuesto',
          p: [
            'Cuando una obra tiene que cumplir un código que cambia lo que construyes, dilo en el presupuesto. "Baranda de 36 pulgadas según el IRC adoptado por el condado" le dice al cliente por qué la baranda mide lo que mide y le dice al inspector que lo sabías. También es lo que evita que el cliente pida una baranda más baja para ahorrar.',
          ],
        },
      ],
      faq: [
        { q: '¿Necesito comprar el libro del código?', a: 'Para leer y revisar, no; las versiones gratuitas en línea tienen el mismo texto. Los contratistas que trabajan con un código todos los días normalmente compran el libro o una suscripción por la búsqueda y los marcadores, y los exámenes de licencia muchas veces permiten el libro impreso.' },
        { q: '¿Qué edición sigo si el estado y la ciudad no coinciden?', a: 'La que usa para inspeccionar la autoridad que da el permiso, que normalmente es la edición del estado con las modificaciones locales. En caso de duda, el departamento de construcción que da el permiso es la respuesta.' },
        { q: '¿Esto aplica para México?', a: 'No. En México los reglamentos de construcción los fija cada estado y cada municipio. Esta página es sobre Estados Unidos.' },
      ],
    },
  },
];

/** Where the guides live in each language. The Spanish path is a Spanish word on purpose. */
export const GUIDES_BASE: Record<Lang, string> = { en: '/guides', es: '/es/guias' };

export function guidePath(g: Guide, lang: Lang): string {
  return `${GUIDES_BASE[lang]}/${g[lang].slug}`;
}

export function findGuide(lang: Lang, slug: string): Guide | undefined {
  return GUIDES.find((g) => g[lang].slug === slug);
}

/** Interface strings for the guide pages themselves. Small enough to live here rather than in the dictionaries. */
export const GUIDE_UI: Record<Lang, Record<string, string>> = {
  en: {
    eyebrow: 'Guides',
    indexTitle: 'Guides for contractors',
    indexDesc: 'Short, practical answers on estimates, invoices, deposits, getting paid and building codes. Written by a contractor, free to read.',
    indexH1: 'Guides for contractors',
    indexLead: 'Practical answers on estimates, deposits, getting paid and codes. Written by a contractor who runs a crew, not by a marketing department.',
    updated: 'Updated',
    readMore: 'Read the guide',
    faq: 'Common questions',
    more: 'More guides',
    ctaTitle: 'Estimates, invoices and payments, from your phone',
    ctaBody: 'LevelWorks is the app behind these guides. Write the estimate at the job, text it, get it signed, turn it into an invoice and get paid by card. Every feature for $5 a month, 30 days free.',
    ctaButton: 'Start free trial',
    ctaFine: 'No credit card to start. Cancel any time.',
    home: 'Home',
    signIn: 'Sign in',
    startTrial: 'Start free trial',
    startTrialShort: 'Free trial',
    backToGuides: 'All guides',
  },
  es: {
    eyebrow: 'Guías',
    indexTitle: 'Guías para contratistas',
    indexDesc: 'Respuestas cortas y prácticas sobre presupuestos, facturas, anticipos, cómo cobrar y códigos de construcción. Escritas por un contratista, gratis.',
    indexH1: 'Guías para contratistas',
    indexLead: 'Respuestas prácticas sobre presupuestos, anticipos, cómo cobrar y códigos. Escritas por un contratista que trabaja con su cuadrilla, no por un departamento de marketing.',
    updated: 'Actualizado',
    readMore: 'Leer la guía',
    faq: 'Preguntas comunes',
    more: 'Más guías',
    ctaTitle: 'Presupuestos, facturas y pagos, desde tu teléfono',
    ctaBody: 'LevelWorks es la app detrás de estas guías. Haz el presupuesto en la obra, mándalo por mensaje, que lo firmen, conviértelo en factura y cobra con tarjeta. Todas las funciones por $5 al mes, 30 días gratis.',
    ctaButton: 'Empezar prueba gratis',
    ctaFine: 'Sin tarjeta para empezar. Cancela cuando quieras.',
    home: 'Inicio',
    signIn: 'Iniciar sesión',
    startTrial: 'Empezar prueba gratis',
    startTrialShort: 'Prueba gratis',
    backToGuides: 'Todas las guías',
  },
};
