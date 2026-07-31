import { useState } from 'react';
import FormField from '../../components/account/FormField';
import { logoWordmarkWhite } from '../../assets';
import { isValidEmail } from '../../utils/validation';

export default function AdminLoginPage() {
  const [form, setForm] = useState({ email: '', password: '', remember: false });
  const [errors, setErrors] = useState({});
  const [ready, setReady] = useState(false);

  const updateField = (event) => {
    const { name, value, checked, type } = event.target;
    setForm((current) => ({ ...current, [name]: type === 'checkbox' ? checked : value }));
    setErrors((current) => ({ ...current, [name]: '' }));
    setReady(false);
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    const nextErrors = {};
    if (!isValidEmail(form.email)) nextErrors.email = 'Enter a valid admin email.';
    if (!form.password) nextErrors.password = 'Enter the admin password.';
    setErrors(nextErrors);
    setReady(Object.keys(nextErrors).length === 0);
  };

  return (
    <div className="admin-login-page">
      <div className="noise" aria-hidden="true" />
      <main className="admin-login-card">
        <div className="admin-login-brand"><img src={logoWordmarkWhite} alt="KICKZ.LK" /><span>PRIVATE ADMIN</span></div>
        <span className="admin-kicker">SECURE CONTROL ROOM</span>
        <h1>ADMIN<br />ACCESS.</h1>
        <p>Frontend access for catalog, orders, customers and storefront settings.</p>
        {/* SPRINT 4 ADMIN LOGIN: validation is local and does not create an authenticated session. */}
        <form className="customer-form" onSubmit={handleSubmit} noValidate>
          <FormField label="ADMIN EMAIL" name="email" type="email" value={form.email} onChange={updateField} error={errors.email} autoComplete="username" placeholder="admin@kickz.lk" />
          <FormField label="PASSWORD" name="password" type="password" value={form.password} onChange={updateField} error={errors.password} autoComplete="current-password" placeholder="Enter admin password" />
          <label className="admin-checkbox"><input name="remember" type="checkbox" checked={form.remember} onChange={updateField} /><span>Remember this session</span></label>
          <button className="btn btn--acid" type="submit">LOGIN TO ADMIN <span>→</span></button>
          {ready && <a className="btn btn--ghost" href="/admin/dashboard">OPEN DASHBOARD</a>}
        </form>
        <small className="admin-login-note">Frontend demonstration only · Authentication connects in Sprint 5</small>
      </main>
    </div>
  );
}
