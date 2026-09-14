/**
 * Whether the client's copy shows a price on every line, or only the total.
 *
 * A lot of contractors quote lump sum on purpose: a priced line invites the
 * client to shop it, cut it, or argue it. The switch lives on the document
 * itself, carried as `hidePrice` on each line item inside the existing
 * `line_items` JSONB, so it needs no migration, travels with the estimate to
 * the invoice made from it, and the public link reads it straight off the row.
 *
 * The contractor always sees every price on his own side. This only changes
 * what the client sees.
 */
export interface PricedLine { total?: number; quantity?: number; rate?: number; hidePrice?: boolean }

const KEY = 'lw-line-prices';

/** The document's setting: prices show unless a line says otherwise. */
export const linePricesShown = (items: PricedLine[] | null | undefined): boolean =>
  !(items || []).some((i) => i && i.hidePrice === true);

/** Stamp the document's setting onto every line so it is saved with them. */
export const withLinePrices = <T extends PricedLine>(items: T[], show: boolean): T[] =>
  items.map((i) => {
    const { hidePrice, ...rest } = i as T & { hidePrice?: boolean };
    return (show ? rest : { ...rest, hidePrice: true }) as T;
  });

/**
 * Whether one line prints an amount on the client's copy. A line at $0 never
 * does — "$0.00" beside a description reads as broken, and it is exactly the
 * workaround people used to get a lump sum before the switch existed.
 */
export const lineAmountShown = (item: PricedLine, show: boolean): boolean => {
  if (!show) return false;
  const total = Number(item.total);
  const derived = (Number(item.quantity) || 0) * (Number(item.rate) || 0);
  return (isNaN(total) ? derived : total) > 0 || derived > 0;
};

/** What the contractor used last time, so the next estimate opens the same way. */
export const rememberedLinePrices = (): boolean => {
  try { return localStorage.getItem(KEY) !== 'off'; } catch { return true; }
};
export const rememberLinePrices = (show: boolean) => {
  try { localStorage.setItem(KEY, show ? 'on' : 'off'); } catch { /* private mode */ }
};
