/**
 * Opening the phone's own Messages app with the text already written.
 *
 * This is deliberately NOT Twilio. The estimate goes out from the contractor's
 * real number, so it lands in the thread his client already has with him and
 * she can just reply — no shared number, no A2P registration, no per-message
 * cost, and nothing for him to check inside the app.
 *
 * He still taps Send himself. That is the trade: we cannot send on his behalf,
 * but what does go out is genuinely from him.
 */

/** iOS and Android disagree on the separator before `body`. */
function separator(): '?' | '&' {
  const ua = typeof navigator !== 'undefined' ? navigator.userAgent : '';
  const isApple = /iPad|iPhone|iPod/.test(ua)
    // iPadOS 13+ reports itself as a Mac with touch.
    || (/Macintosh/.test(ua) && typeof document !== 'undefined' && 'ontouchend' in document);
  return isApple ? '&' : '?';
}

/**
 * True where tapping an `sms:` link actually opens a messaging app. On a
 * laptop it usually does nothing at all, so the UI keeps copy-the-link there.
 */
export function canOpenMessagesApp(): boolean {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent || '';
  const touch = typeof window !== 'undefined'
    && (('ontouchstart' in window) || navigator.maxTouchPoints > 0);
  return touch && /iPhone|iPad|iPod|Android|Mobile/i.test(ua);
}

/**
 * Strip a US phone down to something the dialer will accept. Anything that
 * does not look like a phone number comes back empty, which opens Messages
 * with the recipient blank rather than with garbage in it.
 */
export function normalizePhone(raw: string): string {
  const digits = String(raw || '').replace(/[^\d+]/g, '');
  if (!digits) return '';
  if (digits.startsWith('+')) return digits;
  const only = digits.replace(/\D/g, '');
  if (only.length === 10) return `+1${only}`;
  if (only.length === 11 && only.startsWith('1')) return `+${only}`;
  return only.length >= 7 ? only : '';
}

export function buildSmsHref(phone: string, body: string): string {
  const to = normalizePhone(phone);
  return `sms:${to}${separator()}body=${encodeURIComponent(body)}`;
}

/**
 * Hand off to the Messages app. Uses a real anchor click rather than
 * `location.href` because iOS Safari blocks some scheme navigations that did
 * not come from a user gesture on an element.
 */
export function openMessagesApp(phone: string, body: string): void {
  const a = document.createElement('a');
  a.href = buildSmsHref(phone, body);
  a.style.display = 'none';
  document.body.appendChild(a);
  a.click();
  setTimeout(() => a.remove(), 0);
}
