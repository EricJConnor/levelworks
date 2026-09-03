// Build-time renderer. scripts/prerender.mjs loads this through Vite after
// `vite build` and writes the resulting markup into dist/, so crawlers that
// do not run JavaScript (most AI search bots) get the real page instead of an
// empty <div id="root">. React's createRoot().render() replaces the markup on
// mount, so nothing else about the app changes.
import { renderToString } from 'react-dom/server';
import { StaticRouter } from 'react-router-dom/server';
import LandingPage from './pages/LandingPage';
import Terms from './pages/Terms';
import Privacy from './pages/Privacy';
import { SITE, FEATURES, FAQS } from './site';

type Route = { path: string; title: string; description: string; element: JSX.Element };

const ROUTES: Route[] = [
  { path: '/', title: SITE.title, description: SITE.description, element: <LandingPage /> },
  {
    path: '/terms',
    title: 'Terms of Service – LevelWorks',
    description: 'Terms of Service for LevelWorks, the $5/month estimates, invoices and payments app for contractors.',
    element: <Terms />,
  },
  {
    path: '/privacy',
    title: 'Privacy Policy – LevelWorks',
    description: 'Privacy Policy for LevelWorks, the $5/month estimates, invoices and payments app for contractors.',
    element: <Privacy />,
  },
];

export const routes = ROUTES.map((r) => r.path);

function structuredData() {
  const org = `${SITE.url}/#organization`;
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        '@id': org,
        name: SITE.name,
        legalName: SITE.legalName,
        url: `${SITE.url}/`,
        logo: `${SITE.url}/og.png`,
        email: SITE.email,
        contactPoint: [{ '@type': 'ContactPoint', contactType: 'customer support', email: SITE.email }],
      },
      {
        '@type': 'WebSite',
        '@id': `${SITE.url}/#website`,
        url: `${SITE.url}/`,
        name: SITE.name,
        publisher: { '@id': org },
      },
      {
        '@type': 'SoftwareApplication',
        '@id': `${SITE.url}/#app`,
        name: SITE.name,
        alternateName: 'Level Works',
        url: `${SITE.url}/`,
        description: SITE.description,
        applicationCategory: 'BusinessApplication',
        applicationSubCategory: 'Contractor estimating, invoicing and payments software',
        operatingSystem: 'Web browser (iPhone, Android, desktop); installable as a progressive web app',
        featureList: FEATURES,
        audience: {
          '@type': 'BusinessAudience',
          audienceType: 'Contractors, remodelers, painters, handymen, HVAC, plumbing, electrical, landscaping and other trades and service businesses',
        },
        offers: {
          '@type': 'Offer',
          price: SITE.priceUsd.toFixed(2),
          priceCurrency: 'USD',
          availability: 'https://schema.org/InStock',
          url: `${SITE.url}/#pricing`,
          description: `$${SITE.priceUsd} per month, every feature included. ${SITE.trialDays}-day free trial, no credit card required. Cancel anytime.`,
          priceSpecification: {
            '@type': 'UnitPriceSpecification',
            price: SITE.priceUsd.toFixed(2),
            priceCurrency: 'USD',
            referenceQuantity: { '@type': 'QuantitativeValue', value: 1, unitCode: 'MON' },
          },
        },
        publisher: { '@id': org },
      },
      {
        '@type': 'FAQPage',
        '@id': `${SITE.url}/#faq`,
        mainEntity: FAQS.map((f) => ({
          '@type': 'Question',
          name: f.q,
          acceptedAnswer: { '@type': 'Answer', text: f.a },
        })),
      },
    ],
  };
}

export function render(path: string) {
  const route = ROUTES.find((r) => r.path === path);
  if (!route) throw new Error(`No prerender route for ${path}`);
  const html = renderToString(<StaticRouter location={path}>{route.element}</StaticRouter>);
  const canonical = path === '/' ? `${SITE.url}/` : `${SITE.url}${path}`;
  return {
    html,
    title: route.title,
    description: route.description,
    canonical,
    jsonLd: path === '/' ? JSON.stringify(structuredData()) : null,
  };
}
