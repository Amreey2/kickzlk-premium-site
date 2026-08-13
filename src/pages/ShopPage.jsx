import { useState } from 'react';
import PageHero from '../components/PageHero';
import PageShell from '../components/PageShell';
import ShopCatalog from '../components/shop/ShopCatalog';
import Toast from '../components/Toast';
import useReveal from '../hooks/useReveal';
import useToast from '../hooks/useToast';

export default function ShopPage({ initialView = 'all' }) {
  useReveal();
  const toast = useToast('Added to your saved list.');

  const [search, setSearch] = useState(() => new URLSearchParams(window.location.search).get('search') || '');

  const handleSaved = (product, saved) => {
    toast.showToast(saved ? `${product.name} added to your saved list.` : `${product.name} removed from your saved list.`);
  };

  return (
    <PageShell>
      {/* SPRINT 3.1 SHOP FOUNDATION: shared entry point for every local catalog view. */}
      <PageHero
        kicker="CURATED FOR SRI LANKA"
        title="SHOP"
        copy="Explore authentic new drops and global pairs selected for the KICKZ.LK rotation."
      >
        <label className="shop-hero-search">
          <span>SEARCH SNEAKERS</span>
          <span className="shop-hero-search__field"><input type="search" value={search} onChange={(event) => { setSearch(event.target.value); window.dispatchEvent(new Event('kickz:shop-search')); }} placeholder="Search by product, brand or SKU..." aria-label="Search products by name, brand or SKU" /><i aria-hidden="true">⌕</i></span>
        </label>
      </PageHero>
      <ShopCatalog initialView={initialView} onSaved={handleSaved} searchTerm={search} />
      <Toast message={toast.message} visible={toast.visible} />
    </PageShell>
  );
}
