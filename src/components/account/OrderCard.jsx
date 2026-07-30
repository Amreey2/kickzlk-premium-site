import { formatPrice } from '../../data/products';
import OrderTracking from './OrderTracking';

export default function OrderCard({ order }) {
  return (
    <article className="order-card reveal">
      <div className="order-card__head">
        <div><span>ORDER</span><strong>{order.id}</strong></div>
        <div><span>PLACED</span><strong>{order.date}</strong></div>
        <div><span>TOTAL</span><strong>{formatPrice(order.total)}</strong></div>
        <span className="order-status">{order.status}</span>
      </div>
      <div className="order-card__product">
        <img src={order.product.image} alt={order.product.alt} />
        <div><span className="brand-label">{order.product.brand}</span><h3>{order.product.name}</h3><p>Size {order.size} · {order.product.deliveryTime}</p></div>
      </div>
      <OrderTracking currentStep={order.currentStep} />
    </article>
  );
}
