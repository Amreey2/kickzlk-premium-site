import { useState } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import AdminPageHeader from '../../components/admin/AdminPageHeader';
import AdminStatusBadge from '../../components/admin/AdminStatusBadge';
import { adminOrders } from '../../data/adminData';
import { formatPrice } from '../../data/products';

const statuses = ['Pending', 'Payment Confirmed', 'Processing', 'Import/Clearing', 'Shipped', 'Delivered'];

const paymentTone = (status) => status === 'Paid' ? 'success' : status === 'Pending' ? 'danger' : 'warning';

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState(adminOrders);
  const [selectedId, setSelectedId] = useState(adminOrders[0].id);
  const selectedOrder = orders.find((order) => order.id === selectedId);

  const updateStatus = (id, status) => {
    setOrders((current) => current.map((order) => order.id === id ? { ...order, status } : order));
  };

  return (
    <AdminLayout title="Orders">
      <AdminPageHeader eyebrow="ORDER OPERATIONS" title="ORDERS" copy="Review payment state and update the customer delivery journey." />
      <section className="admin-panel">
        {/* SPRINT 4 ORDER MANAGEMENT: status changes remain component state until the order API is available. */}
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead><tr><th>Order</th><th>Customer</th><th>Product</th><th>Amount</th><th>Payment</th><th>Order Status</th><th>Action</th></tr></thead>
            <tbody>{orders.map((order) => (
              <tr key={order.id}>
                <td data-label="Order"><strong>{order.id}</strong><small>{order.date}</small></td>
                <td data-label="Customer">{order.customer}</td>
                <td data-label="Product">{order.product.name}</td>
                <td data-label="Amount">{formatPrice(order.amount)}</td>
                <td data-label="Payment"><AdminStatusBadge tone={paymentTone(order.paymentStatus)}>{order.paymentStatus}</AdminStatusBadge></td>
                <td data-label="Order Status"><select className="admin-status-select" value={order.status} onChange={(event) => updateStatus(order.id, event.target.value)}>{statuses.map((status) => <option value={status} key={status}>{status}</option>)}</select></td>
                <td data-label="Action"><button className="admin-text-button" type="button" onClick={() => setSelectedId(order.id)}>VIEW ORDER</button></td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      </section>
      {selectedOrder && (
        <section className="admin-panel admin-order-detail">
          <div className="admin-panel__head"><div><span>ORDER DETAIL</span><h2>{selectedOrder.id}</h2></div><AdminStatusBadge tone="success">{selectedOrder.status}</AdminStatusBadge></div>
          <div className="admin-order-detail__grid">
            <div><span>CUSTOMER</span><strong>{selectedOrder.customer}</strong><p>{selectedOrder.email}<br />{selectedOrder.phone}</p></div>
            <div><span>DELIVERY</span><strong>{selectedOrder.address}</strong><p>{selectedOrder.product.deliveryTime}</p></div>
            <div><span>PRODUCT</span><strong>{selectedOrder.product.name}</strong><p>{selectedOrder.size} · {formatPrice(selectedOrder.amount)}</p></div>
          </div>
        </section>
      )}
    </AdminLayout>
  );
}
