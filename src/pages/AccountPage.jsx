import { useEffect, useState } from 'react';
import FormField from '../components/account/FormField';
import PageHero from '../components/PageHero';
import PageShell from '../components/PageShell';
import useReveal from '../hooks/useReveal';
import { authApi, ordersApi } from '../services/api';
import { isValidEmail, isValidPhone } from '../utils/validation';

const emptyAddress = (profile = {}) => ({
  label: 'Home', fullName: profile.name || '', phoneNumber: profile.phoneNumber || '',
  addressLine1: '', addressLine2: '', city: '', postalCode: '', country: 'Sri Lanka', isDefault: false,
});
const initials = (name = '') => name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join('').toUpperCase() || 'KZ';
const money = (value) => `LKR ${Number(value || 0).toLocaleString('en-LK')}`;

export default function AccountPage() {
  useReveal();
  const [profile, setProfile] = useState(null);
  const [profileForm, setProfileForm] = useState({ name: '', email: '', phoneNumber: '' });
  const [addresses, setAddresses] = useState([]);
  const [orders, setOrders] = useState([]);
  const [editingProfile, setEditingProfile] = useState(false);
  const [addressForm, setAddressForm] = useState(null);
  const [editingAddressId, setEditingAddressId] = useState(null);
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let current = true;
    authApi.profile().then(async (customer) => {
      const [savedAddresses, customerOrders] = await Promise.all([authApi.addresses(), ordersApi.forUser(customer.id)]);
      if (!current) return;
      setProfile(customer); setProfileForm(customer); setAddresses(savedAddresses); setOrders(customerOrders);
    }).catch((error) => {
      if (error.status === 401) window.location.assign('/login?next=%2Faccount');
      else if (current) setMessage(error.message);
    }).finally(() => { if (current) setLoading(false); });
    return () => { current = false; };
  }, []);

  const saveProfile = async (event) => {
    event.preventDefault();
    const next = {};
    if (profileForm.name.trim().length < 2) next.name = 'Enter your full name.';
    if (!isValidEmail(profileForm.email)) next.email = 'Enter a valid email address.';
    if (!isValidPhone(profileForm.phoneNumber)) next.phoneNumber = 'Enter a valid phone number.';
    setErrors(next); if (Object.keys(next).length) return;
    setSaving(true); setMessage('');
    try { const updated = await authApi.updateProfile(profileForm); setProfile(updated); setProfileForm(updated); setEditingProfile(false); setMessage('Profile updated.'); }
    catch (error) { setMessage(error.message); } finally { setSaving(false); }
  };

  const openAddress = (address = null) => {
    setEditingAddressId(address?.id || null);
    setAddressForm(address ? { ...address } : emptyAddress(profile));
    setErrors({}); setMessage('');
  };

  const saveAddress = async (event) => {
    event.preventDefault();
    const next = {};
    if (!addressForm.label.trim()) next.label = 'Add a short label.';
    if (addressForm.fullName.trim().length < 2) next.fullName = 'Enter the recipient name.';
    if (!isValidPhone(addressForm.phoneNumber)) next.phoneNumber = 'Enter a valid phone number.';
    if (addressForm.addressLine1.trim().length < 5) next.addressLine1 = 'Enter the street address.';
    if (addressForm.city.trim().length < 2) next.city = 'Enter the city.';
    setErrors(next); if (Object.keys(next).length) return;
    setSaving(true);
    try {
      if (editingAddressId) await authApi.updateAddress(editingAddressId, addressForm);
      else await authApi.createAddress(addressForm);
      setAddresses(await authApi.addresses()); setAddressForm(null); setEditingAddressId(null); setMessage('Saved address updated.');
    } catch (error) { setMessage(error.message); } finally { setSaving(false); }
  };

  const removeAddress = async (id) => {
    setSaving(true); setMessage('');
    try { await authApi.deleteAddress(id); setAddresses(await authApi.addresses()); setMessage('Address removed.'); }
    catch (error) { setMessage(error.message); } finally { setSaving(false); }
  };

  const logout = async () => { await authApi.logout(); window.location.assign('/'); };

  return (
    <PageShell>
      <PageHero kicker="CUSTOMER PROFILE" title="MY ACCOUNT" copy="Manage your profile, saved delivery details and KICKZ.LK order journey." />
      <section className="account-section section-pad"><div className="container account-layout">
        <aside className="profile-card reveal">
          <span className="profile-avatar">{initials(profile?.name)}</span><span className="section-kicker">PROFILE</span>
          <h2>{loading ? 'LOADING…' : profile?.name || 'CUSTOMER'}</h2>
          {profile && <dl><div><dt>Email</dt><dd>{profile.email}</dd></div><div><dt>Phone</dt><dd>{profile.phoneNumber}</dd></div><div><dt>Saved addresses</dt><dd>{addresses.length} / 2</dd></div></dl>}
          <button className="btn btn--ghost" type="button" onClick={() => setEditingProfile((value) => !value)} disabled={!profile}>EDIT PROFILE</button>
          <button className="account-logout" type="button" onClick={logout}>SIGN OUT →</button>
        </aside>
        <div className="account-content">
          {message && <p className={`form-message${message.includes('updated') || message.includes('removed') ? '' : ' form-message--error'}`} role="status">{message}</p>}
          {editingProfile && <section className="account-panel"><div className="account-heading"><span className="section-kicker">PERSONAL DETAILS</span><h2>EDIT PROFILE</h2></div>
            <form className="customer-form" onSubmit={saveProfile} noValidate>
              <FormField label="FULL NAME" name="name" value={profileForm.name} onChange={(event) => setProfileForm((value) => ({ ...value, name: event.target.value }))} error={errors.name} autoComplete="name" />
              <div className="form-row"><FormField label="EMAIL ADDRESS" name="email" type="email" value={profileForm.email} onChange={(event) => setProfileForm((value) => ({ ...value, email: event.target.value }))} error={errors.email} autoComplete="email" /><FormField label="PHONE NUMBER" name="phoneNumber" type="tel" value={profileForm.phoneNumber || ''} onChange={(event) => setProfileForm((value) => ({ ...value, phoneNumber: event.target.value }))} error={errors.phoneNumber} autoComplete="tel" /></div>
              <div className="account-form-actions"><button className="btn btn--acid" disabled={saving}>SAVE PROFILE</button><button className="btn btn--ghost" type="button" onClick={() => setEditingProfile(false)}>CANCEL</button></div>
            </form>
          </section>}

          <section className="account-panel"><div className="account-panel__head"><div className="account-heading"><span className="section-kicker">DELIVERY DETAILS</span><h2>SAVED ADDRESSES</h2></div>{addresses.length < 2 && !addressForm && <button className="btn btn--ghost" type="button" onClick={() => openAddress()}>ADD ADDRESS</button>}</div>
            <div className="address-grid">{addresses.map((address) => <article className="address-card" key={address.id}><div><span>{address.label}</span>{address.isDefault && <strong>DEFAULT</strong>}</div><h3>{address.fullName}</h3><p>{address.addressLine1}{address.addressLine2 ? `, ${address.addressLine2}` : ''}<br />{address.city}{address.postalCode ? ` ${address.postalCode}` : ''}<br />{address.country}<br />{address.phoneNumber}</p><footer><button type="button" onClick={() => openAddress(address)}>EDIT</button><button type="button" onClick={() => removeAddress(address.id)} disabled={saving}>DELETE</button></footer></article>)}</div>
            {!loading && !addresses.length && !addressForm && <p className="account-empty">No saved addresses yet. Add one now for future checkout autofill.</p>}
            {addressForm && <form className="customer-form address-form" onSubmit={saveAddress} noValidate>
              <div className="form-row"><FormField label="ADDRESS LABEL" name="label" value={addressForm.label} onChange={(event) => setAddressForm((value) => ({ ...value, label: event.target.value }))} error={errors.label} placeholder="Home or Work" /><FormField label="RECIPIENT NAME" name="fullName" value={addressForm.fullName} onChange={(event) => setAddressForm((value) => ({ ...value, fullName: event.target.value }))} error={errors.fullName} autoComplete="name" /></div>
              <FormField label="PHONE NUMBER" name="phoneNumber" type="tel" value={addressForm.phoneNumber} onChange={(event) => setAddressForm((value) => ({ ...value, phoneNumber: event.target.value }))} error={errors.phoneNumber} autoComplete="tel" />
              <FormField label="ADDRESS LINE 1" name="addressLine1" value={addressForm.addressLine1} onChange={(event) => setAddressForm((value) => ({ ...value, addressLine1: event.target.value }))} error={errors.addressLine1} autoComplete="address-line1" />
              <FormField label="ADDRESS LINE 2 (OPTIONAL)" name="addressLine2" value={addressForm.addressLine2} onChange={(event) => setAddressForm((value) => ({ ...value, addressLine2: event.target.value }))} required={false} autoComplete="address-line2" />
              <div className="form-row"><FormField label="CITY" name="city" value={addressForm.city} onChange={(event) => setAddressForm((value) => ({ ...value, city: event.target.value }))} error={errors.city} autoComplete="address-level2" /><FormField label="POSTAL CODE (OPTIONAL)" name="postalCode" value={addressForm.postalCode} onChange={(event) => setAddressForm((value) => ({ ...value, postalCode: event.target.value }))} required={false} autoComplete="postal-code" /></div>
              <label className="account-check"><input type="checkbox" checked={addressForm.isDefault} onChange={(event) => setAddressForm((value) => ({ ...value, isDefault: event.target.checked }))} /><span>Use as default address</span></label>
              <div className="account-form-actions"><button className="btn btn--acid" disabled={saving}>SAVE ADDRESS</button><button className="btn btn--ghost" type="button" onClick={() => setAddressForm(null)}>CANCEL</button></div>
            </form>}
          </section>

          <section className="account-panel"><div className="account-heading"><span className="section-kicker">ORDER HISTORY</span><h2>YOUR ROTATION</h2></div>
            <div className="account-orders">{orders.map((order) => <article key={order.id}><div><span>ORDER</span><strong>{order.order_number}</strong></div><div><span>PLACED</span><strong>{new Date(order.created_at).toLocaleDateString('en-LK')}</strong></div><div><span>TOTAL</span><strong>{money(order.total_amount)}</strong></div><em>{order.order_status}</em></article>)}</div>
            {!loading && !orders.length && <p className="account-empty">No account orders yet. Guest checkout remains available whenever you need it.</p>}
          </section>
        </div>
      </div></section>
    </PageShell>
  );
}
