import { logoWordmarkWhite } from '../../assets';
import { authApi } from '../../services/api/auth';

const items = [
  ['/admin/dashboard', 'Dashboard', '01'],
  ['/admin/products', 'Products', '02'],
  ['/admin/products/import', 'Bulk Import', '03'],
  ['/admin/brands', 'Brands', '04'],
  ['/admin/categories', 'Categories', '05'],
  ['/admin/orders', 'Orders', '06'],
  ['/admin/coupons', 'Coupons', '07'],
  ['/admin/customers', 'Customers', '08'],
  ['/admin/settings', 'Settings', '09'],
];

export default function AdminSidebar({ open, onClose }) {
  const currentPath = window.location.pathname;
  const activePath = currentPath === '/admin/products/import'
    ? currentPath
    : currentPath.startsWith('/admin/products') ? '/admin/products' : currentPath;
  const signOut = async (event) => {
    event.preventDefault();
    try { await authApi.adminLogout(); } catch { /* An expired session is already signed out. */ }
    window.location.assign('/admin/login');
  };

  return (
    <>
      <aside className={`admin-sidebar${open ? ' is-open' : ''}`}>
        <a className="admin-brand" href="/admin/dashboard" aria-label="KICKZ.LK admin dashboard"><img src={logoWordmarkWhite} alt="KICKZ.LK" width="1586" height="325" /><span>PRIVATE ADMIN</span></a>
        <nav aria-label="Admin navigation">
          {items.map(([href, label, number]) => (
            <a className={activePath === href ? 'active' : ''} href={href} key={href} onClick={onClose}><span>{number}</span>{label}</a>
          ))}
        </nav>
        <div className="admin-sidebar__footer"><span>ADMIN FRONTEND</span><small>Backend connection pending</small><a href="/admin/login" onClick={signOut}>SIGN OUT →</a></div>
      </aside>
      {open && <button className="admin-sidebar-overlay" aria-label="Close admin menu" onClick={onClose} />}
    </>
  );
}
