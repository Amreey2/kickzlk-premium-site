import { useEffect, useMemo, useState } from 'react';
import CartItem from '../components/checkout/CartItem';
import ConfirmRemoveModal from '../components/checkout/ConfirmRemoveModal';
import PaymentOptionSelector from '../components/checkout/PaymentOptionSelector';
import PageHero from '../components/PageHero';
import PageShell from '../components/PageShell';
import ProductCollectionState from '../components/ProductCollectionState';
import { useProducts } from '../hooks/useProducts';
import useReveal from '../hooks/useReveal';
import { authApi, ordersApi } from '../services/api';
import { cartKey, readCart, writeCart } from '../utils/cart';
import { formatProductPrice } from '../utils/productPresentation';
import { readPaymentOption, writePaymentOption } from '../utils/paymentOption';

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
  const [paymentOption, setPaymentOption] = useState(readPaymentOption);
  const [pendingRemoval, setPendingRemoval] = useState(null);
  const [couponMessage, setCouponMessage] = useState('');
  const detailedItems = items.map((item) => ({ item, product: catalog.products.find((product) => product.id === item.productId) })).filter((entry) => entry.product);
  const requestItems = detailedItems.map(({ item }) => ({ productId: item.productId, selectedSize: item.selectedSize, selectedColor: item.selectedColor, quantity: item.quantity }));

  useEffect(() => {
    if (!requestItems.length) return undefined;
    let active = true;
    ordersApi.quote({ items: requestItems, couponCode, paymentOption }).then((value) => { if (active) { setQuote(value); setCouponMessage(couponCode ? `${value.couponLabel} applied.` : ''); } }).catch((error) => {
      if (active) { setQuote(null); setCouponMessage(error.message); }
    });
    return () => { active = false; };
  }, [couponCode, paymentOption, JSON.stringify(requestItems)]); // eslint-disable-line react-hooks/exhaustive-deps

  const updateItems = (next) => { const saved = writeCart(next); setItems(saved); };
  const updateQuantity = (key, quantity) => {
    if (quantity < 1) { setPendingRemoval(key); return; }
    updateItems(items.map((item) => cartKey(item) === key ? { ...item, quantity: Math.min(10, quantity) } : item));
  };
  const changePayment = (value) => { const option = writePaymentOption(value); setPaymentOption(option); };
  const continueCheckout = async () => { if (!quote) return; const session = await authApi.session(); window.location.assign(session.authenticated ? '/checkout' : '/checkout/start?next=%2Fcheckout'); };
  const applyCoupon = (event) => { event.preventDefault(); const code = couponInput.trim().toUpperCase(); sessionStorage.setItem('kickz_coupon', code); setCouponCode(code); setCouponMessage(code ? 'Checking coupon…' : 'Enter a coupon code.'); };
  const removeCoupon = () => { sessionStorage.removeItem('kickz_coupon'); setCouponInput(''); setCouponCode(''); setCouponMessage('Coupon removed.'); };

  return <PageShell><PageHero kicker="YOUR SELECTION" title="YOUR CART" copy="Review your sneakers, selections and order total before checkout." />
    <section className="cart-section section-pad"><div className="container">
      <ProductCollectionState loading={catalog.loading} error={catalog.error} />
      {!catalog.loading && !items.length && <section className="cart-empty reveal"><span className="cart-empty__icon" aria-hidden="true">＋</span><span className="section-kicker">YOUR CART IS EMPTY</span><h1>YOUR NEXT PAIR STARTS HERE.</h1><p>Explore the latest KICKZ.LK drops and build your rotation.</p><a className="btn btn--acid" href="/shop">CONTINUE SHOPPING <span>↗</span></a></section>}
      {!catalog.loading && items.length > 0 && <div className="cart-layout reveal">
        <section className="cart-products" aria-labelledby="cart-products-title"><div className="cart-panel-heading"><div><span className="section-kicker">SHOPPING CART</span><h1 id="cart-products-title">YOUR ROTATION</h1></div><span>{items.reduce((sum, item) => sum + item.quantity, 0)} ITEMS</span></div>
          {detailedItems.map(({ item, product }) => <CartItem key={cartKey(item)} product={product} item={item} onQuantityChange={(quantity) => updateQuantity(cartKey(item), quantity)} onRemove={() => setPendingRemoval(cartKey(item))} />)}
        </section>
        <aside className="cart-summary"><span className="section-kicker">ORDER SUMMARY</span>
          <PaymentOptionSelector value={paymentOption} onChange={changePayment} quote={quote} compact />
          <form className="coupon-form" onSubmit={applyCoupon}><label><span>PROMO CODE</span><div><input value={couponInput} onChange={(event) => setCouponInput(event.target.value)} placeholder="Enter code" /><button type="submit">APPLY</button></div></label>{couponMessage && <p className={quote?.couponCode ? 'is-success' : 'is-error'}>{couponMessage}</p>}{quote?.couponCode && <div className="coupon-applied"><strong>{quote.couponCode}</strong><button type="button" onClick={removeCoupon}>REMOVE</button></div>}</form>
          <div className="cart-summary__rows"><div><span>Subtotal</span><strong>{formatProductPrice(quote?.subtotalAmount || 0)}</strong></div>{quote?.discountAmount > 0 && <div className="cart-discount"><span>Coupon {quote.couponCode}</span><strong>− {formatProductPrice(quote.discountAmount)}</strong></div>}<div><span>Delivery</span><strong>CONFIRMED LATER</strong></div><div className="cart-summary__total"><span>Order Total</span><strong>{formatProductPrice(quote?.totalAmount || 0)}</strong></div><div><span>Pay Now</span><strong>{formatProductPrice(quote?.advanceAmount || 0)}</strong></div><div><span>Balance on Delivery</span><strong>{formatProductPrice(quote?.balanceAmount || 0)}</strong></div></div>
          <button className="btn btn--acid cart-checkout-button" type="button" disabled={!quote} onClick={continueCheckout}>CONTINUE TO CHECKOUT <span>→</span></button><a className="cart-continue" href="/shop">CONTINUE SHOPPING</a>
        </aside>
      </div>}
    </div></section>{pendingRemoval && <ConfirmRemoveModal productName={detailedItems.find(({ item }) => cartKey(item) === pendingRemoval)?.product.name || 'This item'} onCancel={() => setPendingRemoval(null)} onConfirm={() => { updateItems(items.filter((item) => cartKey(item) !== pendingRemoval)); setPendingRemoval(null); }} />}</PageShell>;
}
