/**
 * The estimate and invoice builders, Spanish.
 *
 * This is the screen a Spanish-speaking contractor lives on, so the wording is
 * the wording used on a real job, not textbook Spanish:
 *   "el trabajo" for the work, "partida" for a line item, "anticipo" for the
 *   deposit, "saldo al terminar" for the balance on completion.
 *
 * Placeholders stay as realistic sample data, translated where they are words
 * ("Repintado exterior") and left alone where they are formats ("(555) 123-4567").
 */
export const estimates: Record<string, string> = {
  // --- shell / header ---
  'est.editingEstimate': 'Editando presupuesto',
  'est.untitled': 'Presupuesto sin título',
  'est.totals': 'Totales',
  'est.itemCount': '{n} partida',
  'est.itemsCount': '{n} partidas',
  'est.taxRatePercent': 'Porcentaje de impuesto',
  'est.depositAmount': 'Monto del anticipo',

  // --- client section ---
  'est.savedClients': 'Clientes guardados',
  'est.chooseClient': 'Elige un cliente',
  'est.clientNamePlaceholder': 'María Keller',
  'est.emailPlaceholder': 'cliente@correo.com',
  'est.phonePlaceholder': '(555) 123-4567',
  'est.projectPlaceholder': 'Repintado exterior',

  // --- the work ---
  'est.theWork': 'El trabajo',
  'est.addItem': 'Agregar partida',
  'est.addAnotherItem': 'Agregar otra partida',
  'est.item': 'Partida',
  'est.removeItem': 'Quitar partida',
  'est.removeItemN': 'Quitar la partida {n}',
  'est.describePlaceholder': 'Describe el trabajo — materiales, preparación, manos de pintura, todo lo que el cliente deba ver',

  // --- section titles on a line item ---
  'est.addSection': 'Agregar sección',
  'est.savedSections': 'Secciones guardadas',
  'est.newSection': '+ Nueva',
  'est.sectionPlaceholder': 'ej. Cocina',
  'est.noSavedSections': 'Aún no hay secciones guardadas — agrega la primera arriba.',
  'est.removeSection': 'Quitar sección',

  // --- photos ---
  'est.projectPhotos': 'Fotos del proyecto',
  'est.projectPhoto': 'Foto del proyecto',
  'est.noPhotos': 'Todavía no hay fotos. Agrega fotos de la obra y se envían junto con el presupuesto.',
  'est.deletePhoto': 'Eliminar foto',
  'est.deletePhotoConfirm': '¿Eliminar esta foto?',
  'est.photoLabelPlaceholder': 'Ponle un nombre',

  // --- action bar ---
  'est.previewHint': 'Guarda y míralo como lo verá tu cliente',
  'est.convertToInvoice': 'Convertir en factura',
  'est.sendToClient': 'Enviar al cliente',

  // --- the client's document ---
  'est.clientView': 'Vista del cliente',
  'est.whatClientSees': 'Esto es lo que ve tu cliente',
  'est.yourBusiness': 'Tu negocio',
  'est.estimateNumber': 'Presupuesto n.º {n}',
  'est.draftRef': 'BORRADOR',
  'est.preparedFor': 'Preparado para',
  'est.taxPercent': 'Impuesto ({p}%)',
  'est.depositAtSigning': 'Anticipo al firmar',
  'est.balanceOnCompletion': 'Saldo al terminar',
  'est.thanks': 'Agradecemos la oportunidad de trabajar contigo. Gracias por considerarnos.',

  // --- toasts ---
  'est.clientNameNeeded': 'Falta el nombre del cliente',
  'est.clientNameNeededBody': 'Escribe el nombre del cliente antes de guardar.',
  'est.projectNameNeeded': 'Falta el nombre del proyecto',
  'est.projectNameNeededBody': 'Ponle un nombre al proyecto para que puedas encontrarlo después.',
  'est.clientEmailNeeded': 'Falta el correo del cliente',
  'est.clientEmailNeededBody': 'Agrega un correo electrónico para poder enviar este presupuesto.',
  'est.addALineItem': 'Agrega una partida',
  'est.addALineItemBody': 'Todo presupuesto necesita al menos una partida con descripción y cantidad.',
  'est.couldNotSave': 'No se pudo guardar',
  'est.couldNotSaveBody': 'Algo salió mal al guardar este presupuesto.',
  'est.saved': 'Guardado',
  'est.savedBody': 'Este presupuesto ya está en tu lista.',
  'est.couldNotSend': 'No se pudo enviar',
  'est.couldNotSendBody': 'No se pudo preparar este presupuesto para enviarlo. Inténtalo de nuevo.',

  // --- invoice builder ---
  'inv.untitled': 'Factura sin título',
  'inv.details': 'Datos de la factura',
  'inv.notesPlaceholder': 'Condiciones de pago, o cualquier otra cosa que el cliente deba saber',
  'inv.emailOptional': 'Opcional aquí — puedes enviar esta factura después desde la lista de Facturas.',
  'inv.converting': 'Convirtiendo…',
  'inv.sendInvoice': 'Enviar factura',
  'inv.fillRequired': 'Completa todos los campos obligatorios',
  'inv.created': 'Factura creada',
  'inv.createdBody': 'Puedes enviarla desde la lista de Facturas.',
  'inv.couldNotCreate': 'Error al crear la factura',
  'inv.couldNotSend': 'Error al enviar la factura',
  'inv.sent': 'Factura enviada',
  'inv.sentWithWarnings': 'Factura enviada con advertencias',

  // --- translate button (wired in below the action bar) ---
  'tr.toEnglish': 'Traducir al inglés',
  'tr.toSpanish': 'Translate to Spanish',
  'tr.translating': 'Traduciendo…',
  'tr.title': 'Revisa la traducción',
  'tr.intro': 'Así queda el trabajo en inglés. Revísalo y aplícalo, o cancela y no cambia nada.',
  'tr.original': 'Original',
  'tr.translated': 'Traducción',
  'tr.apply': 'Aplicar traducción',
  'tr.nothingToTranslate': 'No hay nada que traducir',
  'tr.nothingToTranslateBody': 'Escribe la descripción de al menos una partida primero.',
  'tr.failed': 'No se pudo traducir',
  'tr.applied': 'Traducción aplicada',
  'tr.appliedBody': 'Revisa los montos antes de enviar.',
};
