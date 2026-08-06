import { useEffect, useState } from 'react';
import AdminField from '../../components/admin/AdminField';
import AdminLayout from '../../components/admin/AdminLayout';
import AdminPageHeader from '../../components/admin/AdminPageHeader';
import AdminStatusBadge from '../../components/admin/AdminStatusBadge';
import { catalogApi, resolveApiAssetUrl, uploadsApi } from '../../services/api';
import { handleAdminSessionError } from '../../utils/adminSession';

const empty = { name: '', status: 'Active', displayMode: 'Text', logoImage: '', metaTitle: '', metaDescription: '' };

export default function AdminBrandsPage() {
  const [brands, setBrands] = useState([]);
  const [form, setForm] = useState(empty);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const load = async () => {
    try { setBrands(await catalogApi.adminBrands()); setError(''); }
    catch (requestError) { if (!handleAdminSessionError(requestError)) setError(requestError.message || 'Brands could not be loaded.'); }
    finally { setLoading(false); }
  };
  useEffect(() => {
    let active = true;
    catalogApi.adminBrands().then((items) => {
      if (!active) return;
      setBrands(items); setLoading(false);
    }).catch((requestError) => {
      if (!active || handleAdminSessionError(requestError)) return;
      setError(requestError.message || 'Brands could not be loaded.'); setLoading(false);
    });
    return () => { active = false; };
  }, []);
  const update = (event) => setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  const edit = (brand) => {
    setEditingId(brand.id);
    setForm({ name: brand.name, status: brand.status, displayMode: brand.displayMode, logoImage: brand.storageLogoImage, metaTitle: brand.metaTitle, metaDescription: brand.metaDescription });
    setError(''); setMessage('');
  };
  const reset = () => { setEditingId(null); setForm(empty); };
  const submit = async (event) => {
    event.preventDefault(); setBusy(true); setError(''); setMessage('');
    try {
      if (editingId) await catalogApi.updateBrand(editingId, form); else await catalogApi.createBrand(form);
      setMessage(editingId ? 'Brand updated successfully.' : 'Brand created successfully.'); reset(); await load();
    } catch (requestError) { if (!handleAdminSessionError(requestError)) setError(requestError.message || 'Brand could not be saved.'); }
    finally { setBusy(false); }
  };
  const deactivate = async (brand) => {
    setBusy(true); setError('');
    try { await catalogApi.updateBrand(brand.id, { status: brand.status === 'Active' ? 'Inactive' : 'Active' }); await load(); }
    catch (requestError) { if (!handleAdminSessionError(requestError)) setError(requestError.message || 'Brand status could not be changed.'); }
    finally { setBusy(false); }
  };
  const remove = async (brand) => {
    if (!window.confirm(`Delete ${brand.name}?`)) return;
    setBusy(true); setError('');
    try { await catalogApi.deleteBrand(brand.id); setMessage(`${brand.name} was deleted.`); await load(); }
    catch (requestError) { if (!handleAdminSessionError(requestError)) setError(requestError.message || 'Brand could not be deleted.'); }
    finally { setBusy(false); }
  };
  const uploadImage = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    setUploading(true); setError('');
    try {
      const [image] = await uploadsApi.productImages([file]);
      setForm((current) => ({ ...current, displayMode: 'Image', logoImage: image.url }));
      setMessage('Brand image uploaded. Save the brand to apply it.');
    } catch (requestError) {
      if (!handleAdminSessionError(requestError)) setError(requestError.message || 'Brand image could not be uploaded.');
    } finally { setUploading(false); }
  };

  return <AdminLayout title="Brands">
    <AdminPageHeader eyebrow="CATALOG MANAGEMENT" title="BRANDS" copy="Manage storefront brands and their catalogue metadata." />
    <form className="admin-panel admin-form" onSubmit={submit} noValidate>
      {message && <p className="admin-feedback admin-feedback--success">{message}</p>}{error && <p className="admin-feedback admin-feedback--error">{error}</p>}
      <div className="admin-form-grid">
        <AdminField label="BRAND NAME" name="name" value={form.name} onChange={update} required disabled={busy} />
        <AdminField label="STATUS" name="status" value={form.status} onChange={update} as="select" options={['Active', 'Inactive']} disabled={busy} />
        <AdminField label="DISPLAY MODE" name="displayMode" value={form.displayMode} onChange={update} as="select" options={['Text', 'Image']} disabled={busy} />
        <AdminField label="CDN IMAGE URL (OPTIONAL)" name="logoImage" value={form.logoImage} onChange={update} placeholder="https://…" disabled={busy} />
        <AdminField label="META TITLE (OPTIONAL)" name="metaTitle" value={form.metaTitle} onChange={update} disabled={busy} />
        <AdminField label="META DESCRIPTION (OPTIONAL)" name="metaDescription" value={form.metaDescription} onChange={update} as="textarea" disabled={busy} />
      </div>
      <label className={`admin-upload admin-upload--compact${uploading ? ' is-uploading' : ''}`}><input type="file" accept="image/jpeg,image/png,image/webp" onChange={uploadImage} disabled={busy || uploading} /><span>{uploading ? '↻' : '＋'}</span><strong>{uploading ? 'UPLOADING BRAND IMAGE…' : 'UPLOAD BRAND IMAGE'}</strong><small>Optional · JPG, PNG or WebP</small></label>
      {form.logoImage && <div className="admin-brand-preview"><img src={resolveApiAssetUrl(form.logoImage)} alt="Brand preview" /><span>{form.displayMode.toUpperCase()} MODE PREVIEW</span></div>}
      <div className="admin-form-actions"><button className="btn btn--acid" disabled={busy || uploading}>{editingId ? 'SAVE BRAND' : 'CREATE BRAND'}</button>{editingId && <button className="btn btn--ghost" type="button" onClick={reset}>CANCEL</button>}</div>
    </form>
    <section className="admin-panel">{loading ? <div className="admin-data-state">LOADING BRANDS…</div> : <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Brand</th><th>Mode</th><th>Status</th><th>Meta title</th><th>Actions</th></tr></thead><tbody>{brands.map((brand) => <tr key={brand.id}><td data-label="Brand"><strong>{brand.name}</strong></td><td data-label="Mode">{brand.displayMode}</td><td data-label="Status"><AdminStatusBadge tone={brand.status === 'Active' ? 'success' : 'neutral'}>{brand.status}</AdminStatusBadge></td><td data-label="Meta title">{brand.metaTitle || '—'}</td><td data-label="Actions"><div className="admin-actions"><button type="button" onClick={() => edit(brand)}>EDIT</button><button type="button" onClick={() => deactivate(brand)}>{brand.status === 'Active' ? 'DEACTIVATE' : 'ACTIVATE'}</button><button type="button" onClick={() => remove(brand)}>DELETE</button></div></td></tr>)}</tbody></table></div>}</section>
  </AdminLayout>;
}
