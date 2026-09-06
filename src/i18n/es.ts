/**
 * Spanish strings. Neutral Latin American Spanish, aimed at working trades in
 * the US: "presupuesto" for estimate, "factura" for invoice, "cliente" for
 * client. Anything missing here falls back to English automatically.
 */
import { common } from './es/common';
import { estimates } from './es/estimates';
import { lists } from './es/lists';
import { modals } from './es/modals';
import { pages } from './es/pages';
import { landing } from './es/landing';

export const es: Record<string, string> = {
  ...common, ...estimates, ...lists, ...modals, ...pages, ...landing,
};
