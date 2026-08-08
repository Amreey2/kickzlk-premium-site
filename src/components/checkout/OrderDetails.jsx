import OrderTracking from '../account/OrderTracking';
import { formatProductPrice } from '../../utils/productPresentation';
import { isPaymentPending, orderStatusStep, paymentRequirement } from '../../utils/orderPresentation';

export default function OrderDetails({ order, onViewBank, showNextSteps = true }) {
  return <article className="order-detail-card">
    <header className="order-detail-head"><div><span className="section-kicker">ORDER NUMBER</span><h2>{order.order_number}</h2><p>Placed {new Date(order.created_at).toLocaleDateString('en-LK', { year: 'numeric', month: 'long', day: 'numeric' })}</p></div><strong>{order.order_status}</strong></header>
    <OrderTracking currentStep={orderStatusStep(order.order_status)} />
    <div className="order-detail-sections">
      <section><h3>YOUR ORDER</h3><div className="order-detail-products">{order.items?.map((item) => <div key={item.id || `${item.product_id}-${item.selected_size}-${item.selected_color}`}><div><strong>{item.product_name}</strong><span>{item.selected_color || 'Standard colour'} · Size {item.selected_size}</span></div><span>Qty {item.quantity}</span><b>{formatProductPrice(Number(item.price) * Number(item.quantity))}</b></div>)}</div></section>
      <section><h3>PAYMENT</h3>{isPaymentPending(order) && <strong className="payment-required">{paymentRequirement(order)}</strong>}<dl className="order-detail-list"><div><dt>Payment method</dt><dd>{order.payment_method}</dd></div><div><dt>Payment state</dt><dd>{order.payment_status}</dd></div><div><dt>Order total</dt><dd>{formatProductPrice(Number(order.total_amount))}</dd></div><div><dt>Pay now</dt><dd>{formatProductPrice(Number(order.advance_amount))}</dd></div><div><dt>Paid</dt><dd>{formatProductPrice(Number(order.paid_amount))}</dd></div><div><dt>Balance on delivery</dt><dd>{formatProductPrice(Number(order.pending_amount))}</dd></div></dl>{onViewBank && isPaymentPending(order) && <button className="btn btn--acid order-bank-button" type="button" onClick={onViewBank}>VIEW BANK DETAILS <span>↗</span></button>}</section>
      <section><h3>DELIVERY</h3><dl className="order-detail-list"><div><dt>Customer</dt><dd>{order.customer_name}</dd></div><div><dt>Address</dt><dd>{order.shipping_address}, {order.shipping_city}</dd></div><div><dt>Phone</dt><dd>{order.phone_number}</dd></div><div><dt>Email</dt><dd>{order.email}</dd></div></dl></section>
    </div>
    {showNextSteps && <aside className="order-next-steps"><h3>NEXT STEPS</h3><ol><li><span>01</span><p>Complete the required bank transfer using your order number.</p></li><li><span>02</span><p>KICKZ.LK verifies your payment.</p></li><li><span>03</span><p>Your order moves into confirmation and processing.</p></li><li><span>04</span><p>Follow every delivery update from this order page.</p></li></ol></aside>}
  </article>;
}
