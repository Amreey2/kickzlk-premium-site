import { formatPrice } from '../../data/products';

export default function CartItem({
  product,
  selectedSize,
  quantity,
  onQuantityChange,
  onRemove,
}) {
  const sizePrefix = product.brand === 'Balmain' ? 'EU' : 'US';

  return (
    <article className="cart-item">
      <a className="cart-item__image" href={`/product/${product.id}`} aria-label={`View ${product.name}`}>
        <img src={product.image} alt={product.alt} />
      </a>
      <div className="cart-item__details">
        <span className="brand-label">{product.brand}</span>
        <h2><a href={`/product/${product.id}`}>{product.name}</a></h2>
        <p>{product.preOrder ? `Pre-order · ${product.deliveryTime}` : `Ready stock · ${product.deliveryTime}`}</p>
        <span className="cart-item__size">SIZE <strong>{sizePrefix} {selectedSize}</strong></span>
      </div>
      <div className="cart-item__controls">
        <label className="quantity-control">
          <span>QUANTITY</span>
          <select value={quantity} onChange={(event) => onQuantityChange(Number(event.target.value))} aria-label={`Quantity for ${product.name}`}>
            {[1, 2, 3, 4, 5].map((value) => <option value={value} key={value}>{value}</option>)}
          </select>
        </label>
        <strong className="cart-item__price">{formatPrice(product.price * quantity)}</strong>
        <button className="cart-remove" type="button" onClick={onRemove}>REMOVE ITEM</button>
      </div>
    </article>
  );
}
