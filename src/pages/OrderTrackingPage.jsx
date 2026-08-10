import { useEffect, useState } from 'react';
import BankTransferModal from '../components/checkout/BankTransferModal';
import OrderDetails from '../components/checkout/OrderDetails';
import PageHero from '../components/PageHero';
import PageShell from '../components/PageShell';
import useReveal from '../hooks/useReveal';
import { authApi, ordersApi, settingsApi } from '../services/api';

export default function OrderTrackingPage() {
  useReveal();
  const query = new URLSearchParams(window.location.search);
  const initialOrder = query.get('order') || query.get('reference') || '';
  const storedGuest = (() => { try { return JSON.parse(sessionStorage.getItem('kickz_guest_tracking') || 'null'); } catch { return null; } })();
  const [reference, setReference] = useState(initialOrder);
  const [email, setEmail] = useState(() => storedGuest?.orderNumber === initialOrder ? storedGuest.email : '');
  const [order, setOrder] = useState(null);
  const [settings, setSettings] = useState(null);
  const [bankOpen, setBankOpen] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(Boolean(initialOrder));

  useEffect(() => { settingsApi.paymentSettings().then(setSettings).catch(() => undefined); }, []);
  useEffect(() => {
    let active = true;
    authApi.session().then(async (session) => {
      if (!active) return;
      setAuthenticated(session.authenticated);
      if (session.authenticated && initialOrder) {
        try { setOrder(await ordersApi.get(initialOrder)); } catch (requestError) { setError(requestError.message); }
      } else if (!session.authenticated && initialOrder && storedGuest?.orderNumber === initialOrder && storedGuest.email) {
        try { setOrder(await ordersApi.get(initialOrder, { email: storedGuest.email })); } catch (requestError) { setError(requestError.message); }
      }
    }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [initialOrder, storedGuest?.email, storedGuest?.orderNumber]);

  const submit = async (event) => {
    event.preventDefault(); setError(''); setLoading(true);
    try { setOrder(await ordersApi.get(reference.trim(), authenticated ? {} : { email: email.trim() })); }
    catch (requestError) { setOrder(null); setError(requestError.message); }
    finally { setLoading(false); }
  };

  return <PageShell><PageHero kicker="ORDER LOOKUP" title="FIND YOUR KICKZ" copy="Track an order securely with its KZ order number and checkout email." />
    <section className="tracking-section section-pad"><div className={`container tracking-layout${order ? ' has-result' : ''}`}>
      <form className="tracking-form" onSubmit={submit}><span className="section-kicker">SECURE ORDER LOOKUP</span><h2>TRACK YOUR ORDER</h2>
        <label><span>ORDER NUMBER</span><input required value={reference} onChange={(event) => setReference(event.target.value)} placeholder="KZ-00001" /></label>
        {!authenticated && <label><span>CHECKOUT EMAIL</span><input required type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@email.com" /></label>}
        {authenticated && <p className="tracking-auth-note">Signed-in lookup uses your secure customer account.</p>}
        {error && <p className="form-message form-message--error" role="alert">{error}</p>}
        <button className="btn btn--acid" disabled={loading}>{loading ? 'LOOKING UP…' : 'TRACK ORDER'} <span>→</span></button>
      </form>
      {order ? <OrderDetails order={order} onViewBank={() => setBankOpen(true)} /> : <aside className="tracking-placeholder"><span>01</span><h2>YOUR JOURNEY, CLEARLY TRACKED</h2><p>Guest orders require both the exact order number and matching checkout email. Signed-in customers can open their own orders directly from My Account.</p></aside>}
    </div></section><BankTransferModal open={bankOpen} settings={settings || {}} onClose={() => setBankOpen(false)} />
  </PageShell>;
}
