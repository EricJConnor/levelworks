import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { CardNumberElement, CardExpiryElement, CardCvcElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { Check, Loader2, Lock } from 'lucide-react';
import { Mark } from './Mark';
import { useT } from '@/i18n';

const stripePromise = loadStripe('pk_live_51Rv0bbCrlMKmuUj4ll9r1pdjnK3SKP7LmqlTMi4CYBlBHuLu5NtO0UOBSj8aFGiw1qKNkFQgjm3roSWupxHFbUxL00BEFePpG1');

// Stripe draws its card fields inside an iframe, so it cannot read our CSS
// variables - these literals are the same values as --lv-ink / --lv-faint.
const elementOptions = {
  style: {
    base: {
      fontSize: '16px',
      color: '#0b1220',
      fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
      '::placeholder': { color: '#8a93a3' },
    },
  },
};

function PaymentForm({ userId, userEmail, onSuccess }: { userId: string; userEmail: string; onSuccess: () => void }) {
  const t = useT();
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;
    setLoading(true);
    setError('');

    try {
      const cardElement = elements.getElement(CardNumberElement);
      if (!cardElement) throw new Error(t('mod.cardFieldNotReady'));

      const { error: stripeError, paymentMethod } = await stripe.createPaymentMethod({
        type: 'card',
        card: cardElement,
        billing_details: { email: userEmail }
      });

      if (stripeError) throw new Error(stripeError.message);

      const { data, error: fnError } = await supabase.functions.invoke('create-subscription', {
        body: { userId, userEmail, paymentMethodId: paymentMethod.id }
      });

      if (fnError) throw new Error(fnError.message);
      if (data?.error) throw new Error(data.error);

      onSuccess();
    } catch (err: any) {
      setError(err.message || t('mod.paymentFailed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {error && (
        <p
          className="lv-small"
          style={{
            background: 'var(--lv-red-soft)',
            color: 'var(--lv-red)',
            borderRadius: 'var(--lv-r)',
            padding: '10px 12px',
            marginBottom: 14,
          }}
        >
          {error}
        </p>
      )}

      <label className="lv-field">
        <span className="lv-label">{t('mod.cardNumber')}</span>
        <div className="lv-input focus-within:border-[var(--lv-blue)]">
          <CardNumberElement options={elementOptions} />
        </div>
      </label>

      <div className="lv-grid-2" style={{ marginTop: 14 }}>
        <label className="lv-field">
          <span className="lv-label">{t('mod.expires')}</span>
          <div className="lv-input focus-within:border-[var(--lv-blue)]">
            <CardExpiryElement options={elementOptions} />
          </div>
        </label>
        <label className="lv-field" style={{ marginTop: 0 }}>
          <span className="lv-label">{t('mod.securityCode')}</span>
          <div className="lv-input focus-within:border-[var(--lv-blue)]">
            <CardCvcElement options={elementOptions} />
          </div>
        </label>
      </div>

      <button type="submit" className="lv-btn pri wide lg" disabled={!stripe || loading} style={{ marginTop: 20 }}>
        {loading
          ? <><Loader2 size={18} className="animate-spin" /> {t('mod.processing')}</>
          : <><Lock size={17} /> {t('mod.subscribeFiveAMonth')}</>}
      </button>

      <ul className="lv-stack" style={{ gap: 7, listStyle: 'none', margin: '16px 0 0', padding: 0 }}>
        {[
          t('mod.cancelAnyTimeInSettings'),
          t('mod.fiveAMonthNothingElse'),
          t('mod.yourDataStaysPut'),
        ].map(line => (
          <li key={line} className="lv-small" style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
            <Check size={15} style={{ color: 'var(--lv-green)', flexShrink: 0, marginTop: 2 }} />
            <span>{line}</span>
          </li>
        ))}
      </ul>
    </form>
  );
}

interface SubscriptionGateProps {
  children: React.ReactNode;
}

export const SubscriptionGate: React.FC<SubscriptionGateProps> = ({ children }) => {
  const t = useT();
  const [status, setStatus] = useState<'loading' | 'trial' | 'active' | 'expired' | 'cancelled'>('loading');
  const [daysLeft, setDaysLeft] = useState<number | null>(null);
  const [userId, setUserId] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [userName, setUserName] = useState('');

  useEffect(() => {
    checkSubscription();
  }, []);

  const checkSubscription = async () => {
    // Timeout after 5 seconds - fail open
    const timeout = setTimeout(() => {
      setStatus('active');
    }, 5000);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { clearTimeout(timeout); setStatus('active'); return; }

      setUserId(user.id);
      setUserEmail(user.email || '');
      setUserName(user.user_metadata?.full_name || '');

      const { data, error } = await supabase.functions.invoke('check-subscription', {
        body: { userId: user.id, userEmail: user.email, userName: user.user_metadata?.full_name || '' }
      });

      if (error) {
        setStatus('active');
        return;
      }

      setStatus(data.status);
      setDaysLeft(data.daysLeft);
    } catch (err) {
      clearTimeout(timeout);
      setStatus('active');
    }
  };

  if (status === 'loading') {
    return (
      <div className="lv-app" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Loader2 size={30} className="animate-spin" style={{ color: 'var(--lv-blue)' }} />
      </div>
    );
  }

  if (status === 'expired' || status === 'cancelled') {
    return (
      <div className="lv-app" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
        <div className="lv-card" style={{ maxWidth: 460, width: '100%' }}>
          <div className="lv-card-head">
            <span className="lv-inline" style={{ gap: 8, fontWeight: 700, letterSpacing: '-.02em' }}>
              <Mark size={22} />
              Level<span style={{ color: 'var(--lv-blue)' }}>Works</span>
            </span>
            <span className="lv-pill amber">{status === 'cancelled' ? t('s.cancelled') : t('mod.trialEnded')}</span>
          </div>
          <div className="lv-card-pad">
            <h2 className="lv-h2">
              {status === 'cancelled' ? t('mod.startSubscriptionAgain') : t('mod.freeTrialHasEnded')}
            </h2>
            <p className="lv-sub" style={{ marginTop: 8, marginBottom: 20 }}>
              {t('mod.fiveAMonthEverythingStillHere')}
            </p>
            <Elements stripe={stripePromise}>
              <PaymentForm
                userId={userId}
                userEmail={userEmail}
                onSuccess={() => setStatus('active')}
              />
            </Elements>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      {status === 'trial' && daysLeft !== null && daysLeft <= 5 && (
        <div
          style={{
            background: 'var(--lv-amber-soft)',
            borderBottom: '1px solid var(--lv-line)',
            color: 'var(--lv-ink)',
            font: '500 13.5px var(--lv-font)',
            padding: '9px 16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexWrap: 'wrap',
            gap: 8,
            textAlign: 'center',
          }}
        >
          <span className="lv-pill amber">{t('mod.trialEnding')}</span>
          <span>
            {daysLeft === 1 ? t('mod.trialEndsInOneDay', { n: daysLeft }) : t('mod.trialEndsInDays', { n: daysLeft })}
          </span>
          <button className="lv-btn pri sm" onClick={() => setStatus('expired')}>
            {t('mod.subscribeFiveAMonth')}
          </button>
        </div>
      )}
      {children}
    </>
  );
};
