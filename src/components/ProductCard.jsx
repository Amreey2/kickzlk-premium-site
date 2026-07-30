import { useState } from 'react';

export default function ProductCard({
  product,
  onSaved,
  showHeart = true,
  hidden = false,
  showCommerceDetails = false,
}) {
  const [saved, setSaved] = useState(false);
  const productUrl = product.id ? `/product/${product.id}` : '/product.html';
  const price = product.priceLabel || product.price;
  const sizes = product.sizesLabel || product.sizes;

  const toggleSaved = (event) => {
    event.preventDefault();
    const nextSaved = !saved;
    setSaved(nextSaved);
    onSaved?.(nextSaved);
  };

  return (
    <article className={`product-card reveal${product.delay ? ` delay-${product.delay}` : ''}${hidden ? ' is-hidden' : ''}`} data-category={product.category}>
      <a href={productUrl} className="product-card__visual" aria-label={product.ariaLabel}>
        <span className={`badge${product.badgeClass ? ` ${product.badgeClass}` : ''}`}>{product.badge}</span>
        {showHeart && <button className={`heart${saved ? ' saved' : ''}`} aria-label="Save product" onClick={toggleSaved}>{saved ? '♥' : '♡'}</button>}
        <img src={product.image} alt={product.alt} loading={product.loading} />
        <span className="product-card__code">{product.code}</span>
      </a>
      <div className="product-card__body">
        <div><span className="brand-label">{product.brand}</span><h3><a href={productUrl}>{product.name}</a></h3></div>
        <div className="price-row"><strong>{price}</strong><span>{sizes}</span></div>
      </div>
      {showCommerceDetails && (
        <div className="product-card__commerce">
          <span>{product.preOrder ? 'PRE-ORDER' : 'AVAILABLE NOW'} · {product.deliveryTime}</span>
          <a href={productUrl} className="product-card__cta">VIEW PAIR <span>→</span></a>
        </div>
      )}
    </article>
  );
}
