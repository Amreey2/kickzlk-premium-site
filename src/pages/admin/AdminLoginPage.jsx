import { useState } from 'react';
import FormField from '../../components/account/FormField';
import { logoWordmarkWhite } from '../../assets';
import { authApi } from '../../services/api';
import { isValidEmail } from '../../utils/validation';

export default function AdminLoginPage() {
  const [form, setForm] = useState({ email: '', password: '', remember: false });
  const [errors, setErrors] = useState(() => new URLSearchParams(window.location.search).get('session') === 'expired'
    ? { form: 'Your administrator session expired. Sign in again to continue.' }
    : {});
  const [submitting, setSubmitting] = useState(false);

  const updateField = (event) => {
    const { name, value, checked, type } = event.target;
    setForm((current) => ({ ...current, [name]: type === 'checkbox' ? checked : value }));
    setErrors((current) => ({ ...current, [name]: '', form: '' }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const nextErrors = {};
    if (!isValidEmail(form.email)) nextErrors.email = 'Enter a valid admin email.';
    if (!form.password) nextErrors.password = 'Enter the admin password.';
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;

    setSubmitting(true);
    try {
      await authApi.adminLogin({ email: form.email, password: form.password });
      window.location.assign('/admin/dashboard');
    } catch (error) {
      setErrors({ form: error.message || 'Admin login failed. Please try again.' });
      setSubmitting(false);
    }
  };

  return (
    <div className="admin-login-page">
      <div className="noise" aria-hidden="true" />
      <main className="admin-login-card">
        <div className="admin-login-brand"><img src={logoWordmarkWhite} alt="KICKZ.LK" /><span>PRIVATE ADMIN</span></div>
        <span className="admin-kicker">SECURE CONTROL ROOM</span>
        <h1>ADMIN<br />ACCESS.</h1>
        <p>Secure access for catalog, orders, customers and storefront settings.</p>
        {/* SPRINT 6.1B ADMIN SESSION: the existing backend sets the protected httpOnly admin cookie. */}
        <form className="customer-form" onSubmit={handleSubmit} noValidate>
          <FormField label="ADMIN EMAIL" name="email" type="email" value={form.email} onChange={updateField} error={errors.email} autoComplete="username" placeholder="admin@kickz.lk" />
          <FormField label="PASSWORD" name="password" type="password" value={form.password} onChange={updateField} error={errors.password} autoComplete="current-password" placeholder="Enter admin password" />
          <label className="admin-checkbox"><input name="remember" type="checkbox" checked={form.remember} onChange={updateField} /><span>Remember this session</span></label>
          <button className="btn btn--acid" type="submit" disabled={submitting}>{submitting ? 'AUTHENTICATING…' : 'LOGIN TO ADMIN'} <span>→</span></button>
          {errors.form && <p className="form-message form-message--error" role="alert">{errors.form}</p>}
        </form>
        <small className="admin-login-note">Private access · Administrator sessions expire automatically</small>
      </main>
    </div>
  );
}
