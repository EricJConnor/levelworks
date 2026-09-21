import { useEffect } from 'react';

/**
 * Keep the field you are typing in above the phone keyboard.
 *
 * THE BUG. The builders are a fixed, full-height shell (`height: 100dvh`,
 * `overflow: hidden`) with one scrolling body and a pinned action bar. On a
 * phone the keyboard slides over the bottom of the screen without changing
 * that height — `dvh` follows the browser chrome, not the keyboard — so a
 * field in the lower half ends up underneath it. You can type; you cannot see
 * what you are typing. Eric, 22 Sep: "when you're trying to type in materials,
 * you can't see what you're writing."
 *
 * Nothing in the browser fixes this for us here: the page itself cannot scroll
 * (body overflow is locked while the builder is open) and Safari will not
 * reliably scroll a focused element inside a fixed container.
 *
 * THE FIX. When a field inside the scroller takes focus, measure where the
 * usable screen actually ends — `visualViewport` shrinks when the keyboard
 * opens, which is the only honest measure of it — and scroll the container if
 * the field sits below that line.
 *
 * Two details worth keeping. The measurement waits for the keyboard's slide-in
 * animation, or it reads the pre-keyboard viewport and concludes everything is
 * fine. And it re-measures on `visualViewport` resize, because the keyboard can
 * also appear later, or change height when a phone switches to an emoji or
 * prediction bar.
 */
const GAP = 16;       // breathing room under the field
const SETTLE = 340;   // the keyboard's slide-in

export function useKeepInView(ref: React.RefObject<HTMLElement>) {
  useEffect(() => {
    const scroller = ref.current;
    if (!scroller) return;

    const bottomOfScreen = () => {
      const vv = window.visualViewport;
      return vv ? vv.height + vv.offsetTop : window.innerHeight;
    };

    const bring = (el: HTMLElement) => {
      const rect = el.getBoundingClientRect();
      const limit = bottomOfScreen() - GAP;
      if (rect.bottom <= limit) return;
      scroller.scrollTop += rect.bottom - limit;
    };

    let focused: HTMLElement | null = null;
    let timer: number | undefined;

    const onFocusIn = (e: Event) => {
      const el = e.target as HTMLElement;
      if (!(el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement)) return;
      focused = el;
      window.clearTimeout(timer);
      timer = window.setTimeout(() => { if (focused) bring(focused); }, SETTLE);
    };
    const onFocusOut = () => { focused = null; window.clearTimeout(timer); };
    // The keyboard can open, resize, or be replaced by a prediction bar after
    // focus, so one measurement at focus time is not enough.
    const onViewport = () => { if (focused) bring(focused); };

    scroller.addEventListener('focusin', onFocusIn);
    scroller.addEventListener('focusout', onFocusOut);
    window.visualViewport?.addEventListener('resize', onViewport);
    window.visualViewport?.addEventListener('scroll', onViewport);

    return () => {
      window.clearTimeout(timer);
      scroller.removeEventListener('focusin', onFocusIn);
      scroller.removeEventListener('focusout', onFocusOut);
      window.visualViewport?.removeEventListener('resize', onViewport);
      window.visualViewport?.removeEventListener('scroll', onViewport);
    };
  }, [ref]);
}
