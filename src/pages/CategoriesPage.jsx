import { useEffect, useState } from 'react';
import PageHero from '../components/PageHero';
import PageShell from '../components/PageShell';
import ProductCollectionState from '../components/ProductCollectionState';
import Seo from '../components/Seo';
import ShopCatalog from '../components/shop/ShopCatalog';
import Toast from '../components/Toast';
import useReveal from '../hooks/useReveal';
import useToast from '../hooks/useToast';
import { catalogApi } from '../services/api';
import { breadcrumbSchema, slugifySeo } from '../utils/seo';

export default function CategoriesPage({ categorySlug = '' }) {
  useReveal();
  const toast = useToast('Added to your saved list.');
  const [category, setCategory] = useState(null);
  const [loadingCategory, setLoadingCategory] = useState(Boolean(categorySlug));
  const [categoryMissing, setCategoryMissing] = useState(false);
  const [seoSearch, setSeoSearch] = useState(window.location.search);
  useEffect(() => {
    if (!categorySlug) return;
    let active = true;
    catalogApi.categories().then((items) => {
      if (!active) return;
      const match = items.find((item) => slugifySeo(item.name) === categorySlug);
      setCategory(match || null); setCategoryMissing(!match);
    }).catch(() => { if (active) setCategoryMissing(true); }).finally(() => { if (active) setLoadingCategory(false); });
    return () => { active = false; };
  }, [categorySlug]);
  useEffect(() => {
    const update = () => setSeoSearch(window.location.search);
    window.addEventListener('popstate', update);
    window.addEventListener('kickz:location-change', update);
    return () => { window.removeEventListener('popstate', update); window.removeEventListener('kickz:location-change', update); };
  }, []);
  if (loadingCategory) return <PageShell><Seo title="Loading Category | KICKZ.LK" canonicalPath={`/category/${categorySlug}`} noIndex /><ProductCollectionState loading /></PageShell>;
  if (categoryMissing) return <PageShell><Seo title="Category Not Found | KICKZ.LK" canonicalPath={`/category/${categorySlug}`} noIndex /><PageHero kicker="404" title="CATEGORY NOT FOUND" copy="This category is not available in the active KICKZ.LK catalogue." /></PageShell>;
  return <PageShell>
    {category && <Seo
      title={category.metaTitle || `${category.name} | KICKZ.LK`}
      description={category.metaDescription || `Shop authentic ${category.name} from KICKZ.LK in Sri Lanka.`}
      canonicalPath={(() => { const params = new URLSearchParams(seoSearch); const page = Math.max(1, Number(params.get('page')) || 1); const filtered = [...params.keys()].some((key) => key !== 'page'); return `/category/${slugifySeo(category.name)}${!filtered && page > 1 ? `?page=${page}` : ''}`; })()}
      noIndex={(() => { const params = new URLSearchParams(seoSearch); return [...params.keys()].some((key) => key !== 'page'); })()}
      image={category.image || undefined}
      jsonLd={breadcrumbSchema([['Home', '/'], ['Categories', '/categories'], [category.name, `/category/${slugifySeo(category.name)}`]])}
    />}
    <PageHero kicker="LIVE CATALOGUE" title={category?.name?.toUpperCase() || 'CATEGORIES'} copy={category ? `Browse active ${category.name} products in the current KICKZ.LK catalogue.` : 'Browse the current KICKZ.LK catalogue by active category.'} />
    <ShopCatalog key={category?.name || 'all-categories'} initialView="categories" initialCategory={category?.name || ''} onSaved={(product, saved) => toast.showToast(saved ? `${product.name} saved.` : `${product.name} removed.`)} />
    <Toast message={toast.message} visible={toast.visible} />
  </PageShell>;
}
