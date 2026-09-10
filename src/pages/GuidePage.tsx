/**
 * The guides: /guides, /guides/:slug, /es/guias, /es/guias/:slug.
 *
 * One component for the index and the article, in both languages. The
 * language comes from the route, never from localStorage: a Spanish reader
 * who opens an English link gets the English page, with the switcher one tap
 * from the Spanish twin. Every one of these URLs is prerendered at build time
 * (scripts/prerender.mjs), so the HTML Google reads is the finished page.
 *
 * Same shell as the landing page — `.lw` tokens, the header, the footer —
 * because to a visitor it is the same site. Article styles are `.lw-guide-*`
 * in landing.css.
 */
import { useEffect } from 'react';
import { Link, Route, useParams } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { LanguageToggle } from '@/i18n';
import { GUIDES, GUIDES_BASE, GUIDE_UI, findGuide, guidePath, type Guide, type Lang } from '@/guides/content';
import './landing.css';

const SITE = 'https://levelworks.org';

function Mark() {
  return (
    <svg viewBox="0 0 28 28" fill="none" aria-hidden="true">
      <rect x="1.5" y="8.5" width="25" height="11" rx="3.5" stroke="#0b1220" strokeWidth="2" />
      <rect x="10" y="11" width="8" height="6" rx="2" fill="#2563eb" />
      <path d="M8.5 9v10M19.5 9v10" stroke="#0b1220" strokeWidth="1.5" strokeOpacity=".35" />
    </svg>
  );
}

/** Keeps the tab title and share tags right when the reader moves between guides without a reload. */
function useHead(title: string, desc: string, url: string) {
  useEffect(() => {
    document.title = title;
    const set = (sel: string, attr: string, val: string) => {
      const el = document.head.querySelector<HTMLElement>(sel);
      if (el) el.setAttribute(attr, val);
    };
    set('meta[name="description"]', 'content', desc);
    set('meta[property="og:title"]', 'content', title);
    set('meta[property="og:description"]', 'content', desc);
    set('meta[property="og:url"]', 'content', url);
    set('link[rel="canonical"]', 'href', url);
  }, [title, desc, url]);
}

function dateLabel(iso: string, lang: Lang) {
  const d = new Date(iso + 'T12:00:00Z');
  return d.toLocaleDateString(lang === 'es' ? 'es-US' : 'en-US', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' });
}

function Shell({ lang, sibling, children }: { lang: Lang; sibling: string; children: React.ReactNode }) {
  const ui = GUIDE_UI[lang];
  const home = lang === 'es' ? '/es' : '/';
  const signup = `${home}?signup=1`;
  return (
    <div className="lw lw-guide-shell">
      <header className="lw-hdr scrolled">
        <div className="lw-wrap">
          <a href={home} className="lw-logo" aria-label="LevelWorks">
            <Mark />
            <span>Level<b>Works</b></span>
          </a>
          <nav className="lw-nav" aria-label={ui.eyebrow}>
            <Link to={GUIDES_BASE[lang]}>{ui.eyebrow}</Link>
          </nav>
          <div className="lw-hdr-cta">
            <LanguageToggle className="lw-lang-fix" siblingHref={sibling} />
            <a className="lw-btn ghost signin" href={home}>{ui.signIn}</a>
            <a className="lw-btn pri hdr-cta-long" href={signup}>{ui.startTrial}</a>
            <a className="lw-btn pri hdr-cta-short" href={signup}>{ui.startTrialShort}</a>
          </div>
        </div>
      </header>

      {children}

      <footer className="lw-ft lw-guide-ft">
        <div className="lw-wrap">
          <div className="bot">
            <span>© {new Date().getFullYear()} LevelWorks</span>
            <span>
              <a href={home}>{ui.home}</a> · <Link to={GUIDES_BASE[lang]}>{ui.eyebrow}</Link> · <a href="/terms">Terms</a> · <a href="/privacy">Privacy</a>
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}

function Cta({ lang }: { lang: Lang }) {
  const ui = GUIDE_UI[lang];
  const signup = `${lang === 'es' ? '/es' : '/'}?signup=1`;
  return (
    <aside className="lw-guide-cta">
      <h3>{ui.ctaTitle}</h3>
      <p>{ui.ctaBody}</p>
      <a className="lw-btn pri" href={signup}>{ui.ctaButton} <ChevronRight size={18} /></a>
      <span className="fine">{ui.ctaFine}</span>
    </aside>
  );
}

function GuideCard({ g, lang }: { g: Guide; lang: Lang }) {
  const ui = GUIDE_UI[lang];
  const tx = g[lang];
  return (
    <Link to={guidePath(g, lang)} className="lw-guide-card">
      <h3>{tx.h1}</h3>
      <p>{tx.description}</p>
      <span className="more">{ui.readMore} <ChevronRight size={16} /></span>
    </Link>
  );
}

export function GuideIndex({ lang }: { lang: Lang }) {
  const ui = GUIDE_UI[lang];
  const other: Lang = lang === 'es' ? 'en' : 'es';
  useHead(`${ui.indexTitle} — LevelWorks`, ui.indexDesc, SITE + GUIDES_BASE[lang]);
  return (
    <Shell lang={lang} sibling={GUIDES_BASE[other]}>
      <main className="lw-guide-main">
        <div className="lw-wrap">
          <div className="lw-guide-head">
            <span className="lw-eyebrow">{ui.eyebrow}</span>
            <h1 className="lw-h2">{ui.indexH1}</h1>
            <p className="lw-lead">{ui.indexLead}</p>
          </div>
          <div className="lw-guide-grid">
            {GUIDES.map((g) => <GuideCard key={g.id} g={g} lang={lang} />)}
          </div>
          <Cta lang={lang} />
        </div>
      </main>
    </Shell>
  );
}

export function GuideArticle({ lang }: { lang: Lang }) {
  const { slug = '' } = useParams();
  const g = findGuide(lang, slug);
  const ui = GUIDE_UI[lang];
  const other: Lang = lang === 'es' ? 'en' : 'es';
  const tx = g ? g[lang] : null;
  useHead(tx ? `${tx.title} — LevelWorks` : 'LevelWorks', tx?.description ?? '', g ? SITE + guidePath(g, lang) : SITE);

  if (!g || !tx) {
    return <GuideIndex lang={lang} />;
  }

  const others = GUIDES.filter((x) => x.id !== g.id).slice(0, 3);
  // The tip block goes after the second section, where a reader who is
  // skimming has decided to stay; the product pitch comes at the end.
  const midpoint = Math.min(2, tx.blocks.length);

  return (
    <Shell lang={lang} sibling={guidePath(g, other)}>
      <main className="lw-guide-main">
        <div className="lw-wrap">
          <article className="lw-guide">
            <nav className="lw-guide-crumb" aria-label="Breadcrumb">
              <Link to={GUIDES_BASE[lang]}>{ui.eyebrow}</Link>
              <ChevronRight size={14} />
              <span>{tx.h1}</span>
            </nav>
            <h1 className="lw-h2">{tx.h1}</h1>
            <p className="lw-guide-meta">{ui.updated} {dateLabel(g.updated, lang)} · Eric Connor</p>
            <p className="lw-lead">{tx.intro}</p>

            {tx.blocks.map((b, i) => (
              <section key={i}>
                {b.h && <h2>{b.h}</h2>}
                {b.p?.map((p, j) => <p key={j}>{p}</p>)}
                {b.list && <ul>{b.list.map((li, j) => <li key={j}>{li}</li>)}</ul>}
                {b.steps && <ol>{b.steps.map((li, j) => <li key={j}>{li}</li>)}</ol>}
                {b.tip && <p className="lw-guide-tip">{b.tip}</p>}
                {i === midpoint - 1 && <Cta lang={lang} />}
              </section>
            ))}

            {tx.faq.length > 0 && (
              <section className="lw-guide-faq">
                <h2>{ui.faq}</h2>
                {tx.faq.map((f, i) => (
                  <div key={i}>
                    <h3>{f.q}</h3>
                    <p>{f.a}</p>
                  </div>
                ))}
              </section>
            )}
          </article>

          <section className="lw-guide-more">
            <h2 className="lw-h3">{ui.more}</h2>
            <div className="lw-guide-grid">
              {others.map((x) => <GuideCard key={x.id} g={x} lang={lang} />)}
            </div>
          </section>
        </div>
      </main>
    </Shell>
  );
}

/**
 * The four routes, shared by App.tsx and the SSR entry so they cannot drift.
 * React Router flattens the fragment when it builds the route tree.
 */
export function guideRoutes() {
  return (
    <>
      <Route path="/guides" element={<GuideIndex lang="en" />} />
      <Route path="/guides/:slug" element={<GuideArticle lang="en" />} />
      <Route path="/es/guias" element={<GuideIndex lang="es" />} />
      <Route path="/es/guias/:slug" element={<GuideArticle lang="es" />} />
    </>
  );
}
