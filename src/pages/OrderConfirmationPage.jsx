import { useEffect, useState } from 'react';
import PageHero from '../components/PageHero';
import PageShell from '../components/PageShell';
import { ordersApi } from '../services/api';
import { formatProductPrice } from '../utils/productPresentation';

export default function OrderConfirmationPage() {
  const params = new URLSearchParams(window.location.search);
  const orderNumber = params.get('order');
  const storedOrder = (() => { try { return JSON.parse(sessionStorage.getItem('kickz_last_order') || 'null'); } catch { return null; } })();
  const [order, setOrder] = useState(() => storedOrder?.order_number === orderNumber ? storedOrder : null);
  const loggedIn = Boolean(order?.user_id || storedOrder?.user_id);
  const [error, setError] = useState(() => !order && !storedOrder?.email ? 'This confirmation is available only in the browser that placed the order.' : '');
  useEffect(() => {
    if (order || !orderNumber || !storedOrder?.email) return;
    ordersApi.get(orderNumber, { email: storedOrder.email }).then(setOrder).catch((requestError) => setError(requestError.message));
  }, [order, orderNumber, storedOrder?.email]);
  if (!order) return <PageShell><PageHero kicker="ORDER STATUS" title={error ? 'CONFIRMATION UNAVAILABLE' : 'LOADING ORDER'} copy={error || 'Retrieving your secure order confirmation.'} /></PageShell>;
  return <PageShell><PageHero kicker="ORDER RECEIVED" title="ORDER CONFIRMED" copy="Your KICKZ.LK order is recorded. Complete the bank transfer using your order number as the payment reference." />
    <section className="confirmation-section section-pad"><div className="container confirmation-card"><div className="confirmation-mark">✓</div><div className="confirmation-head"><span className="section-kicker">YOUR REFERENCES</span><h2>{order.order_number}</h2><p>Keep both references for payment confirmation and delivery tracking.</p></div>
      <dl className="confirmation-grid"><div><dt>Order Number</dt><dd>{order.order_number}</dd></div><div><dt>Tracking Number</dt><dd>{order.tracking_number}</dd></div><div><dt>Order Total</dt><dd>{formatProductPrice(Number(order.total_amount))}</dd></div><div><dt>Advance / Pay Now</dt><dd>{formatProductPrice(Number(order.advance_amount))}</dd></div><div><dt>Balance on Delivery</dt><dd>{formatProductPrice(Number(order.pending_amount))}</dd></div><div><dt>Payment Method</dt><dd>{order.payment_method}</dd></div><div><dt>Payment Status</dt><dd>{order.payment_status}</dd></div><div><dt>Order Status</dt><dd>{order.order_status}</dd></div></dl>
      <aside className="confirmation-next"><strong>NEXT STEPS</strong><ol><li>Transfer the displayed advance amount using the order number as reference.</li><li>Send the transfer receipt to KICKZ.LK for payment confirmation.</li><li>Use the tracking number for order updates.</li></ol></aside>
      <div className="confirmation-actions"><a className="btn btn--acid" href={loggedIn ? '/account' : `/track-order?reference=${encodeURIComponent(order.tracking_number)}`}>{loggedIn ? 'VIEW MY ORDERS' : 'TRACK THIS ORDER'} <span>→</span></a><a className="btn btn--ghost" href="/shop">CONTINUE SHOPPING</a></div>
    </div></section></PageShell>;
}
