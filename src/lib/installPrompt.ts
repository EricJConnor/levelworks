/**
 * Installing LevelWorks to the home screen.
 *
 * Android and desktop Chrome fire `beforeinstallprompt`, which lets us show a
 * real one-tap Install button. **iOS gives no such API** — Apple has never
 * exposed a way to add to the home screen from script, so on an iPhone the
 * only honest thing is to show the two steps and get out of the way.
 *
 * The event fires early, often before React has mounted, so it is captured at
 * module scope from `main.tsx` rather than inside a component.
 */

type PromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
};

let deferred: PromptEvent | null = null;
const listeners = new Set<() => void>();

const notify = () => listeners.forEach((fn) => fn());

if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => {
    // Chrome shows its own mini-bar unless we take the event over.
    e.preventDefault();
    deferred = e as PromptEvent;
    notify();
  });
  window.addEventListener('appinstalled', () => {
    deferred = null;
    notify();
  });
}

export function onInstallChange(fn: () => void): () => void {
  listeners.add(fn);
  return () => { listeners.delete(fn); };
}

/** True once the browser has told us it is willing to install the app. */
export function canInstall(): boolean {
  return deferred !== null;
}

/** Already running from the home screen, so there is nothing to offer. */
export function isStandalone(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia?.('(display-mode: standalone)').matches
    || (window.navigator as any).standalone === true;
}

export function isIOS(): boolean {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent || '';
  return /iPad|iPhone|iPod/.test(ua)
    // iPadOS 13+ reports itself as a Mac with touch.
    || (/Macintosh/.test(ua) && typeof document !== 'undefined' && 'ontouchend' in document);
}

/** On an iPhone, "Add to Home Screen" only exists in Safari. */
export function isIOSButNotSafari(): boolean {
  if (!isIOS()) return false;
  const ua = navigator.userAgent || '';
  return /CriOS|FxiOS|EdgiOS|OPiOS/.test(ua);
}

export async function promptInstall(): Promise<'accepted' | 'dismissed' | 'unavailable'> {
  if (!deferred) return 'unavailable';
  const e = deferred;
  // The event can only be used once, whatever the outcome.
  deferred = null;
  notify();
  try {
    await e.prompt();
    const { outcome } = await e.userChoice;
    return outcome;
  } catch {
    return 'dismissed';
  }
}
