import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
const out = [];
async function go(label, url, opts = {}) {
  const ctx = await b.newContext({ viewport: { width: 1280, height: 900 }, locale: opts.locale || 'en-US' });
  await ctx.route('**/*', r => (new URL(r.request().url()).hostname === '127.0.0.1') ? r.continue() : r.abort());
  if (opts.store) await ctx.addInitScript(l => localStorage.setItem('lw-lang', l), opts.store);
  const p = await ctx.newPage();
  await p.goto(url, { waitUntil: 'domcontentloaded' });
  await p.waitForTimeout(1200);
  out.push({ label, endedAt: p.url(), lang: await p.evaluate(() => document.documentElement.lang),
             title: (await p.title()).slice(0, 40), stored: await p.evaluate(() => localStorage.getItem('lw-lang')) });
  if (opts.shot) await p.screenshot({ path: opts.shot, fullPage: false });
  await ctx.close();
}
await go('english user on /', 'http://127.0.0.1:4187/', { store: 'en', shot: 'en-desktop.png' });
await go('first visit, english browser', 'http://127.0.0.1:4187/');
await go('first visit, spanish browser', 'http://127.0.0.1:4187/', { locale: 'es-MX' });
await go('spanish-stored user on /', 'http://127.0.0.1:4187/', { store: 'es' });
await go('anyone on /es', 'http://127.0.0.1:4187/es', { store: 'en', shot: 'es-desktop.png' });
await go('app route unaffected', 'http://127.0.0.1:4187/terms', { store: 'es' });
console.log(JSON.stringify(out, null, 1));
await b.close();
