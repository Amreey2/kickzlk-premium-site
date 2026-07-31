import { useState } from 'react';
import AdminField from '../../components/admin/AdminField';
import AdminLayout from '../../components/admin/AdminLayout';
import AdminPageHeader from '../../components/admin/AdminPageHeader';
import { getProductById } from '../../data/products';

const emptyProduct = {
  brand: '',
  name: '',
  description: '',
  category: 'nike',
  price: '',
  productType: 'Ready Stock',
  deliveryTime: '',
  sizes: '',
};

export default function AdminProductFormPage({ productId }) {
  const product = productId ? getProductById(productId) : null;
  const [form, setForm] = useState(product ? {
    brand: product.brand,
    name: product.name,
    description: product.description,
    category: product.category,
    price: String(product.price),
    productType: product.preOrder ? 'Pre Order' : 'Ready Stock',
    deliveryTime: product.deliveryTime,
    sizes: product.sizes.join(', '),
  } : emptyProduct);
  const [saved, setSaved] = useState(false);
  const isEdit = Boolean(productId);

  const updateField = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
    setSaved(false);
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    setSaved(true);
  };

  return (
    <AdminLayout title={isEdit ? 'Edit Product' : 'Add Product'}>
      <AdminPageHeader eyebrow="CATALOG EDITOR" title={isEdit ? 'EDIT PRODUCT' : 'ADD PRODUCT'} copy="Frontend form structure prepared for catalog create and update APIs." action={<a className="btn btn--ghost" href="/admin/products">BACK TO PRODUCTS</a>} />
      <form className="admin-panel admin-form" onSubmit={handleSubmit}>
        <div className="admin-form-grid">
          <AdminField label="BRAND" name="brand" value={form.brand} onChange={updateField} placeholder="Nike, Jordan, Adidas..." required />
          <AdminField label="PRODUCT NAME" name="name" value={form.name} onChange={updateField} placeholder="Product name" required />
          <AdminField label="DESCRIPTION" name="description" value={form.description} onChange={updateField} as="textarea" placeholder="Product description" required />
          <AdminField label="CATEGORY" name="category" value={form.category} onChange={updateField} as="select" options={['nike', 'jordan', 'adidas', 'luxury']} />
          <AdminField label="PRICE (LKR)" name="price" value={form.price} onChange={updateField} type="number" placeholder="64900" required />
          <AdminField label="PRODUCT TYPE" name="productType" value={form.productType} onChange={updateField} as="select" options={['Ready Stock', 'Pre Order']} />
          <AdminField label="DELIVERY TIMELINE" name="deliveryTime" value={form.deliveryTime} onChange={updateField} placeholder="14–28 days" required />
          <AdminField label="AVAILABLE SIZES" name="sizes" value={form.sizes} onChange={updateField} placeholder="7, 7.5, 8, 8.5..." required />
        </div>
        <label className="admin-upload"><input type="file" accept="image/*" /><span>＋</span><strong>UPLOAD PRODUCT IMAGES</strong><small>Frontend placeholder · JPG, PNG or WebP</small></label>
        <div className="admin-form-actions"><button className="btn btn--acid" type="submit">{isEdit ? 'SAVE PRODUCT' : 'CREATE PRODUCT'} <span>→</span></button>{saved && <p role="status">Frontend form saved locally. Backend mutation pending.</p>}</div>
      </form>
    </AdminLayout>
  );
}
