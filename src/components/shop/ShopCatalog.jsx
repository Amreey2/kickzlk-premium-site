import { useState } from 'react';
import { products } from '../../data/products';
import ProductCard from '../ProductCard';

const views = [
  ['all', 'ALL PRODUCTS'],
  ['new', 'NEW DROPS'],
  ['preorder', 'PRE ORDER'],
  ['brands', 'BRANDS'],
];

export default function ShopCatalog({ initialView = 'all', onSaved }) {
  const [view, setView] = useState(initialView);
  const [brand, setBrand] = useState('all');
  const brands = [...new Set(products.map((product) => product.brand))];

  const visibleProducts = products.filter((product) => {
    if (view === 'new') return product.isNew;
    if (view === 'preorder') return product.preOrder;
    if (view === 'brands' && brand !== 'all') return product.brand === brand;
    return true;
  });

  const selectView = (nextView) => {
    setView(nextView);
    if (nextView !== 'brands') setBrand('all');
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
