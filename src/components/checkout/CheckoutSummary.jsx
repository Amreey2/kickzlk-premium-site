import { formatPrice } from '../../data/products';

export default function CheckoutSummary({ product, selectedSize, setSelectedSize }) {
  const sizePrefix = product.brand === 'Balmain' ? 'EU' : 'US';

  return (
    <aside className="checkout-summary">
      <span className="section-kicker">YOUR PAIR</span>
      <div className="checkout-product">
        <div><img src={product.image} alt={product.alt} /></div>
        <section><span className="brand-label">{product.brand}</span><h2>{product.name}</h2><strong>{formatPrice(product.price)}</strong><small>{product.preOrder ? `Pre-order · ${product.deliveryTime}` : `Available · ${product.deliveryTime}`}</small></section>
      </div>
      <label className="form-field">
        <span>SELECTED SIZE</span>
        <select value={selectedSize} onChange={(event) => setSelectedSize(event.target.value)}>
          {product.sizes.map((size) => <option value={size} key={size}>{sizePrefix} {size}</option>)}
        </select>
      </label>
      <p className="price-notice">Due to Sri Lanka&apos;s fluctuating USD exchange rate, confirm today&apos;s final price before placing your order.</p>
    </aside>
  );
}
