import { CreditCard, RefreshCw } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Mark } from './Mark';
import { useT } from '@/i18n';

interface SubscriptionBlockerProps {
  status: string;
  onRetry: () => void;
}

export function SubscriptionBlocker({ status, onRetry }: SubscriptionBlockerProps) {
  const t = useT();
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
        return { title: t('mod.subscriptionCancelledTitle'), label: t('s.cancelled'), desc: t('mod.subscriptionCancelledDesc') };
      case 'past_due':
        return { title: t('mod.paymentPastDueTitle'), label: t('s.pastDue'), desc: t('mod.updateCardDesc') };
      case 'unpaid':
        return { title: t('mod.paymentDidNotGoThroughTitle'), label: t('mod.paymentNeeded'), desc: t('mod.updateCardDesc') };
      case 'incomplete':
        return { title: t('mod.setupNotFinishedTitle'), label: t('mod.setupIncomplete'), desc: t('mod.finishPaymentStep') };
      case 'incomplete_expired':
        return { title: t('mod.freeTrialHasEnded'), label: t('mod.trialEnding'), desc: t('mod.subscribeToKeepUsing') };
      default:
        return { title: t('mod.subscriptionNeededTitle'), label: t('mod.subscription'), desc: t('mod.subscribeToOpenAgain') };
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
        <p className="lv-sub" style={{ marginTop: 8 }}>{t('mod.levelWorksIsFiveAMonth')}</p>

        <div className="lv-stack" style={{ gap: 8, marginTop: 20 }}>
          <button className="lv-btn pri wide" onClick={handleManageSubscription}>
            <CreditCard size={16} />
            {needsCard ? t('mod.updateYourCard') : t('mod.manageYourSubscription')}
          </button>
          <button className="lv-btn sec wide" onClick={onRetry}>
            <RefreshCw size={15} /> {t('mod.checkAgain')}
          </button>
          <button className="lv-btn quiet wide" onClick={handleSignOut}>{t('a.signOut')}</button>
        </div>
      </div>
    </div>
  );
}
