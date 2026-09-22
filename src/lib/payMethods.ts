/**
 * Which ways the client may pay one invoice: card, bank transfer, or both.
 *
 * The roofer's ask, and it is about money rather than convenience. A card
 * costs him 2.9% plus 30 cents. A bank transfer costs 0.8% capped at $5. On a
 * $6,000 roof that is $174 against $5, and on a $20,000 job it is $580 against
 * $5, because the cap does not move. He does not care on a $300 repair and he
 * cares enormously on a full roof, so the choice belongs to him, per invoice.
 *
 * LevelWorks adds nothing to either. Joist charges 3.49% plus 49 cents; taking
 * a cut of the one payment method people choose specifically to avoid fees
 * would defeat the point of offering it.
 *
 * Like `hidePrice` and `clientAddress`, the setting is stamped on every line
 * item inside the existing `line_items` JSONB, so there is no migration, the
 * public link reads it straight off the row, and converting an estimate to an
 * invoice carries it for free. Every line-item whitelist has to carry
 * `payMethods` or it vanishes on save.
 */
export type PayMethod = 'card' | 'bank' | 'both';

export interface PayableLine { payMethods?: PayMethod }

const KEY = 'lw-pay-methods';
const VALID: PayMethod[] = ['card', 'bank', 'both'];

const clean = (v: unknown): PayMethod | null =>
  VALID.includes(v as PayMethod) ? (v as PayMethod) : null;

/**
 * The document's setting. Read from the first line that carries one, so a line
 * added after the choice was made does not change the answer. Anything written
 * before this existed has no stamp at all and means card, which is what those
 * invoices already offered.
 */
export const payMethodsOf = (items: PayableLine[] | null | undefined): PayMethod =>
  stampedPayMethods(items) || 'card';

/**
 * The stamp itself, or null when the lines carry none. The builder needs the
 * difference: an estimate converted to an invoice has never been stamped, and
 * treating that as "card" silently took the bank option off every converted
 * invoice, which is exactly the invoice a roofer wants paid by bank.
 */
export const stampedPayMethods = (items: PayableLine[] | null | undefined): PayMethod | null => {
  for (const i of items || []) {
    const v = clean(i?.payMethods);
    if (v) return v;
  }
  return null;
};

/** Stamp the document's setting onto every line so it is saved with them. */
export const withPayMethods = <T extends PayableLine>(items: T[], method: PayMethod): T[] =>
  items.map((i) => ({ ...i, payMethods: method }));

/** Does this invoice accept a card? A bank transfer? */
export const allowsCard = (m: PayMethod) => m === 'card' || m === 'both';
export const allowsBank = (m: PayMethod) => m === 'bank' || m === 'both';

/** What he chose last time, so the next invoice opens the same way. */
export const rememberedPayMethods = (): PayMethod => {
  try { return clean(localStorage.getItem(KEY)) || 'both'; } catch { return 'both'; }
};
export const rememberPayMethods = (m: PayMethod) => {
  try { localStorage.setItem(KEY, m); } catch { /* private mode */ }
};

/**
 * What a bank transfer actually costs on an amount, for the line the builder
 * shows him. Stripe's ACH is 0.8% capped at $5; the card comparison is the
 * platform's own 2.9% + 30c, which is what he pays today.
 */
export const bankFee = (total: number) => Math.min(Math.max(total, 0) * 0.008, 5);
export const cardFee = (total: number) => (total > 0 ? total * 0.029 + 0.3 : 0);
