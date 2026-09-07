/**
 * The estimate builder and the invoice builder.
 *
 * `est.` covers the estimate builder and the shell both builders share (they are
 * deliberate twins — same section cards, same line items, same action bar), so a
 * string that appears in both is defined once here. `inv.` is invoice-only.
 */
export const estimates: Record<string, string> = {
  // --- shell / header ---
  'est.editingEstimate': 'Editing estimate',
  'est.untitled': 'Untitled estimate',
  'est.totals': 'Totals',
  'est.itemCount': '{n} item',
  'est.itemsCount': '{n} items',
  'est.taxRatePercent': 'Tax rate percent',
  'est.depositAmount': 'Deposit amount',

  // --- client section ---
  'est.savedClients': 'Saved clients',
  'est.chooseClient': 'Choose a client',
  'est.clientNamePlaceholder': 'Maria Keller',
  'est.emailPlaceholder': 'client@email.com',
  'est.phonePlaceholder': '(555) 123-4567',
  'est.projectPlaceholder': 'Exterior repaint',

  // --- the work ---
  'est.theWork': 'The work',
  'est.addItem': 'Add item',
  'est.addAnotherItem': 'Add another item',
  'est.item': 'Item',
  'est.removeItem': 'Remove item',
  'est.removeItemN': 'Remove item {n}',
  'est.describePlaceholder': 'Describe the work — materials, prep, coats, anything the client should see',

  // --- section titles on a line item ---
  'est.addSection': 'Add a section',
  'est.savedSections': 'Saved sections',
  'est.newSection': '+ New',
  'est.sectionPlaceholder': 'e.g. Kitchen',
  'est.noSavedSections': 'No saved sections yet — add your first above.',
  'est.removeSection': 'Remove section',

  // --- photos ---
  'est.projectPhotos': 'Project photos',
  'est.projectPhoto': 'Project photo',
  'est.noPhotos': 'No photos yet. Add job-site photos and they go out with the estimate.',
  'est.deletePhoto': 'Delete photo',
  'est.deletePhotoConfirm': 'Delete this photo?',
  'est.photoLabelPlaceholder': 'Add a label',

  // --- action bar ---
  'est.previewHint': 'Save and see it the way your client will',
  'est.convertToInvoice': 'Convert to invoice',
  'est.sendToClient': 'Send to client',

  // --- the client's document ---
  'est.clientView': 'Client view',
  'est.whatClientSees': 'This is what your client sees',
  'est.yourBusiness': 'Your Business',
  'est.estimateNumber': 'Estimate #{n}',
  'est.draftRef': 'DRAFT',
  'est.preparedFor': 'Prepared for',
  'est.taxPercent': 'Tax ({p}%)',
  'est.depositAtSigning': 'Deposit due at signing',
  'est.balanceOnCompletion': 'Balance on completion',
  'est.thanks': 'We appreciate the opportunity to work with you. Thanks for considering us.',

  // --- toasts ---
  'est.clientNameNeeded': 'Client name needed',
  'est.clientNameNeededBody': 'Add the client’s name before saving.',
  'est.projectNameNeeded': 'Project name needed',
  'est.projectNameNeededBody': 'Give this estimate a project name so you can find it later.',
  'est.clientEmailNeeded': 'Client email needed',
  'est.clientEmailNeededBody': 'Add an email address to send this estimate.',
  'est.addALineItem': 'Add a line item',
  'est.addALineItemBody': 'Every estimate needs at least one item with a description and a quantity.',
  'est.couldNotSave': 'Could not save',
  'est.couldNotSaveBody': 'Something went wrong saving this estimate.',
  'est.saved': 'Saved',
  'est.savedBody': 'This estimate is in your list.',
  'est.couldNotSend': 'Could not send',
  'est.couldNotSendBody': 'This estimate could not be prepared for sending. Try again.',

  // --- invoice builder ---
  'inv.untitled': 'Untitled invoice',
  'inv.details': 'Invoice details',
  'inv.notesPlaceholder': 'Payment terms, or anything else the client should know',
  'inv.emailOptional': 'Optional here — you can send this invoice later from the Invoices list.',
  'inv.converting': 'Converting…',
  'inv.sendInvoice': 'Send invoice',
  'inv.fillRequired': 'Please fill in all required fields',
  'inv.created': 'Invoice created',
  'inv.createdBody': 'You can send it from the Invoices list.',
  'inv.couldNotCreate': 'Error creating invoice',
  'inv.couldNotSend': 'Error sending invoice',
  'inv.sent': 'Invoice sent',
  'inv.sentWithWarnings': 'Invoice sent with warnings',

  // --- translate button ---
  'tr.whichCopy': 'Which copy',
  'tr.yourWords': 'Your words',
  'tr.clientCopy': "Client's copy",
  'tr.editingYours': 'You are editing what you originally wrote. The client keeps the translated copy until you translate again.',
  'tr.editedSince': 'You have edited your original since translating. Translate again so the client copy matches.',
  'tr.readingClientCopy': 'This is what the client sees. Your own words are under “Your words”.',
  'tr.needsTranslating': 'Not translated yet',
  'tr.allCurrent': 'Everything is up to date',
  'tr.allCurrentBody': 'The client copy already matches what you wrote. Edit a line first if you want to change it.',
  'tr.clientCopyReadOnly': 'This is what the client sees. To change it, edit under “Your words” and translate again.',
  'tr.toEnglish': 'Translate to English',
  'tr.toSpanish': 'Traducir al español',
  'tr.translating': 'Translating…',
  'tr.title': 'Check the translation',
  'tr.intro': 'Here is the work in English. Look it over and apply it, or cancel and nothing changes.',
  'tr.original': 'Original',
  'tr.translated': 'Translation',
  'tr.apply': 'Apply translation',
  'tr.nothingToTranslate': 'Nothing to translate',
  'tr.nothingToTranslateBody': 'Write the description on at least one line item first.',
  'tr.failed': 'Could not translate',
  'tr.applied': 'Translation applied',
  'tr.appliedBody': 'Check the amounts before you send.',
};
