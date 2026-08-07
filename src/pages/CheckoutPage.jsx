import { useEffect, useState } from 'react';
import FormField from '../components/account/FormField';
import CheckoutSummary from '../components/checkout/CheckoutSummary';
import PageHero from '../components/PageHero';
import PageShell from '../components/PageShell';
import { getProductById, products } from '../data/products';
import useReveal from '../hooks/useReveal';
import { authApi } from '../services/api';
import { isValidEmail, isValidPhone } from '../utils/validation';

export default function CheckoutPage() {
  useReveal();
  const params = new URLSearchParams(window.location.search);
  const product = getProductById(params.get('product')) || products[0];
  const requestedSize = params.get('size');
  const requestedQuantity = Number(params.get('quantity'));
  const quantity = Number.isInteger(requestedQuantity) && requestedQuantity > 0 ? Math.min(requestedQuantity, 5) : 1;
  const [selectedSize, setSelectedSize] = useState(product.sizes.includes(requestedSize) ? requestedSize : product.sizes[0]);
  const [customer, setCustomer] = useState({ name: '', email: '', phone: '', address: '', city: '', notes: '' });
  const [errors, setErrors] = useState({});
  const [ready, setReady] = useState(false);
  const [accountCustomer, setAccountCustomer] = useState(false);

  useEffect(() => {
    let current = true;
    authApi.profile().then(async (profile) => {
      const addresses = await authApi.addresses();
      if (!current) return;
      const address = addresses.find((item) => item.isDefault) || addresses[0];
      setAccountCustomer(true);
      setCustomer((value) => ({
        ...value, name: profile.name, email: profile.email, phone: profile.phoneNumber || '',
        address: address ? [address.addressLine1, address.addressLine2].filter(Boolean).join(', ') : value.address,
        city: address?.city || value.city,
      }));
    }).catch(() => undefined);
    return () => { current = false; };
  }, []);

  const updateField = (event) => {
    const { name, value } = event.target;
    setCustomer((current) => ({ ...current, [name]: value }));
    setErrors((current) => ({ ...current, [name]: '' }));
    setReady(false);
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    const nextErrors = {};
    if (customer.name.trim().length < 2) nextErrors.name = 'Enter the customer name.';
    if (!isValidEmail(customer.email)) nextErrors.email = 'Enter a valid email address.';
    if (!isValidPhone(customer.phone)) nextErrors.phone = 'Enter a valid phone number.';
    if (customer.address.trim().length < 5) nextErrors.address = 'Enter the delivery address.';
    if (customer.city.trim().length < 2) nextErrors.city = 'Enter the delivery city.';
    setErrors(nextErrors);
    setReady(Object.keys(nextErrors).length === 0);
  };

  const message = `Hi KICKZ.LK, please confirm ${product.name}, size ${selectedSize}, for ${customer.name}. Delivery: ${customer.address}, ${customer.city}. Notes: ${customer.notes || 'None'}.`;
  const whatsappUrl = `https://wa.me/94700000000?text=${encodeURIComponent(message)}`;

  return (
    <PageShell>
      <PageHero kicker="ORDER PREPARATION" title="CHECKOUT" copy="Confirm your pair and customer details before continuing through WhatsApp with the KICKZ.LK team." />
      <section className="checkout-section section-pad">
        <div className="container checkout-layout">
          <form className="checkout-form customer-form" onSubmit={handleSubmit} noValidate>
            <div className="checkout-heading"><span className="section-kicker">{accountCustomer ? 'ACCOUNT CHECKOUT' : 'GUEST CHECKOUT'}</span><h2>DELIVERY DETAILS</h2><p>{accountCustomer ? 'Your customer profile and default saved address have been added. Review them before continuing.' : 'No account is required. Enter your customer and shipping information to continue.'}</p></div>
            <FormField label="FULL NAME" name="name" value={customer.name} onChange={updateField} error={errors.name} autoComplete="name" placeholder="Customer name" />
            <div className="form-row">
              <FormField label="EMAIL ADDRESS" name="email" type="email" value={customer.email} onChange={updateField} error={errors.email} autoComplete="email" placeholder="you@email.com" />
              <FormField label="WHATSAPP / MOBILE NUMBER" name="phone" type="tel" value={customer.phone} onChange={updateField} error={errors.phone} autoComplete="tel" placeholder="+94 7X XXX XXXX" />
            </div>
            <FormField label="DELIVERY ADDRESS" name="address" value={customer.address} onChange={updateField} error={errors.address} autoComplete="street-address" placeholder="Street and delivery address" />
            <FormField label="CITY" name="city" value={customer.city} onChange={updateField} error={errors.city} autoComplete="address-level2" placeholder="City" />
            <label className="form-field"><span>ORDER NOTES</span><textarea name="notes" value={customer.notes} onChange={updateField} placeholder="Sizing, delivery or sourcing notes" rows="4" /></label>
            {!accountCustomer && <aside className="guest-checkout-note"><span>GUEST CHECKOUT</span><p>No account is required. Creating an account later makes saved information, order history and tracking easier to access.</p><a href="/register">VIEW ACCOUNT BENEFITS →</a></aside>}
            <div className="bank-transfer"><span>PAYMENT METHOD</span><strong>BANK TRANSFER</strong><p>Bank transfer details will be shared after today&apos;s final price and product availability are confirmed through WhatsApp.</p></div>
            <div className="checkout-actions">
              <button className="btn btn--acid" type="submit">CONFIRM ORDER <span>→</span></button>
              <a className="btn btn--ghost checkout-whatsapp" href={whatsappUrl} target="_blank" rel="noopener noreferrer">CONTACT VIA WHATSAPP <span>↗</span></a>
            </div>
            {ready && <p className="form-message" role="status">Details reviewed. Use WhatsApp to confirm today&apos;s final price and availability.</p>}
          </form>
          {/* CHECKOUT SUMMARY: remains sticky only on wide screens and follows the form naturally on tablet/mobile. */}
          <CheckoutSummary product={product} selectedSize={selectedSize} quantity={quantity} setSelectedSize={(size) => { setSelectedSize(size); setReady(false); }} />
        </div>
      </section>
    </PageShell>
  );
}
