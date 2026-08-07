import { useState } from 'react';
import AuthLayout from '../components/account/AuthLayout';
import FormField from '../components/account/FormField';
import PageShell from '../components/PageShell';
import useReveal from '../hooks/useReveal';
import { authApi } from '../services/api';
import { currentNext } from '../utils/customerNavigation';
import { isValidEmail, isValidPhone } from '../utils/validation';

export default function RegisterPage() {
  useReveal();
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', confirmPassword: '' });
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
    if (form.name.trim().length < 2) nextErrors.name = 'Enter your full name.';
    if (!isValidEmail(form.email)) nextErrors.email = 'Enter a valid email address.';
    if (!isValidPhone(form.phone)) nextErrors.phone = 'Enter a valid Sri Lankan phone number.';
    if (form.password.length < 8) nextErrors.password = 'Use at least 8 characters.';
    if (!form.confirmPassword) nextErrors.confirmPassword = 'Confirm your password.';
    else if (form.confirmPassword !== form.password) nextErrors.confirmPassword = 'Passwords do not match.';
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;
    setSubmitting(true);
    try {
      await authApi.register({ name: form.name, email: form.email, phoneNumber: form.phone, password: form.password });
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
        kicker="JOIN THE ROTATION"
        title="CREATE ACCOUNT."
        copy="Prepare a KICKZ.LK profile for faster enquiries, saved delivery details and transparent order tracking."
        footer={<p className="auth-switch">ALREADY REGISTERED? <a href={`/login?next=${encodeURIComponent(next)}`}>SIGN IN →</a></p>}
      >
        <form className="customer-form" onSubmit={handleSubmit} noValidate>
          <FormField label="FULL NAME" name="name" value={form.name} onChange={updateField} error={errors.name} autoComplete="name" placeholder="Your full name" />
          <div className="form-row">
            <FormField label="EMAIL ADDRESS" name="email" type="email" value={form.email} onChange={updateField} error={errors.email} autoComplete="email" placeholder="you@email.com" />
            <FormField label="PHONE NUMBER" name="phone" type="tel" value={form.phone} onChange={updateField} error={errors.phone} autoComplete="tel" placeholder="+94 7X XXX XXXX" />
          </div>
          <div className="form-row">
            <FormField label="PASSWORD" name="password" type="password" value={form.password} onChange={updateField} error={errors.password} autoComplete="new-password" placeholder="Minimum 8 characters" />
            <FormField label="CONFIRM PASSWORD" name="confirmPassword" type="password" value={form.confirmPassword} onChange={updateField} error={errors.confirmPassword} autoComplete="new-password" placeholder="Repeat your password" />
          </div>
          <button className="btn btn--acid" type="submit" disabled={submitting}>{submitting ? 'CREATING ACCOUNT…' : 'CREATE ACCOUNT'} <span>→</span></button>
          {next.startsWith('/checkout') && <a className="btn btn--ghost" href={`${next}${next.includes('?') ? '&' : '?'}guest=1`}>CONTINUE AS GUEST</a>}
          {message && <p className="form-message form-message--error" role="alert">{message}</p>}
        </form>
      </AuthLayout>
    </PageShell>
  );
}
