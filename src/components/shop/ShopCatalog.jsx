import { useEffect, useMemo, useState } from 'react';
import { useProducts } from '../../hooks/useProducts';
import { catalogApi } from '../../services/api';
import ProductCard from '../ProductCard';
import ProductCollectionState from '../ProductCollectionState';
import ShopFilters from './ShopFilters';
import ShopPagination from './ShopPagination';

const legacyViews = [
  ['all', 'ALL PRODUCTS'],
  ['new', 'NEW DROPS'],
  ['preorder', 'PRE ORDER'],
  ['brands', 'BRANDS'],
  ['categories', 'CATEGORIES'],
];
const emptyFilters = { onSale: false, brands: [], minPrice: '', maxPrice: '', sizes: [], genders: [], activities: [], colors: [] };
const listParam = (params, key) => (params.get(key) || '').split(',').map((value) => value.trim()).filter(Boolean);
const initialFilters = () => {
  const params = new URLSearchParams(window.location.search);
  return {
    onSale: params.get('sale') === '1',
    brands: listParam(params, 'brands'),
    minPrice: params.get('min') || '',
    maxPrice: params.get('max') || '',
    sizes: listParam(params, 'sizes'),
    genders: listParam(params, 'genders'),
    activities: [...new Set([...listParam(params, 'activities'), ...listParam(params, 'category')])],
    colors: listParam(params, 'colors'),
  };
};
const europeanSize = (value) => {
  const size = String(value || '').trim();
  if (/^(US|UK)\s*/i.test(size)) return '';
  const match = size.match(/^(?:EU\s*)?(\d+(?:\.\d+)?)$/i);
  return match ? match[1] : '';
};
const optionList = (products, values, readValues, format = (value) => value) => values.map((value) => ({
  value,
  label: format(value),
  count: products.filter((product) => readValues(product).some((item) => item.toLowerCase() === value.toLowerCase())).length,
}));

function useShopPageSize() {
  const query = '(max-width: 650px)';
  const [pageSize, setPageSize] = useState(() => window.matchMedia(query).matches ? 30 : 36);
  useEffect(() => {
    const media = window.matchMedia(query);
    const update = () => setPageSize(media.matches ? 30 : 36);
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, []);
  return pageSize;
}

function AdvancedShopCatalog({ onSaved }) {
  const { products, loading, error } = useProducts();
  const [filters, setFilters] = useState(initialFilters);
  const [page, setPage] = useState(() => Math.max(1, Number(new URLSearchParams(window.location.search).get('page')) || 1));
  const [drawerOpen, setDrawerOpen] = useState(false);
  const pageSize = useShopPageSize();
  const search = new URLSearchParams(window.location.search).get('search')?.trim().toLowerCase() || '';
  const minPrice = filters.minPrice === '' ? null : Number(filters.minPrice);
  const maxPrice = filters.maxPrice === '' ? null : Number(filters.maxPrice);
  const priceError = (minPrice !== null && Number.isFinite(minPrice) && minPrice < 0) || (maxPrice !== null && Number.isFinite(maxPrice) && maxPrice < 0)
    ? 'Price values cannot be negative.'
    : minPrice !== null && maxPrice !== null && Number.isFinite(minPrice) && Number.isFinite(maxPrice) && minPrice > maxPrice
      ? 'Minimum price cannot exceed maximum price.'
      : '';

  const availableOptions = useMemo(() => {
    const unique = (values) => [...new Set(values.filter(Boolean))].sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
    const brands = unique(products.map((product) => product.brand));
    const sizes = unique(products.flatMap((product) => product.sizes.map(europeanSize)));
    const genders = unique(products.map((product) => product.categoryGender));
    const activities = unique(products.map((product) => product.category));
    const colors = unique(products.flatMap((product) => product.colorVariations));
    return {
      brands: optionList(products, brands, (product) => [product.brand]),
      sizes: optionList(products, sizes, (product) => product.sizes.map(europeanSize), (value) => `EU ${value}`),
      genders: optionList(products, genders, (product) => [product.categoryGender]),
      activities: optionList(products, activities, (product) => [product.category]),
      colors: optionList(products, colors, (product) => product.colorVariations),
    };
  }, [products]);

  const filteredProducts = useMemo(() => products.filter((product) => {
    const has = (selected, values) => selected.length === 0 || selected.some((selection) => values.some((value) => value.toLowerCase() === selection.toLowerCase()));
    if (search && ![product.name, product.brand, product.category, product.sku].some((value) => value.toLowerCase().includes(search))) return false;
    if (filters.onSale && !(product.originalPrice > product.price)) return false;
    if (!has(filters.brands, [product.brand])) return false;
    if (!has(filters.sizes, product.sizes.map(europeanSize).filter(Boolean))) return false;
    if (!has(filters.genders, [product.categoryGender].filter(Boolean))) return false;
    if (!has(filters.activities, [product.category])) return false;
    if (!has(filters.colors, product.colorVariations)) return false;
    if (!priceError && Number.isFinite(minPrice) && product.price < minPrice) return false;
    if (!priceError && Number.isFinite(maxPrice) && product.price > maxPrice) return false;
    return true;
  }), [filters, maxPrice, minPrice, priceError, products, search]);

  const activeCount = Number(filters.onSale) + ['brands', 'sizes', 'genders', 'activities', 'colors'].reduce((total, key) => total + filters[key].length, 0)
    + Number(filters.minPrice !== '') + Number(filters.maxPrice !== '');
  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const pageProducts = filteredProducts.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const resultStart = filteredProducts.length ? (currentPage - 1) * pageSize + 1 : 0;
  const resultEnd = Math.min(currentPage * pageSize, filteredProducts.length);

  useEffect(() => {
    document.body.classList.toggle('shop-filter-open', drawerOpen);
    const close = (event) => { if (event.key === 'Escape') setDrawerOpen(false); };
    window.addEventListener('keydown', close);
    return () => { document.body.classList.remove('shop-filter-open'); window.removeEventListener('keydown', close); };
  }, [drawerOpen]);

  useEffect(() => {
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (currentPage > 1) params.set('page', String(currentPage));
    if (filters.onSale) params.set('sale', '1');
    if (filters.brands.length) params.set('brands', filters.brands.join(','));
    if (filters.minPrice !== '') params.set('min', filters.minPrice);
    if (filters.maxPrice !== '') params.set('max', filters.maxPrice);
    if (filters.sizes.length) params.set('sizes', filters.sizes.join(','));
    if (filters.genders.length) params.set('genders', filters.genders.join(','));
    if (filters.activities.length) params.set('activities', filters.activities.join(','));
    if (filters.colors.length) params.set('colors', filters.colors.join(','));
    window.history.replaceState({}, '', `${window.location.pathname}${params.size ? `?${params}` : ''}`);
  }, [currentPage, filters, search]);

  const changeFilter = (key, value) => { setFilters((current) => ({ ...current, [key]: value })); setPage(1); };
  const toggleValue = (key, value) => {
    setFilters((current) => ({ ...current, [key]: current[key].includes(value) ? current[key].filter((item) => item !== value) : [...current[key], value] }));
    setPage(1);
  };
  const clearFilters = () => { setFilters(emptyFilters); setPage(1); };
  const changePage = (nextPage) => {
    setPage(nextPage);
    window.requestAnimationFrame(() => document.querySelector('.shop-results-header')?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
  };
  const filterProps = { filters, options: availableOptions, activeCount, priceError, onToggleValue: toggleValue, onChange: changeFilter, onClear: clearFilters };

  return <section className="shop-catalog shop-catalog--advanced section-pad">
    <div className="container">
      <div className="shop-mobile-toolbar">
        <button type="button" onClick={() => setDrawerOpen(true)}>FILTER{activeCount > 0 && <b>{activeCount}</b>} <span>＋</span></button>
        <small>{filteredProducts.length} SNEAKERS</small>
      </div>
      <div className="shop-layout">
        <aside className="shop-filter-sidebar" aria-label="Product filters"><ShopFilters {...filterProps} /></aside>
        <div className="shop-results">
          <header className="shop-results-header">
            <div><span className="section-kicker">SHOP ALL</span><h2>THE ROTATION</h2></div>
            <p>{loading ? 'Loading sneakers…' : `Showing ${resultStart}–${resultEnd} of ${filteredProducts.length}`}</p>
          </header>
          <ProductCollectionState loading={loading} error={error} />
          {!loading && !error && filteredProducts.length === 0 && <div className="shop-empty" role="status"><span className="section-kicker">NO MATCHES</span><h3>No sneakers found matching your filters.</h3><p>Adjust your selections or clear all filters to see the full rotation.</p><button className="btn btn--ghost" type="button" onClick={clearFilters}>CLEAR ALL FILTERS</button></div>}
          {!loading && !error && pageProducts.length > 0 && <div className="product-grid shop-product-grid">
            {pageProducts.map((product) => <ProductCard product={product} key={product.id} showCommerceDetails showOriginalPrice onSaved={(saved) => onSaved?.(product, saved)} />)}
          </div>}
          <ShopPagination current={currentPage} total={totalPages} onChange={changePage} />
        </div>
      </div>
    </div>
    <div className={`shop-filter-drawer${drawerOpen ? ' is-open' : ''}`} aria-hidden={!drawerOpen}>
      <button className="shop-filter-backdrop" type="button" aria-label="Close filters" onClick={() => setDrawerOpen(false)} />
      <aside role="dialog" aria-modal="true" aria-label="Product filters"><ShopFilters {...filterProps} mobile onClose={() => setDrawerOpen(false)} /></aside>
    </div>
  </section>;
}

function LegacyShopCatalog({ initialView, onSaved }) {
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
    if (view === 'new') return index < 4;
    if (view === 'preorder') return product.preOrder;
    if (view === 'brands' && brand !== 'all') return product.brand === brand;
    if (view === 'categories' && category !== 'all') return product.category === category;
    return true;
  });
  const selectView = (nextView) => { setView(nextView); if (nextView !== 'brands') setBrand('all'); if (nextView !== 'categories') setCategory('all'); };
  return <section className="shop-catalog section-pad"><div className="container">
    <div className="shop-toolbar reveal"><div className="filter-row" role="group" aria-label="Shop product view">{legacyViews.map(([value, label]) => <button className={`filter-btn${view === value ? ' active' : ''}`} key={value} onClick={() => selectView(value)}>{label}</button>)}</div><span>{visibleProducts.length} PAIRS</span></div>
    {view === 'brands' && <div className="filter-row shop-brand-filter reveal" role="group" aria-label="Filter by brand"><button className={`filter-btn${brand === 'all' ? ' active' : ''}`} onClick={() => setBrand('all')}>ALL BRANDS</button>{brands.map((brandName) => <button className={`filter-btn${brand === brandName ? ' active' : ''}`} key={brandName} onClick={() => setBrand(brandName)}>{brandName.toUpperCase()}</button>)}</div>}
    {view === 'categories' && <div className="filter-row shop-brand-filter reveal" role="group" aria-label="Filter by category"><button className={`filter-btn${category === 'all' ? ' active' : ''}`} onClick={() => setCategory('all')}>ALL CATEGORIES</button>{categories.map((item) => <button className={`filter-btn${category === item.name ? ' active' : ''}`} key={item.id} onClick={() => setCategory(item.name)}>{item.name.toUpperCase()}</button>)}</div>}
    <ProductCollectionState loading={loading} error={error} empty={!loading && !error && visibleProducts.length === 0} />
    <div className="product-grid">{visibleProducts.map((product) => <ProductCard product={product} key={product.id} showCommerceDetails onSaved={(saved) => onSaved?.(product, saved)} />)}</div>
  </div></section>;
}

export default function ShopCatalog({ initialView = 'all', onSaved }) {
  return initialView === 'all' ? <AdvancedShopCatalog onSaved={onSaved} /> : <LegacyShopCatalog initialView={initialView} onSaved={onSaved} />;
}
