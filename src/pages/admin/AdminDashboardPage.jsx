import AdminLayout from '../../components/admin/AdminLayout';
import AdminPageHeader from '../../components/admin/AdminPageHeader';
import { adminActivity, adminCustomers, adminOrders } from '../../data/adminData';
import { products } from '../../data/products';

const cards = [
  ['TOTAL PRODUCTS', products.length, 'Active local catalog'],
  ['TOTAL ORDERS', adminOrders.length, 'Mock order records'],
  ['PENDING ORDERS', adminOrders.filter((order) => order.status === 'Pending').length, 'Requires review'],
  ['CUSTOMERS', adminCustomers.length, 'Customer profiles'],
];

export default function AdminDashboardPage() {
  return (
    <AdminLayout title="Dashboard">
      <AdminPageHeader eyebrow="OVERVIEW" title="DASHBOARD" copy="A private operational view prepared for the KICKZ.LK backend connection." />
      {/* SPRINT 4 OVERVIEW: stat cards consume replaceable local data collections. */}
      <section className="admin-stats">
        {cards.map(([label, value, detail], index) => <article key={label}><span>0{index + 1}</span><strong>{value}</strong><h2>{label}</h2><p>{detail}</p></article>)}
      </section>
      <section className="admin-panel admin-activity">
        <div className="admin-panel__head"><div><span>LIVE FEED</span><h2>RECENT ACTIVITY</h2></div><a href="/admin/orders">VIEW ORDERS →</a></div>
        <div>{adminActivity.map((activity) => <article key={`${activity.time}-${activity.title}`}><span>{activity.time}</span><div><strong>{activity.title}</strong><p>{activity.detail}</p></div></article>)}</div>
      </section>
    </AdminLayout>
  );
}
