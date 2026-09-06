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
 * The flags.
 *
 * Drawn as SVG rather than emoji on purpose: flag emoji do not render as flags
 * on Windows at all — Chrome there shows the two letters instead — so a laptop
 * user would see "US" where a Mac user sees a flag. These are simplified to
 * read at 20px: the stars and the eagle are invisible at this size anyway.
 */
const FlagUS: React.FC = () => (
  <svg viewBox="0 0 20 14" aria-hidden="true">
    <rect width="20" height="14" fill="#b22234" />
    {[1, 3, 5, 7, 9, 11].map((y) => (
      <rect key={y} y={y} width="20" height="1" fill="#fff" />
    ))}
    <rect width="8.6" height="7.6" fill="#3c3b6e" />
  </svg>
);

const FlagMX: React.FC = () => (
  <svg viewBox="0 0 20 14" aria-hidden="true">
    <rect width="20" height="14" fill="#fff" />
    <rect width="6.67" height="14" fill="#006847" />
    <rect x="13.33" width="6.67" height="14" fill="#ce1126" />
    <circle cx="10" cy="7" r="1.7" fill="#8c6239" />
  </svg>
);

interface LangOption { code: Lang; abbr: string; name: string; Flag: React.FC }

/**
 * Which flag stands for Spanish is a judgment call, not a fact: language is not
 * country. Mexico is used because it is far the largest share of Spanish-speaking
 * trades in the US and reads instantly to them. Swapping it is this one line.
 */
const LANGS: LangOption[] = [
  { code: 'en', abbr: 'EN', name: 'English', Flag: FlagUS },
  { code: 'es', abbr: 'ES', name: 'Español', Flag: FlagMX },
];

/**
 * The switcher: the flag you are in now, its abbreviation, and a chevron. Open
 * it and the other language is one tap away. The abbreviation carries the
 * meaning — the flag is what makes it findable at a glance.
 */
export const LanguageToggle: React.FC<{ className?: string }> = ({ className }) => {
  const { lang, setLang } = useLang();
  const [open, setOpen] = useState(false);
  const ref = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const current = LANGS.find((l) => l.code === lang) || LANGS[0];
  const others = LANGS.filter((l) => l.code !== lang);

  return (
    <div className={`lv-lang${className ? ' ' + className : ''}`} ref={ref}>
      <button
        type="button"
        className="lv-lang-btn"
        onClick={() => setOpen(!open)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`${current.name} — Language / Idioma`}
      >
        <span className="lv-flag"><current.Flag /></span>
        <span className="lv-lang-abbr">{current.abbr}</span>
        <svg className="lv-lang-chev" viewBox="0 0 12 12" aria-hidden="true">
          <path d="M3 4.5 6 8l3-3.5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {open && (
        <div className="lv-lang-menu" role="menu">
          {others.map((o) => (
            <button
              key={o.code}
              type="button"
              role="menuitem"
              onClick={() => { setLang(o.code); setOpen(false); }}
            >
              <span className="lv-flag"><o.Flag /></span>
              <span className="lv-lang-abbr">{o.abbr}</span>
              <span className="lv-lang-name">{o.name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
