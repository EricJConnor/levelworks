/**
 * Server entry for the Spanish homepage.
 *
 * The site is a Vite SPA — every URL is served the same index.html — so a
 * Spanish route alone would only ever be a client-side state flip, and the
 * HTML a crawler or a link preview actually receives would still be English.
 * This renders the landing page to real Spanish HTML at build time, which
 * `scripts/prerender-es.mjs` writes to dist/es/index.html.
 *
 * Only the providers the landing page actually reads are here. BrowserRouter
 * is not one of them: it touches window.history, which does not exist in Node.
 */
import { renderToString } from 'react-dom/server';
import { StaticRouter } from 'react-router-dom/server';
import { LanguageProvider } from './i18n';
import LandingPage from './pages/LandingPage';

export function render(): string {
  return renderToString(
    <StaticRouter location="/es">
      <LanguageProvider initial="es">
        <LandingPage />
      </LanguageProvider>
    </StaticRouter>,
  );
}
