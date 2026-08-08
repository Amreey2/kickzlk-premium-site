import { formatProductPrice, productImage, productImageAlt } from '../../utils/productPresentation';

export default function CartItem({ product, item, onQuantityChange, onRemove }) {
  const originalPrice = Number(product.originalPrice || 0);
  const discounted = originalPrice > product.price;
  return <article className="cart-item">
    <a className="cart-item__image" href={`/product/${product.id}`} aria-label={`View ${product.name}`}><img src={productImage(product, item.selectedColor)} alt={productImageAlt(product)} /></a>
    <div className="cart-item__details">
      <span className="brand-label">{product.brand}</span><h2><a href={`/product/${product.id}`}>{product.name}</a></h2>
      <p>{product.preOrder ? `Pre-order · ${product.deliveryTime}` : `Ready stock · ${product.deliveryTime}`}</p>
      <div className="cart-item__selection"><span>SIZE <strong>{item.selectedSize}</strong></span>{item.selectedColor && <span>COLOUR <strong>{item.selectedColor}</strong></span>}</div>
      <div className="cart-item__unit-price"><strong>{formatProductPrice(product.price)}</strong>{discounted && <del>{formatProductPrice(originalPrice)}</del>}</div>
    </div>
    <div className="cart-item__controls">
      <div className="quantity-stepper" aria-label={`Quantity for ${product.name}`}><button type="button" onClick={() => onQuantityChange(item.quantity - 1)} aria-label="Decrease quantity">−</button><span>{item.quantity}</span><button type="button" onClick={() => onQuantityChange(item.quantity + 1)} aria-label="Increase quantity">＋</button></div>
      <strong className="cart-item__price">{formatProductPrice(product.price * item.quantity)}</strong>
      <button className="cart-remove" type="button" onClick={onRemove}>REMOVE</button>
    </div>
  </article>;
}
