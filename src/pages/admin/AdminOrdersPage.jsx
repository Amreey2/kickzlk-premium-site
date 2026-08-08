import { useEffect, useState } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import AdminPageHeader from '../../components/admin/AdminPageHeader';
import AdminStatusBadge from '../../components/admin/AdminStatusBadge';
import { ordersApi } from '../../services/api';
import { handleAdminSessionError } from '../../utils/adminSession';
import { formatProductPrice } from '../../utils/productPresentation';

const fulfilmentStatuses = ['Order Confirmed', 'Processing', 'Quality Check Completed', 'Shipped', 'Customs Clearance', 'Out for Delivery', 'Delivered'];
const statusesFor = (order) => {
  const payment = order.payment_option === 'full'
    ? ['Payment Pending — Full Amount', 'Full Payment Confirmed']
    : [`Payment Pending — ${Number(order.advance_percentage || 50)}% Advance`, `${Number(order.advance_percentage || 50)}% Payment Confirmed`];
  return [...payment, ...fulfilmentStatuses];
};
const paymentTone = (status) => String(status).includes('Confirmed') ? 'success' : 'warning';

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');
  useEffect(() => { ordersApi.adminList().then((value) => { setOrders(value); setSelectedId(value[0]?.id || null); }).catch((requestError) => { if (!handleAdminSessionError(requestError)) setError(requestError.message); }); }, []);
  const updateStatus = async (id, status) => { try { const updated = await ordersApi.updateStatus(id, status); setOrders((current) => current.map((order) => order.id === id ? updated : order)); } catch (requestError) { if (!handleAdminSessionError(requestError)) setError(requestError.message); } };
  const visible = orders.filter((order) => `${order.order_number} ${order.customer_name} ${order.email}`.toLowerCase().includes(search.toLowerCase()));
  const selected = orders.find((order) => order.id === selectedId);
  return <AdminLayout title="Orders"><AdminPageHeader eyebrow="ORDER OPERATIONS" title="ORDERS" copy="Review customer, payment and delivery progress from one clear workflow." />
    {error && <p className="admin-feedback admin-feedback--error">{error}</p>}
    <section className="admin-panel"><label className="admin-order-search"><span>SEARCH ORDER OR CUSTOMER</span><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="KZ-00001 or customer email" /></label><div className="admin-table-wrap"><table className="admin-table admin-orders-table"><thead><tr><th>Order</th><th>Customer</th><th>Date</th><th>Total</th><th>Paid</th><th>Balance</th><th>Payment State</th><th>Order Status</th><th>Action</th></tr></thead><tbody>{visible.map((order) => <tr key={order.id}><td data-label="Order"><strong>{order.order_number}</strong></td><td data-label="Customer">{order.customer_name}<small>{order.user_id ? 'CUSTOMER' : 'GUEST'}</small></td><td data-label="Date">{new Date(order.created_at).toLocaleDateString('en-LK')}</td><td data-label="Total">{formatProductPrice(Number(order.total_amount))}</td><td data-label="Paid">{formatProductPrice(Number(order.paid_amount))}</td><td data-label="Balance">{formatProductPrice(Number(order.pending_amount))}</td><td data-label="Payment"><AdminStatusBadge tone={paymentTone(order.payment_status)}>{order.payment_status}</AdminStatusBadge></td><td data-label="Status"><select className="admin-status-select" value={order.order_status} onChange={(event) => updateStatus(order.id, event.target.value)}>{statusesFor(order).map((status) => <option key={status}>{status}</option>)}</select></td><td data-label="Action"><button className="admin-text-button" onClick={() => setSelectedId(order.id)}>VIEW</button></td></tr>)}</tbody></table></div></section>
    {selected && <section className="admin-panel admin-order-detail"><div className="admin-panel__head"><div><span>ORDER DETAIL</span><h2>{selected.order_number}</h2><p>{new Date(selected.created_at).toLocaleString('en-LK')}</p></div><AdminStatusBadge tone={paymentTone(selected.payment_status)}>{selected.payment_status}</AdminStatusBadge></div><div className="admin-order-detail__grid"><div><span>CUSTOMER</span><strong>{selected.customer_name}</strong><p>{selected.email}<br />{selected.phone_number}<br />{selected.user_id ? 'Registered customer' : 'Guest checkout'}</p></div><div><span>DELIVERY</span><strong>{selected.shipping_city}</strong><p>{selected.shipping_address}</p></div><div><span>PAYMENT</span><strong>{selected.payment_method}</strong><p>Order total {formatProductPrice(Number(selected.total_amount))}<br />Pay now {formatProductPrice(Number(selected.advance_amount))}<br />Paid {formatProductPrice(Number(selected.paid_amount))}<br />Balance {formatProductPrice(Number(selected.pending_amount))}</p></div></div><div className="admin-order-items">{selected.items?.map((item) => <article key={item.id}><strong>{item.product_name}</strong><span>{item.selected_color || 'Standard'} · {item.selected_size} · Qty {item.quantity}</span><b>{formatProductPrice(Number(item.price) * item.quantity)}</b></article>)}</div></section>}
  </AdminLayout>;
}
