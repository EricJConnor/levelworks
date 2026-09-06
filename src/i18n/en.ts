/**
 * English source strings. Each area owns one file so several screens can be
 * translated at once without stepping on each other.
 */
import { common } from './en/common';
import { estimates } from './en/estimates';
import { lists } from './en/lists';
import { modals } from './en/modals';
import { pages } from './en/pages';
import { landing } from './en/landing';

export const en: Record<string, string> = {
  ...common, ...estimates, ...lists, ...modals, ...pages, ...landing,
};
