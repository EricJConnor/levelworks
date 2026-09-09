/**
 * /annual and /es/annual — where every ad click lands.
 *
 * One job: get a contractor on his phone to press one button. The page is
 * the ad continued: the same 9:47pm text, the same phone, the same $49. No
 * hero video, no animation beyond the counter changing. Screenshots are the
 * real app (marketing/shots), lazy below the fold.
 *
 * The button calls /api/annual-checkout and goes straight to Stripe; there is
 * no signup form before payment. UTM params on the URL ride along into the
 * checkout metadata so a purchase can be traced back to its ad.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { Mark } from '@/components/Mark';
import { useT, useLang, LanguageToggle } from '@/i18n';
import { trackEvent } from '@/lib/pixel';
import '@/pages/landing.css';
import './annual.css';

const CAP = 500;

/** Title and share tags for this page, restored when it unmounts. No Helmet dependency needed for one page. */
function useHead({ title, desc, url, lang }: { title: string; desc: string; url: string; lang: string }) {
  useEffect(() => {
    const was = document.title;
    document.title = title;
    const set = (sel: string, attr: string, val: string) => {
      let el = document.head.querySelector<HTMLElement>(sel);
      if (!el) { el = document.createElement(sel.startsWith('link') ? 'link' : 'meta'); const m = sel.match(/\[(\w+(?::\w+)?)="([^"]+)"\]/); if (m) el.setAttribute(m[1], m[2]); el.dataset.an = '1'; document.head.appendChild(el); }
      el.setAttribute(attr, val);
    };
    set('meta[name="description"]', 'content', desc);
    set('meta[name="robots"]', 'content', 'noindex');
    set('meta[property="og:title"]', 'content', title);
    set('meta[property="og:description"]', 'content', desc);
    set('meta[property="og:url"]', 'content', url);
    set('meta[property="og:image"]', 'content', 'https://levelworks.org/marketing/annual-og.png');
    set('meta[property="og:locale"]', 'content', lang === 'es' ? 'es_MX' : 'en_US');
    set('link[rel="canonical"]', 'href', url);
    return () => { document.title = was; document.head.querySelectorAll('[data-an]').forEach(e => e.remove()); };
  }, [title, desc, url, lang]);
}

type Count = { count: number; left: number; soldOut: boolean } | null;

function readUtm() {
  const q = new URLSearchParams(window.location.search);
  return {
    source: q.get('utm_source') || '', medium: q.get('utm_medium') || '',
    campaign: q.get('utm_campaign') || '', content: q.get('utm_content') || '',
  };
}

export default function AnnualPage() {
  const t = useT();
  const { lang } = useLang();
  const [count, setCount] = useState<Count>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const prev = useRef<number | null>(null);
  const [tick, setTick] = useState(false);

  // The live number: on load, then every 30s. Nothing is shown until it has
  // arrived, so there is never a flash of zero.
  useEffect(() => {
    let alive = true;
    const load = async () => {
      try {
        const r = await fetch('/api/annual-count', { cache: 'no-store' });
        if (!r.ok) return;
        const d = await r.json();
        if (!alive) return;
        if (prev.current !== null && d.count !== prev.current) { setTick(true); setTimeout(() => setTick(false), 600); }
        prev.current = d.count;
        setCount({ count: d.count, left: d.left, soldOut: d.soldOut });
      } catch { /* keep the last number */ }
    };
    load();
    const id = setInterval(load, 30000);
    return () => { alive = false; clearInterval(id); };
  }, []);

  const soldOut = !!count?.soldOut;
  const monthlyHref = (lang === 'es' ? '/es' : '/') + '?signup=1';

  const claim = useCallback(async () => {
    if (busy) return;
    if (soldOut) { window.location.assign(monthlyHref); return; }
    setBusy(true); setErr('');
    trackEvent('InitiateCheckout', { value: 49, currency: 'USD', content_name: 'LevelWorks Annual' });
    try {
      const r = await fetch('/api/annual-checkout', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lang, utm: readUtm() }),
      });
      const d = await r.json();
      if (r.status === 409) { setCount(c => ({ count: d.count ?? CAP, left: 0, soldOut: true })); setBusy(false); return; }
      if (!r.ok || !d.url) throw new Error(d.message || 'no url');
      window.location.assign(d.url);
    } catch (e) {
      setErr(t('an.error'));
      setBusy(false);
    }
  }, [busy, soldOut, lang, monthlyHref, t]);

  // Counter line. Under 50: how many claimed. 50 and up: how many left.
  let counterLine = t('an.spots');
  if (count && count.count >= CAP) counterLine = t('an.soldOut');
  else if (count && count.count >= 50) counterLine = t('an.left', { n: count.left });
  else if (count && count.count >= 25) counterLine = t('an.claimed', { n: count.count });

  const title = lang === 'es' ? 'Un año de LevelWorks por $49' : 'A year of LevelWorks for $49';
  const desc = t('an.sub');
  const url = lang === 'es' ? 'https://levelworks.org/es/annual' : 'https://levelworks.org/annual';
  const s = (n: string) => `/marketing/shots/${n}-${lang}.webp`;
  useHead({ title: `${title} · LevelWorks`, desc, url, lang });

  return (
    <div className="lw an">

      <header className="an-top">
        <a className="an-brand" href={lang === 'es' ? '/es' : '/'} aria-label="LevelWorks"><Mark size={24} /><span>Level<b>Works</b></span></a>
        <LanguageToggle />
      </header>

      <main>
        <section className="an-hero">
          <p className="an-label">{t('an.label')}</p>
          <h1 className="an-h1">{t('an.h1')}</h1>
          <p className="an-sub">{t('an.sub')}</p>

          <button type="button" className="lw-btn pri lg wide an-cta" onClick={claim} disabled={busy}>
            {busy ? t('an.ctaBusy') : soldOut ? t('an.ctaSold') : t('an.cta')}
          </button>
          <p className={`an-count${tick ? ' tick' : ''}`} aria-live="polite">{counterLine}</p>
          {err && <p className="an-err" role="alert">{err}</p>}
          <p className="an-secure">{t('an.secure')}</p>

          <figure className="an-phone">
            <img src={s('estimate')} width="390" height="844" alt={t('an.shot1')} fetchPriority="high" decoding="async" />
          </figure>
          <p className="an-story"><span>{t('an.story1')}</span> {t('an.story2')}</p>
        </section>

        <section className="an-feats" aria-label="Features">
          <div className="an-feat">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 3h7l5 5v13H7z" /><path d="M14 3v5h5M10 12h6M10 16h6" /></svg>
            <div><b>{t('an.f1')}</b><span>{t('an.f1d')}</span></div>
          </div>
          <div className="an-feat">
            <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="6" width="18" height="13" rx="2" /><path d="M3 10h18M7 15h4" /></svg>
            <div><b>{t('an.f2')}</b><span>{t('an.f2d')}</span></div>
          </div>
          <div className="an-feat">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 12a8 8 0 1 1-2.3-5.7" /><path d="M20 4v5h-5" /></svg>
            <div><b>{t('an.f3')}</b><span>{t('an.f3d')}</span></div>
          </div>
        </section>

        <section className="an-shots">
          <h2 className="an-h2">{t('an.shots')}</h2>
          <div className="an-shotrow">
            <figure><img src={s('estimate')} width="390" height="844" loading="lazy" decoding="async" alt={t('an.shot1')} /><figcaption>{t('an.shot1')}</figcaption></figure>
            <figure><img src={s('invoice')} width="390" height="844" loading="lazy" decoding="async" alt={t('an.shot2')} /><figcaption>{t('an.shot2')}</figcaption></figure>
            <figure><img src={s('recurring')} width="390" height="844" loading="lazy" decoding="async" alt={t('an.shot3')} /><figcaption>{t('an.shot3')}</figcaption></figure>
          </div>
        </section>

        <section className="an-why">
          <h2 className="an-h2">{t('an.whyH')}</h2>
          <p>{t('an.why')}</p>
          <p className="an-sig">{t('an.whySig')}</p>
        </section>

        <section className="an-faq">
          <h2 className="an-h2">{t('an.faqH')}</h2>
          <dl>
            <dt>{t('an.q1')}</dt><dd>{t('an.a1')}</dd>
            <dt>{t('an.q2')}</dt><dd>{t('an.a2')}</dd>
            <dt>{t('an.q3')}</dt><dd>{t('an.a3')}</dd>
          </dl>
        </section>

        <section className="an-bottom">
          <button type="button" className="lw-btn pri lg wide an-cta" onClick={claim} disabled={busy}>
            {busy ? t('an.ctaBusy') : soldOut ? t('an.ctaSold') : t('an.cta')}
          </button>
          <p className="an-count">{counterLine}</p>
          <p className="an-trial">{t('an.trial')} <a href={monthlyHref}>{t('an.trialLink')}</a>{t('an.trialTail')}</p>
        </section>
      </main>

      <footer className="an-foot">
        <a href="/terms">{t('an.terms')}</a>
        <a href="/privacy">{t('an.privacy')}</a>
        <a href={monthlyHref}>{t('an.monthly')}</a>
      </footer>
    </div>
  );
}
