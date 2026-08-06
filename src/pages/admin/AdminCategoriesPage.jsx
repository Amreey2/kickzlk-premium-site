import { useEffect, useState } from 'react';
import AdminField from '../../components/admin/AdminField';
import AdminLayout from '../../components/admin/AdminLayout';
import AdminPageHeader from '../../components/admin/AdminPageHeader';
import AdminStatusBadge from '../../components/admin/AdminStatusBadge';
import { catalogApi } from '../../services/api';
import { handleAdminSessionError } from '../../utils/adminSession';

const empty = { name: '', status: 'Active', image: '', metaTitle: '', metaDescription: '', type: '', gender: '', collection: '' };
const kinds = [['type', 'TYPE'], ['gender', 'GENDER'], ['collection', 'COLLECTION']];

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState([]); const [options, setOptions] = useState([]);
  const [form, setForm] = useState(empty); const [editingId, setEditingId] = useState(null);
  const [newOption, setNewOption] = useState({ kind: 'type', value: '' });
  const [busy, setBusy] = useState(false); const [loading, setLoading] = useState(true);
  const [error, setError] = useState(''); const [message, setMessage] = useState('');
  const load = async () => {
    try { const [items, values] = await Promise.all([catalogApi.adminCategories(), catalogApi.adminOptions()]); setCategories(items); setOptions(values); setError(''); }
    catch (requestError) { if (!handleAdminSessionError(requestError)) setError(requestError.message || 'Categories could not be loaded.'); }
    finally { setLoading(false); }
  };
  useEffect(() => {
    let active = true;
    Promise.all([catalogApi.adminCategories(), catalogApi.adminOptions()]).then(([items, values]) => {
      if (!active) return;
      setCategories(items); setOptions(values); setLoading(false);
    }).catch((requestError) => {
      if (!active || handleAdminSessionError(requestError)) return;
      setError(requestError.message || 'Categories could not be loaded.'); setLoading(false);
    });
    return () => { active = false; };
  }, []);
  const update = (event) => setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  const edit = (category) => { setEditingId(category.id); setForm({ name: category.name, status: category.status, image: category.storageImage, metaTitle: category.metaTitle, metaDescription: category.metaDescription, type: category.type, gender: category.gender, collection: category.collection }); setError(''); };
  const reset = () => { setEditingId(null); setForm(empty); };
  const submit = async (event) => {
    event.preventDefault(); setBusy(true); setError(''); setMessage('');
    try { if (editingId) await catalogApi.updateCategory(editingId, form); else await catalogApi.createCategory(form); setMessage(editingId ? 'Category updated successfully.' : 'Category created successfully.'); reset(); await load(); }
    catch (requestError) { if (!handleAdminSessionError(requestError)) setError(requestError.message || 'Category could not be saved.'); }
    finally { setBusy(false); }
  };
  const deactivate = async (category) => { setBusy(true); try { await catalogApi.updateCategory(category.id, { status: category.status === 'Active' ? 'Inactive' : 'Active' }); await load(); } catch (requestError) { if (!handleAdminSessionError(requestError)) setError(requestError.message); } finally { setBusy(false); } };
  const remove = async (category) => { if (!window.confirm(`Delete ${category.name}?`)) return; setBusy(true); try { await catalogApi.deleteCategory(category.id); await load(); } catch (requestError) { if (!handleAdminSessionError(requestError)) setError(requestError.message); } finally { setBusy(false); } };
  const addOption = async (event) => { event.preventDefault(); setBusy(true); setError(''); try { await catalogApi.createOption(newOption); setNewOption((current) => ({ ...current, value: '' })); await load(); } catch (requestError) { if (!handleAdminSessionError(requestError)) setError(requestError.message); } finally { setBusy(false); } };
  const values = (kind) => ['', ...options.filter((option) => option.kind === kind && option.status === 'Active').map((option) => option.value)];

  return <AdminLayout title="Categories">
    <AdminPageHeader eyebrow="CATALOG MANAGEMENT" title="CATEGORIES" copy="Manage category metadata and controlled catalogue values." />
    <form className="admin-panel admin-form" onSubmit={submit} noValidate>
      {message && <p className="admin-feedback admin-feedback--success">{message}</p>}{error && <p className="admin-feedback admin-feedback--error">{error}</p>}
      <div className="admin-form-grid">
        <AdminField label="CATEGORY NAME" name="name" value={form.name} onChange={update} required disabled={busy} /><AdminField label="STATUS" name="status" value={form.status} onChange={update} as="select" options={['Active', 'Inactive']} disabled={busy} />
        <AdminField label="TYPE" name="type" value={form.type} onChange={update} as="select" options={values('type')} disabled={busy} /><AdminField label="GENDER" name="gender" value={form.gender} onChange={update} as="select" options={values('gender')} disabled={busy} />
        <AdminField label="COLLECTION" name="collection" value={form.collection} onChange={update} as="select" options={values('collection')} disabled={busy} /><AdminField label="CATEGORY IMAGE URL" name="image" value={form.image} onChange={update} placeholder="https://…" disabled={busy} />
        <AdminField label="META TITLE" name="metaTitle" value={form.metaTitle} onChange={update} required disabled={busy} /><AdminField label="META DESCRIPTION" name="metaDescription" value={form.metaDescription} onChange={update} as="textarea" required disabled={busy} />
      </div><div className="admin-form-actions"><button className="btn btn--acid" disabled={busy}>{editingId ? 'SAVE CATEGORY' : 'CREATE CATEGORY'}</button>{editingId && <button className="btn btn--ghost" type="button" onClick={reset}>CANCEL</button>}</div>
    </form>
    <form className="admin-panel admin-form" onSubmit={addOption}><div className="admin-form-section__head"><span>＋</span><div><strong>ADD CONTROLLED VALUE</strong><p>Extend type, gender, or collection options for future catalogue entries.</p></div></div><div className="admin-form-grid"><AdminField label="FIELD" name="kind" value={newOption.kind} onChange={(event) => setNewOption((current) => ({ ...current, kind: event.target.value }))} as="select" options={kinds.map(([kind]) => kind)} disabled={busy} /><AdminField label="NEW VALUE" name="value" value={newOption.value} onChange={(event) => setNewOption((current) => ({ ...current, value: event.target.value }))} required disabled={busy} /></div><div className="admin-form-actions"><button className="btn btn--ghost" disabled={busy}>ADD VALUE</button></div></form>
    <section className="admin-panel">{loading ? <div className="admin-data-state">LOADING CATEGORIES…</div> : <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Category</th><th>Type</th><th>Gender</th><th>Collection</th><th>Status</th><th>Actions</th></tr></thead><tbody>{categories.map((category) => <tr key={category.id}><td data-label="Category"><strong>{category.name}</strong></td><td data-label="Type">{category.type || '—'}</td><td data-label="Gender">{category.gender || '—'}</td><td data-label="Collection">{category.collection || '—'}</td><td data-label="Status"><AdminStatusBadge tone={category.status === 'Active' ? 'success' : 'neutral'}>{category.status}</AdminStatusBadge></td><td data-label="Actions"><div className="admin-actions"><button type="button" onClick={() => edit(category)}>EDIT</button><button type="button" onClick={() => deactivate(category)}>{category.status === 'Active' ? 'DEACTIVATE' : 'ACTIVATE'}</button><button type="button" onClick={() => remove(category)}>DELETE</button></div></td></tr>)}</tbody></table></div>}</section>
  </AdminLayout>;
}
