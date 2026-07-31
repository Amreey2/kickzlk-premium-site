export default function AdminHeader({ title, onMenuOpen }) {
  return (
    <header className="admin-header">
      <button className="admin-menu-button" type="button" aria-label="Open admin menu" onClick={onMenuOpen}><span /><span /></button>
      <div><span>CONTROL ROOM</span><strong>{title}</strong></div>
      <div className="admin-user"><span>AD</span><div><strong>Admin</strong><small>KICKZ.LK</small></div></div>
    </header>
  );
}
