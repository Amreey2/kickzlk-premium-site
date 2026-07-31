import { useState } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import AdminPageHeader from '../../components/admin/AdminPageHeader';
import { adminCustomers } from '../../data/adminData';

export default function AdminCustomersPage() {
  const [selectedCustomer, setSelectedCustomer] = useState(null);

  return (
    <AdminLayout title="Customers">
      <AdminPageHeader eyebrow="CUSTOMER DIRECTORY" title="CUSTOMERS" copy="Frontend customer profiles prepared for future account and order APIs." />
      <section className="admin-panel">
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead><tr><th>Customer</th><th>Email</th><th>WhatsApp</th><th>Total Orders</th><th>Last Order</th><th>History</th></tr></thead>
            <tbody>{adminCustomers.map((customer) => (
              <tr key={customer.id}>
                <td data-label="Customer"><strong>{customer.name}</strong><small>{customer.id}</small></td>
                <td data-label="Email">{customer.email}</td>
                <td data-label="WhatsApp">{customer.whatsapp}</td>
                <td data-label="Total Orders">{customer.totalOrders}</td>
                <td data-label="Last Order">{customer.lastOrder}</td>
                <td data-label="History"><button className="admin-text-button" type="button" onClick={() => setSelectedCustomer(customer)}>VIEW HISTORY</button></td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      </section>
      {selectedCustomer && (
        <section className="admin-panel admin-history-placeholder">
          <span>ORDER HISTORY PLACEHOLDER</span>
          <h2>{selectedCustomer.name}</h2>
          <p>{selectedCustomer.totalOrders} orders will be loaded here when the customer/order backend is connected.</p>
          <button className="admin-text-button" type="button" onClick={() => setSelectedCustomer(null)}>CLOSE</button>
        </section>
      )}
    </AdminLayout>
  );
}
