import { useT } from '@/i18n';

interface PricingCountdownProps {
  variant?: 'landing' | 'compact' | 'full';
  className?: string;
}

export function PricingCountdown({ variant = 'landing', className = '' }: PricingCountdownProps) {
  const t = useT();
  if (variant === 'compact') {
    return (
      <span
        className={`lv-pill ${className}`}
        style={{ background: 'var(--lv-surface)', color: 'var(--lv-ink)', border: '1px solid var(--lv-line-2)', padding: '8px 14px', fontSize: 13 }}
      >
        <b className="lv-num" style={{ fontWeight: 700 }}>$5</b> {t('mod.aMonthAfterTrial')}
      </span>
    );
  }

  return (
    <div className={`lv-card ${className}`} style={{ maxWidth: 460 }}>
      <div className="lv-card-pad">
        <span className="lv-eyebrow">{t('mod.pricing')}</span>
        <p className="lv-num" style={{ fontSize: 32, fontWeight: 700, letterSpacing: '-.03em', margin: '8px 0 0', lineHeight: 1.1 }}>
          $5<span style={{ fontSize: 16, fontWeight: 600, color: 'var(--lv-mute)' }}> {t('mod.aMonth')}</span>
        </p>
        <p className="lv-sub" style={{ marginTop: 6 }}>
          {t('mod.everythingIncluded')}
        </p>

        <hr className="lv-hr" style={{ margin: '16px 0' }} />

        <div className="lv-inline" style={{ justifyContent: 'space-between' }}>
          <div>
            <p className="lv-row-t">{t('mod.freeTrial')}</p>
            <p className="lv-row-s">{t('mod.freeTrialSub')}</p>
          </div>
          <span className="lv-num" style={{ fontSize: 19, fontWeight: 700, whiteSpace: 'nowrap' }}>{t('mod.thirtyDays')}</span>
        </div>
      </div>
    </div>
  );
}

export default PricingCountdown;
