import { useEffect, useMemo, useState } from 'react';
import Seo from './Seo';
import { breadcrumbSchema, DEFAULT_DESCRIPTION, DEFAULT_TITLE, organizationSchema, websiteSchema } from '../utils/seo';

const pages = {
  '/': { title: DEFAULT_TITLE, description: DEFAULT_DESCRIPTION, canonicalPath: '/', jsonLd: [organizationSchema, websiteSchema] },
  '/index.html': { title: DEFAULT_TITLE, description: DEFAULT_DESCRIPTION, canonicalPath: '/', jsonLd: [organizationSchema, websiteSchema] },
  '/shop': { title: 'Shop All Authentic Sneakers | KICKZ.LK', description: 'Browse the complete KICKZ.LK rotation of authentic sneakers and curated global drops in Sri Lanka.', canonicalPath: '/shop' },
  '/new-drops': { title: 'New Sneaker Drops | KICKZ.LK', description: 'Explore the newest authentic sneakers added to the KICKZ.LK catalogue.', canonicalPath: '/new-drops' },
  '/brands': { title: 'Sneaker Brands | KICKZ.LK', description: 'Browse active sneaker brands available from KICKZ.LK in Sri Lanka.', canonicalPath: '/brands' },
  '/categories': { title: 'Sneaker Categories | KICKZ.LK', description: 'Browse authentic KICKZ.LK sneakers by category, activity, size, colour and more.', canonicalPath: '/categories' },
  '/about': { title: 'About KICKZ.LK | Authentic Sneaker Sourcing', description: 'Learn about KICKZ.LK authentic sneaker sourcing, quality checks and support for Sri Lanka.', canonicalPath: '/about' },
  '/about-us': { title: 'About KICKZ.LK | Authentic Sneaker Sourcing', description: 'Learn about KICKZ.LK authentic sneaker sourcing, quality checks and support for Sri Lanka.', canonicalPath: '/about' },
  '/community': { title: 'About KICKZ.LK | Authentic Sneaker Sourcing', description: 'Learn about KICKZ.LK authentic sneaker sourcing, quality checks and support for Sri Lanka.', canonicalPath: '/about' },
  '/contact': { title: 'Contact KICKZ.LK | Sneaker Sizing & Order Support', description: 'Contact KICKZ.LK for sneaker sizing, sourcing, pricing and order support in Sri Lanka.', canonicalPath: '/contact' },
};

const privatePaths = ['/login', '/register', '/forgot-password', '/reset-password', '/account', '/cart', '/checkout', '/checkout/start', '/order-confirmation', '/track-order'];

export default function RouteSeo({ pathname }) {
  const [search, setSearch] = useState(window.location.search);
  useEffect(() => {
    const update = () => setSearch(window.location.search);
    window.addEventListener('popstate', update);
    window.addEventListener('kickz:location-change', update);
    return () => { window.removeEventListener('popstate', update); window.removeEventListener('kickz:location-change', update); };
  }, []);

  const config = useMemo(() => {
    if (pages[pathname]) {
      const base = pages[pathname];
      if (!['/shop', '/categories'].includes(pathname)) return base;
      const params = new URLSearchParams(search);
      const page = Math.max(1, Number(params.get('page')) || 1);
      const nonPageParams = [...params.keys()].filter((key) => key !== 'page');
      return {
        ...base,
        title: page > 1 ? `${base.title} — Page ${page}` : base.title,
        canonicalPath: nonPageParams.length ? base.canonicalPath : `${base.canonicalPath}${page > 1 ? `?page=${page}` : ''}`,
        noIndex: nonPageParams.length > 0,
      };
    }
    if (pathname.startsWith('/admin/') || privatePaths.some((path) => pathname === path || pathname.startsWith(`${path}/`))) {
      return { title: `Private Page | KICKZ.LK`, description: 'Private KICKZ.LK customer or administration page.', canonicalPath: pathname, noIndex: true };
    }
    return null;
  }, [pathname, search]);

  if (!config) return null;
  const jsonLd = config.jsonLd || (!config.noIndex ? breadcrumbSchema([['Home', '/'], [config.title.split(' | ')[0], config.canonicalPath]]) : []);
  return <Seo {...config} jsonLd={jsonLd} />;
}
