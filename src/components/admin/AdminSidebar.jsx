import { logoWordmarkWhite } from '../../assets';

const items = [
  ['/admin/dashboard', 'Dashboard', '01'],
  ['/admin/products', 'Products', '02'],
  ['/admin/orders', 'Orders', '03'],
  ['/admin/customers', 'Customers', '04'],
  ['/admin/settings', 'Settings', '05'],
];

export default function AdminSidebar({ open, onClose }) {
  const currentPath = window.location.pathname;
  const activePath = currentPath.startsWith('/admin/products') ? '/admin/products' : currentPath;

  return (
    <>
      <aside className={`admin-sidebar${open ? ' is-open' : ''}`}>
        <a className="admin-brand" href="/admin/dashboard" aria-label="KICKZ.LK admin dashboard"><img src={logoWordmarkWhite} alt="KICKZ.LK" /><span>PRIVATE ADMIN</span></a>
        <nav aria-label="Admin navigation">
          {items.map(([href, label, number]) => (
            <a className={activePath === href ? 'active' : ''} href={href} key={href} onClick={onClose}><span>{number}</span>{label}</a>
          ))}
        </nav>
        <div className="admin-sidebar__footer"><span>ADMIN FRONTEND</span><small>Backend connection pending</small><a href="/admin/login">SIGN OUT →</a></div>
      </aside>
      {open && <button className="admin-sidebar-overlay" aria-label="Close admin menu" onClick={onClose} />}
    </>
  );
}
