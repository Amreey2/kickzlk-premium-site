import { useEffect, useMemo, useState } from 'react';
import { useProducts } from '../../hooks/useProducts';
import { catalogApi } from '../../services/api';
import ProductCard from '../ProductCard';
import ProductCollectionState from '../ProductCollectionState';

const views = [
  ['all', 'ALL PRODUCTS'],
  ['new', 'NEW DROPS'],
  ['preorder', 'PRE ORDER'],
  ['brands', 'BRANDS'],
  ['categories', 'CATEGORIES'],
];

export default function ShopCatalog({ initialView = 'all', onSaved }) {
  const queryCategory = new URLSearchParams(window.location.search).get('category') || 'all';
  const [view, setView] = useState(queryCategory !== 'all' ? 'categories' : initialView);
  const [brand, setBrand] = useState('all');
  const [category, setCategory] = useState(queryCategory);
  const [categories, setCategories] = useState([]);
  const { products, loading, error } = useProducts();
  const brands = useMemo(() => [...new Set(products.map((product) => product.brand))], [products]);
  useEffect(() => {
    let active = true;
    catalogApi.categories().then((items) => { if (active) setCategories(items); }, () => { if (active) setCategories([]); });
    return () => { active = false; };
  }, []);

  const visibleProducts = products.filter((product, index) => {
    // The API is newest-first; use its leading products until a dedicated featured flag exists.
    if (view === 'new') return index < 4;
    if (view === 'preorder') return product.preOrder;
    if (view === 'brands' && brand !== 'all') return product.brand === brand;
    if (view === 'categories' && category !== 'all') return product.category === category;
    return true;
  });

  const selectView = (nextView) => {
    setView(nextView);
    if (nextView !== 'brands') setBrand('all');
    if (nextView !== 'categories') setCategory('all');
  };

  return (
    <section className="shop-catalog section-pad">
      <div className="container">
        {/* SPRINT 3.1 SHOP CONTROLS: one reusable catalog powers all, new, pre-order and brand views. */}
        <div className="shop-toolbar reveal">
          <div className="filter-row" role="group" aria-label="Shop product view">
            {views.map(([value, label]) => (
              <button className={`filter-btn${view === value ? ' active' : ''}`} key={value} onClick={() => selectView(value)}>{label}</button>
            ))}
          </div>
          <span>{visibleProducts.length} PAIRS</span>
        </div>
        {view === 'brands' && (
          <div className="filter-row shop-brand-filter reveal" role="group" aria-label="Filter by brand">
            <button className={`filter-btn${brand === 'all' ? ' active' : ''}`} onClick={() => setBrand('all')}>ALL BRANDS</button>
            {brands.map((brandName) => (
              <button className={`filter-btn${brand === brandName ? ' active' : ''}`} key={brandName} onClick={() => setBrand(brandName)}>{brandName.toUpperCase()}</button>
            ))}
          </div>
        )}
        {view === 'categories' && (
          <div className="filter-row shop-brand-filter reveal" role="group" aria-label="Filter by category">
            <button className={`filter-btn${category === 'all' ? ' active' : ''}`} onClick={() => setCategory('all')}>ALL CATEGORIES</button>
            {categories.map((item) => <button className={`filter-btn${category === item.name ? ' active' : ''}`} key={item.id} onClick={() => setCategory(item.name)}>{item.name.toUpperCase()}</button>)}
          </div>
        )}
        <ProductCollectionState loading={loading} error={error} empty={!loading && !error && visibleProducts.length === 0} />
        <div className="product-grid">
          {visibleProducts.map((product) => (
            <ProductCard
              product={product}
              key={product.id}
              showCommerceDetails
              onSaved={(saved) => onSaved?.(product, saved)}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
