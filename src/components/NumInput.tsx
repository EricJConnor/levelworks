import React, { useState } from 'react';

/**
 * A number field you can actually type a price into.
 *
 * THE BUG THIS REPLACES. Every price and quantity field was
 * `<input type="number" value={item.rate} onChange={e => set(parseFloat(e.target.value) || 0)} />`.
 * The state is a number, so the field can only ever show a number — and the
 * half-typed states on the way to a price are not numbers:
 *
 *   "12."   parseFloat -> 12, so the decimal point is erased as you type it
 *   ""      parseFloat -> NaN -> 0, so the field refuses to be emptied
 *   ".5"    unreachable, because the "." never survives
 *
 * Which means $12.50 could not be typed at all. Eric, 22 Sep: "can you make
 * sure you can type in a dollar amount and not just use the arrows".
 *
 * THE FIX. While the field has focus it holds the raw text the person is
 * typing and reports the number alongside it; on blur the text is dropped and
 * the canonical number shows again. So "12." is a legal thing to be looking at
 * for the second it takes to type "12.50", and the saved value is still a
 * number throughout.
 *
 * It is `type="text"` with `inputMode="decimal"`, which also loses the spinner
 * arrows — nobody prices a roof by clicking a tiny arrow forty times — while
 * still giving a phone the number keypad.
 */
export function NumInput({
  value, onChange, className = '', disabled, ariaLabel, placeholder,
}: {
  value: number;
  onChange: (n: number) => void;
  className?: string;
  disabled?: boolean;
  ariaLabel?: string;
  placeholder?: string;
}) {
  const [draft, setDraft] = useState<string | null>(null);
  const shown = draft ?? (Number.isFinite(value) ? String(value) : '');

  return (
    <input
      type="text"
      inputMode="decimal"
      autoComplete="off"
      className={className}
      value={shown}
      aria-label={ariaLabel}
      placeholder={placeholder}
      disabled={disabled}
      onFocus={(e) => { setDraft(shown); e.currentTarget.select(); }}
      onBlur={() => setDraft(null)}
      onChange={(e) => {
        const raw = e.target.value;
        // Digits and at most one dot. Anything else is simply not accepted, so
        // the field never has to show an error for a stray letter.
        if (raw !== '' && !/^\d*\.?\d*$/.test(raw)) return;
        setDraft(raw);
        const n = parseFloat(raw);
        onChange(Number.isFinite(n) ? n : 0);
      }}
    />
  );
}
