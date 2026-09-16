import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { useProfile } from '@/contexts/ProfileContext';
import { useT } from '@/i18n';
import { finishStripeConnect, startStripeConnect } from '@/lib/stripeConnect';
import { Mark } from '@/components/Mark';

/**
 * Where Stripe sends the contractor after "Set up payments". Hands the code to
 * /api/stripe-connect, which saves the account on his profile, then refreshes
 * the profile so the dashboard already shows "card payments on" when he lands.
 * Plain words on every failure, and a way back in.
 */
export default function StripeConnectCallback() {
  const navigate = useNavigate();
  const t = useT();
  const { refreshProfile } = useProfile();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [detail, setDetail] = useState('');
  const [payoutsPending, setPayoutsPending] = useState(false);
  const ran = useRef(false);

  useEffect(() => {
    // React StrictMode runs effects twice in dev; the code is single-use.
    if (ran.current) return;
    ran.current = true;

    (async () => {
      const params = new URLSearchParams(window.location.search);
      const code = params.get('code') || '';
      const err = params.get('error') || '';

      if (err) {
        setDetail(err === 'access_denied' ? t('pg.sc.cancelled') : t('pg.sc.stripeError', { reason: params.get('error_description') || err }));
        setStatus('error');
        return;
      }
      if (!code) {
        setDetail(t('pg.sc.noCode'));
        setStatus('error');
        return;
      }

      const r = await finishStripeConnect(code);
      if (!r.ok) {
        setDetail(
          r.error === 'signed_out' ? t('pg.sc.signedOut')
          : r.error === 'code_used' ? t('pg.sc.codeUsed')
          : r.message || t('pg.sc.genericFail'),
        );
        setStatus('error');
        return;
      }

      await refreshProfile();
      setPayoutsPending(!r.chargesEnabled);
      setStatus('success');
      // Take the query string with us so a reload cannot resend the code.
      window.history.replaceState(null, '', '/stripe-connect-callback');
      setTimeout(() => navigate('/app', { replace: true }), 2500);
    })();
  }, []);

  return (
    <div className="lv-app" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div className="lv-card lv-card-pad" style={{ width: '100%', maxWidth: 440, textAlign: 'center' }}>
        <div className="lv-inline" style={{ justifyContent: 'center', marginBottom: 18, color: 'var(--lv-ink)' }}>
          <Mark size={22} /><span className="lv-h3">LevelWorks</span>
        </div>

        {status === 'loading' && (
          <div className="lv-empty">
            <Loader2 size={34} className="animate-spin" style={{ color: 'var(--lv-blue)' }} />
            <h3>{t('pg.sc.connecting')}</h3>
            <p>{t('pg.sc.connectingBody')}</p>
          </div>
        )}

        {status === 'success' && (
          <div className="lv-empty">
            <CheckCircle size={40} style={{ color: 'var(--lv-green)' }} />
            <h3>{t('pg.sc.doneTitle')}</h3>
            <p>{payoutsPending ? t('pg.sc.doneBodyPending') : t('pg.sc.doneBody')}</p>
            <button className="lv-btn pri" onClick={() => navigate('/app', { replace: true })}>{t('pg.sc.backToApp')}</button>
          </div>
        )}

        {status === 'error' && (
          <div className="lv-empty">
            <AlertCircle size={40} style={{ color: 'var(--lv-red)' }} />
            <h3>{t('pg.sc.failTitle')}</h3>
            <p>{detail}</p>
            <div className="lv-inline" style={{ justifyContent: 'center', gap: 10 }}>
              <button className="lv-btn quiet" onClick={() => navigate('/app', { replace: true })}>{t('pg.sc.backToApp')}</button>
              <button className="lv-btn pri" onClick={() => startStripeConnect()}>{t('a.retry')}</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
