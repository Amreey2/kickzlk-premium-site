import { useEffect } from 'react';
import { absoluteSeoUrl, DEFAULT_DESCRIPTION, DEFAULT_TITLE, fallbackImage } from '../utils/seo';

const setMeta = (selector, attributes, content) => {
  let element = document.head.querySelector(selector);
  if (!element) {
    element = document.createElement('meta');
    Object.entries(attributes).forEach(([key, value]) => element.setAttribute(key, value));
    document.head.appendChild(element);
  }
  element.setAttribute('content', content);
};

export default function Seo({
  title = DEFAULT_TITLE,
  description = DEFAULT_DESCRIPTION,
  canonicalPath = '/',
  image,
  type = 'website',
  noIndex = false,
  jsonLd = [],
}) {
  useEffect(() => {
    const canonicalUrl = absoluteSeoUrl(canonicalPath);
    const socialImage = image ? absoluteSeoUrl(image) : fallbackImage();
    document.title = title;
    setMeta('meta[name="description"]', { name: 'description' }, description);
    setMeta('meta[name="robots"]', { name: 'robots' }, noIndex ? 'noindex, nofollow' : 'index, follow, max-image-preview:large');
    setMeta('meta[property="og:title"]', { property: 'og:title' }, title);
    setMeta('meta[property="og:description"]', { property: 'og:description' }, description);
    setMeta('meta[property="og:type"]', { property: 'og:type' }, type);
    setMeta('meta[property="og:url"]', { property: 'og:url' }, canonicalUrl);
    setMeta('meta[property="og:image"]', { property: 'og:image' }, socialImage);
    setMeta('meta[property="og:site_name"]', { property: 'og:site_name' }, 'KICKZ.LK');
    setMeta('meta[name="twitter:card"]', { name: 'twitter:card' }, 'summary_large_image');
    setMeta('meta[name="twitter:title"]', { name: 'twitter:title' }, title);
    setMeta('meta[name="twitter:description"]', { name: 'twitter:description' }, description);
    setMeta('meta[name="twitter:image"]', { name: 'twitter:image' }, socialImage);

    let canonical = document.head.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.rel = 'canonical';
      document.head.appendChild(canonical);
    }
    canonical.href = canonicalUrl;

    document.head.querySelectorAll('script[data-kickz-seo-jsonld]').forEach((script) => script.remove());
    (Array.isArray(jsonLd) ? jsonLd : [jsonLd]).filter(Boolean).forEach((value) => {
      const script = document.createElement('script');
      script.type = 'application/ld+json';
      script.dataset.kickzSeoJsonld = 'true';
      script.text = JSON.stringify(value).replace(/</g, '\\u003c');
      document.head.appendChild(script);
    });
    window.dispatchEvent(new Event('kickz:seo-ready'));
  }, [canonicalPath, description, image, jsonLd, noIndex, title, type]);

  return null;
}
