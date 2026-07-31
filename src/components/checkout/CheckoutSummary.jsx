import { formatPrice } from '../../data/products';
import PriceNotice from './PriceNotice';

export default function CheckoutSummary({ product, selectedSize, setSelectedSize, quantity = 1 }) {
  const sizePrefix = product.brand === 'Balmain' ? 'EU' : 'US';
  const subtotal = product.price * quantity;

  return (
    <aside className="checkout-summary">
      <div className="checkout-summary__heading">
        <span className="section-kicker">ORDER SUMMARY</span>
        <span>{quantity} {quantity === 1 ? 'ITEM' : 'ITEMS'}</span>
      </div>
      <div className="checkout-product">
        <div className="checkout-product__image"><img src={product.image} alt={product.alt} /></div>
        <section>
          <span className="brand-label">{product.brand}</span>
          <h2>{product.name}</h2>
          <dl className="checkout-product__meta">
            <div><dt>Size</dt><dd>{sizePrefix} {selectedSize}</dd></div>
            <div><dt>Quantity</dt><dd>{quantity}</dd></div>
          </dl>
          <strong>{formatPrice(product.price)}</strong>
          <small>{product.preOrder ? `Pre-order · ${product.deliveryTime}` : `Available · ${product.deliveryTime}`}</small>
        </section>
      </div>
      <label className="form-field">
        <span>SELECTED SIZE</span>
        <select value={selectedSize} onChange={(event) => setSelectedSize(event.target.value)}>
          {product.sizes.map((size) => <option value={size} key={size}>{sizePrefix} {size}</option>)}
        </select>
      </label>
      <div className="checkout-totals" aria-label="Order totals">
        <div><span>Subtotal</span><strong>{formatPrice(subtotal)}</strong></div>
        <div className="checkout-totals__total"><span>Total</span><strong>{formatPrice(subtotal)}</strong></div>
      </div>
      <PriceNotice />
    </aside>
  );
}
