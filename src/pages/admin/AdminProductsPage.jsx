import { useEffect, useState } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import AdminPageHeader from '../../components/admin/AdminPageHeader';
import AdminStatusBadge from '../../components/admin/AdminStatusBadge';
import { productsApi } from '../../services/api';
import { handleAdminSessionError } from '../../utils/adminSession';
import { formatProductPrice, productImage, replaceFailedProductImage } from '../../utils/productPresentation';

const statusTone = (status) => status === 'Active' ? 'success' : status === 'Out of Stock' ? 'warning' : 'neutral';

export default function AdminProductsPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [pendingId, setPendingId] = useState('');

  const loadProducts = async () => {
    setLoading(true);
    setError('');
    try {
      productsApi.clearCache();
      setProducts(await productsApi.adminList());
    } catch (requestError) {
      if (!handleAdminSessionError(requestError)) setError(requestError.message || 'Products could not be loaded.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let active = true;
    productsApi.clearCache();
    productsApi.adminList().then(
      (catalog) => {
        if (!active) return;
        setProducts(catalog);
        setLoading(false);
      },
      (requestError) => {
        if (!active || handleAdminSessionError(requestError)) return;
        setError(requestError.message || 'Products could not be loaded.');
        setLoading(false);
      },
    );
    return () => { active = false; };
  }, []);

  const deleteProduct = async (product) => {
    if (!window.confirm(`Delete ${product.name}? This cannot be undone.`)) return;
    setPendingId(product.id);
    setError('');
    setMessage('');
    try {
      await productsApi.remove(product.slug);
      setMessage(`${product.name} was deleted.`);
      await loadProducts();
    } catch (requestError) {
      if (!handleAdminSessionError(requestError)) setError(requestError.message || 'The product could not be deleted.');
    } finally {
      setPendingId('');
    }
  };

  const updateStatus = async (product, status) => {
    setPendingId(product.id);
    setError('');
    setMessage('');
    try {
      await productsApi.update(product.slug, {
        availability: status,
        stock: status === 'Out of Stock' ? 0 : product.stock,
      });
      setMessage(`${product.name} is now ${status.toLowerCase()}.`);
      await loadProducts();
    } catch (requestError) {
      if (!handleAdminSessionError(requestError)) setError(requestError.message || 'Product status could not be updated.');
    } finally {
      setPendingId('');
    }
  };

  return (
    <AdminLayout title="Products">
      <AdminPageHeader eyebrow="CATALOG MANAGEMENT" title="PRODUCTS" copy={loading ? 'Loading live catalog…' : `${products.length} products in the live catalog.`} action={<a href="/admin/products/new" className="btn btn--acid">ADD PRODUCT <span>＋</span></a>} />
      <section className="admin-panel">
        {/* SPRINT 6.1B LIVE CATALOG: the existing table now reflects database reads and protected mutations. */}
        {message && <p className="admin-feedback admin-feedback--success" role="status">{message}</p>}
        {error && <div className="admin-feedback admin-feedback--error" role="alert"><span>{error}</span><button type="button" onClick={loadProducts}>TRY AGAIN</button></div>}
        {loading ? <div className="admin-data-state" role="status">LOADING PRODUCTS…</div> : products.length === 0 ? <div className="admin-data-state"><strong>NO PRODUCTS YET</strong><a href="/admin/products/new">ADD THE FIRST PRODUCT →</a></div> : <div className="admin-table-wrap">
          <table className="admin-table admin-product-table">
            <thead><tr><th>Product</th><th>Category</th><th>Price</th><th>Status</th><th>Actions</th></tr></thead>
            <tbody>{products.map((product) => (
              <tr key={product.id}>
                <td data-label="Product"><div className="admin-product-cell"><img src={productImage(product)} alt="" onError={replaceFailedProductImage} /><div><span>{product.brand}</span><strong>{product.name}</strong></div></div></td>
                <td data-label="Category">{product.category}</td>
                <td data-label="Price">{formatProductPrice(product.price)}</td>
                <td data-label="Status"><div className="admin-product-status"><AdminStatusBadge tone={statusTone(product.status)}>{product.status}</AdminStatusBadge><select aria-label={`Status for ${product.name}`} value={product.status} disabled={pendingId === product.id} onChange={(event) => updateStatus(product, event.target.value)}><option>Active</option><option>Inactive</option><option>Out of Stock</option></select></div></td>
                <td data-label="Actions"><div className="admin-actions"><a href={`/admin/products/${product.slug}/edit`}>EDIT</a><button type="button" disabled={pendingId === product.id} onClick={() => deleteProduct(product)}>{pendingId === product.id ? 'WORKING…' : 'DELETE'}</button></div></td>
              </tr>
            ))}</tbody>
          </table>
        </div>}
      </section>
    </AdminLayout>
  );
}
