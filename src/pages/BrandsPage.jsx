import { useEffect, useState } from 'react';
import PageHero from '../components/PageHero';
import PageShell from '../components/PageShell';
import ProductCard from '../components/ProductCard';
import ProductCollectionState from '../components/ProductCollectionState';
import Toast from '../components/Toast';
import { useProducts } from '../hooks/useProducts';
import useReveal from '../hooks/useReveal';
import useToast from '../hooks/useToast';
import { catalogApi } from '../services/api';
import BrandTile from '../components/BrandTile';
import Seo from '../components/Seo';
import { breadcrumbSchema, slugifySeo } from '../utils/seo';
import { trackCatalogSelection } from '../utils/analytics';

export default function BrandsPage({ brandSlug = '' }) {
  useReveal();
  const toast = useToast('Added to your saved list.');
  const { products, loading: productsLoading, error: productsError } = useProducts();
  const [brands, setBrands] = useState([]);
  const [selectedBrand, setSelectedBrand] = useState(() => new URLSearchParams(window.location.search).get('brand') || '');
  const [brandsLoading, setBrandsLoading] = useState(true);
  const [brandsError, setBrandsError] = useState('');

  useEffect(() => {
    let active = true;
    catalogApi.brands().then((items) => { if (active) { setBrands(items); if (brandSlug) setSelectedBrand(items.find((brand) => slugifySeo(brand.name) === brandSlug)?.name || ''); } }).catch(() => {
      if (active) setBrandsError('Brands are temporarily unavailable.');
    }).finally(() => { if (active) setBrandsLoading(false); });
    return () => { active = false; };
  }, [brandSlug]);

  const visibleProducts = selectedBrand ? products.filter((product) => product.brand === selectedBrand) : [];
  const selectedBrandData = brands.find((brand) => brand.name === selectedBrand);
  const brandMissing = Boolean(brandSlug && !brandsLoading && !selectedBrandData);
  const selectBrand = (brand) => {
    trackCatalogSelection('brand', brand.name);
    setSelectedBrand(brand.name);
    window.history.pushState({}, '', `/brand/${slugifySeo(brand.name)}`);
    window.dispatchEvent(new Event('kickz:location-change'));
  };
  const clearBrand = () => {
    setSelectedBrand('');
    window.history.pushState({}, '', '/brands');
    window.dispatchEvent(new Event('kickz:location-change'));
  };

  if (brandMissing) return <PageShell><Seo title="Brand Not Found | KICKZ.LK" canonicalPath={`/brand/${brandSlug}`} noIndex /><PageHero kicker="404" title="BRAND NOT FOUND" copy="This brand is not available in the active KICKZ.LK catalogue." /></PageShell>;

  return (
    <PageShell>
      {brandSlug && brandsLoading && <Seo title="Loading Brand | KICKZ.LK" canonicalPath={`/brand/${brandSlug}`} noIndex />}
      {selectedBrandData && <Seo
        title={selectedBrandData.metaTitle || `${selectedBrandData.name} | KICKZ.LK`}
        description={selectedBrandData.metaDescription || `Shop authentic ${selectedBrandData.name} sneakers available from KICKZ.LK in Sri Lanka.`}
        canonicalPath={`/brand/${slugifySeo(selectedBrandData.name)}`}
        image={selectedBrandData.logoImage || undefined}
        jsonLd={breadcrumbSchema([['Home', '/'], ['Brands', '/brands'], [selectedBrandData.name, `/brand/${slugifySeo(selectedBrandData.name)}`]])}
      />}
      <PageHero kicker="GLOBAL LABELS" title="BRANDS" copy="From iconic sportswear to statement luxury, sourced to match your rotation." />
      <section className="section-pad"><div className="container">
        {!selectedBrand && <>
          <ProductCollectionState loading={brandsLoading} error={brandsError} empty={!brandsLoading && !brandsError && brands.length === 0} />
          {!brandsLoading && !brandsError && <div className="brand-grid reveal">
            {brands.map((brand, index) => <BrandTile brand={brand} index={index} key={brand.id} href={`/brand/${slugifySeo(brand.name)}`} onClick={() => selectBrand(brand)} />)}
          </div>}
        </>}
        {selectedBrand && <>
          <div className="shop-toolbar reveal"><button className="filter-btn active" type="button" onClick={clearBrand}>← ALL BRANDS</button><span>{selectedBrand.toUpperCase()} · {visibleProducts.length} PAIRS</span></div>
          <ProductCollectionState loading={productsLoading} error={productsError} empty={!productsLoading && !productsError && visibleProducts.length === 0} />
          <div className="product-grid">{visibleProducts.map((product) => <ProductCard product={product} key={product.id} showCommerceDetails onSaved={(saved) => toast.showToast(saved ? `${product.name} saved.` : `${product.name} removed.`)} />)}</div>
        </>}
      </div></section>
      <Toast message={toast.message} visible={toast.visible} />
    </PageShell>
  );
}
