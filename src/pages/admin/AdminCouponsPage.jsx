import { useEffect, useMemo, useState } from 'react';
import AdminField from '../../components/admin/AdminField';
import AdminLayout from '../../components/admin/AdminLayout';
import AdminPageHeader from '../../components/admin/AdminPageHeader';
import AdminStatusBadge from '../../components/admin/AdminStatusBadge';
import { catalogApi, couponsApi, productsApi } from '../../services/api';
import { handleAdminSessionError } from '../../utils/adminSession';
import { formatProductPrice } from '../../utils/productPresentation';

const blank = { code: '', name: '', description: '', discountType: 'Percentage', discountValue: '', status: 'Active',
  appliesTo: 'store', minimumOrderAmount: '', totalUsageLimit: '', perCustomerLimit: '', startsAt: '', expiresAt: '',
  productIds: [], categoryIds: [] };
const localDate = (value) => value ? String(value).slice(0, 16) : '';
const formatDiscount = (coupon) => coupon.discountType === 'Percentage' ? `${coupon.discountValue}%` : formatProductPrice(coupon.discountValue);
const appliesLabel = (coupon) => coupon.appliesTo === 'store' ? 'Entire store' : coupon.appliesTo === 'products' ? `${coupon.productIds.length} product(s)` : `${coupon.categoryIds.length} category(s)`;

export default function AdminCouponsPage() {
  const [coupons, setCoupons] = useState([]); const [products, setProducts] = useState([]); const [categories, setCategories] = useState([]);
  const [form, setForm] = useState(blank); const [editingId, setEditingId] = useState(null); const [search, setSearch] = useState('');
  const [targetSearch, setTargetSearch] = useState('');
  const [status, setStatus] = useState(''); const [busy, setBusy] = useState(false); const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState(''); const [error, setError] = useState('');

  const load = async () => {
    try {
      productsApi.clearCache();
      const [couponData, productData, categoryData] = await Promise.all([couponsApi.adminList(), productsApi.adminList(), catalogApi.adminCategories()]);
      setCoupons(couponData); setProducts(productData); setCategories(categoryData); setError('');
    } catch (requestError) { if (!handleAdminSessionError(requestError)) setError(requestError.message); }
    finally { setLoading(false); }
  };
  useEffect(() => {
    let active = true;
    productsApi.clearCache();
    Promise.all([couponsApi.adminList(), productsApi.adminList(), catalogApi.adminCategories()]).then(([couponData, productData, categoryData]) => {
      if (!active) return; setCoupons(couponData); setProducts(productData); setCategories(categoryData); setLoading(false);
    }).catch((requestError) => { if (active && !handleAdminSessionError(requestError)) { setError(requestError.message); setLoading(false); } });
    return () => { active = false; };
  }, []);
  const update = (event) => setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  const reset = () => { setEditingId(null); setForm(blank); };
  const edit = (coupon) => {
    setEditingId(coupon.id);
    setForm({ ...coupon, startsAt: localDate(coupon.startsAt), expiresAt: localDate(coupon.expiresAt),
      totalUsageLimit: coupon.totalUsageLimit ?? '', perCustomerLimit: coupon.perCustomerLimit ?? '',
      minimumOrderAmount: coupon.minimumOrderAmount || '', productIds: coupon.productIds || [], categoryIds: coupon.categoryIds || [] });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  const toggleTarget = (field, id) => setForm((current) => ({ ...current, [field]: current[field].includes(id) ? current[field].filter((value) => value !== id) : [...current[field], id] }));
  const submit = async (event) => {
    event.preventDefault(); setBusy(true); setError(''); setMessage('');
    try {
      if (editingId) await couponsApi.update(editingId, form); else await couponsApi.create(form);
      setMessage(editingId ? 'Coupon updated.' : 'Coupon created.'); reset(); await load();
    } catch (requestError) { if (!handleAdminSessionError(requestError)) setError(requestError.message); }
    finally { setBusy(false); }
  };
  const toggleStatus = async (coupon) => {
    setBusy(true); setError(''); try { await couponsApi.update(coupon.id, { ...coupon, status: coupon.status === 'Active' ? 'Inactive' : 'Active' }); await load(); }
    catch (requestError) { if (!handleAdminSessionError(requestError)) setError(requestError.message); } finally { setBusy(false); }
  };
  const archive = async (coupon) => {
    if (!window.confirm(`Archive ${coupon.code}? Historical order data will be retained.`)) return;
    setBusy(true); setError(''); try { await couponsApi.archive(coupon.id); setMessage('Coupon archived.'); await load(); }
    catch (requestError) { if (!handleAdminSessionError(requestError)) setError(requestError.message); } finally { setBusy(false); }
  };
  const visible = useMemo(() => coupons.filter((coupon) => {
    const term = search.trim().toLowerCase();
    return (!term || `${coupon.code} ${coupon.name}`.toLowerCase().includes(term)) && (!status || coupon.effectiveStatus === status);
  }), [coupons, search, status]);
  const visibleTargetProducts = useMemo(() => {
    const term = targetSearch.trim().toLowerCase();
    if (!term) return products;
    return products.filter((product) => `${product.name} ${product.brand} ${product.sku}`.toLowerCase().includes(term));
  }, [products, targetSearch]);

  return <AdminLayout title="Coupons & Promotions">
    <AdminPageHeader eyebrow="PROMOTION MANAGEMENT" title="COUPONS" copy="Create controlled promotions with server-validated targeting and usage limits." />
    {message && <p className="admin-feedback admin-feedback--success">{message}</p>}{error && <p className="admin-feedback admin-feedback--error">{error}</p>}
    <form className="admin-panel admin-form coupon-admin-form" onSubmit={submit}>
      <section><div className="admin-form-section__head"><span>01</span><div><strong>BASIC</strong><p>Customer code and internal description.</p></div></div><div className="admin-form-grid"><AdminField label="COUPON CODE" name="code" value={form.code} onChange={update} required disabled={busy} /><AdminField label="INTERNAL NAME" name="name" value={form.name} onChange={update} required disabled={busy} /><AdminField label="DESCRIPTION" name="description" value={form.description} onChange={update} as="textarea" required={false} disabled={busy} /><AdminField label="STATUS" name="status" value={form.status} onChange={update} as="select" options={['Active', 'Inactive']} disabled={busy} /></div></section>
      <section><div className="admin-form-section__head"><span>02</span><div><strong>DISCOUNT & VALIDITY</strong><p>Discount value, active window and minimum eligible amount.</p></div></div><div className="admin-form-grid"><AdminField label="DISCOUNT TYPE" name="discountType" value={form.discountType} onChange={update} as="select" options={['Percentage', 'Fixed']} disabled={busy} /><AdminField label={form.discountType === 'Percentage' ? 'PERCENTAGE' : 'FIXED LKR AMOUNT'} name="discountValue" value={form.discountValue} onChange={update} type="number" required disabled={busy} /><AdminField label="MINIMUM ELIGIBLE ORDER" name="minimumOrderAmount" value={form.minimumOrderAmount} onChange={update} type="number" required={false} disabled={busy} /><AdminField label="START DATE / TIME (OPTIONAL)" name="startsAt" value={form.startsAt} onChange={update} type="datetime-local" required={false} disabled={busy} /><AdminField label="EXPIRY DATE / TIME (OPTIONAL)" name="expiresAt" value={form.expiresAt} onChange={update} type="datetime-local" required={false} disabled={busy} /></div></section>
      <section><div className="admin-form-section__head"><span>03</span><div><strong>RESTRICTIONS</strong><p>Limit the eligible subtotal to the entire store, products, or categories.</p></div></div><div className="admin-form-grid"><AdminField label="APPLIES TO" name="appliesTo" value={form.appliesTo} onChange={update} as="select" options={['store', 'products', 'categories']} disabled={busy} /><AdminField label="TOTAL USAGE LIMIT (OPTIONAL)" name="totalUsageLimit" value={form.totalUsageLimit} onChange={update} type="number" required={false} disabled={busy} /><AdminField label="PER-CUSTOMER LIMIT (OPTIONAL)" name="perCustomerLimit" value={form.perCustomerLimit} onChange={update} type="number" required={false} disabled={busy} /></div>
        {form.appliesTo === 'products' && <><label className="coupon-target-search"><span>SEARCH TARGET PRODUCTS</span><input value={targetSearch} onChange={(event) => setTargetSearch(event.target.value)} placeholder="Search by product name, brand or SKU..." /></label><div className="coupon-target-grid">{visibleTargetProducts.map((product) => <label key={product.id}><input type="checkbox" checked={form.productIds.includes(product.databaseId)} onChange={() => toggleTarget('productIds', product.databaseId)} /><span><strong>{product.name}</strong><small>{product.brand} · {product.sku}</small></span></label>)}</div></>}
        {form.appliesTo === 'categories' && <div className="coupon-target-grid">{categories.map((category) => <label key={category.id}><input type="checkbox" checked={form.categoryIds.includes(category.id)} onChange={() => toggleTarget('categoryIds', category.id)} /><span><strong>{category.name}</strong><small>{category.status}</small></span></label>)}</div>}
      </section>
      <div className="admin-form-actions"><button className="btn btn--acid" disabled={busy}>{editingId ? 'SAVE COUPON' : 'CREATE COUPON'}</button>{editingId && <button className="btn btn--ghost" type="button" onClick={reset}>CANCEL</button>}</div>
    </form>
    <section className="admin-panel"><div className="coupon-admin-tools"><label className="admin-management-search"><span>SEARCH COUPONS</span><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search by code or name..." /></label><label><span>STATUS</span><select value={status} onChange={(event) => setStatus(event.target.value)}><option value="">All statuses</option><option>Active</option><option>Inactive</option><option>Expired</option></select></label><strong>Showing {visible.length} of {coupons.length}</strong></div>
      {loading ? <div className="admin-data-state">LOADING COUPONS…</div> : <div className="admin-table-wrap"><table className="admin-table coupon-admin-table"><thead><tr><th>Coupon</th><th>Discount</th><th>Applies to</th><th>Minimum</th><th>Usage</th><th>Expiry</th><th>Status</th><th>Actions</th></tr></thead><tbody>{visible.map((coupon) => <tr key={coupon.id}><td data-label="Coupon"><strong>{coupon.code}</strong><small>{coupon.name}</small></td><td data-label="Discount">{formatDiscount(coupon)}</td><td data-label="Applies to">{appliesLabel(coupon)}</td><td data-label="Minimum">{coupon.minimumOrderAmount ? formatProductPrice(coupon.minimumOrderAmount) : 'None'}</td><td data-label="Usage">{coupon.usageCount} / {coupon.totalUsageLimit ?? '∞'}</td><td data-label="Expiry">{coupon.expiresAt ? new Date(coupon.expiresAt).toLocaleDateString('en-LK') : 'No expiry'}</td><td data-label="Status"><AdminStatusBadge tone={coupon.effectiveStatus === 'Active' ? 'success' : coupon.effectiveStatus === 'Expired' ? 'warning' : 'neutral'}>{coupon.effectiveStatus}</AdminStatusBadge></td><td data-label="Actions"><div className="admin-actions"><button type="button" onClick={() => edit(coupon)}>EDIT</button><button type="button" disabled={busy || coupon.effectiveStatus === 'Expired'} onClick={() => toggleStatus(coupon)}>{coupon.status === 'Active' ? 'DEACTIVATE' : 'ACTIVATE'}</button><button type="button" disabled={busy} onClick={() => archive(coupon)}>ARCHIVE</button></div></td></tr>)}</tbody></table></div>}
    </section>
  </AdminLayout>;
}
