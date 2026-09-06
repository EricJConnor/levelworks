import { CreditCard, RefreshCw } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Mark } from './Mark';

interface SubscriptionBlockerProps {
  status: string;
  onRetry: () => void;
}

export function SubscriptionBlocker({ status, onRetry }: SubscriptionBlockerProps) {
  const handleSignOut = async () => {
    await supabase.auth.signOut();
    window.location.href = '/';
  };

  const handleManageSubscription = () => {
    window.location.href = '/dashboard?tab=subscription';
  };

  const getStatusMessage = () => {
    switch (status) {
      case 'canceled':
        return { title: 'Your subscription is cancelled', label: 'Cancelled', desc: 'Start it again whenever you like. Your estimates, invoices and clients are all still here.' };
      case 'past_due':
        return { title: 'Your payment is past due', label: 'Past due', desc: 'Update your card and everything switches back on.' };
      case 'unpaid':
        return { title: 'Your last payment did not go through', label: 'Payment needed', desc: 'Update your card and everything switches back on.' };
      case 'incomplete':
        return { title: 'Your setup is not finished', label: 'Setup incomplete', desc: 'Finish the payment step to open your account.' };
      case 'incomplete_expired':
        return { title: 'Your free trial has ended', label: 'Trial ending', desc: 'Subscribe to keep using LevelWorks. Your estimates, invoices and clients are all still here.' };
      default:
        return { title: 'A subscription is needed', label: 'Subscription', desc: 'Subscribe to open your account again. Your estimates, invoices and clients are all still here.' };
    }
  };

  const { title, label, desc } = getStatusMessage();
  const needsCard = status === 'past_due' || status === 'unpaid';

  return (
    <div
      className="lv-app"
      style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
    >
      <div className="lv-card lv-card-pad" style={{ maxWidth: 440, width: '100%' }}>
        <div className="lv-inline" style={{ justifyContent: 'space-between' }}>
          <span className="lv-inline" style={{ gap: 8, fontWeight: 700, letterSpacing: '-.02em' }}>
            <Mark size={22} />
            Level<span style={{ color: 'var(--lv-blue)' }}>Works</span>
          </span>
          <span className="lv-pill amber">{label}</span>
        </div>

        <h2 className="lv-h2" style={{ marginTop: 18 }}>{title}</h2>
        <p className="lv-sub" style={{ marginTop: 8 }}>{desc}</p>
        <p className="lv-sub" style={{ marginTop: 8 }}>LevelWorks is $5 a month.</p>

        <div className="lv-stack" style={{ gap: 8, marginTop: 20 }}>
          <button className="lv-btn pri wide" onClick={handleManageSubscription}>
            <CreditCard size={16} />
            {needsCard ? 'Update your card' : 'Manage your subscription'}
          </button>
          <button className="lv-btn sec wide" onClick={onRetry}>
            <RefreshCw size={15} /> Check again
          </button>
          <button className="lv-btn quiet wide" onClick={handleSignOut}>Sign out</button>
        </div>
      </div>
    </div>
  );
}
