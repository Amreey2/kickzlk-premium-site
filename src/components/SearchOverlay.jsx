import { useEffect, useRef, useState } from 'react';
import { productsApi } from '../services/api';
import { formatProductPrice, productImage, productImageAlt } from '../utils/productPresentation';

export default function SearchOverlay({ open, onClose }) {
  const inputRef = useRef(null);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return undefined;
    document.body.classList.add('search-open');
    inputRef.current?.focus();
    const keydown = (event) => { if (event.key === 'Escape') onClose(); };
    window.addEventListener('keydown', keydown);
    return () => { document.body.classList.remove('search-open'); window.removeEventListener('keydown', keydown); };
  }, [onClose, open]);

  useEffect(() => {
    if (!open || query.trim().length < 2) return undefined;
    let active = true;
    const timer = window.setTimeout(() => {
      setLoading(true); setError('');
      productsApi.list({ search: query.trim() }).then((items) => { if (active) setResults(items.slice(0, 6)); })
        .catch((requestError) => { if (active) { setResults([]); setError(requestError.message); } })
        .finally(() => { if (active) setLoading(false); });
    }, 180);
    return () => { active = false; window.clearTimeout(timer); };
  }, [open, query]);

  if (!open) return null;
  const hasQuery = query.trim().length >= 2;
  return <div className="search-overlay" role="dialog" aria-modal="true" aria-labelledby="search-overlay-title" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
    <section>
      <header><div><span className="section-kicker">KICKZ.LK CATALOG</span><h2 id="search-overlay-title">FIND YOUR NEXT PAIR.</h2></div><button type="button" onClick={onClose} aria-label="Close search">×</button></header>
      <label className="search-overlay__field"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.8-3.8" /></svg><input ref={inputRef} value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search products, brands, SKU…" aria-label="Search products" /></label>
      <div className="search-overlay__results" aria-live="polite">
        {!hasQuery && <p>Start typing to search the live KICKZ.LK catalogue.</p>}
        {hasQuery && loading && <p>Searching the rotation…</p>}
        {error && <p className="is-error">{error}</p>}
        {hasQuery && !loading && !error && results.length === 0 && <p>No matching pairs found.</p>}
        {hasQuery && !loading && results.map((product) => <a href={`/product/${product.slug || product.id}`} key={product.id}><img src={productImage(product)} alt={productImageAlt(product)} /><span><small>{product.brand}</small><strong>{product.name}</strong><b>{formatProductPrice(product.price)}</b></span><i>↗</i></a>)}
      </div>
      <footer><span>ESC TO CLOSE</span><a href="/shop">SHOP ALL <i>→</i></a></footer>
    </section>
  </div>;
}
