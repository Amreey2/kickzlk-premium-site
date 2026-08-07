import { useState } from 'react';
import CartItem from '../components/checkout/CartItem';
import PriceNotice from '../components/checkout/PriceNotice';
import PageHero from '../components/PageHero';
import PageShell from '../components/PageShell';
import { formatPrice, getProductById, products } from '../data/products';
import useReveal from '../hooks/useReveal';

export default function CartPage() {
  useReveal();
  const params = new URLSearchParams(window.location.search);
  const product = getProductById(params.get('product')) || products[0];
  const requestedSize = params.get('size');
  const selectedSize = product.sizes.includes(requestedSize) ? requestedSize : product.sizes[0];
  const requestedQuantity = Number(params.get('quantity'));
  const [quantity, setQuantity] = useState(Number.isInteger(requestedQuantity) && requestedQuantity > 0 ? Math.min(requestedQuantity, 5) : 1);
  const [hasItem, setHasItem] = useState(true);
  const subtotal = product.price * quantity;
  const checkoutHref = `/checkout?product=${encodeURIComponent(product.id)}&size=${encodeURIComponent(selectedSize)}&quantity=${quantity}`;
  const checkoutStartHref = `/checkout/start?next=${encodeURIComponent(checkoutHref)}`;

  return (
    <PageShell>
      <PageHero kicker="YOUR SELECTION" title="YOUR CART" copy="Review your pair, selected size and order total before continuing to checkout." />
      <section className="cart-section section-pad">
        <div className="container">
          {hasItem ? (
            /* CART DESKTOP LAYOUT: product details and summary stay independent, then stack cleanly for touch screens. */
            <div className="cart-layout reveal">
              <section className="cart-products" aria-labelledby="cart-products-title">
                <div className="cart-panel-heading">
                  <div><span className="section-kicker">SHOPPING CART</span><h1 id="cart-products-title">YOUR PAIR</h1></div>
                  <span>1 ITEM</span>
                </div>
                <CartItem
                  product={product}
                  selectedSize={selectedSize}
                  quantity={quantity}
                  onQuantityChange={setQuantity}
                  onRemove={() => setHasItem(false)}
                />
              </section>
              <aside className="cart-summary">
                <span className="section-kicker">ORDER SUMMARY</span>
                <div className="cart-summary__rows">
                  <div><span>Subtotal</span><strong>{formatPrice(subtotal)}</strong></div>
                  <div><span>Delivery</span><strong>CONFIRMED LATER</strong></div>
                  <div className="cart-summary__total"><span>Total</span><strong>{formatPrice(subtotal)}</strong></div>
                </div>
                <PriceNotice />
                <a className="btn btn--acid" href={checkoutStartHref}>CONTINUE TO CHECKOUT <span>→</span></a>
                <a className="cart-continue" href="/shop">CONTINUE SHOPPING</a>
              </aside>
            </div>
          ) : (
            <section className="cart-empty reveal">
              <span className="section-kicker">YOUR CART IS EMPTY</span>
              <h1>YOUR NEXT PAIR<br />STARTS HERE.</h1>
              <p>The pair was removed from your cart. Explore the latest KICKZ.LK drops when you&apos;re ready.</p>
              <a className="btn btn--acid" href="/shop">SHOP SNEAKERS <span>↗</span></a>
            </section>
          )}
        </div>
      </section>
    </PageShell>
  );
}
