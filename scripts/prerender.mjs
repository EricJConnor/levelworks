/**
 * Prerenders the marketing pages that have to be real HTML for Google and for
 * link previews, and writes the sitemap that lists them.
 *
 *   dist/es/index.html                 the Spanish homepage
 *   dist/guides/index.html             the English guide index
 *   dist/guides/<slug>/index.html      each English guide
 *   dist/es/guias/index.html           the Spanish guide index
 *   dist/es/guias/<slug>/index.html    each Spanish guide
 *   dist/sitemap.xml                   every one of the above, plus the rest
 *
 * Each page takes the built English index.html (so the hashed CSS/JS links
 * are always the current ones), swaps the head, sets <html lang>, drops the
 * server-rendered markup into #root and adds the page's JSON-LD. The React
 * bundle then takes over exactly as it does on the English homepage — same
 * design, same behaviour — but the first byte off the server is the finished
 * page, which is the whole point.
 *
 * Run after `vite build` and the SSR build. Wired into `npm run build`. Every
 * check below throws, so a page cannot ship silently wrong.
 */
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();
const dist = path.join(root, 'dist');
const SITE = 'https://levelworks.org';
const OG_IMAGE = `${SITE}/og.png`;
const TODAY = new Date().toISOString().slice(0, 10);

const ESC = (s) => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
// How React escapes text content, for checking that a heading made it into the markup.
const REACT = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#x27;');

const ssr = await import(path.join(root, 'dist-ssr', 'entry-ssr.js'));
const { render, renderGuide, GUIDES, GUIDES_BASE, GUIDE_UI, guidePath } = ssr;

const base = await readFile(path.join(dist, 'index.html'), 'utf8');
if (!base.includes('<div id="root"></div>')) throw new Error('prerender: #root not found in dist/index.html');

/* ------------------------------------------------------------------ */
/* Head                                                                */
/* ------------------------------------------------------------------ */

// Tags the English homepage carries that every other page must replace.
const DROP = [
  /\n\s*<link rel="canonical"[^>]*>/g,
  /\n\s*<title>[\s\S]*?<\/title>/g,
  /\n\s*<meta name="description"[^>]*>/g,
  /\n\s*<meta property="og:title"[^>]*>/g,
  /\n\s*<meta property="og:description"[^>]*>/g,
  /\n\s*<meta property="og:url"[^>]*>/g,
  /\n\s*<meta property="og:type"[^>]*>/g,
  /\n\s*<meta property="og:locale"[^>]*>/g,
  /\n\s*<meta property="og:locale:alternate"[^>]*>/g,
  /\n\s*<link rel="alternate" hreflang="[^"]*"[^>]*>/g,
  /\n\s*<script type="application\/ld\+json">[\s\S]*?<\/script>/g,
];

/**
 * @param {object} o
 * @param {'en'|'es'} o.lang
 * @param {string} o.url        canonical URL of this page
 * @param {string} o.alt        URL of the same page in the other language
 * @param {string} o.title
 * @param {string} o.desc
 * @param {string} o.ogTitle
 * @param {'website'|'article'} o.type
 * @param {object[]} o.jsonLd
 */
function head({ lang, url, alt, title, desc, ogTitle, type, jsonLd }) {
  const other = lang === 'es' ? 'en' : 'es';
  const en = lang === 'en' ? url : alt;
  const es = lang === 'es' ? url : alt;
  const ld = jsonLd.map((o) => `\n    <script type="application/ld+json">${JSON.stringify(o).replace(/</g, '\\u003c')}</script>`).join('');
  return `
    <link rel="canonical" href="${url}" />
    <title>${ESC(title)}</title>
    <meta name="description" content="${ESC(desc)}" />
    <meta property="og:title" content="${ESC(ogTitle)}" />
    <meta property="og:description" content="${ESC(desc)}" />
    <meta property="og:url" content="${url}" />
    <meta property="og:type" content="${type}" />
    <meta property="og:locale" content="${lang === 'es' ? 'es_US' : 'en_US'}" />
    <meta property="og:locale:alternate" content="${other === 'es' ? 'es_US' : 'en_US'}" />
    <link rel="alternate" hreflang="en" href="${en}" />
    <link rel="alternate" hreflang="es" href="${es}" />
    <link rel="alternate" hreflang="x-default" href="${en}" />${ld}`;
}

function page({ lang, headHtml, markup }) {
  let html = base;
  for (const re of DROP) html = html.replace(re, '');
  html = html.replace('<html lang="en">', `<html lang="${lang}">`);
  html = html.replace('<meta charset="UTF-8" />', `<meta charset="UTF-8" />${headHtml}`);
  html = html.replace('<div id="root"></div>', `<div id="root">${markup}</div>`);
  return html;
}

async function write(rel, html) {
  const file = path.join(dist, rel, 'index.html');
  await mkdir(path.dirname(file), { recursive: true });
  await writeFile(file, html);
  return file;
}

/* ------------------------------------------------------------------ */
/* Structured data                                                     */
/* ------------------------------------------------------------------ */

const ORG = {
  '@type': 'Organization',
  '@id': `${SITE}/#org`,
  name: 'LevelWorks',
  legalName: 'Level Works LLC',
  url: SITE,
  logo: `${SITE}/icon-card.png`,
  email: 'support@levelworks.org',
  founder: { '@type': 'Person', name: 'Eric Connor' },
  address: { '@type': 'PostalAddress', addressLocality: 'Philadelphia', addressRegion: 'PA', addressCountry: 'US' },
};

/** The product, priced. The only pricing that may appear anywhere: $5 a month, 30 days free. */
function softwareLd(lang) {
  return {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    '@id': `${SITE}/#app`,
    name: 'LevelWorks',
    url: lang === 'es' ? `${SITE}/es` : SITE,
    inLanguage: lang === 'es' ? 'es' : 'en',
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'Web, iOS, Android',
    description: lang === 'es'
      ? 'App de presupuestos y facturas para contratistas: presupuestos desde el teléfono, firma del cliente, facturas, pagos con tarjeta y cobro recurrente. $5 al mes, 30 días gratis.'
      : 'Estimating and invoicing app for contractors: estimates from your phone, client signatures, invoices, card payments and recurring billing. $5 a month, 30 days free.',
    image: OG_IMAGE,
    publisher: { '@id': `${SITE}/#org` },
    offers: {
      '@type': 'Offer',
      price: '5.00',
      priceCurrency: 'USD',
      url: lang === 'es' ? `${SITE}/es` : SITE,
      availability: 'https://schema.org/InStock',
      priceSpecification: {
        '@type': 'UnitPriceSpecification',
        price: '5.00',
        priceCurrency: 'USD',
        billingDuration: 1,
        billingIncrement: 1,
        unitCode: 'MON',
      },
      description: lang === 'es' ? '30 días gratis, luego $5 al mes. Cancela cuando quieras.' : '30 days free, then $5 a month. Cancel any time.',
    },
  };
}

function articleLd(g, lang) {
  const tx = g[lang];
  const url = SITE + guidePath(g, lang);
  return [
    {
      '@context': 'https://schema.org',
      '@type': 'Article',
      '@id': `${url}#article`,
      headline: tx.h1,
      description: tx.description,
      inLanguage: lang,
      url,
      mainEntityOfPage: url,
      datePublished: g.updated,
      dateModified: g.updated,
      image: OG_IMAGE,
      author: { '@type': 'Person', name: 'Eric Connor', jobTitle: lang === 'es' ? 'Contratista' : 'Contractor' },
      publisher: { ...ORG, '@context': undefined },
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'LevelWorks', item: lang === 'es' ? `${SITE}/es` : SITE },
        { '@type': 'ListItem', position: 2, name: GUIDE_UI[lang].eyebrow, item: SITE + GUIDES_BASE[lang] },
        { '@type': 'ListItem', position: 3, name: tx.h1, item: url },
      ],
    },
  ];
}

/* ------------------------------------------------------------------ */
/* 1. The Spanish homepage                                             */
/* ------------------------------------------------------------------ */

// Written for what a Spanish-speaking contractor actually types into Google,
// not translated from the English page.
const ES_TITLE = 'LevelWorks — App para hacer estimados y facturas para contratistas. $5 al mes.';
const ES_DESC = 'Programa de estimados para contratistas en español: haz presupuestos desde el '
  + 'teléfono, recibe la firma del cliente, convierte a factura y cobra con tarjeta. '
  + 'Todo por $5 al mes, con 30 días gratis.';
const ES_OG_TITLE = 'LevelWorks — Estimados y facturas para contratistas, en español';

{
  const markup = render();
  const html = page({
    lang: 'es',
    markup,
    headHtml: head({
      lang: 'es', url: `${SITE}/es`, alt: `${SITE}/`,
      title: ES_TITLE, desc: ES_DESC, ogTitle: ES_OG_TITLE, type: 'website',
      jsonLd: [softwareLd('es'), { '@context': 'https://schema.org', ...ORG }],
    }),
  });
  const must = [
    ['<html lang="es">', 'lang="es"'],
    [`<link rel="canonical" href="${SITE}/es" />`, 'Spanish canonical'],
    [`<link rel="alternate" hreflang="es" href="${SITE}/es" />`, 'hreflang es'],
    [`<link rel="alternate" hreflang="en" href="${SITE}/" />`, 'hreflang en'],
    [`<link rel="alternate" hreflang="x-default" href="${SITE}/" />`, 'hreflang x-default'],
    ['og:locale" content="es_US"', 'og:locale es_US'],
    ['"@type":"SoftwareApplication"', 'SoftwareApplication JSON-LD'],
  ];
  for (const [needle, what] of must) if (!html.includes(needle)) throw new Error(`prerender-es: missing ${what}`);
  if (html.includes('<title>LevelWorks — Estimates')) throw new Error('prerender-es: English title survived');
  if (markup.length < 5000) throw new Error(`prerender-es: markup looks empty (${markup.length} bytes)`);
  await write('es', html);
  console.log(`prerender: dist/es/index.html (${(html.length / 1024).toFixed(0)}KB, ${(markup.length / 1024).toFixed(0)}KB of Spanish markup)`);
}

/* ------------------------------------------------------------------ */
/* 2. The guides                                                       */
/* ------------------------------------------------------------------ */

const urls = [];
for (const lang of ['en', 'es']) {
  const other = lang === 'es' ? 'en' : 'es';
  const ui = GUIDE_UI[lang];

  // index
  {
    const url = SITE + GUIDES_BASE[lang];
    const markup = renderGuide(GUIDES_BASE[lang], lang);
    const html = page({
      lang, markup,
      headHtml: head({
        lang, url, alt: SITE + GUIDES_BASE[other],
        title: `${ui.indexTitle} — LevelWorks`, desc: ui.indexDesc, ogTitle: ui.indexTitle, type: 'website',
        jsonLd: [{
          '@context': 'https://schema.org', '@type': 'CollectionPage', name: ui.indexTitle, description: ui.indexDesc, url, inLanguage: lang,
          publisher: { '@id': `${SITE}/#org` },
        }, { '@context': 'https://schema.org', ...ORG }],
      }),
    });
    if (!html.includes(`<html lang="${lang}">`)) throw new Error(`prerender-guides: lang missing on ${url}`);
    if (!markup.includes(REACT(ui.indexH1))) throw new Error(`prerender-guides: index heading missing on ${url}`);
    await write(GUIDES_BASE[lang].slice(1), html);
    urls.push({ loc: url, alt: SITE + GUIDES_BASE[other], lang, lastmod: TODAY, priority: '0.7' });
  }

  // articles
  for (const g of GUIDES) {
    const tx = g[lang];
    const rel = guidePath(g, lang);
    const url = SITE + rel;
    const alt = SITE + guidePath(g, other);
    const markup = renderGuide(rel, lang);
    const html = page({
      lang, markup,
      headHtml: head({ lang, url, alt, title: `${tx.title} — LevelWorks`, desc: tx.description, ogTitle: tx.h1, type: 'article', jsonLd: articleLd(g, lang) }),
    });
    if (!markup.includes(REACT(tx.h1))) throw new Error(`prerender-guides: headline missing on ${url}`);
    if (!html.includes(`<link rel="alternate" hreflang="${other}" href="${alt}" />`)) throw new Error(`prerender-guides: hreflang twin missing on ${url}`);
    if (!html.includes('"@type":"Article"')) throw new Error(`prerender-guides: Article JSON-LD missing on ${url}`);
    if (markup.length < 4000) throw new Error(`prerender-guides: markup looks empty on ${url} (${markup.length} bytes)`);
    if (tx.title.length > 70) console.warn(`prerender-guides: title over 70 chars, Google will cut it: ${tx.title}`);
    if (tx.description.length > 165) console.warn(`prerender-guides: description over 165 chars: ${tx.slug}`);
    await write(rel.slice(1), html);
    urls.push({ loc: url, alt, lang, lastmod: g.updated, priority: '0.8' });
  }
}
console.log(`prerender: ${urls.length} guide pages`);

/* ------------------------------------------------------------------ */
/* 3. The sitemap                                                      */
/* ------------------------------------------------------------------ */

const fixed = [
  { loc: `${SITE}/`, alt: `${SITE}/es`, lang: 'en', lastmod: TODAY, priority: '1.0', freq: 'weekly' },
  { loc: `${SITE}/es`, alt: `${SITE}/`, lang: 'es', lastmod: TODAY, priority: '1.0', freq: 'weekly' },
  { loc: `${SITE}/annual`, alt: `${SITE}/es/annual`, lang: 'en', lastmod: TODAY, priority: '0.9', freq: 'weekly' },
  { loc: `${SITE}/es/annual`, alt: `${SITE}/annual`, lang: 'es', lastmod: TODAY, priority: '0.9', freq: 'weekly' },
  { loc: `${SITE}/terms`, lastmod: '2026-09-07', priority: '0.3', freq: 'monthly' },
  { loc: `${SITE}/privacy`, lastmod: '2026-09-07', priority: '0.3', freq: 'monthly' },
];

function entry(u) {
  const en = u.lang === 'en' ? u.loc : u.alt;
  const es = u.lang === 'es' ? u.loc : u.alt;
  const links = u.alt
    ? `\n    <xhtml:link rel="alternate" hreflang="en" href="${en}" />\n    <xhtml:link rel="alternate" hreflang="es" href="${es}" />\n    <xhtml:link rel="alternate" hreflang="x-default" href="${en}" />`
    : '';
  return `  <url>\n    <loc>${u.loc}</loc>${links}\n    <lastmod>${u.lastmod}</lastmod>\n    <changefreq>${u.freq || 'monthly'}</changefreq>\n    <priority>${u.priority}</priority>\n  </url>`;
}

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"\n        xmlns:xhtml="http://www.w3.org/1999/xhtml">\n${[...fixed, ...urls].map(entry).join('\n')}\n</urlset>\n`;
await writeFile(path.join(dist, 'sitemap.xml'), sitemap);
console.log(`prerender: dist/sitemap.xml (${fixed.length + urls.length} urls)`);
