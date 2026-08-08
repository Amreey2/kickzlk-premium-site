import { useEffect, useMemo, useState } from 'react';
import CartItem from '../components/checkout/CartItem';
import PageHero from '../components/PageHero';
import PageShell from '../components/PageShell';
import ProductCollectionState from '../components/ProductCollectionState';
import { useProducts } from '../hooks/useProducts';
import useReveal from '../hooks/useReveal';
import { ordersApi } from '../services/api';
import { cartKey, readCart, writeCart } from '../utils/cart';
import { formatProductPrice } from '../utils/productPresentation';

export default function CartPage() {
  useReveal();
  const catalog = useProducts();
  const params = useMemo(() => new URLSearchParams(window.location.search), []);
  const [items, setItems] = useState(() => {
    const stored = readCart();
    if (stored.length || !params.get('product') || !params.get('size')) return stored;
    return writeCart([{ productId: params.get('product'), selectedSize: params.get('size'), selectedColor: params.get('color') || '', quantity: Number(params.get('quantity')) || 1 }]);
  });
  const [couponInput, setCouponInput] = useState(() => sessionStorage.getItem('kickz_coupon') || '');
  const [couponCode, setCouponCode] = useState(() => sessionStorage.getItem('kickz_coupon') || '');
  const [quote, setQuote] = useState(null);
  const [couponMessage, setCouponMessage] = useState('');
  const detailedItems = items.map((item) => ({ item, product: catalog.products.find((product) => product.id === item.productId) })).filter((entry) => entry.product);
  const requestItems = detailedItems.map(({ item }) => ({ productId: item.productId, selectedSize: item.selectedSize, selectedColor: item.selectedColor, quantity: item.quantity }));

  useEffect(() => {
    if (!requestItems.length) return undefined;
    let active = true;
    ordersApi.quote({ items: requestItems, couponCode }).then((value) => { if (active) { setQuote(value); setCouponMessage(couponCode ? `${value.couponLabel} applied.` : ''); } }).catch((error) => {
      if (active) { setQuote(null); setCouponMessage(error.message); }
    });
    return () => { active = false; };
  }, [couponCode, JSON.stringify(requestItems)]); // eslint-disable-line react-hooks/exhaustive-deps

  const updateItems = (next) => { const saved = writeCart(next); setItems(saved); };
  const updateQuantity = (key, quantity) => updateItems(quantity < 1 ? items.filter((item) => cartKey(item) !== key) : items.map((item) => cartKey(item) === key ? { ...item, quantity: Math.min(10, quantity) } : item));
  const applyCoupon = (event) => { event.preventDefault(); const code = couponInput.trim().toUpperCase(); sessionStorage.setItem('kickz_coupon', code); setCouponCode(code); setCouponMessage(code ? 'Checking coupon…' : 'Enter a coupon code.'); };

  return <PageShell><PageHero kicker="YOUR SELECTION" title="YOUR CART" copy="Review your sneakers, selections and order total before checkout." />
    <section className="cart-section section-pad"><div className="container">
      <ProductCollectionState loading={catalog.loading} error={catalog.error} />
      {!catalog.loading && !items.length && <section className="cart-empty reveal"><span className="cart-empty__icon" aria-hidden="true">＋</span><span className="section-kicker">YOUR CART IS EMPTY</span><h1>YOUR NEXT PAIR STARTS HERE.</h1><p>Explore the latest KICKZ.LK drops and build your rotation.</p><a className="btn btn--acid" href="/shop">CONTINUE SHOPPING <span>↗</span></a></section>}
      {!catalog.loading && items.length > 0 && <div className="cart-layout reveal">
        <section className="cart-products" aria-labelledby="cart-products-title"><div className="cart-panel-heading"><div><span className="section-kicker">SHOPPING CART</span><h1 id="cart-products-title">YOUR ROTATION</h1></div><span>{items.reduce((sum, item) => sum + item.quantity, 0)} ITEMS</span></div>
          {detailedItems.map(({ item, product }) => <CartItem key={cartKey(item)} product={product} item={item} onQuantityChange={(quantity) => updateQuantity(cartKey(item), quantity)} onRemove={() => updateItems(items.filter((entry) => cartKey(entry) !== cartKey(item)))} />)}
        </section>
        <aside className="cart-summary"><span className="section-kicker">ORDER SUMMARY</span>
          <form className="coupon-form" onSubmit={applyCoupon}><label><span>PROMO CODE</span><div><input value={couponInput} onChange={(event) => setCouponInput(event.target.value)} placeholder="Enter code" /><button type="submit">APPLY</button></div></label>{couponMessage && <p className={quote?.couponCode ? 'is-success' : 'is-error'}>{couponMessage}</p>}</form>
          <div className="cart-summary__rows"><div><span>Subtotal</span><strong>{formatProductPrice(quote?.subtotalAmount || 0)}</strong></div>{quote?.discountAmount > 0 && <div className="cart-discount"><span>Coupon discount</span><strong>− {formatProductPrice(quote.discountAmount)}</strong></div>}<div><span>Delivery</span><strong>CONFIRMED LATER</strong></div><div className="cart-summary__total"><span>Order Total</span><strong>{formatProductPrice(quote?.totalAmount || 0)}</strong></div><div><span>Advance / Pay Now</span><strong>{formatProductPrice(quote?.advanceAmount || 0)}</strong></div><div><span>Balance on Delivery</span><strong>{formatProductPrice(quote?.balanceAmount || 0)}</strong></div></div>
          <a className={`btn btn--acid${quote ? '' : ' is-disabled'}`} href={quote ? '/checkout/start?next=%2Fcheckout' : undefined}>CONTINUE TO CHECKOUT <span>→</span></a><a className="cart-continue" href="/shop">CONTINUE SHOPPING</a>
        </aside>
      </div>}
    </div></section></PageShell>;
}
