import { useState } from 'react';
import {
  formatProductPrice,
  productAvailability,
  productDeliveryTime,
  productImage,
  productImageAlt,
  productSizesLabel,
  productTags,
  replaceFailedProductImage,
} from '../utils/productPresentation';

export default function ProductCard({
  product,
  onSaved,
  showHeart = true,
  hidden = false,
  showCommerceDetails = false,
}) {
  const [saved, setSaved] = useState(false);
  const productUrl = product.slug || product.id ? `/product/${product.slug || product.id}` : '/product.html';
  const price = product.priceLabel || formatProductPrice(product.price);
  const sizes = product.sizesLabel || productSizesLabel(product);
  const tags = productTags(product);
  const code = product.code || `KZ / ${(product.slug || product.id).slice(0, 12).toUpperCase()}`;

  const toggleSaved = (event) => {
    event.preventDefault();
    const nextSaved = !saved;
    setSaved(nextSaved);
    onSaved?.(nextSaved);
  };

  return (
    <article className={`product-card reveal${product.delay ? ` delay-${product.delay}` : ''}${hidden ? ' is-hidden' : ''}`} data-category={product.category.toLowerCase()}>
      <a href={productUrl} className="product-card__visual" aria-label={product.ariaLabel || `View ${product.name}`}>
        {tags.length > 0 && <div className="product-card__badges">{tags.map((tag, index) => <span className={`badge${index === 0 ? ' badge--acid' : ''}`} key={tag.toLowerCase()}>{tag.toUpperCase()}</span>)}</div>}
        {showHeart && <button className={`heart${saved ? ' saved' : ''}`} aria-label="Save product" onClick={toggleSaved}>{saved ? '♥' : '♡'}</button>}
        <img src={product.image || productImage(product)} alt={product.alt || productImageAlt(product)} loading={product.loading || 'lazy'} onError={replaceFailedProductImage} />
        <span className="product-card__code">{code}</span>
      </a>
      <div className="product-card__body">
        <div><span className="brand-label">{product.brand}</span><h3><a href={productUrl}>{product.name}</a></h3></div>
        <div className="price-row"><strong>{price}</strong><span>{sizes}</span></div>
      </div>
      {showCommerceDetails && (
        <div className="product-card__commerce">
          <span>{productAvailability(product)} · {productDeliveryTime(product)}</span>
          <a href={productUrl} className="product-card__cta">VIEW PAIR <span>→</span></a>
        </div>
      )}
    </article>
  );
}
