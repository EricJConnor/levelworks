/**
 * /annual/success?session_id=cs_…  (and /es/annual/success)
 *
 * The screen after paying. It asks the server to confirm the payment and set
 * the account up (idempotent with the Stripe webhook), then:
 *   - a brand-new account: "You're in. Set up your login." Email already
 *     filled in, choose a password, one button, and you are inside the app
 *     with the guided tour running.
 *   - an account that already existed: the year is on it, sign in as usual.
 *
 * Also fires the Meta Purchase event with the Stripe session id as eventID,
 * so it dedupes against the same event the server sends through the
 * Conversions API.
 */
import { useEffect, useState } from 'react';
import { Mark } from '@/components/Mark';
import { useT, useLang, LanguageToggle } from '@/i18n';
import { trackEvent } from '@/lib/pixel';
import { supabase } from '@/lib/supabase';
import '@/pages/landing.css';
import './annual.css';

type State =
  | { kind: 'loading' }
  | { kind: 'setup'; email: string }
  | { kind: 'existing'; email: string }
  | { kind: 'error'; message: string };

export default function AnnualSuccess() {
  const t = useT();
  const { lang } = useLang();
  const sid = typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('session_id') || '' : '';
  const [state, setState] = useState<State>({ kind: 'loading' });
  const [pw, setPw] = useState('');
  const [pw2, setPw2] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  useEffect(() => {
    document.title = (lang === 'es' ? 'Ya estás dentro' : 'You’re in') + ' · LevelWorks';
    if (!sid) { setState({ kind: 'error', message: t('an.okNoSession') }); return; }
    // Purchase event once per session id, even on refresh.
    const key = 'lw49-purchase-' + sid;
    try { if (!sessionStorage.getItem(key)) { sessionStorage.setItem(key, '1'); trackEvent('Purchase', { value: 49, currency: 'USD', content_name: 'LevelWorks Annual', content_ids: ['annual_49'], num_items: 1 }, sid); } } catch { /* fine */ }
    (async () => {
      try {
        const r = await fetch('/api/annual-session', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ session_id: sid }) });
        const d = await r.json();
        if (!r.ok) throw new Error(d.message || d.error || 'failed');
        setState(d.canSetPassword ? { kind: 'setup', email: d.email } : { kind: 'existing', email: d.email });
      } catch (e: any) {
        setState({ kind: 'error', message: t('an.okError') });
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sid, lang]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (state.kind !== 'setup' || busy) return;
    setErr('');
    if (pw.length < 8) { setErr(t('an.pwShort')); return; }
    if (pw !== pw2) { setErr(t('an.pwMismatch')); return; }
    setBusy(true);
    try {
      const r = await fetch('/api/annual-session', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ session_id: sid, password: pw }) });
      const d = await r.json();
      if (!r.ok) throw new Error(d.message || d.error || 'failed');
      const { error } = await supabase.auth.signInWithPassword({ email: state.email, password: pw });
      if (error) throw error;
      window.location.assign('/app?tour=1');
    } catch (e: any) {
      setErr(t('an.okError'));
      setBusy(false);
    }
  };

  return (
    <div className="lw an">
      <header className="an-top">
        <a className="an-brand" href={lang === 'es' ? '/es' : '/'} aria-label="LevelWorks"><Mark size={24} /><span>Level<b>Works</b></span></a>
        <LanguageToggle />
      </header>
      <main className="an-ok">
        <div className="an-check" aria-hidden="true">✓</div>

        {state.kind === 'loading' && (
          <>
            <h1>{t('an.okH')}</h1>
            <p>{t('an.okSetting')}</p>
          </>
        )}

        {state.kind === 'setup' && (
          <>
            <h1>{t('an.okH')}</h1>
            <p>{t('an.okSetup')}</p>
            <form className="an-setup" onSubmit={submit}>
              <label className="lv-field">
                <span className="lv-label">{t('an.okEmail')}</span>
                <input className="lv-input" type="email" value={state.email} readOnly />
              </label>
              <label className="lv-field">
                <span className="lv-label">{t('an.okPassword')}</span>
                <input className="lv-input" type="password" autoComplete="new-password" value={pw} onChange={e => setPw(e.target.value)} placeholder={t('an.okPwHint')} autoFocus />
              </label>
              <label className="lv-field">
                <span className="lv-label">{t('an.okPassword2')}</span>
                <input className="lv-input" type="password" autoComplete="new-password" value={pw2} onChange={e => setPw2(e.target.value)} />
              </label>
              {err && <p className="an-err" role="alert">{err}</p>}
              <button type="submit" className="lw-btn pri lg wide" disabled={busy}>{busy ? t('an.okBusy') : t('an.okGo')}</button>
            </form>
            <small>{t('an.okAfter')}</small>
          </>
        )}

        {state.kind === 'existing' && (
          <>
            <h1>{t('an.okH')}</h1>
            <p>{t('an.okExistingLead', { email: state.email })}</p>
            <a className="lw-btn pri lg" href="/app">{t('an.okBtn')}</a>
            <small>{t('an.okForgot')}</small>
          </>
        )}

        {state.kind === 'error' && (
          <>
            <h1>{t('an.okH')}</h1>
            <p>{state.message}</p>
            <a className="lw-btn pri lg" href="/app">{t('an.okBtn')}</a>
            <small>{t('an.okSpam')}</small>
          </>
        )}
      </main>
    </div>
  );
}
