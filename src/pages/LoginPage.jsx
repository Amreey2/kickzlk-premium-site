import { useState } from 'react';
import AuthLayout from '../components/account/AuthLayout';
import FormField from '../components/account/FormField';
import PageShell from '../components/PageShell';
import useReveal from '../hooks/useReveal';
import { authApi, ordersApi } from '../services/api';
import { currentNext } from '../utils/customerNavigation';
import { isValidEmail } from '../utils/validation';

export default function LoginPage() {
  useReveal();
  const [form, setForm] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [guestForm, setGuestForm] = useState({ orderNumber: '', email: '' });
  const [guestError, setGuestError] = useState('');
  const [guestSubmitting, setGuestSubmitting] = useState(false);
  const next = currentNext();

  const updateField = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
    setErrors((current) => ({ ...current, [name]: '' }));
    setMessage('');
  };

  const trackGuestOrder = async (event) => {
    event.preventDefault(); setGuestError('');
    const orderNumber = guestForm.orderNumber.trim().toUpperCase();
    const email = guestForm.email.trim().toLowerCase();
    if (!/^KZ-\d{5,}$/.test(orderNumber)) return setGuestError('Enter a valid KZ order number.');
    if (!isValidEmail(email)) return setGuestError('Enter the checkout email address.');
    setGuestSubmitting(true);
    try {
      await ordersApi.get(orderNumber, { email });
      sessionStorage.setItem('kickz_guest_tracking', JSON.stringify({ orderNumber, email }));
      window.location.assign(`/track-order?order=${encodeURIComponent(orderNumber)}`);
    } catch (error) { setGuestError(error.message); }
    finally { setGuestSubmitting(false); }
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
        <section className="guest-track-login"><div><span className="section-kicker">ORDERED AS A GUEST?</span><p>Track securely with the order number and matching checkout email.</p></div><form onSubmit={trackGuestOrder} noValidate><FormField label="ORDER NUMBER" name="orderNumber" value={guestForm.orderNumber} onChange={(event) => setGuestForm((value) => ({ ...value, orderNumber: event.target.value }))} placeholder="KZ-00001" /><FormField label="EMAIL" name="guestEmail" type="email" value={guestForm.email} onChange={(event) => setGuestForm((value) => ({ ...value, email: event.target.value }))} placeholder="you@email.com" /><button className="btn btn--ghost" disabled={guestSubmitting}>{guestSubmitting ? 'CHECKING…' : 'TRACK YOUR ORDER'} <span>→</span></button>{guestError && <p className="form-message form-message--error" role="alert">{guestError}</p>}</form></section>
      </AuthLayout>
    </PageShell>
  );
}
