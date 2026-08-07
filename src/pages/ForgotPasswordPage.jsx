import { useState } from 'react';
import AuthLayout from '../components/account/AuthLayout';
import FormField from '../components/account/FormField';
import PageShell from '../components/PageShell';
import useReveal from '../hooks/useReveal';
import { authApi } from '../services/api';
import { isValidEmail } from '../utils/validation';

export default function ForgotPasswordPage() {
  useReveal();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    if (!isValidEmail(email)) return setError('Enter a valid email address.');
    setSubmitting(true); setError('');
    try { setResult(await authApi.forgotPassword(email)); } catch (requestError) { setError(requestError.message); }
    finally { setSubmitting(false); }
  };

  return (
    <PageShell><AuthLayout kicker="ACCOUNT RECOVERY" title="RESET ACCESS." copy="Request a secure, time-limited link to restore access to your KICKZ.LK account." footer={<p className="auth-switch">REMEMBERED IT? <a href="/login">BACK TO SIGN IN →</a></p>}>
      <form className="customer-form" onSubmit={submit} noValidate>
        <FormField label="EMAIL ADDRESS" name="email" type="email" value={email} onChange={(event) => { setEmail(event.target.value); setError(''); }} error={error} autoComplete="email" placeholder="you@email.com" />
        <button className="btn btn--acid" disabled={submitting} type="submit">{submitting ? 'PREPARING…' : 'REQUEST RESET LINK'} <span>→</span></button>
        {result && <p className="form-message" role="status">{result.message}</p>}
        {result?.resetToken && <a className="btn btn--ghost" href={`/reset-password?token=${encodeURIComponent(result.resetToken)}`}>OPEN DEVELOPMENT RESET LINK</a>}
      </form>
    </AuthLayout></PageShell>
  );
}
