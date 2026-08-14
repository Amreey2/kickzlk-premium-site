import { useEffect, useMemo, useState } from 'react';
import FormField from '../components/account/FormField';
import BankTransferModal from '../components/checkout/BankTransferModal';
import CheckoutSummary from '../components/checkout/CheckoutSummary';
import PaymentOptionSelector from '../components/checkout/PaymentOptionSelector';
import PageHero from '../components/PageHero';
import PageShell from '../components/PageShell';
import ProductCollectionState from '../components/ProductCollectionState';
import { useProducts } from '../hooks/useProducts';
import useReveal from '../hooks/useReveal';
import { authApi, ordersApi, settingsApi } from '../services/api';
import { clearCart, readCart } from '../utils/cart';
import { isValidEmail, isValidPhone } from '../utils/validation';
import { normalizePaymentOption, readPaymentOption, writePaymentOption } from '../utils/paymentOption';

const initialCustomer = { name: '', email: '', phone: '', address: '', city: '', notes: '' };
const orderKey = () => sessionStorage.getItem('kickz_order_key') || (() => { const key = crypto.randomUUID().replaceAll('-', ''); sessionStorage.setItem('kickz_order_key', key); return key; })();

export default function CheckoutPage() {
  useReveal();
  const catalog = useProducts();
  const params = useMemo(() => new URLSearchParams(window.location.search), []);
  const items = useMemo(() => params.get('product') && params.get('size') ? [{ productId: params.get('product'), selectedSize: params.get('size'), selectedColor: params.get('color') || '', quantity: Number(params.get('quantity')) || 1 }] : readCart(), [params]);
  const entries = items.map((item) => ({ item, product: catalog.products.find((product) => product.id === item.productId) })).filter((entry) => entry.product);
  const requestItems = entries.map(({ item }) => ({ productId: item.productId, selectedSize: item.selectedSize, selectedColor: item.selectedColor, quantity: item.quantity }));
  const couponCode = sessionStorage.getItem('kickz_coupon') || '';
  const [paymentOption, setPaymentOption] = useState(() => normalizePaymentOption(params.get('paymentOption') || readPaymentOption()));
  const [customer, setCustomer] = useState(initialCustomer); const [errors, setErrors] = useState({});
  const [accountCustomer, setAccountCustomer] = useState(false); const [addresses, setAddresses] = useState([]); const [selectedAddress, setSelectedAddress] = useState('');
  const [quote, setQuote] = useState(null); const [settings, setSettings] = useState(null); const [bankOpen, setBankOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false); const [message, setMessage] = useState('');

  useEffect(() => { settingsApi.paymentSettings().then(setSettings).catch((error) => setMessage(error.message)); }, []);
  useEffect(() => { if (!requestItems.length) return undefined; let active = true; ordersApi.quote({ items: requestItems, couponCode, paymentOption, email: customer.email }).then((value) => { if (active) setQuote(value); }).catch((error) => { if (active) setMessage(error.message); }); return () => { active = false; }; },  [couponCode, paymentOption, customer.email, JSON.stringify(requestItems)]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    let active = true;
    authApi.session().then(async (session) => {
      if (!session.authenticated) {
        if (params.get('guest') !== '1') window.location.assign(`/checkout/start?next=${encodeURIComponent(`${window.location.pathname}${window.location.search}`)}`);
        return;
      }
      const profile = await authApi.profile();
      const saved = await authApi.addresses(); if (!active) return;
      setAccountCustomer(true); setAddresses(saved);
      const address = saved.find((item) => item.isDefault) || saved[0];
      setSelectedAddress(address ? String(address.id) : '');
      setCustomer({ ...initialCustomer, name: profile.name, email: profile.email, phone: profile.phoneNumber || '', address: address ? [address.addressLine1, address.addressLine2].filter(Boolean).join(', ') : '', city: address?.city || '' });
    }).catch(() => undefined);
    return () => { active = false; };
  }, [params]);
  const changePayment = (value) => { const option = writePaymentOption(value); setPaymentOption(option); };
  const updateField = (event) => { const { name, value } = event.target; setCustomer((current) => ({ ...current, [name]: value })); setErrors((current) => ({ ...current, [name]: '' })); };
  const chooseAddress = (event) => { const id = event.target.value; setSelectedAddress(id); const address = addresses.find((item) => String(item.id) === id); if (address) setCustomer((value) => ({ ...value, name: address.fullName || value.name, phone: address.phoneNumber || value.phone, address: [address.addressLine1, address.addressLine2].filter(Boolean).join(', '), city: address.city })); };
  const placeOrder = async (event) => { event.preventDefault(); const next = {}; if (customer.name.trim().length < 2) next.name = 'Enter the customer name.'; if (!isValidEmail(customer.email)) next.email = 'Enter a valid email address.'; if (!isValidPhone(customer.phone)) next.phone = 'Enter a valid phone number.'; if (customer.address.trim().length < 5) next.address = 'Enter the delivery address.'; if (customer.city.trim().length < 2) next.city = 'Enter the delivery city.'; setErrors(next); if (Object.keys(next).length || !quote) return; setSubmitting(true); setMessage(''); try { const order = await ordersApi.create({ customerName: customer.name, email: customer.email, phoneNumber: customer.phone, shippingAddress: customer.address, shippingCity: customer.city, orderNotes: customer.notes, items: requestItems, couponCode, paymentOption, idempotencyKey: orderKey() }); sessionStorage.setItem('kickz_last_order', JSON.stringify(order)); sessionStorage.removeItem('kickz_order_key'); sessionStorage.removeItem('kickz_coupon'); clearCart(); window.location.assign(`/order-confirmation?order=${encodeURIComponent(order.order_number)}`); } catch (error) { setMessage(error.message); setSubmitting(false); } };

  if (!catalog.loading && !entries.length) return <PageShell><PageHero kicker="CHECKOUT" title="YOUR CART IS EMPTY" copy="Add a pair before starting checkout." /><section className="empty-state section-pad"><a className="btn btn--acid" href="/shop">CONTINUE SHOPPING</a></section></PageShell>;
  return <PageShell><PageHero kicker="SECURE ORDER" title="CHECKOUT" copy="Confirm delivery details, payment amounts and your bank-transfer reference." /><section className="checkout-section section-pad"><div className="container checkout-layout"><form className="checkout-form customer-form" onSubmit={placeOrder} noValidate><div className="checkout-heading"><span className="section-kicker">{accountCustomer ? 'ACCOUNT CHECKOUT' : 'GUEST CHECKOUT'}</span><h2>DELIVERY DETAILS</h2><p>{accountCustomer ? 'Your profile is ready. Select a saved address or update these checkout details.' : 'No account is required. Enter your shipping information to continue.'}</p></div>
    {accountCustomer && addresses.length > 0 && <label className="form-field"><span>SAVED ADDRESS</span><select value={selectedAddress} onChange={chooseAddress}>{addresses.map((address) => <option value={address.id} key={address.id}>{address.label} — {address.city}{address.isDefault ? ' (Default)' : ''}</option>)}</select></label>}
    <FormField label="FULL NAME" name="name" value={customer.name} onChange={updateField} error={errors.name} autoComplete="name" /><div className="form-row"><FormField label="EMAIL ADDRESS" name="email" type="email" value={customer.email} onChange={updateField} error={errors.email} autoComplete="email" /><FormField label="WHATSAPP / PHONE" name="phone" type="tel" value={customer.phone} onChange={updateField} error={errors.phone} autoComplete="tel" /></div><FormField label="SHIPPING ADDRESS" name="address" value={customer.address} onChange={updateField} error={errors.address} autoComplete="street-address" /><FormField label="CITY" name="city" value={customer.city} onChange={updateField} error={errors.city} autoComplete="address-level2" /><label className="form-field"><span>ORDER NOTES</span><textarea name="notes" value={customer.notes} onChange={updateField} rows="3" /></label>
    {!accountCustomer && <aside className="guest-checkout-note"><span>GUEST CHECKOUT</span><p>Your order number will remain available for secure tracking after confirmation.</p><a href="/login?next=%2Fcheckout">LOGIN INSTEAD →</a></aside>}
    <PaymentOptionSelector value={paymentOption} onChange={changePayment} quote={quote} />
    <button className="bank-transfer" type="button" onClick={() => setBankOpen(true)}><span>PAYMENT METHOD</span><strong>{settings?.methodName || 'BANK TRANSFER'}</strong><p>View bank details, transfer instructions and copyable account information.</p><i>VIEW DETAILS ↗</i></button>
    <button className="btn btn--acid" type="submit" disabled={submitting || !quote}>{submitting ? 'PLACING ORDER…' : 'PLACE ORDER'} <span>→</span></button>{message && <p className="form-message form-message--error" role="alert">{message}</p>}</form><ProductCollectionState loading={catalog.loading} error={catalog.error} /><CheckoutSummary entries={entries} quote={quote} /></div></section><BankTransferModal open={bankOpen} settings={settings || {}} onClose={() => setBankOpen(false)} /></PageShell>;
}
