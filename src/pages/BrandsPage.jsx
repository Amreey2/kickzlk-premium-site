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

export default function BrandsPage() {
  useReveal();
  const toast = useToast('Added to your saved list.');
  const { products, loading: productsLoading, error: productsError } = useProducts();
  const [brands, setBrands] = useState([]);
  const [selectedBrand, setSelectedBrand] = useState('');
  const [brandsLoading, setBrandsLoading] = useState(true);
  const [brandsError, setBrandsError] = useState('');

  useEffect(() => {
    let active = true;
    catalogApi.brands().then((items) => { if (active) setBrands(items); }).catch(() => {
      if (active) setBrandsError('Brands are temporarily unavailable.');
    }).finally(() => { if (active) setBrandsLoading(false); });
    return () => { active = false; };
  }, []);

  const visibleProducts = selectedBrand ? products.filter((product) => product.brand === selectedBrand) : [];

  return (
    <PageShell>
      <PageHero kicker="GLOBAL LABELS" title="BRANDS" copy="From iconic sportswear to statement luxury, sourced to match your rotation." />
      <section className="section-pad"><div className="container">
        {!selectedBrand && <>
          <ProductCollectionState loading={brandsLoading} error={brandsError} empty={!brandsLoading && !brandsError && brands.length === 0} />
          {!brandsLoading && !brandsError && <div className="brand-grid reveal">
            {brands.map((brand, index) => <button className="brand-tile" type="button" key={brand.id} onClick={() => setSelectedBrand(brand.name)}><span>{brand.name.toUpperCase()}</span><small>{String(index + 1).padStart(2, '0')} →</small></button>)}
          </div>}
        </>}
        {selectedBrand && <>
          <div className="shop-toolbar reveal"><button className="filter-btn active" type="button" onClick={() => setSelectedBrand('')}>← ALL BRANDS</button><span>{selectedBrand.toUpperCase()} · {visibleProducts.length} PAIRS</span></div>
          <ProductCollectionState loading={productsLoading} error={productsError} empty={!productsLoading && !productsError && visibleProducts.length === 0} />
          <div className="product-grid">{visibleProducts.map((product) => <ProductCard product={product} key={product.id} showCommerceDetails onSaved={(saved) => toast.showToast(saved ? `${product.name} saved.` : `${product.name} removed.`)} />)}</div>
        </>}
      </div></section>
      <Toast message={toast.message} visible={toast.visible} />
    </PageShell>
  );
}
