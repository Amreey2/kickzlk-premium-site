import { useState } from 'react';
import AuthLayout from '../components/account/AuthLayout';
import FormField from '../components/account/FormField';
import PageShell from '../components/PageShell';
import useReveal from '../hooks/useReveal';
import { authApi } from '../services/api';

export default function ResetPasswordPage() {
  useReveal();
  const token = new URLSearchParams(window.location.search).get('token') || '';
  const [form, setForm] = useState({ password: '', confirmPassword: '' });
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState('');
  const [complete, setComplete] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    const next = {};
    if (!token) next.form = 'This reset link is incomplete.';
    if (form.password.length < 8) next.password = 'Use at least 8 characters.';
    if (form.confirmPassword !== form.password) next.confirmPassword = 'Passwords do not match.';
    setErrors(next);
    if (Object.keys(next).length) return;
    try { const result = await authApi.resetPassword(token, form.password); setMessage(result.message); setComplete(true); }
    catch (error) { setMessage(error.message); }
  };

  return (
    <PageShell><AuthLayout kicker="SECURE RECOVERY" title="NEW PASSWORD." copy="Choose a new password for your customer account. Reset links expire after 30 minutes and can only be used once." footer={<p className="auth-switch"><a href="/login">RETURN TO SIGN IN →</a></p>}>
      <form className="customer-form" onSubmit={submit} noValidate>
        <FormField label="NEW PASSWORD" name="password" type="password" value={form.password} onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))} error={errors.password} autoComplete="new-password" placeholder="Minimum 8 characters" />
        <FormField label="CONFIRM PASSWORD" name="confirmPassword" type="password" value={form.confirmPassword} onChange={(event) => setForm((current) => ({ ...current, confirmPassword: event.target.value }))} error={errors.confirmPassword} autoComplete="new-password" placeholder="Repeat your password" />
        {!complete && <button className="btn btn--acid" type="submit">UPDATE PASSWORD <span>→</span></button>}
        {(message || errors.form) && <p className={`form-message${complete ? '' : ' form-message--error'}`} role="status">{message || errors.form}</p>}
        {complete && <a className="btn btn--acid" href="/login">SIGN IN NOW <span>→</span></a>}
      </form>
    </AuthLayout></PageShell>
  );
}
