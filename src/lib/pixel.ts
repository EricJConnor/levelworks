// Meta (Facebook) Pixel — loaded and fired only on the production domain,
// never on localhost or a local dev/preview build.
const PIXEL_ID = '2017000758930909';

declare global {
  interface Window {
    fbq?: ((...args: unknown[]) => void) & { callMethod?: (...args: unknown[]) => void; queue?: unknown[]; loaded?: boolean; version?: string };
    _fbq?: Window['fbq'];
  }
}

function isProductionEnvironment(): boolean {
  if (!import.meta.env.PROD) return false;
  const host = window.location.hostname;
  return host !== 'localhost' && host !== '127.0.0.1';
}

let initialized = false;

function loadPixelScript() {
  if (window.fbq) return;

  const fbq: Window['fbq'] = function (...args: unknown[]) {
    if (fbq.callMethod) {
      fbq.callMethod(...args);
    } else {
      fbq.queue!.push(args);
    }
  };
  fbq.queue = [];
  fbq.loaded = true;
  fbq.version = '2.0';
  window.fbq = fbq;
  window._fbq = fbq;

  const script = document.createElement('script');
  script.async = true;
  script.src = 'https://connect.facebook.net/en_US/fbevents.js';
  document.head.appendChild(script);
}

function ensureInitialized() {
  if (initialized || !isProductionEnvironment()) return;
  loadPixelScript();
  window.fbq!('init', PIXEL_ID);
  initialized = true;
}

export function trackPageView() {
  if (!isProductionEnvironment()) return;
  ensureInitialized();
  window.fbq!('track', 'PageView');
}

export function trackEvent(name: string, params?: Record<string, unknown>) {
  if (!isProductionEnvironment()) return;
  ensureInitialized();
  window.fbq!('track', name, params);
}
