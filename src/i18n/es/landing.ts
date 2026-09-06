/**
 * The marketing landing page, Spanish.
 *
 * This is the page a TikTok visitor lands on, so it has to sound like a
 * contractor wrote it, not like a translation. Two things done on purpose:
 *
 * - The hero is addressed with "tú" and uses the trades' own words:
 *   "presupuesto", "obra", "cobrar". No corporate Spanish anywhere.
 * - Sample data inside the mockups (client names, brand names, card names,
 *   dollar figures) stays as it is — those are illustrative, and a Spanish
 *   speaker in the US reads Visa and Sherwin-Williams exactly as written.
 *   The words AROUND them are translated so the picture still reads.
 */
export const landing: Record<string, string> = {
  // ---- shell / header ----
  'lp.logoAria': 'Inicio de LevelWorks',
  'lp.navAria': 'Principal',
  'lp.navFeatures': 'Funciones',
  'lp.navPayments': 'Pagos',
  'lp.navHowItWorks': 'Cómo funciona',
  'lp.navPricing': 'Precio',
  'lp.navFaq': 'Preguntas',
  'lp.signIn': 'Iniciar sesión',
  'lp.startTrial': 'Empezar prueba gratis',
  'lp.startTrialShort': 'Gratis',
  'lp.startTrial30': 'Empieza gratis por 30 días',
  'lp.menuAria': 'Menú',

  // ---- referral banner ----
  'lp.refPre': 'Código de referido',
  'lp.refApplied': 'aplicado. Recibes',
  'lp.ref60': '60 días gratis',
  'lp.refPost': 'al registrarte.',

  // ---- hero ----
  'lp.priceChipAmount': '$5/mes',
  'lp.priceChipText': 'Presupuestos, firmas, facturas y pagos. Todo.',
  'lp.heroTitle': 'Presupuestos y facturas, hechos por un contratista.',
  'lp.heroLead': 'Escribe un presupuesto profesional desde tu teléfono, recíbelo firmado desde el del cliente, y cobra con tarjeta directo a tu banco. Todo por $5 al mes.',
  'lp.heroSeeApp': 'Ver la aplicación',
  'lp.heroFine1': 'No necesitas tarjeta para empezar',
  'lp.heroFine2': 'Todas las funciones incluidas',
  'lp.heroFine3': 'Cancela cuando quieras',
  'lp.floatPaid': '$4,850.00 pagados',
  'lp.floatPaidSub': 'Depositados en tu banco',
  'lp.floatSigned': 'Maria Keller firmó',
  'lp.floatSignedSub': 'Presupuesto n.º 1042 · hace un momento',
  'lp.floatViewed': 'Presupuesto abierto',
  'lp.floatViewedSub': 'Dan Ortiz abrió el n.º 1038',

  // ---- proof strip ----
  'lp.proof1': 'Hecha por un contratista que trabaja',
  'lp.proof1Sub': 'Diseñada en obras reales en los suburbios de Filadelfia, no en una oficina.',
  'lp.proof2': 'Pagos protegidos con Stripe',
  'lp.proof2Sub': 'Los datos de la tarjeta nunca pasan por nuestros servidores. El dinero llega a tu banco.',
  'lp.proof3': 'Presupuestos y facturas sin límite',
  'lp.proof3Sub': 'Sin límite por documento, sin niveles, sin extras.',
  'lp.proof4': 'Tu logotipo, no el nuestro',
  'lp.proof4Sub': 'Nada de lo que envías lleva la marca de LevelWorks.',

  // ---- trades ----
  'lp.tradesTitle': 'Hecha para todos los oficios',
  'lp.tradeGeneral': 'Contratistas generales',
  'lp.tradePainters': 'Pintores',
  'lp.tradeRemodelers': 'Remodeladores',
  'lp.tradeElectricians': 'Electricistas',
  'lp.tradePlumbers': 'Plomeros',
  'lp.tradeHvac': 'Aire y calefacción',
  'lp.tradeLandscapers': 'Jardineros',
  'lp.tradeRoofers': 'Techadores',
  'lp.tradeHandymen': 'Handyman',
  'lp.tradeFlooring': 'Pisos',
  'lp.tradeCleaning': 'Servicios de limpieza',

  // ---- features section ----
  'lp.featEyebrow': 'Todo en una sola aplicación',
  'lp.featTitle': 'Del primer presupuesto al pago final, sin soltar el teléfono.',
  'lp.featLead': 'Las mismas herramientas que las plataformas grandes venden por partes. Aquí van juntas, a un solo precio.',
  'lp.featTablistAria': 'Funciones',
  'lp.tabEstimates': 'Presupuestos',
  'lp.tabEstimatesBlurb': 'Partidas, secciones, anticipos y tu logotipo. Haz uno en el teléfono afuera de la casa y envíalo antes de irte.',
  'lp.tabSign': 'Firmas digitales',
  'lp.tabSignBlurb': 'El cliente aprueba y firma desde un enlace, en cualquier dispositivo, sin instalar nada. Te llega un aviso en el momento en que lo hace.',
  'lp.tabInvoices': 'Facturas y pagos con tarjeta',
  'lp.tabInvoicesBlurb': 'Convierte un presupuesto firmado en factura con un toque. El cliente paga con tarjeta, Apple Pay o Google Pay y el dinero llega directo a tu banco.',
  'lp.tabRecurring': 'Cobro recurrente',
  'lp.tabRecurringBlurb': 'Pon los contratos de mantenimiento en automático: mensual, trimestral, anual, como quieras. Si una tarjeta falla se reintenta sola y te avisamos.',
  'lp.tabPhotos': 'Avances con fotos',
  'lp.tabPhotosBlurb': 'Toma fotos en la obra y mándale al cliente un avance limpio de antes, durante y después con un solo toque.',
  'lp.tabClients': 'Clientes y trabajos',
  'lp.tabClientsBlurb': 'Cada cliente, trabajo, nota y documento en un solo lugar, con buscador y sincronizado en todos tus dispositivos.',

  // ---- payments section ----
  'lp.payEyebrow': 'Cobra desde la aplicación',
  'lp.payTitle': 'Mandas la factura. El cliente paga. El dinero está en tu banco.',
  'lp.payLead': 'Sin andar persiguiendo cheques ni esperando intermediarios. Tu cliente paga el enlace de la factura con tarjeta y el dinero llega directo a la cuenta de tu negocio.',
  'lp.payCheck1': 'Visa, Mastercard, American Express, Discover',
  'lp.payCheck2': 'Apple Pay y Google Pay desde el teléfono del cliente',
  'lp.payCheck3': 'Anticipos en los presupuestos, saldos en las facturas',
  'lp.payCheck4': 'Recibos enviados solos, cada pago registrado',
  'lp.payNote': 'Procesado por Stripe. Incluido en tu plan de $5; solo se aplican las comisiones normales de la tarjeta.',

  // ---- recurring deep dive ----
  'lp.recEyebrow': 'Cobro recurrente',
  'lp.recTitle': 'Contratos de servicio que se cobran solos.',
  'lp.recLead': 'Mantenimiento de aire acondicionado, jardinería, contratos de mantenimiento. Pones el monto y la fecha una vez y dejas de rehacer la misma factura cada mes.',
  'lp.recCheck1': 'Mensual, trimestral, anual o el intervalo que tú pongas',
  'lp.recCheck2': 'Las tarjetas rechazadas se reintentan solas',
  'lp.recCheck3': 'Aviso al instante si un pago falla, y el cliente queda marcado como atrasado',
  'lp.recCheck4': 'Algo que la mayoría de las aplicaciones para contratistas todavía no ofrece',

  // ---- branding deep dive ----
  'lp.brandEyebrow': 'Tu negocio, no nuestro anuncio',
  'lp.brandTitle': 'Tu nombre. Tu logotipo. Tu cliente.',
  'lp.brandLead': 'Otras aplicaciones ponen su marca en cada presupuesto que envías y convierten tus papeles en su publicidad. Cada documento de LevelWorks lleva tu nombre, tu logotipo y nada más.',
  'lp.brandCheck1': 'Sube tu logotipo una vez y aparece en todo',
  'lp.brandCheck2': 'Presupuestos, facturas, recibos y avances con fotos',
  'lp.brandCheck3': 'El cliente te ve a ti, y solo a ti',

  // ---- photos deep dive ----
  'lp.photoEyebrow': 'Avances con fotos',
  'lp.photoTitle': 'Muéstrale el trabajo al cliente mientras todavía estás en la obra.',
  'lp.photoLead': 'Toma fotos de antes, durante y después en la obra, escribe una línea y manda un avance limpio. Menos llamadas de "¿cómo va?", y un cliente que se siente atendido.',
  'lp.photoCheck1': 'Un toque de la cámara al cliente',
  'lp.photoCheck2': 'Las fotos se quedan con el trabajo para siempre',
  'lp.photoCheck3': 'Un asistente con inteligencia artificial para dudas de códigos y materiales',

  // ---- how it works ----
  'lp.hiwEyebrow': 'Cómo funciona',
  'lp.hiwTitle': 'Del presupuesto al pago, en cuatro toques.',
  'lp.hiwStep1': 'Arma el presupuesto',
  'lp.hiwStep1Body': 'Agrega partidas, materiales y mano de obra. Guarda las partidas que más usas y te toma un par de minutos.',
  'lp.hiwStep2': 'Manda el enlace',
  'lp.hiwStep2Body': 'Por correo o por mensaje. El cliente abre una página limpia con tu marca, en cualquier dispositivo.',
  'lp.hiwStep3': 'El cliente firma',
  'lp.hiwStep3Body': 'Lo revisa y firma con el dedo. Te llega un aviso en el momento en que pasa.',
  'lp.hiwStep4': 'Factura y cobra',
  'lp.hiwStep4Body': 'Conviértelo en factura con un toque. El cliente paga con tarjeta y el dinero llega a tu banco.',

  // ---- pricing ----
  'lp.pricingEyebrow': 'Precio',
  'lp.pricingTitle': 'Un solo plan. Todo incluido. Cinco dólares.',
  'lp.pricingLead': 'La mayoría de las aplicaciones de presupuestos cobran entre $19 y $149 al mes y dejan la mitad de sus funciones en los planes caros. Nosotros cobramos $5 fijos, y no te suben el precio nunca.',
  'lp.planThemWho': 'Aplicaciones típicas para contratistas',
  'lp.planPerMonth': '/mes',
  'lp.planThemSub': 'Planes por niveles. Las funciones que de verdad quieres están en el más caro.',
  'lp.planThem1': 'Presupuestos y facturas',
  'lp.planThem2': 'Firmas digitales',
  'lp.planThem3': 'Pagos con tarjeta',
  'lp.planThem4': 'Cobro recurrente en el plan básico',
  'lp.planThem5': 'Su marca fuera de tus documentos',
  'lp.planThem6': 'Usuarios y documentos sin límite',
  'lp.planUsWho': 'Todo, a un solo precio',
  'lp.planUsSub': '30 días gratis para empezar, sin tarjeta. Tu precio queda fijo mientras sigas con nosotros.',
  'lp.planUs1': 'Presupuestos y facturas sin límite',
  'lp.planUs2': 'Firmas digitales con aviso al instante',
  'lp.planUs3': 'Pagos con tarjeta, Apple Pay y Google Pay directo a tu banco',
  'lp.planUs4': 'Cobro recurrente automático',
  'lp.planUs5': 'Tu logotipo en todo, sin la marca de LevelWorks',
  'lp.planUs6': 'Avances con fotos de la obra',
  'lp.planUs7': 'Clientes, trabajos, notas y recibos',
  'lp.planUs8': 'Envío por correo y mensaje, con notificaciones',
  'lp.planUs9': 'Asistente con inteligencia artificial',
  'lp.planFine': '$5 al mes después de la prueba. Cancela cuando quieras.',
  'lp.savePre': 'Contra un plan de $149, son',
  'lp.saveAmount': '$1,728 al año',
  'lp.savePost': 'que se quedan en tu bolsillo.',

  // ---- founder ----
  'lp.founderEyebrow': 'Por qué existe',
  'lp.founderQuote': '"Tengo una empresa de remodelación. Estaba pagando más de cien dólares al mes por un programa de presupuestos que ponía su propio logotipo en mis papeles y ni siquiera hacía cobros recurrentes. Así que construí la aplicación que yo quería, y le puse el precio que a mí me gustaría pagar."',
  'lp.founderRolePre': 'Fundador de LevelWorks · Dueño de',
  'lp.founderRolePost': ', Filadelfia',
  'lp.fact1': 'al mes, todas las funciones, precio fijo',
  'lp.fact2Amount': '30 días',
  'lp.fact2': 'gratis, sin tarjeta para empezar',
  'lp.fact3': 'logotipos de LevelWorks en tus documentos',
  'lp.fact4Amount': '1 toque',
  'lp.fact4': 'del presupuesto firmado a la factura',

  // ---- faq ----
  'lp.faqEyebrow': 'Preguntas',
  'lp.faqTitle': 'Respuestas directas.',
  'lp.faq1Q': '¿Cuánto cuesta LevelWorks?',
  'lp.faq1A': 'Un solo plan de $5 al mes con todo incluido: presupuestos y facturas sin límite, firmas, pagos con tarjeta, cobro recurrente, avances con fotos, clientes, trabajos y notas. Una vez que entras, tu precio queda fijo. No hay niveles ni nada que desbloquear después.',
  'lp.faq2Q': '¿Hay prueba gratis?',
  'lp.faq2A': 'Sí. Cada cuenta nueva recibe 30 días gratis con acceso a todas las funciones, y no necesitas tarjeta para empezar. Si te registras con un enlace de referido son 60 días.',
  'lp.faq3Q': '¿Cómo firma el cliente un presupuesto?',
  'lp.faq3A': 'Le mandas un enlace por correo o por mensaje. Lo abre en su teléfono, tableta o computadora, revisa las partidas y firma con el dedo o con el ratón. A ti te llega un aviso en el momento en que queda firmado.',
  'lp.faq4Q': '¿Cómo me pagan?',
  'lp.faq4A': 'Mandas el enlace de la factura y tu cliente paga con tarjeta de crédito, Apple Pay o Google Pay. Los pagos van por Stripe y se depositan directo en tu cuenta de banco. Se aplican las comisiones normales de la tarjeta; LevelWorks no le agrega nada encima.',
  'lp.faq5Q': '¿Qué es el cobro recurrente?',
  'lp.faq5A': 'Para clientes con un contrato de servicio, como mantenimiento de aire acondicionado, jardinería o un contrato mensual, pones el monto y la fecha una sola vez y se le cobra a su tarjeta automáticamente. Si la tarjeta falla, se reintenta, te avisamos enseguida y el cliente queda marcado como atrasado en tu panel.',
  'lp.faq6Q': '¿Mis presupuestos van a llevar la marca de LevelWorks?',
  'lp.faq6A': 'No. Sube tu logotipo una vez y cada presupuesto, factura y avance lleva únicamente tu nombre y tu logotipo. Tu cliente trata contigo.',
  'lp.faq7Q': '¿Están seguros mis datos?',
  'lp.faq7A': 'Todos los datos van cifrados, tanto al viajar como al guardarse, y los datos de las tarjetas nunca pasan por nuestros servidores; los maneja por completo Stripe, el mismo procesador que usan empresas como Amazon y Shopify.',
  'lp.faq8Q': '¿Puedo cancelar cuando quiera?',
  'lp.faq8A': 'Sí. Sin contratos, cancelas desde tu panel cuando quieras, y tus datos siguen siendo tuyos.',

  // ---- final cta ----
  'lp.finalTitle': 'Manda tu primer presupuesto esta noche.',
  'lp.finalLead': 'Treinta días gratis, todas las funciones activas, sin tarjeta. Si no vale los cinco dólares, te vas y ya.',

  // ---- footer ----
  'lp.footerAbout': 'Presupuestos, firmas, facturas, pagos y cobro recurrente para contratistas. Hecha por un contratista en Filadelfia, Pensilvania.',
  'lp.footerProduct': 'Producto',
  'lp.footerAccount': 'Cuenta',
  'lp.footerCompany': 'Empresa',
  'lp.footerTerms': 'Términos',
  'lp.footerPrivacy': 'Privacidad',
  'lp.footerCopyright': '© {year} LevelWorks. Hecha para los oficios.',
  'lp.footerMade': 'Hecha en Filadelfia',

  // ---- mockup: estimate document ----
  'lp.mockBizLine': 'Con licencia y seguro · Bucks County, PA',
  'lp.mockEstimateNo': 'Presupuesto n.º 1042',
  'lp.mockDate': '6 sep 2026',
  'lp.mockPreparedFor': 'Preparado para',
  'lp.mockAddress': '118 Elm St, Doylestown',
  'lp.mockItem1': 'Preparación exterior y lavado a presión',
  'lp.mockItem1Sub': 'Raspar, lijar y sellar la madera descubierta',
  'lp.mockItem2': 'Fachada, 2 manos',
  'lp.mockItem2Sub': 'Sherwin-Williams Duration',
  'lp.mockItem3': 'Molduras y contraventanas',
  'lp.mockItem3Sub': '16 ventanas, 2 puertas',
  'lp.mockSubtotal': 'Subtotal',
  'lp.mockDeposit': 'Anticipo al firmar',
  'lp.mockTotal': 'Total',
  'lp.mockSignedAt': 'Firmado el 6 sep, 2:14 PM',
  'lp.mockSignHere': 'Firme aquí',
  'lp.mockApprovedPay': 'Aprobado · Pagar el anticipo',
  'lp.mockApproveSign': 'Aprobar y firmar',

  // ---- mockup: invoices ----
  'lp.mockInv1No': 'Factura n.º 1038',
  'lp.mockInv1Status': 'Enviada',
  'lp.mockInv1Line': 'Repintado de cocina · Dan Ortiz',
  'lp.mockInv1Due': 'Vence el 20 sep',
  'lp.mockInv2No': 'Factura n.º 1042',
  'lp.mockInv2Status': 'Pagada',
  'lp.mockInv2Line': 'Repintado exterior · Maria Keller',
  'lp.mockInv2Sub': 'Pagada con Visa ···4421 · 12 sep',
  'lp.mockProcessing': 'Procesamiento',
  'lp.mockProcessingSub': 'Stripe, pago con tarjeta',
  'lp.mockDeposited': 'Depositado en tu banco',
  'lp.mockDepositedSub': 'Ridgeline Painting · Cuenta de negocio',
  'lp.mockReceipt': 'Recibo',
  'lp.mockPaidInFull': 'Pagada por completo',

  // ---- mockup: signing ----
  'lp.mockSignEyebrow': 'Presupuesto n.º 1042 · $4,850.00',
  'lp.mockSignTitle': 'Aprobar este presupuesto',
  'lp.mockSignBubblePre': 'Al firmar acepta el alcance y el total de arriba.',
  'lp.mockSignBubblePost': 'recibirá el aviso al instante.',
  'lp.mockDrawSignature': 'Dibuje su firma',
  'lp.mockSignApprove': 'Firmar y aprobar',
  'lp.mockSignFine': 'Funciona en cualquier teléfono. Sin instalar nada.',
  'lp.mockSignPush': 'Notificación · hace un momento',

  // ---- mockup: recurring ----
  'lp.mockRecTitle': 'Cobro recurrente',
  'lp.mockRecActive': '4 activos',
  'lp.mockRec1': 'Mantenimiento de aire · Familia Grant',
  'lp.mockRec1Sub': 'Trimestral · sigue el 1 oct · Visa ···2210',
  'lp.mockRec2': 'Jardinería · Oakwood HOA',
  'lp.mockRec2Sub': 'Mensual · sigue el 15 sep · Mastercard ···8817',
  'lp.mockRec3': 'Tarjeta rechazada · Tom Reyes',
  'lp.mockRec3Sub': 'Se reintenta mañana · te avisamos a las 9:02 AM',
  'lp.mockRec3Tag': 'Atrasado',
  'lp.mockRec4': 'Hospedaje del sitio web · Bella Salon',
  'lp.mockRec4Sub': 'Anual · sigue el 1 mar · Amex ···1003',
  'lp.mockAutoPay': 'pago automático',
  'lp.mockEditSchedule': 'Editar el calendario',
  'lp.mockNewSchedule': '+ Nuevo cobro',

  // ---- mockup: photo updates ----
  'lp.mockPhotoEyebrow': 'Avance del trabajo · Exterior de los Keller',
  'lp.mockPhotoTitle': 'Día 3: segunda mano puesta',
  'lp.mockPhotoBubble': 'Hola Maria, la fachada quedó lista y se ve muy bien. Mañana seguimos con molduras y contraventanas, si el clima ayuda.',
  'lp.mockPhotoSignoff': '— Rob',
  'lp.mockPhotoSend': 'Enviar avance al cliente',
  'lp.mockPhotoFine': 'Las fotos se marcan como antes, durante y después',

  // ---- mockup: clients ----
  'lp.mockClientsTitle': 'Clientes',
  'lp.mockClientsPill': 'Con buscador, ordenados por actividad',
  'lp.mockClient1Sub': 'Repintado exterior · Firmado, anticipo pagado',
  'lp.mockClient2Sub': 'Repintado de cocina · Factura enviada',
  'lp.mockClient3Sub': 'Mantenimiento de aire · Trimestral',
  'lp.mockClient4Sub': 'Jardinería · Mensual',
  'lp.mockClient5Sub': 'Hospedaje · Anual',

  // ---- mockup: branding ----
  'lp.mockBrandSentPre': 'Enviado desde',
  'lp.mockBrandSentYour': 'tu',
  'lp.mockBrandSentPost': 'negocio',
  'lp.mockBrandNoBranding': 'Sin la marca de LevelWorks',
};
