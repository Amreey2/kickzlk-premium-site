export default function AdminPageHeader({ eyebrow, title, copy, action }) {
  return (
    <div className="admin-page-head">
      <div><span>{eyebrow}</span><h1>{title}</h1>{copy && <p>{copy}</p>}</div>
      {action}
    </div>
  );
}
