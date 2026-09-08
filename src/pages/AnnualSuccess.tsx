/**
 * /annual/success?session_id=cs_…  (and /es/annual/success)
 *
 * "You're in. Check your email for your login link." Fires the Meta Purchase
 * event with the Stripe session id as eventID, so it dedupes against the
 * same event the webhook sends through the Conversions API.
 */
import { useEffect } from 'react';
import { Mark } from '@/components/Mark';
import { useT, useLang, LanguageToggle } from '@/i18n';
import { trackEvent } from '@/lib/pixel';
import '@/pages/landing.css';
import './annual.css';

export default function AnnualSuccess() {
  const t = useT();
  const { lang } = useLang();

  useEffect(() => {
    document.title = (lang === 'es' ? 'Ya estás dentro' : 'You’re in') + ' · LevelWorks';
    const sid = new URLSearchParams(window.location.search).get('session_id') || '';
    // Fire once per session id, even if the page is refreshed.
    const key = 'lw49-purchase-' + sid;
    if (!sid) return;
    try { if (sessionStorage.getItem(key)) return; sessionStorage.setItem(key, '1'); } catch { /* fire anyway */ }
    trackEvent('Purchase', { value: 49, currency: 'USD', content_name: 'LevelWorks Annual', content_ids: ['annual_49'], num_items: 1 }, sid);
  }, [lang]);

  return (
    <div className="lw an">
      <header className="an-top">
        <a className="an-brand" href={lang === 'es' ? '/es' : '/'} aria-label="LevelWorks"><Mark size={24} /><span>Level<b>Works</b></span></a>
        <LanguageToggle />
      </header>
      <main className="an-ok">
        <div className="an-check" aria-hidden="true">✓</div>
        <h1>{t('an.okH')}</h1>
        <p>{t('an.okNew')}</p>
        <p>{t('an.okExisting')}</p>
        <a className="lw-btn pri lg" href="/app">{t('an.okBtn')}</a>
        <small>{t('an.okSpam')}</small>
      </main>
    </div>
  );
}
