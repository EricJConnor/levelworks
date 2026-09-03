// Runs after `vite build`. Renders the public pages to static HTML inside
// dist/ so search engines and AI crawlers read the real content. If anything
// goes wrong it logs loudly and leaves the plain SPA build in place, so a
// prerender problem can never take the site down.
import fs from 'node:fs';
import path from 'node:path';
import { createServer } from 'vite';

const dist = path.resolve('dist');
const templatePath = path.join(dist, 'index.html');

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

function setMeta(html, attr, key, value) {
  const re = new RegExp(`(<meta\\s+${attr}="${key}"\\s+content=")[^"]*(")`);
  return re.test(html) ? html.replace(re, `$1${esc(value)}$2`) : html;
}

function applyHead(html, page) {
  html = html.replace(/<title>[^<]*<\/title>/, `<title>${esc(page.title)}</title>`);
  html = html.replace(/(<link\s+rel="canonical"\s+href=")[^"]*(")/, `$1${esc(page.canonical)}$2`);
  html = setMeta(html, 'name', 'description', page.description);
  html = setMeta(html, 'property', 'og:title', page.title);
  html = setMeta(html, 'property', 'og:description', page.description);
  html = setMeta(html, 'property', 'og:url', page.canonical);
  html = setMeta(html, 'name', 'twitter:title', page.title);
  html = setMeta(html, 'name', 'twitter:description', page.description);
  if (page.jsonLd) {
    const safe = page.jsonLd.replace(/</g, '\\u003c');
    html = html.replace('</head>', `    <script type="application/ld+json">${safe}</script>\n  </head>`);
  }
  return html;
}

async function main() {
  if (!fs.existsSync(templatePath)) throw new Error(`${templatePath} not found; run vite build first`);
  const template = fs.readFileSync(templatePath, 'utf8');
  if (!template.includes('<div id="root"></div>')) throw new Error('index.html has no empty #root to fill');

  const vite = await createServer({ server: { middlewareMode: true }, appType: 'custom', logLevel: 'error' });
  try {
    const { render, routes } = await vite.ssrLoadModule('/src/prerender.tsx');
    for (const route of routes) {
      const page = render(route);
      let html = applyHead(template, page);
      html = html.replace('<div id="root"></div>', `<div id="root">${page.html}</div>`);
      const out = route === '/' ? templatePath : path.join(dist, route.replace(/^\//, ''), 'index.html');
      fs.mkdirSync(path.dirname(out), { recursive: true });
      fs.writeFileSync(out, html);
      console.log(`prerendered ${route} -> ${path.relative(process.cwd(), out)} (${(page.html.length / 1024).toFixed(1)} KB of markup)`);
    }
  } finally {
    await vite.close();
  }
}

main().catch((err) => {
  console.error('\n[prerender] FAILED - shipping the plain client-rendered build instead.\n', err);
  process.exit(0);
});
