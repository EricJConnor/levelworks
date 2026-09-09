/**
 * First-run tour. Four boxes, one at a time, each pointing at the real thing
 * on screen: profile, new estimate, new invoice, recurring billing. Opens on
 * /app?tour=1 (the screen after a $49 purchase sends people here) and runs
 * once; "Skip" or finishing writes lw-tour-done so it never comes back.
 *
 * Targets are found by data-tour attributes in AppLayout. On a phone the
 * header buttons are hidden and the bottom tabs carry the same attributes, so
 * the first visible match is the one that gets the ring.
 */
import { useEffect, useLayoutEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useT } from '@/i18n';

const KEY = 'lw-tour-done';

export type TourStep = { target: string; title: string; body: string; cta?: string };

function visibleTarget(name: string): HTMLElement | null {
  const els = Array.from(document.querySelectorAll<HTMLElement>(`[data-tour="${name}"]`));
  return els.find(el => el.offsetParent !== null || el.getClientRects().length > 0) || null;
}

export function tourRequested(): boolean {
  try {
    if (localStorage.getItem(KEY)) return false;
  } catch { /* storage blocked: still show it once */ }
  return new URLSearchParams(window.location.search).get('tour') === '1';
}

export function Tour({ onFinish, onOpenAccount, onNewEstimate }: { onFinish: () => void; onOpenAccount: () => void; onNewEstimate: () => void }) {
  const t = useT();
  const steps: TourStep[] = [
    { target: 'account', title: t('tour.1t'), body: t('tour.1b'), cta: t('tour.1c') },
    { target: 'estimate', title: t('tour.2t'), body: t('tour.2b') },
    { target: 'invoice', title: t('tour.3t'), body: t('tour.3b') },
    { target: 'clients', title: t('tour.4t'), body: t('tour.4b'), cta: t('tour.4c') },
  ];
  const [i, setI] = useState(0);
  const [rect, setRect] = useState<DOMRect | null>(null);
  const step = steps[i];

  const measure = () => {
    const el = visibleTarget(step.target);
    setRect(el ? el.getBoundingClientRect() : null);
  };
  useLayoutEffect(measure, [i]);
  useEffect(() => {
    window.addEventListener('resize', measure); window.addEventListener('scroll', measure, true);
    return () => { window.removeEventListener('resize', measure); window.removeEventListener('scroll', measure, true); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [i]);

  const done = () => {
    try { localStorage.setItem(KEY, '1'); } catch { /* fine */ }
    const u = new URL(window.location.href); u.searchParams.delete('tour');
    window.history.replaceState({}, '', u.pathname + (u.search || ''));
    onFinish();
  };
  const next = () => { if (i < steps.length - 1) setI(i + 1); else { done(); onNewEstimate(); } };
  const act = () => {
    if (step.target === 'account') { done(); onOpenAccount(); }
    else { done(); onNewEstimate(); }
  };

  // Card sits under the target when there is room, above it otherwise; centred on phones.
  const narrow = typeof window !== 'undefined' && window.innerWidth < 640;
  const below = rect ? rect.bottom + 12 : 0;
  const cardStyle: React.CSSProperties = narrow || !rect
    ? { left: 16, right: 16, bottom: rect && rect.top > window.innerHeight / 2 ? window.innerHeight - rect.top + 12 : 'auto', top: rect && rect.top <= window.innerHeight / 2 ? below : 'auto' }
    : { left: Math.max(16, Math.min(rect.left, window.innerWidth - 380)), top: below };
  if (narrow && !rect) { cardStyle.top = 'auto'; cardStyle.bottom = 24; }

  return createPortal(
    <div className="lv-tour" role="dialog" aria-modal="true" aria-label={step.title}>
      <div className="lv-tour-scrim" />
      {rect && <div className="lv-tour-ring" style={{ left: rect.left - 6, top: rect.top - 6, width: rect.width + 12, height: rect.height + 12 }} />}
      <div className="lv-tour-card" style={cardStyle}>
        <span className="lv-eyebrow">{t('tour.step', { n: i + 1, of: steps.length })}</span>
        <h3 className="lv-h3" style={{ marginTop: 6 }}>{step.title}</h3>
        <p className="lv-sub" style={{ marginTop: 6 }}>{step.body}</p>
        <div className="lv-tour-acts">
          <button type="button" className="lv-btn quiet sm" onClick={done}>{t('tour.skip')}</button>
          {step.cta && <button type="button" className="lv-btn sec sm" onClick={act}>{step.cta}</button>}
          <button type="button" className="lv-btn pri sm" onClick={next}>{i < steps.length - 1 ? t('tour.next') : t('tour.finish')}</button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
