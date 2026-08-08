import { useEffect, useState } from 'react';
import BankTransferModal from '../components/checkout/BankTransferModal';
import OrderDetails from '../components/checkout/OrderDetails';
import PageHero from '../components/PageHero';
import PageShell from '../components/PageShell';
import useReveal from '../hooks/useReveal';
import { ordersApi, settingsApi } from '../services/api';

export default function OrderConfirmationPage() {
  useReveal();
  const orderNumber = new URLSearchParams(window.location.search).get('order');
  const storedOrder = (() => { try { return JSON.parse(sessionStorage.getItem('kickz_last_order') || 'null'); } catch { return null; } })();
  const [order, setOrder] = useState(() => storedOrder?.order_number === orderNumber ? storedOrder : null);
  const [settings, setSettings] = useState(null);
  const [bankOpen, setBankOpen] = useState(false);
  const [error, setError] = useState(() => !order && !storedOrder?.email ? 'This confirmation is available only in the browser that placed the order.' : '');
  useEffect(() => { settingsApi.paymentSettings().then(setSettings).catch(() => undefined); }, []);
  useEffect(() => {
    if (order || !orderNumber || !storedOrder?.email) return;
    ordersApi.get(orderNumber, { email: storedOrder.email }).then(setOrder).catch((requestError) => setError(requestError.message));
  }, [order, orderNumber, storedOrder?.email]);
  if (!order) return <PageShell><PageHero kicker="ORDER STATUS" title={error ? 'CONFIRMATION UNAVAILABLE' : 'LOADING ORDER'} copy={error || 'Retrieving your secure order confirmation.'} /></PageShell>;
  return <PageShell><PageHero kicker="ORDER RECEIVED" title="ORDER CONFIRMED" copy="Your order is recorded. Complete the required bank transfer using your KZ order number as the reference." />
    <section className="confirmation-section section-pad"><div className="container"><div className="confirmation-success"><span className="confirmation-mark">✓</span><div><h2>THANK YOU. YOUR ORDER NUMBER IS {order.order_number}.</h2><p>Save this number for payment communication and order tracking.</p></div></div><OrderDetails order={order} onViewBank={() => setBankOpen(true)} /><div className="confirmation-actions"><a className="btn btn--acid" href={`/track-order?order=${encodeURIComponent(order.order_number)}`}>VIEW / TRACK ORDER <span>→</span></a><a className="btn btn--ghost" href="/shop">CONTINUE SHOPPING</a></div></div></section>
    <BankTransferModal open={bankOpen} settings={settings || {}} onClose={() => setBankOpen(false)} />
  </PageShell>;
}
