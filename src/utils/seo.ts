import { PageSeoData } from './api';
import { applyDynamicFavicon } from './logo';

function setMetaTag(selector: string, attribute: string, value: string, createIfMissing: { tag: string; attrName: string; attrVal: string }) {
  if (typeof document === 'undefined') return;
  let element = document.querySelector(selector);
  if (!element && createIfMissing) {
    element = document.createElement(createIfMissing.tag);
    element.setAttribute(createIfMissing.attrName, createIfMissing.attrVal);
    document.head.appendChild(element);
  }
  if (element) {
    element.setAttribute(attribute, value);
  }
}

export function applyClientSeo(seo: Partial<PageSeoData>) {
  if (typeof document === 'undefined') return;

  // Title
  if (seo.title) {
    document.title = seo.title;
  }

  const isOnProgramSlug =
    typeof window !== 'undefined' &&
    window.location.pathname.startsWith('/programas/') &&
    window.location.pathname.replace(/\/+$/, '') !== '/programas';

  // Dynamic Favicon (program logo only on /programas/:slug; mascot on the rest of the site)
  if (isOnProgramSlug && seo.faviconUrl) {
    applyDynamicFavicon(seo.faviconUrl);
  } else {
    applyDynamicFavicon('/reb_mascot.jpg');
  }

  // Meta Description
  if (seo.description) {
    setMetaTag('meta[name="description"]', 'content', seo.description, {
      tag: 'meta',
      attrName: 'name',
      attrVal: 'description',
    });
  }

  // Keywords
  if (seo.keywords) {
    setMetaTag('meta[name="keywords"]', 'content', seo.keywords, {
      tag: 'meta',
      attrName: 'name',
      attrVal: 'keywords',
    });
  }

  // Canonical
  const canonicalUrl = seo.canonicalUrl || (typeof window !== 'undefined' ? window.location.origin + window.location.pathname : '');
  if (canonicalUrl) {
    setMetaTag('link[rel="canonical"]', 'href', canonicalUrl, {
      tag: 'link',
      attrName: 'rel',
      attrVal: 'canonical',
    });
  }

  // OpenGraph
  const ogTitle = seo.ogTitle || seo.title || 'Rebeldia FM';
  const ogDescription = seo.ogDescription || seo.description || '';
  const rawOgImage = isOnProgramSlug ? (seo.ogImage || '/reb_mascot.jpg') : '/reb_mascot.jpg';
  const safeOgImage = rawOgImage.startsWith('data:') ? '/reb_mascot.jpg' : rawOgImage;
  const ogImage =
    safeOgImage.startsWith('/') && typeof window !== 'undefined'
      ? `${window.location.origin}${safeOgImage}`
      : safeOgImage;
  const ogType = seo.ogType || 'website';

  setMetaTag('meta[property="og:title"]', 'content', ogTitle, { tag: 'meta', attrName: 'property', attrVal: 'og:title' });
  setMetaTag('meta[property="og:description"]', 'content', ogDescription, { tag: 'meta', attrName: 'property', attrVal: 'og:description' });
  setMetaTag('meta[property="og:type"]', 'content', ogType, { tag: 'meta', attrName: 'property', attrVal: 'og:type' });
  setMetaTag('meta[property="og:image"]', 'content', ogImage, { tag: 'meta', attrName: 'property', attrVal: 'og:image' });
  if (canonicalUrl) {
    setMetaTag('meta[property="og:url"]', 'content', canonicalUrl, { tag: 'meta', attrName: 'property', attrVal: 'og:url' });
  }

  // Twitter Cards
  const twitterCard = seo.twitterCard || 'summary_large_image';
  setMetaTag('meta[name="twitter:card"]', 'content', twitterCard, { tag: 'meta', attrName: 'name', attrVal: 'twitter:card' });
  setMetaTag('meta[name="twitter:title"]', 'content', ogTitle, { tag: 'meta', attrName: 'name', attrVal: 'twitter:title' });
  setMetaTag('meta[name="twitter:description"]', 'content', ogDescription, { tag: 'meta', attrName: 'name', attrVal: 'twitter:description' });
  setMetaTag('meta[name="twitter:image"]', 'content', ogImage, { tag: 'meta', attrName: 'name', attrVal: 'twitter:image' });

  // GEO Tags (Geotargeting)
  const geoRegion = seo.geoRegion || 'BR-SC';
  const geoPlacename = seo.geoPlacename || 'Florianopolis, Santa Catarina, Brasil';
  const geoPosition = seo.geoPosition || '-27.5954;-48.5480';
  const icbm = seo.icbm || '-27.5954, -48.5480';

  setMetaTag('meta[name="geo.region"]', 'content', geoRegion, { tag: 'meta', attrName: 'name', attrVal: 'geo.region' });
  setMetaTag('meta[name="geo.placename"]', 'content', geoPlacename, { tag: 'meta', attrName: 'name', attrVal: 'geo.placename' });
  setMetaTag('meta[name="geo.position"]', 'content', geoPosition, { tag: 'meta', attrName: 'name', attrVal: 'geo.position' });
  setMetaTag('meta[name="ICBM"]', 'content', icbm, { tag: 'meta', attrName: 'name', attrVal: 'ICBM' });

  // Schema.org Structured Data (JSON-LD)
  let scriptTag = document.getElementById('rebeldia-jsonld') as HTMLScriptElement | null;
  if (!scriptTag) {
    scriptTag = document.createElement('script');
    scriptTag.id = 'rebeldia-jsonld';
    scriptTag.type = 'application/ld+json';
    document.head.appendChild(scriptTag);
  }

  const lat = geoPosition.includes(';') ? geoPosition.split(';')[0].trim() : '-27.5954';
  const lng = geoPosition.includes(';') ? geoPosition.split(';')[1].trim() : '-48.5480';

  scriptTag.textContent = seo.jsonLdCustom || JSON.stringify({
    '@context': 'https://schema.org',
    '@type': seo.schemaType || 'RadioStation',
    'name': seo.title || 'Rebeldia FM',
    'description': seo.description || 'Rádio Web Livre 24 horas no ar.',
    'url': canonicalUrl || 'https://rebeldiafm.com.br',
    'address': {
      '@type': 'PostalAddress',
      'addressLocality': 'Florianopolis',
      'addressRegion': 'SC',
      'addressCountry': 'BR',
    },
    'geo': {
      '@type': 'GeoCoordinates',
      'latitude': lat,
      'longitude': lng,
    },
  }, null, 2);
}
