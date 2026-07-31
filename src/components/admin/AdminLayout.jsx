import { useState } from 'react';
import AdminHeader from './AdminHeader';
import AdminSidebar from './AdminSidebar';

export default function AdminLayout({ title, children }) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="admin-app">
      <div className="noise" aria-hidden="true" />
      <AdminSidebar open={menuOpen} onClose={() => setMenuOpen(false)} />
      <div className="admin-workspace">
        <AdminHeader title={title} onMenuOpen={() => setMenuOpen(true)} />
        <main className="admin-main">{children}</main>
      </div>
    </div>
  );
}
