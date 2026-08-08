import { useState } from 'react';
import OrderTracking from '../components/account/OrderTracking';
import PageHero from '../components/PageHero';
import PageShell from '../components/PageShell';
import { ordersApi } from '../services/api';
import { formatProductPrice } from '../utils/productPresentation';

const statusStep = (status) => {
  const steps = {
    Pending: 0, 'Order Placed': 0, 'Payment Pending': 0, 'Payment Confirmed': 1,
    'Order Confirmed': 1, Processing: 2, 'Quality Check Completed': 2,
    Shipped: 3, 'Customs Clearance': 3, 'Import/Clearing': 3,
    'Out for Delivery': 4, Delivered: 5,
  };
  return steps[status] ?? 0;
};

export default function OrderTrackingPage() {
  const query = new URLSearchParams(window.location.search);
  const [reference, setReference] = useState(query.get('reference') || '');
  const [email, setEmail] = useState('');
  const [order, setOrder] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (event) => {
    event.preventDefault(); setError(''); setLoading(true);
    try { setOrder(await ordersApi.get(reference.trim(), { email: email.trim() })); }
    catch (requestError) { setOrder(null); setError(requestError.message); }
    finally { setLoading(false); }
  };

  return <PageShell><PageHero kicker="ORDER LOOKUP" title="TRACK YOUR ORDER" copy="Enter your order or tracking number with the checkout email address." />
    <section className="tracking-section section-pad"><div className="container tracking-layout">
      <form className="tracking-form" onSubmit={submit}><span className="section-kicker">SECURE LOOKUP</span><h2>FIND YOUR KICKZ</h2>
        <label><span>ORDER / TRACKING NUMBER</span><input required value={reference} onChange={(event) => setReference(event.target.value)} placeholder="KZ-… or KZTRK-…" /></label>
        <label><span>CHECKOUT EMAIL</span><input required type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@email.com" /></label>
        {error && <p className="form-message form-message--error" role="alert">{error}</p>}
        <button className="btn btn--acid" disabled={loading}>{loading ? 'LOOKING UP…' : 'TRACK ORDER'} <span>→</span></button>
      </form>
      {order ? <article className="tracking-result"><div className="tracking-result__head"><div><span className="section-kicker">LIVE ORDER STATUS</span><h2>{order.order_number}</h2><p>{order.tracking_number}</p></div><strong>{order.order_status}</strong></div>
        <OrderTracking currentStep={statusStep(order.order_status)} />
        <dl className="confirmation-grid"><div><dt>Payment</dt><dd>{order.payment_status}</dd></div><div><dt>Order Total</dt><dd>{formatProductPrice(Number(order.total_amount))}</dd></div><div><dt>Advance</dt><dd>{formatProductPrice(Number(order.advance_amount))}</dd></div><div><dt>Balance</dt><dd>{formatProductPrice(Number(order.pending_amount))}</dd></div></dl>
      </article> : <aside className="tracking-placeholder"><span>01</span><h2>YOUR JOURNEY, CLEARLY TRACKED</h2><p>For your privacy, the email must match the address used during checkout.</p></aside>}
    </div></section>
  </PageShell>;
}
