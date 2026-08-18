import { useEffect, useMemo, useState } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import AdminPageHeader from '../../components/admin/AdminPageHeader';
import AdminStatusBadge from '../../components/admin/AdminStatusBadge';
import { productsApi } from '../../services/api';
import { handleAdminSessionError } from '../../utils/adminSession';
import { formatProductPrice, productImage, replaceFailedProductImage } from '../../utils/productPresentation';

const PAGE_SIZE = 12;
const statusTone = (status) => status === 'Active' ? 'success' : 'neutral';
const stockTone = (status) => status === 'IN STOCK' ? 'success' : status === 'LOW STOCK' ? 'warning' : 'danger';
const unique = (values) => [...new Set(values.filter(Boolean))].sort((a, b) => a.localeCompare(b));
const emptyFilters = { brand: '', category: '', tag: '', status: '', sale: '', preOrder: '' };

export default function AdminProductsPage() {
  const [products, setProducts] = useState([]); const [loading, setLoading] = useState(true);
  const [error, setError] = useState(''); const [message, setMessage] = useState(''); const [pendingId, setPendingId] = useState('');
  const [search, setSearch] = useState(''); const [filters, setFilters] = useState(emptyFilters); const [page, setPage] = useState(1);
  const [editing, setEditing] = useState(null);

  const loadProducts = async () => {
    setLoading(true); setError('');
    try { productsApi.clearCache(); setProducts(await productsApi.adminList()); }
    catch (requestError) { if (!handleAdminSessionError(requestError)) setError(requestError.message || 'Products could not be loaded.'); }
    finally { setLoading(false); }
  };
  useEffect(() => {
    let active = true; productsApi.clearCache();
    productsApi.adminList().then((catalog) => { if (active) { setProducts(catalog); setLoading(false); } }, (requestError) => {
      if (!active || handleAdminSessionError(requestError)) return; setError(requestError.message || 'Products could not be loaded.'); setLoading(false);
    });
    return () => { active = false; };
  }, []);

  const options = useMemo(() => ({ brands: unique(products.map((p) => p.brand)), categories: unique(products.map((p) => p.category)), tags: unique(products.flatMap((p) => p.productTags || [])) }), [products]);
  const filtered = useMemo(() => products.slice().sort((a, b) => (Date.parse(b.createdAt) || 0) - (Date.parse(a.createdAt) || 0) || String(b.id).localeCompare(String(a.id))).filter((product) => {
    const term = search.trim().toLowerCase();
    return (!term || `${product.name} ${product.brand} ${product.sku}`.toLowerCase().includes(term))
      && (!filters.brand || product.brand === filters.brand) && (!filters.category || product.category === filters.category)
      && (!filters.tag || product.productTags?.includes(filters.tag)) && (!filters.status || product.status === filters.status)
      && (!filters.sale || (filters.sale === 'yes' ? Number(product.originalPrice) > Number(product.price) : !product.originalPrice))
      && (!filters.preOrder || (filters.preOrder === 'yes' ? product.preOrder : !product.preOrder));
  }), [products, search, filters]);
  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE)); const currentPage = Math.min(page, pageCount);
  const displayed = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  const active = search.trim() || Object.values(filters).some(Boolean);
  const clear = () => { setSearch(''); setFilters(emptyFilters); setPage(1); };
  const setFilter = (name, value) => { setFilters((current) => ({ ...current, [name]: value })); setPage(1); };

  const deleteProduct = async (product) => {
    if (!window.confirm(`Delete ${product.name}? This cannot be undone.`)) return; setPendingId(product.id); setError(''); setMessage('');
    try { await productsApi.remove(product.slug); setMessage(`${product.name} was deleted.`); await loadProducts(); }
    catch (requestError) { if (!handleAdminSessionError(requestError)) setError(requestError.message || 'The product could not be deleted.'); }
    finally { setPendingId(''); }
  };
  const updateStatus = async (product, status) => {
    setPendingId(product.id); setError(''); setMessage('');
    try { const updated = await productsApi.update(product.slug, { availability: status, stock: product.stock }); setProducts((current) => current.map((item) => item.id === product.id ? updated : item)); setMessage(`${product.name} is now ${status.toLowerCase()}.`); }
    catch (requestError) { if (!handleAdminSessionError(requestError)) setError(requestError.message || 'Product status could not be updated.'); }
    finally { setPendingId(''); }
  };
  const beginEdit = (product) => setEditing({ id: product.id, stock: String(product.stock), regularPrice: String(product.originalPrice || product.price), salePrice: product.originalPrice ? String(product.price) : '' });
  const save = async (product) => {
    const stock = Number(editing.stock); const regular = Number(editing.regularPrice); const sale = editing.salePrice.trim() === '' ? null : Number(editing.salePrice);
    if (!Number.isInteger(stock) || stock < 0) return setError('Stock must be a non-negative whole number.');
    if (!Number.isFinite(regular) || regular <= 0) return setError('Regular price must be a positive amount.');
    if (sale !== null && (!Number.isFinite(sale) || sale <= 0 || sale > regular)) return setError('Sale price must be positive and cannot exceed the regular price.');
    setPendingId(product.id); setError(''); setMessage('');
    try {
      const hasSale = sale !== null && sale < regular;
      const updated = await productsApi.update(product.slug, { stock, price: hasSale ? sale : regular, originalPrice: hasSale ? regular : null, availability: product.status });
      setProducts((current) => current.map((item) => item.id === product.id ? updated : item)); setEditing(null); setMessage(`${product.name} pricing and stock were updated.`);
    } catch (requestError) { if (!handleAdminSessionError(requestError)) setError(requestError.message || 'Quick edit could not be saved.'); }
    finally { setPendingId(''); }
  };

  return <AdminLayout title="Products"><AdminPageHeader eyebrow="CATALOG MANAGEMENT" title="PRODUCTS" copy={loading ? 'Loading live catalog…' : `${products.length} products in the live catalog.`} action={<div className="admin-page-actions"><a href="/admin/products/import" className="btn btn--ghost">BULK IMPORT</a><a href="/admin/products/new" className="btn btn--acid">ADD PRODUCT <span>＋</span></a></div>} />
    <section className="admin-panel">
      {message && <p className="admin-feedback admin-feedback--success" role="status">{message}</p>}{error && <div className="admin-feedback admin-feedback--error" role="alert"><span>{error}</span><button type="button" onClick={() => setError('')}>DISMISS</button></div>}
      <div className="admin-product-tools"><label className="admin-management-search"><span>SEARCH PRODUCTS</span><input value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} placeholder="Search by product name, brand or SKU..." /></label>
        <div className="admin-product-filters">
          <label><span>BRAND</span><select value={filters.brand} onChange={(event) => setFilter('brand', event.target.value)}><option value="">All brands</option>{options.brands.map((v) => <option key={v}>{v}</option>)}</select></label>
          <label><span>CATEGORY</span><select value={filters.category} onChange={(event) => setFilter('category', event.target.value)}><option value="">All categories</option>{options.categories.map((v) => <option key={v}>{v}</option>)}</select></label>
          <label><span>PRODUCT TAG</span><select value={filters.tag} onChange={(event) => setFilter('tag', event.target.value)}><option value="">All tags</option>{options.tags.map((v) => <option key={v}>{v}</option>)}</select></label>
          <label><span>STATUS</span><select value={filters.status} onChange={(event) => setFilter('status', event.target.value)}><option value="">Any status</option><option>Active</option><option>Inactive</option></select></label>
          <label><span>SALE</span><select value={filters.sale} onChange={(event) => setFilter('sale', event.target.value)}><option value="">Any pricing</option><option value="yes">On sale</option><option value="no">Not on sale</option></select></label>
          <label><span>PRE-ORDER</span><select value={filters.preOrder} onChange={(event) => setFilter('preOrder', event.target.value)}><option value="">Any type</option><option value="yes">Pre-order</option><option value="no">Ready stock</option></select></label>
        </div>
        <div className="admin-product-results"><strong>Showing {displayed.length} of {products.length} products</strong>{active && <><span>{filtered.length} matching</span><button type="button" onClick={clear}>CLEAR FILTERS</button></>}</div>
      </div>
      {loading ? <div className="admin-data-state">LOADING PRODUCTS…</div> : displayed.length === 0 ? <div className="admin-data-state"><strong>NO PRODUCTS MATCH YOUR SEARCH</strong><button type="button" className="admin-text-button" onClick={clear}>CLEAR FILTERS →</button></div> : <div className="admin-table-wrap"><table className="admin-table admin-product-table"><thead><tr><th>Product</th><th>SKU</th><th>Category</th><th>Pricing</th><th>Stock</th><th>Status</th><th>Actions</th></tr></thead><tbody>{displayed.map((product) => {
        const isEditing = editing?.id === product.id;
        return <tr key={product.id}><td data-label="Product"><div className="admin-product-cell"><img src={productImage(product)} alt="" onError={replaceFailedProductImage} /><div><span>{product.brand}</span><strong>{product.name}</strong></div></div></td>
          <td data-label="SKU"><strong>{product.sku}</strong></td><td data-label="Category">{product.category}</td>
          <td data-label="Pricing">{isEditing ? <div className="admin-quick-fields"><label><span>REGULAR</span><input type="number" value={editing.regularPrice} onChange={(event) => setEditing((c) => ({ ...c, regularPrice: event.target.value }))} /></label><label><span>SALE</span><input type="number" value={editing.salePrice} placeholder="None" onChange={(event) => setEditing((c) => ({ ...c, salePrice: event.target.value }))} /></label></div> : <div className="admin-price-stack">{product.originalPrice && <del>{formatProductPrice(product.originalPrice)}</del>}<strong>{formatProductPrice(product.price)}</strong></div>}</td>
          <td data-label="Stock">{isEditing ? <div className="admin-quick-fields"><label><span>STOCK</span><input type="number" value={editing.stock} onChange={(event) => setEditing((c) => ({ ...c, stock: event.target.value }))} /></label></div> : <div className="admin-product-status"><strong>{product.stock}</strong><AdminStatusBadge tone={stockTone(product.stockStatus)}>{product.stockStatus}</AdminStatusBadge></div>}</td>
          <td data-label="Status"><div className="admin-product-status"><AdminStatusBadge tone={statusTone(product.status)}>{product.status}</AdminStatusBadge><select value={product.status} disabled={pendingId === product.id || isEditing} onChange={(event) => updateStatus(product, event.target.value)}><option>Active</option><option>Inactive</option></select></div></td>
          <td data-label="Actions">{isEditing ? <div className="admin-actions"><button type="button" disabled={pendingId === product.id} onClick={() => save(product)}>SAVE</button><button type="button" onClick={() => setEditing(null)}>CANCEL</button></div> : <div className="admin-actions"><button type="button" onClick={() => beginEdit(product)}>QUICK EDIT</button><a href={`/admin/products/${product.slug}/edit`}>FULL EDIT</a><a href={`/admin/products/${product.slug}/duplicate`}>DUPLICATE</a><button type="button" disabled={pendingId === product.id} onClick={() => deleteProduct(product)}>{pendingId === product.id ? 'WORKING…' : 'DELETE'}</button></div>}</td></tr>;
      })}</tbody></table></div>}
      {filtered.length > PAGE_SIZE && <nav className="admin-pagination" aria-label="Product pages"><button disabled={currentPage === 1} onClick={() => setPage((v) => Math.max(1, v - 1))}>← PREVIOUS</button>{Array.from({ length: pageCount }, (_, i) => i + 1).map((n) => <button className={n === currentPage ? 'is-active' : ''} aria-current={n === currentPage ? 'page' : undefined} key={n} onClick={() => setPage(n)}>{n}</button>)}<button disabled={currentPage === pageCount} onClick={() => setPage((v) => Math.min(pageCount, v + 1))}>NEXT →</button></nav>}
    </section>
  </AdminLayout>;
}
