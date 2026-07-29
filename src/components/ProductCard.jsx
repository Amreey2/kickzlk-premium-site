import { useState } from 'react';

export default function ProductCard({ product, onSaved, showHeart = true, hidden = false }) {
  const [saved, setSaved] = useState(false);
  const toggleSaved = (event) => {
    event.preventDefault();
    const nextSaved = !saved;
    setSaved(nextSaved);
    onSaved?.(nextSaved);
  };

  return (
    <article className={`product-card reveal${product.delay ? ` delay-${product.delay}` : ''}${hidden ? ' is-hidden' : ''}`} data-category={product.category}>
      <a href="product.html" className="product-card__visual" aria-label={product.ariaLabel}>
        <span className={`badge${product.badgeClass ? ` ${product.badgeClass}` : ''}`}>{product.badge}</span>
        {showHeart && <button className={`heart${saved ? ' saved' : ''}`} aria-label="Save product" onClick={toggleSaved}>{saved ? '♥' : '♡'}</button>}
        <img src={product.image} alt={product.alt} loading={product.loading} />
        <span className="product-card__code">{product.code}</span>
      </a>
      <div className="product-card__body">
        <div><span className="brand-label">{product.brand}</span><h3>{product.name}</h3></div>
        <div className="price-row"><strong>{product.price}</strong><span>{product.sizes}</span></div>
      </div>
    </article>
  );
}
