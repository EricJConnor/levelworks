interface PricingCountdownProps {
  variant?: 'landing' | 'compact' | 'full';
  className?: string;
}

export function PricingCountdown({ variant = 'landing', className = '' }: PricingCountdownProps) {
  if (variant === 'compact') {
    return (
      <span
        className={`lv-pill ${className}`}
        style={{ background: 'var(--lv-surface)', color: 'var(--lv-ink)', border: '1px solid var(--lv-line-2)', padding: '8px 14px', fontSize: 13 }}
      >
        <b className="lv-num" style={{ fontWeight: 700 }}>$5</b> a month, after a 30-day free trial
      </span>
    );
  }

  return (
    <div className={`lv-card ${className}`} style={{ maxWidth: 460 }}>
      <div className="lv-card-pad">
        <span className="lv-eyebrow">Pricing</span>
        <p className="lv-num" style={{ fontSize: 32, fontWeight: 700, letterSpacing: '-.03em', margin: '8px 0 0', lineHeight: 1.1 }}>
          $5<span style={{ fontSize: 16, fontWeight: 600, color: 'var(--lv-mute)' }}> a month</span>
        </p>
        <p className="lv-sub" style={{ marginTop: 6 }}>
          Everything in LevelWorks is included. No setup fee, no per-estimate charge.
        </p>

        <hr className="lv-hr" style={{ margin: '16px 0' }} />

        <div className="lv-inline" style={{ justifyContent: 'space-between' }}>
          <div>
            <p className="lv-row-t">Free trial</p>
            <p className="lv-row-s">No card needed to start. Cancel any time.</p>
          </div>
          <span className="lv-num" style={{ fontSize: 19, fontWeight: 700, whiteSpace: 'nowrap' }}>30 days</span>
        </div>
      </div>
    </div>
  );
}

export default PricingCountdown;
