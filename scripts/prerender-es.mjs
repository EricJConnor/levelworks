/**
 * Writes dist/es/index.html: the Spanish homepage as real HTML.
 *
 * Takes the built English index.html (so the hashed CSS/JS links are always
 * the current ones), swaps the head for Spanish, sets lang="es", and drops the
 * server-rendered markup into #root. The React bundle then takes over exactly
 * as it does on the English page — same design, same behaviour, but the first
 * byte off the server is Spanish, which is the whole point.
 *
 * Run after `vite build` and the SSR build. Wired into `npm run build`.
 */
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();
const dist = path.join(root, 'dist');

const SITE = 'https://levelworks.org';

// Written for what a Spanish-speaking contractor actually types into Google,
// not translated from the English page.
const TITLE = 'LevelWorks — App para hacer estimados y facturas para contratistas. $5 al mes.';
const DESC = 'Programa de estimados para contratistas en español: haz presupuestos desde el '
  + 'teléfono, recibe la firma del cliente, convierte a factura y cobra con tarjeta. '
  + 'Todo por $5 al mes, con 30 días gratis.';
const OG_TITLE = 'LevelWorks — Estimados y facturas para contratistas, en español';

const ESC = (s) => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');

const HEAD_ES = `
    <link rel="canonical" href="${SITE}/es" />
    <title>${ESC(TITLE)}</title>
    <meta name="description" content="${ESC(DESC)}" />
    <meta property="og:title" content="${ESC(OG_TITLE)}" />
    <meta property="og:description" content="${ESC(DESC)}" />
    <meta property="og:url" content="${SITE}/es" />
    <meta property="og:locale" content="es_US" />
    <meta property="og:locale:alternate" content="en_US" />`;

const { render } = await import(path.join(root, 'dist-ssr', 'entry-es.js'));
const markup = render();

let html = await readFile(path.join(dist, 'index.html'), 'utf8');

// One head, in Spanish. Drop every English tag we are replacing, then insert.
const drop = [
  /\n\s*<link rel="canonical"[^>]*>/g,
  /\n\s*<title>[\s\S]*?<\/title>/g,
  /\n\s*<meta name="description"[^>]*>/g,
  /\n\s*<meta property="og:title"[^>]*>/g,
  /\n\s*<meta property="og:description"[^>]*>/g,
  /\n\s*<meta property="og:url"[^>]*>/g,
  /\n\s*<meta property="og:locale"[^>]*>/g,
  /\n\s*<meta property="og:locale:alternate"[^>]*>/g,
];
for (const re of drop) html = html.replace(re, '');

html = html.replace('<html lang="en">', '<html lang="es">');
html = html.replace('<meta charset="UTF-8" />', `<meta charset="UTF-8" />${HEAD_ES}`);
html = html.replace('<div id="root"></div>', `<div id="root">${markup}</div>`);

// Every check that must hold, or the page ships broken and silent.
const must = [
  ['<html lang="es">', 'lang="es"'],
  [`<link rel="canonical" href="${SITE}/es" />`, 'Spanish canonical'],
  [`<link rel="alternate" hreflang="es" href="${SITE}/es" />`, 'hreflang es'],
  [`<link rel="alternate" hreflang="en" href="${SITE}/" />`, 'hreflang en'],
  [`<link rel="alternate" hreflang="x-default" href="${SITE}/" />`, 'hreflang x-default'],
  ['og:locale" content="es_US"', 'og:locale es_US'],
];
for (const [needle, what] of must) {
  if (!html.includes(needle)) throw new Error(`prerender-es: missing ${what}`);
}
if (html.includes('<title>LevelWorks — Estimates')) throw new Error('prerender-es: English title survived');
if (markup.length < 5000) throw new Error(`prerender-es: markup looks empty (${markup.length} bytes)`);

await mkdir(path.join(dist, 'es'), { recursive: true });
await writeFile(path.join(dist, 'es', 'index.html'), html);
console.log(`prerender-es: dist/es/index.html (${(html.length / 1024).toFixed(0)}KB, ${(markup.length / 1024).toFixed(0)}KB of Spanish markup)`);
