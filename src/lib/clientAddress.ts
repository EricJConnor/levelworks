/**
 * The client's address on the document.
 *
 * Roofers and anyone else who quotes by the property asked for it: the address
 * is the job. The `estimates` and `invoices` tables have no address column and
 * adding one needs a migration nobody can run from the app, so the address
 * rides inside the existing `line_items` JSONB the same way `hidePrice` does —
 * stamped on every line, read back from the first line that carries one. That
 * means no migration, the public link reads it straight off the row, and the
 * invoice made from an estimate inherits it with the line items.
 *
 * Every line-item whitelist (DataContext, InvoiceContext, both builders) has to
 * carry `clientAddress` or it vanishes on save — the same trap `sourceText` and
 * `hidePrice` taught.
 */
export interface AddressedLine { clientAddress?: string }

/** The address the document carries, or an empty string. */
export const clientAddressOf = (items: AddressedLine[] | null | undefined): string => {
  for (const i of items || []) {
    const a = i && typeof i.clientAddress === 'string' ? i.clientAddress.trim() : '';
    if (a) return a;
  }
  return '';
};

/** Stamp the address onto every line so it is saved with them; strip it when blank. */
export const withClientAddress = <T extends AddressedLine>(items: T[], address: string): T[] => {
  const a = (address || '').trim();
  return items.map((i) => {
    const { clientAddress, ...rest } = i as T & { clientAddress?: string };
    return (a ? { ...rest, clientAddress: a } : rest) as T;
  });
};
