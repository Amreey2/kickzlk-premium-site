import { useState } from 'react';
import {
  formatProductPrice,
  productAvailability,
  productDeliveryTime,
  productGallery,
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
  showOriginalPrice = false,
}) {
  const [saved, setSaved] = useState(false);
  const [hoverImageFailed, setHoverImageFailed] = useState(false);
  const productUrl = product.slug || product.id ? `/product/${product.slug || product.id}` : '/product.html';
  const price = product.priceLabel || formatProductPrice(product.price);
  const sizes = product.sizesLabel || productSizesLabel(product);
  const tags = productTags(product);
  const originalPrice = Number(product.originalPrice) > Number(product.price) ? formatProductPrice(product.originalPrice) : '';
  const code = product.code || `KZ / ${(product.slug || product.id).slice(0, 12).toUpperCase()}`;
  const gallery = productGallery(product, product.colorVariations?.[0] || '');
  const primaryImage = product.image || gallery[0]?.url || productImage(product);
  const hoverImage = gallery[1]?.url;

  const toggleSaved = (event) => {
    event.preventDefault();
    const nextSaved = !saved;
    setSaved(nextSaved);
    onSaved?.(nextSaved);
  };

  return (
    <article className={`product-card reveal${hoverImage && !hoverImageFailed ? ' has-hover-image' : ''}${product.delay ? ` delay-${product.delay}` : ''}${hidden ? ' is-hidden' : ''}`} data-category={String(product.category || '').toLowerCase()}>
      <a href={productUrl} className="product-card__visual" aria-label={product.ariaLabel || `View ${product.name}`}>
        {tags.length > 0 && <div className="product-card__badges">{tags.map((tag, index) => <span className={`badge${index === 0 ? ' badge--acid' : ''}`} key={tag.toLowerCase()}>{tag.toUpperCase()}</span>)}</div>}
        {showHeart && <button className={`heart${saved ? ' saved' : ''}`} aria-label="Save product" onClick={toggleSaved}>{saved ? '♥' : '♡'}</button>}
        <img className="product-card__image product-card__image--primary" src={primaryImage} alt={product.alt || productImageAlt(product)} loading={product.loading || 'lazy'} width="900" height="900" decoding="async" onError={replaceFailedProductImage} />
        {hoverImage && !hoverImageFailed && <img className="product-card__image product-card__image--hover" src={hoverImage} alt="" aria-hidden="true" loading="lazy" width="900" height="900" decoding="async" onError={() => setHoverImageFailed(true)} />}
        <span className="product-card__code">{code}</span>
      </a>
      <div className="product-card__body">
        <div><span className="brand-label">{product.brand}</span><h3><a href={productUrl}>{product.name}</a></h3></div>
        <div className="price-row"><div className="product-card__prices"><strong>{price}</strong>{showOriginalPrice && originalPrice && <del>{originalPrice}</del>}</div><span>{sizes}</span></div>
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
