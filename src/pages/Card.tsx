import { useEffect, useState } from 'react';
import { Mark } from '@/components/Mark';
import { useT } from '@/i18n';

/**
 * The business card.
 *
 * Eric pulls this up when someone asks for one: they point a camera at the QR,
 * land on this same page, and tap Save to contacts. The QR carries the URL
 * rather than the contact itself — a URL scans instantly from arm's length, and
 * it puts the app one tap away instead of only dropping a name in a phone.
 *
 * The QR is fetched once and inlined rather than used as an <img> so it cannot
 * show a broken square in a basement with one bar of signal; the fallback is an
 * <img> of the same file.
 */
export default function Card() {
  const t = useT();
  const [qr, setQr] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    fetch('/qr.svg')
      .then(r => (r.ok ? r.text() : Promise.reject(new Error('qr'))))
      .then(svg => {
        if (!alive) return;
        setQr(svg.replace(/<\?xml[^>]*\?>\s*/, '')
          .replace('<svg ', '<svg class="bc-qr-svg" shape-rendering="crispEdges" aria-hidden="true" '));
      })
      .catch(() => { /* the <img> fallback below covers it */ });
    return () => { alive = false; };
  }, []);

  useEffect(() => { document.title = 'Eric Connor — LevelWorks'; }, []);

  return (
    <main className="bc">
      <div className="bc-in">
        <a className="bc-mark" href="/">
          <Mark />
          <span>LevelWorks</span>
        </a>

        <div className="bc-who">
          <h1>Eric Connor</h1>
          <p>{t('bc.role')}</p>
        </div>

        <div className="bc-qr">
          {qr
            ? <div dangerouslySetInnerHTML={{ __html: qr }} />
            : <img src="/qr.svg" alt="" width={232} height={232} />}
        </div>
        <p className="bc-hint">{t('bc.point')}</p>

        <div className="bc-lines">
          <a href="mailto:support@levelworks.org">support@levelworks.org</a>
          <a href="https://levelworks.org">levelworks.org</a>
        </div>

        <a className="lv-btn pri lg wide" href="/levelworks.vcf" download>
          {t('bc.save')}
        </a>

        <div className="bc-links">
          <a href="/">{t('bc.seeApp')}</a>
          <a href="/app">{t('bc.startTrial')}</a>
        </div>

        <p className="bc-note">{t('bc.pitch')}</p>
      </div>
    </main>
  );
}
