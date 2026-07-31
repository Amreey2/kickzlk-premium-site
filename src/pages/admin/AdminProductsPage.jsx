import { useState } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import AdminPageHeader from '../../components/admin/AdminPageHeader';
import AdminStatusBadge from '../../components/admin/AdminStatusBadge';
import { formatPrice, products as catalogProducts } from '../../data/products';

export default function AdminProductsPage() {
  const [products, setProducts] = useState(catalogProducts);
  const deleteProduct = (id) => setProducts((current) => current.filter((product) => product.id !== id));

  return (
    <AdminLayout title="Products">
      <AdminPageHeader eyebrow="CATALOG MANAGEMENT" title="PRODUCTS" copy={`${products.length} products in the local frontend catalog.`} action={<a href="/admin/products/new" className="btn btn--acid">ADD PRODUCT <span>＋</span></a>} />
      <section className="admin-panel">
        {/* SPRINT 4 PRODUCT TABLE: edit/delete handlers are intentionally local until backend mutations exist. */}
        <div className="admin-table-wrap">
          <table className="admin-table admin-product-table">
            <thead><tr><th>Product</th><th>Category</th><th>Price</th><th>Type</th><th>Status</th><th>Actions</th></tr></thead>
            <tbody>{products.map((product) => (
              <tr key={product.id}>
                <td data-label="Product"><div className="admin-product-cell"><img src={product.image} alt="" /><div><span>{product.brand}</span><strong>{product.name}</strong></div></div></td>
                <td data-label="Category">{product.category}</td>
                <td data-label="Price">{formatPrice(product.price)}</td>
                <td data-label="Type">{product.preOrder ? 'Pre Order' : 'Ready Stock'}</td>
                <td data-label="Status"><AdminStatusBadge tone={product.preOrder ? 'warning' : 'success'}>{product.availability}</AdminStatusBadge></td>
                <td data-label="Actions"><div className="admin-actions"><a href={`/admin/products/${product.id}/edit`}>EDIT</a><button type="button" onClick={() => deleteProduct(product.id)}>DELETE</button></div></td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      </section>
    </AdminLayout>
  );
}
