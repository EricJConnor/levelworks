/**
 * Server entry for the prerendered marketing pages: the Spanish homepage and
 * the guides in both languages.
 *
 * The site is a Vite SPA — every URL is served the same index.html — so a
 * Spanish route or a guide would only ever be a client-side state flip, and
 * the HTML a crawler or a link preview actually receives would still be the
 * English homepage. This renders each page to real HTML at build time, which
 * `scripts/prerender.mjs` writes into dist/.
 *
 * Only the providers these pages actually read are here. BrowserRouter is not
 * one of them: it touches window.history, which does not exist in Node.
 */
import { renderToString } from 'react-dom/server';
import { Routes } from 'react-router-dom';
import { StaticRouter } from 'react-router-dom/server';
import { LanguageProvider } from './i18n';
import LandingPage from './pages/LandingPage';
import { guideRoutes } from './pages/GuidePage';

export { GUIDES, GUIDES_BASE, GUIDE_UI, guidePath } from './guides/content';

export function render(): string {
  return renderToString(
    <StaticRouter location="/es">
      <LanguageProvider initial="es">
        <LandingPage />
      </LanguageProvider>
    </StaticRouter>,
  );
}

export function renderGuide(path: string, lang: 'en' | 'es'): string {
  return renderToString(
    <StaticRouter location={path}>
      <LanguageProvider initial={lang}>
        <Routes>{guideRoutes()}</Routes>
      </LanguageProvider>
    </StaticRouter>,
  );
}
