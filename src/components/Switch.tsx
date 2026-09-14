import React from 'react';

/** A labelled on/off switch in the app's own language: blue when on, hairline grey when off. */
export const Switch: React.FC<{ on: boolean; onChange: (v: boolean) => void; label: string; disabled?: boolean }> = ({ on, onChange, label, disabled }) => (
  <button type="button" role="switch" aria-checked={on} aria-label={label} className={`lv-switch${on ? ' on' : ''}`} onClick={() => !disabled && onChange(!on)} disabled={disabled}>
    <span className="lv-switch-knob" />
  </button>
);
