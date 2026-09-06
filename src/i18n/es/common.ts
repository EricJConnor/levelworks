/**
 * Shared vocabulary, Spanish.
 *
 * Register: how a contractor talks to another contractor — direct, no
 * corporate padding. Second person "tú" throughout (usted reads like a bank
 * letter); the client-facing document uses no pronoun at all where possible.
 *
 * Terms fixed on purpose:
 *   estimate  -> presupuesto   (never "estimado", which means "dear/esteemed")
 *   invoice   -> factura
 *   deposit   -> anticipo      (understood everywhere; "depósito" reads bank)
 *   line item -> partida
 *   quantity  -> cantidad, abbreviated Cant. to fit the same column
 */
export const common: Record<string, string> = {
  // actions
  'a.save': 'Guardar',
  'a.saving': 'Guardando…',
  'a.cancel': 'Cancelar',
  'a.close': 'Cerrar',
  'a.edit': 'Editar',
  'a.delete': 'Eliminar',
  'a.deleting': 'Eliminando…',
  'a.send': 'Enviar',
  'a.sending': 'Enviando…',
  'a.resend': 'Reenviar',
  'a.view': 'Ver',
  'a.preview': 'Vista previa',
  'a.back': 'Atrás',
  'a.next': 'Siguiente',
  'a.done': 'Listo',
  'a.add': 'Agregar',
  'a.copy': 'Copiar',
  'a.copied': 'Copiado',
  'a.copyLink': 'Copiar enlace',
  'a.search': 'Buscar',
  'a.confirm': 'Confirmar',
  'a.continue': 'Continuar',
  'a.skip': 'Omitir',
  'a.retry': 'Intentar de nuevo',
  'a.upload': 'Subir',
  'a.camera': 'Cámara',
  'a.loading': 'Cargando…',
  'a.signIn': 'Iniciar sesión',
  'a.signOut': 'Cerrar sesión',
  'a.viewAll': 'Ver todos',
  'a.clearFilters': 'Quitar filtros',

  // status
  's.draft': 'Borrador',
  's.sent': 'Enviado',
  's.approved': 'Aprobado',
  's.rejected': 'Rechazado',
  's.paid': 'Pagada',
  's.unpaid': 'Sin pagar',
  's.partlyPaid': 'Pago parcial',
  's.overdue': 'Vencida',
  's.pastDue': 'Atrasado',
  's.active': 'Activa',
  's.cancelled': 'Cancelada',
  's.signed': 'Firmado',

  // money / documents
  'm.subtotal': 'Subtotal',
  'm.tax': 'Impuesto',
  'm.total': 'Total',
  'm.deposit': 'Anticipo',
  'm.balanceDue': 'Saldo pendiente',
  'm.amount': 'Monto',
  'm.qty': 'Cant.',
  'm.rate': 'Precio',
  'm.lineTotal': 'Total de partida',
  'm.estimate': 'Presupuesto',
  'm.invoice': 'Factura',
  'm.client': 'Cliente',
  'm.project': 'Proyecto',
  'm.date': 'Fecha',
  'm.dueDate': 'Fecha de vencimiento',
  'm.notes': 'Notas',
  'm.photos': 'Fotos',
  'm.description': 'Descripción',
  'm.name': 'Nombre',
  'm.email': 'Correo',
  'm.phone': 'Teléfono',
  'm.address': 'Dirección',

  // shell
  'nav.dashboard': 'Inicio',
  'nav.estimates': 'Presupuestos',
  'nav.invoices': 'Facturas',
  'nav.clients': 'Clientes',
  'nav.photos': 'Fotos',
  'nav.notes': 'Notas',
  'nav.more': 'Más',
  'nav.account': 'Cuenta',
  'nav.help': 'Ayuda',
  'nav.notifications': 'Notificaciones',
  'nav.newEstimate': 'Nuevo presupuesto',
  'nav.newInvoice': 'Nueva factura',
  'nav.invoice': 'Factura',
  'nav.addToPhone': 'Agregar al teléfono',
  'nav.language': 'Idioma',

  // gate
  'gate.title': 'Inicia sesión para continuar',
  'gate.body': 'Tus presupuestos y clientes te esperan.',
  'gate.backHome': 'Volver al inicio',

  // errors
  'e.somethingWrong': 'Algo salió mal',
  'e.tryAgain': 'Inténtalo de nuevo.',
  'e.required': 'Este campo es obligatorio',
};
