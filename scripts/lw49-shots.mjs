// Real app screenshots for /annual and the day-3 email, at iPhone size, both
// languages, from the demo account (scripts/lw49-demo.mjs).
//
//   node scripts/lw49-shots.mjs [baseUrl]     (default http://127.0.0.1:5321)
// Writes public/marketing/shots/{estimate,invoice,recurring}-{en,es}.webp
// and public/marketing/estimate-example.png (the client's view of the estimate).
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';
import sharp from 'sharp';

const BASE = process.argv[2] || 'http://127.0.0.1:5321';
const SUPABASE_URL = 'https://djrsmuafbbzxpbdibolq.supabase.co';
const ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRqcnNtdWFmYmJ6eHBiZGlib2xxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ5ODE1OTIsImV4cCI6MjA5MDU1NzU5Mn0.vIKq1NjFXX3w7Jj09AEU8F4KLxG9O6TA-bsDl7vFKlw';
const EMAIL = 'demo.lw49@levelworks.org';
const PASSWORD = process.env.DEMO_PASSWORD || 'Level-Demo-2026';
const OUT = 'public/marketing/shots';
mkdirSync(OUT, { recursive: true });

// Sign in once through the auth API and hand the session to the page, the same
// shape supabase-js keeps under its storageKey.
const r = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
  method: 'POST', headers: { apikey: ANON, 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: EMAIL, password: PASSWORD }),
});
const session = await r.json();
if (!session.access_token) { console.error('login failed', session); process.exit(1); }

const L = {
  en: { estimates: 'Estimates', invoices: 'Invoices', clients: 'Clients', edit: 'Edit' },
  es: { estimates: 'Presupuestos', invoices: 'Facturas', clients: 'Clientes', edit: 'Editar' },
};

const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', proxy: { server: process.env.HTTPS_PROXY, bypass: '<-loopback>,127.0.0.1,localhost' }, args: ['--ssl-version-max=tls1.2'] });
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, locale: 'en-US', ignoreHTTPSErrors: true });
await ctx.addInitScript(([s, lang]) => {
  localStorage.setItem('level-app-auth', JSON.stringify(s));
  localStorage.setItem('lw-lang', lang);
}, [session, 'en']);
const page = await ctx.newPage();

async function save(name, opts = {}) {
  const png = await page.screenshot({ type: 'png', ...opts });
  await sharp(png).webp({ quality: 82 }).toFile(`${OUT}/${name}.webp`);
  console.log('shot', name);
  return png;
}
const settle = ms => page.waitForTimeout(ms);

for (const lang of ['en', 'es']) {
  await page.addInitScript(l => localStorage.setItem('lw-lang', l), lang);
  const t = L[lang];

  // estimate builder, on the signed bathroom estimate
  await page.goto(`${BASE}/app`); await settle(2500);
  await page.getByRole('button', { name: t.estimates, exact: true }).first().click(); await settle(1200);
  await page.getByRole('button', { name: t.edit }).first().click(); await settle(1500);
  await save(`estimate-${lang}`);

  // invoice, opened from the list
  await page.goto(`${BASE}/app`); await settle(2000);
  await page.getByRole('button', { name: t.invoices, exact: true }).first().click(); await settle(1200);
  await page.locator('.iv-row').first().click(); await settle(1500);
  await save(`invoice-${lang}`);

  // recurring billing, on the client
  await page.goto(`${BASE}/app`); await settle(2000);
  await page.getByRole('button', { name: t.clients, exact: true }).first().click(); await settle(1200);
  await page.locator('.cl-open').filter({ hasText: 'Johnson HVAC' }).first().click(); await settle(1500);
  await save(`recurring-${lang}`);
}

// The client's view of the estimate (public link), for the day-3 email.
const est = await fetch(`${SUPABASE_URL}/rest/v1/estimates?select=view_token&client_name=eq.Mike%20Rivera&limit=1`, {
  headers: { apikey: ANON, Authorization: `Bearer ${session.access_token}` },
}).then(r => r.json());
if (est?.[0]?.view_token) {
  await page.addInitScript(() => localStorage.setItem('lw-lang', 'en'));
  await page.goto(`${BASE}/view-estimate/${est[0].view_token}`); await settle(2500);
  const png = await page.screenshot({ type: 'png', fullPage: false });
  await sharp(png).png().toFile('public/marketing/estimate-example.png');
  console.log('shot estimate-example');
}
await browser.close();
