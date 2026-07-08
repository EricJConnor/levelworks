import { useEffect } from 'react';

interface DocumentMetaOptions {
  title: string;
  description: string;
  canonicalPath: string;
}

function setMetaTag(attr: 'name' | 'property', key: string, content: string) {
  let tag = document.querySelector(`meta[${attr}="${key}"]`);
  if (!tag) {
    tag = document.createElement('meta');
    tag.setAttribute(attr, key);
    document.head.appendChild(tag);
  }
  tag.setAttribute('content', content);
}

export function useDocumentMeta({ title, description, canonicalPath }: DocumentMetaOptions) {
  useEffect(() => {
    const previousTitle = document.title;
    document.title = title;

    setMetaTag('name', 'description', description);
    setMetaTag('property', 'og:title', title);
    setMetaTag('property', 'og:description', description);
    setMetaTag('name', 'twitter:title', title);
    setMetaTag('name', 'twitter:description', description);

    let canonical = document.querySelector('link[rel="canonical"]');
    const previousCanonical = canonical?.getAttribute('href') ?? null;
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.setAttribute('rel', 'canonical');
      document.head.appendChild(canonical);
    }
    canonical.setAttribute('href', `https://levelworks.org${canonicalPath}`);

    return () => {
      document.title = previousTitle;
      if (previousCanonical) canonical?.setAttribute('href', previousCanonical);
    };
  }, [title, description, canonicalPath]);
}
