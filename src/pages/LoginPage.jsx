import { useState } from 'react';
import AuthLayout from '../components/account/AuthLayout';
import FormField from '../components/account/FormField';
import PageShell from '../components/PageShell';
import useReveal from '../hooks/useReveal';
import { isValidEmail } from '../utils/validation';

export default function LoginPage() {
  useReveal();
  const [form, setForm] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState('');

  const updateField = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
    setErrors((current) => ({ ...current, [name]: '' }));
    setMessage('');
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    const nextErrors = {};
    if (!isValidEmail(form.email)) nextErrors.email = 'Enter a valid email address.';
    if (!form.password) nextErrors.password = 'Enter your password.';
    setErrors(nextErrors);
    setMessage(Object.keys(nextErrors).length ? '' : 'Login UI validated. Account authentication will connect in a future backend sprint.');
  };

  return (
    <PageShell>
      {/* SPRINT 3.2 LOGIN UI: frontend validation only; no authentication request is made. */}
      <AuthLayout
        kicker="CUSTOMER ACCESS"
        title="WELCOME BACK."
        copy="Sign in to review orders, follow import progress and keep your KICKZ.LK rotation in one place."
        footer={<p className="auth-switch">NEW TO KICKZ.LK? <a href="/register">CREATE AN ACCOUNT →</a></p>}
      >
        <form className="customer-form" onSubmit={handleSubmit} noValidate>
          <FormField label="EMAIL ADDRESS" name="email" type="email" value={form.email} onChange={updateField} error={errors.email} autoComplete="email" placeholder="you@email.com" />
          <FormField label="PASSWORD" name="password" type="password" value={form.password} onChange={updateField} error={errors.password} autoComplete="current-password" placeholder="Enter your password" />
          <button className="btn btn--acid" type="submit">SIGN IN <span>→</span></button>
          <a className="btn btn--ghost" href="/checkout?guest=1">CONTINUE AS GUEST</a>
          {message && <p className="form-message" role="status">{message}</p>}
        </form>
      </AuthLayout>
    </PageShell>
  );
}
