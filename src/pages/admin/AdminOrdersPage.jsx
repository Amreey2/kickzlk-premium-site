import { useEffect, useState } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import AdminPageHeader from '../../components/admin/AdminPageHeader';
import AdminStatusBadge from '../../components/admin/AdminStatusBadge';
import { ordersApi, resolveApiAssetUrl } from '../../services/api';
import { handleAdminSessionError } from '../../utils/adminSession';
import { formatProductPrice } from '../../utils/productPresentation';

const fulfilmentStatuses = ['Order Confirmed', 'Processing', 'Quality Check Completed', 'Shipped', 'Customs Clearance', 'Out for Delivery', 'Delivered'];
const statusesFor = (order) => {
  const payment = order.payment_option === 'full' ? ['Payment Pending — Full Amount', 'Full Payment Confirmed'] : [`Payment Pending — ${Number(order.advance_percentage || 50)}% Advance`, `${Number(order.advance_percentage || 50)}% Payment Confirmed`];
  return [...payment, ...fulfilmentStatuses];
};
const money = (value) => formatProductPrice(Number(value || 0));
const parse = (value) => { try { return typeof value === 'string' ? JSON.parse(value) : value; } catch { return []; } };
const itemImage = (item) => {
  const candidate = [...(parse(item.product_images) || []), ...(parse(item.product_cdn_images) || [])][0];
  return resolveApiAssetUrl(typeof candidate === 'string' ? candidate : candidate?.url);
};
const tone = (status) => String(status).includes('Confirmed') ? 'success' : 'warning';

function OrderModal({ order, draft, busy, setDraft, requestPublish, close }) {
  if (!order) return null;
  const remaining = Math.max(0, Number(order.total_amount) - Number(order.paid_amount));
  const deliveryBalance = Math.max(0, Number(order.total_amount) - Number(order.advance_amount));
  return <div className="admin-modal" role="dialog" aria-modal="true" aria-labelledby="order-modal-title" onMouseDown={(event) => event.target === event.currentTarget && close()}>
    <section className="admin-modal__surface admin-order-modal">
      <header className="admin-modal__header"><div><span>COMPLETE ORDER</span><h2 id="order-modal-title">{order.order_number}</h2><p>{new Date(order.created_at).toLocaleString('en-LK')}</p></div><button type="button" onClick={close} aria-label="Close order details">×</button></header>
      <section className="admin-order-status-editor"><div><span>CURRENT PUBLISHED STATUS</span><strong>{order.order_status}</strong></div><label><span>PENDING STATUS</span><select value={draft} onChange={(event) => setDraft(event.target.value)}>{statusesFor(order).map((status) => <option key={status}>{status}</option>)}</select></label><button className="btn btn--acid" type="button" disabled={busy || draft === order.order_status} onClick={requestPublish}>PUBLISH STATUS</button></section>
      <div className="admin-order-modal__summary">
        <section><span>CUSTOMER</span><h3>{order.customer_name}</h3><p>{order.email}<br />{order.phone_number}<br />{order.user_id ? 'Registered customer' : 'Guest checkout'}</p></section>
        <section><span>ORDER</span><h3>{order.order_number}</h3><p>Published: {order.order_status}<br />Payment: {order.payment_status}<br />Method: {order.payment_method || 'Bank Transfer'}</p></section>
        <section><span>DELIVERY</span><h3>{order.shipping_city || '—'}</h3><p>{order.shipping_address || '—'}<br />City: {order.shipping_city || '—'}<br />Notes: {order.order_notes || 'None'}</p></section>
      </div>
      <section className="admin-order-modal__section"><div className="admin-order-modal__section-head"><span>PRODUCTS</span><strong>{order.items?.length || 0} LINE ITEM(S)</strong></div><div className="admin-order-product-list">{order.items?.map((item) => {
        const image = itemImage(item); const current = Number(item.price); const original = Number(item.original_price);
        return <article key={item.id}>{image ? <img src={image} alt="" /> : <div className="admin-order-product-placeholder">KZ</div>}<div><strong>{item.product_name}</strong><span>SKU: {item.sku || 'Unavailable'}</span><span>{item.selected_color || 'Standard colour'} · {item.selected_size || 'No size'} · Qty {item.quantity}</span></div><div className="admin-order-product-price">{original > current && <del>{money(original)}</del>}<strong>{money(current)}</strong><span>Line total {money(current * item.quantity)}</span></div></article>;
      })}</div></section>
      <section className="admin-order-modal__section"><div className="admin-order-modal__section-head"><span>FINANCIAL SUMMARY</span>{order.coupon_code && <strong>COUPON {order.coupon_code} · {order.coupon_discount_type} {order.coupon_discount_value}</strong>}</div><dl className="admin-order-financial-grid">
        {[['Subtotal', order.subtotal_amount], ['Discount', order.discount_amount], ['Order Total', order.total_amount], ['Advance / Pay Now', order.advance_amount], ['Advance Paid', Math.min(Number(order.paid_amount), Number(order.advance_amount))], ['Balance on Delivery', deliveryBalance], ['Total Paid', order.paid_amount], ['Remaining Balance', remaining]].map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{label === 'Discount' ? '− ' : ''}{money(value)}</dd></div>)}
      </dl></section>
      <section className="admin-order-modal__section"><div className="admin-order-modal__section-head"><span>STATUS HISTORY</span></div><ol className="admin-order-history">{order.status_history?.map((entry) => <li key={entry.id}><i /><div><strong>{entry.status}</strong><span>{new Date(entry.created_at).toLocaleString('en-LK')}</span>{entry.note && <p>{entry.note}</p>}</div></li>)}</ol></section>
    </section>
  </div>;
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState([]); const [selectedId, setSelectedId] = useState(null); const [drafts, setDrafts] = useState({});
  const [confirmation, setConfirmation] = useState(null); const [search, setSearch] = useState(''); const [error, setError] = useState('');
  const [message, setMessage] = useState(''); const [publishing, setPublishing] = useState(false);
  useEffect(() => { ordersApi.adminList().then(setOrders).catch((requestError) => { if (!handleAdminSessionError(requestError)) setError(requestError.message); }); }, []);
  useEffect(() => { if (!selectedId) return undefined; document.body.style.overflow = 'hidden'; return () => { document.body.style.overflow = ''; }; }, [selectedId]);
  const selected = orders.find((order) => order.id === selectedId); const draft = selected ? drafts[selected.id] || selected.order_status : '';
  const publish = async () => {
    if (!confirmation || publishing) return; setPublishing(true); setError(''); setMessage('');
    try { const updated = await ordersApi.updateStatus(confirmation.id, confirmation.status, 'Status published by administrator.'); setOrders((current) => current.map((order) => order.id === updated.id ? updated : order)); setDrafts((current) => ({ ...current, [updated.id]: updated.order_status })); setConfirmation(null); setMessage('Order status published.'); }
    catch (requestError) { if (!handleAdminSessionError(requestError)) setError(requestError.message); } finally { setPublishing(false); }
  };
  const visible = orders.filter((order) => `${order.order_number} ${order.customer_name} ${order.email}`.toLowerCase().includes(search.toLowerCase()));
  return <AdminLayout title="Orders"><AdminPageHeader eyebrow="ORDER OPERATIONS" title="ORDERS" copy="Review customer, payment and delivery progress from one clear workflow." />
    {message && <p className="admin-feedback admin-feedback--success" role="status">{message}</p>}{error && <p className="admin-feedback admin-feedback--error" role="alert">{error}</p>}

    <section className="admin-panel">
      <label className="admin-order-search"><span>SEARCH ORDER OR CUSTOMER</span><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="KZ-00001 or customer email" /></label>
      <div className="admin-table-wrap"><table className="admin-table admin-orders-table">
        <thead><tr><th>Order</th><th>Customer</th><th>Date</th><th>Total</th><th>Paid</th><th>Balance</th><th>Payment State</th><th>Published Status</th><th>Action</th></tr></thead>
        <tbody>{visible.map((order) => <tr key={order.id}>
          <td data-label="Order"><strong>{order.order_number}</strong></td>
          <td data-label="Customer">{order.customer_name}<small>{order.user_id ? 'CUSTOMER' : 'GUEST'}</small></td>
          <td data-label="Date">{new Date(order.created_at).toLocaleDateString('en-LK')}</td>
          <td data-label="Total">{money(order.total_amount)}</td><td data-label="Paid">{money(order.paid_amount)}</td><td data-label="Balance">{money(order.pending_amount)}</td>
          <td data-label="Payment"><AdminStatusBadge tone={tone(order.payment_status)}>{order.payment_status}</AdminStatusBadge></td>
          <td data-label="Status"><strong>{order.order_status}</strong></td>
          <td data-label="Action"><button className="admin-text-button" onClick={() => setSelectedId(order.id)}>VIEW ORDER</button></td>
        </tr>)}</tbody>
      </table></div>
    </section>
    <OrderModal order={selected} draft={draft} busy={publishing} setDraft={(status) => setDrafts((current) => ({ ...current, [selected.id]: status }))} requestPublish={() => setConfirmation({ id: selected.id, current: selected.order_status, status: draft })} close={() => setSelectedId(null)} />
    {confirmation && <div className="admin-modal admin-modal--confirm" role="dialog" aria-modal="true"><section className="admin-modal__surface">
      <span>STATUS PUBLICATION</span><h2>Publish this status update?</h2>
      <dl><div><dt>Current</dt><dd>{confirmation.current}</dd></div><div><dt>New</dt><dd>{confirmation.status}</dd></div></dl>
      <p>This status will become visible to the customer.</p>
      <div><button className="btn btn--ghost" type="button" disabled={publishing} onClick={() => setConfirmation(null)}>CANCEL</button><button className="btn btn--acid" type="button" disabled={publishing} onClick={publish}>{publishing ? 'PUBLISHING…' : 'CONFIRM & PUBLISH'}</button></div>
    </section></div>}
  </AdminLayout>;
}
