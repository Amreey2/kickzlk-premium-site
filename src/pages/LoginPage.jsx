import { useState } from 'react';
import AuthLayout from '../components/account/AuthLayout';
import FormField from '../components/account/FormField';
import PageShell from '../components/PageShell';
import useReveal from '../hooks/useReveal';
import { authApi } from '../services/api';
import { currentNext } from '../utils/customerNavigation';
import { isValidEmail } from '../utils/validation';

export default function LoginPage() {
  useReveal();
  const [form, setForm] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const next = currentNext();

  const updateField = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
    setErrors((current) => ({ ...current, [name]: '' }));
    setMessage('');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const nextErrors = {};
    if (!isValidEmail(form.email)) nextErrors.email = 'Enter a valid email address.';
    if (!form.password) nextErrors.password = 'Enter your password.';
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;
    setSubmitting(true);
    try {
      await authApi.login(form);
      window.location.assign(next);
    } catch (error) {
      setMessage(error.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <PageShell>
      <AuthLayout
        kicker="CUSTOMER ACCESS"
        title="WELCOME BACK."
        copy="Sign in to review orders, follow import progress and keep your KICKZ.LK rotation in one place."
        footer={<p className="auth-switch">NEW TO KICKZ.LK? <a href={`/register?next=${encodeURIComponent(next)}`}>CREATE AN ACCOUNT →</a></p>}
      >
        <form className="customer-form" onSubmit={handleSubmit} noValidate>
          <FormField label="EMAIL ADDRESS" name="email" type="email" value={form.email} onChange={updateField} error={errors.email} autoComplete="email" placeholder="you@email.com" />
          <FormField label="PASSWORD" name="password" type="password" value={form.password} onChange={updateField} error={errors.password} autoComplete="current-password" placeholder="Enter your password" />
          <a className="form-link" href="/forgot-password">FORGOT PASSWORD?</a>
          <button className="btn btn--acid" type="submit" disabled={submitting}>{submitting ? 'SIGNING IN…' : 'SIGN IN'} <span>→</span></button>
          {next.startsWith('/checkout') && <a className="btn btn--ghost" href={`${next}${next.includes('?') ? '&' : '?'}guest=1`}>CONTINUE AS GUEST</a>}
          {message && <p className="form-message form-message--error" role="alert">{message}</p>}
        </form>
      </AuthLayout>
    </PageShell>
  );
}
