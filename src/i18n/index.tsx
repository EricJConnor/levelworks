/**
 * Language switching for LevelWorks.
 *
 * Deliberately hand-rolled rather than react-i18next: the whole need is one
 * flat dictionary, one toggle, and a `t()` function. That is ~80 lines and no
 * dependency.
 *
 * Rules that matter:
 * - A missing Spanish key falls back to English, never to a raw key. A screen
 *   half-translated is survivable; `est.sendToClient` printed at a client is not.
 * - The choice is read synchronously in the useState initializer, so the first
 *   render is already in the right language — a Spanish speaker never sees a
 *   flash of English.
 * - `<html lang>` is kept in step so browsers, screen readers and Google all
 *   know what language the page is in.
 */
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { en } from './en';
import { es } from './es';

export type Lang = 'en' | 'es';

const DICTS: Record<Lang, Record<string, string>> = { en, es };
const STORAGE_KEY = 'lw-lang';

/** The user's stored choice, else their browser's language, else English. */
export function detectLang(): Lang {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === 'en' || saved === 'es') return saved;
  } catch {
    /* private mode or blocked storage — fall through to the browser hint */
  }
  const nav = typeof navigator !== 'undefined' ? (navigator.languages?.[0] || navigator.language || '') : '';
  return nav.toLowerCase().startsWith('es') ? 'es' : 'en';
}

interface Ctx {
  lang: Lang;
  setLang: (l: Lang) => void;
  /** Translate a key. `vars` fills {placeholders}. */
  t: (key: string, vars?: Record<string, string | number>) => string;
}

const LangContext = createContext<Ctx | null>(null);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [lang, setLangState] = useState<Lang>(() => detectLang());

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    try { localStorage.setItem(STORAGE_KEY, l); } catch { /* nothing to do */ }
  }, []);

  const t = useCallback((key: string, vars?: Record<string, string | number>) => {
    const raw = DICTS[lang][key] ?? DICTS.en[key] ?? key;
    if (!vars) return raw;
    return raw.replace(/\{(\w+)\}/g, (m, name) => (name in vars ? String(vars[name]) : m));
  }, [lang]);

  const value = useMemo(() => ({ lang, setLang, t }), [lang, setLang, t]);
  return <LangContext.Provider value={value}>{children}</LangContext.Provider>;
};

/**
 * Usable outside the provider so a component can never crash for want of a
 * translation — it just renders English.
 */
export function useLang(): Ctx {
  const ctx = useContext(LangContext);
  if (ctx) return ctx;
  return {
    lang: 'en',
    setLang: () => {},
    t: (key, vars) => {
      const raw = en[key] ?? key;
      return vars ? raw.replace(/\{(\w+)\}/g, (m, n) => (n in vars ? String(vars[n]) : m)) : raw;
    },
  };
}

/** Shorthand for the common case. */
export function useT() {
  return useLang().t;
}

/**
 * The toggle. Two words, always both visible, so a Spanish speaker can find it
 * without reading English — the point of the whole feature.
 */
export const LanguageToggle: React.FC<{ className?: string }> = ({ className }) => {
  const { lang, setLang } = useLang();
  return (
    <div className={`lv-lang${className ? ' ' + className : ''}`} role="group" aria-label="Language / Idioma">
      <button
        type="button"
        className={lang === 'en' ? 'on' : ''}
        aria-pressed={lang === 'en'}
        onClick={() => setLang('en')}
      >
        EN
      </button>
      <button
        type="button"
        className={lang === 'es' ? 'on' : ''}
        aria-pressed={lang === 'es'}
        onClick={() => setLang('es')}
      >
        ES
      </button>
    </div>
  );
};
