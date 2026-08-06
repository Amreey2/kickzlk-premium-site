import { useEffect, useRef, useState } from 'react';
import AdminField from '../../components/admin/AdminField';
import AdminLayout from '../../components/admin/AdminLayout';
import AdminPageHeader from '../../components/admin/AdminPageHeader';
import { catalogApi, productsApi, resolveApiAssetUrl, uploadsApi } from '../../services/api';
import { handleAdminSessionError } from '../../utils/adminSession';
import { replaceFailedProductImage } from '../../utils/productPresentation';

const emptyProduct = {
  sku: '',
  brand: '',
  name: '',
  description: '',
  category: '',
  price: '',
  deliveryTime: '',
  sizes: '',
  preOrder: true,
  stock: '0',
  status: 'Active',
  productTags: '',
  colorVariations: '',
  metaTitle: '',
  metaDescription: '',
  imageAltText: '',
  cdnImages: '',
};

const imagePayload = (image, index, productName) => ({
  url: image.storageUrl || image.url,
  alt: image.alt || `${productName} sneaker view ${index + 1}`,
  position: index + 1,
});

export default function AdminProductFormPage({ productId, duplicateFrom }) {
  const isEdit = Boolean(productId);
  const isDuplicate = Boolean(duplicateFrom);
  const sourceId = productId || duplicateFrom;
  const [form, setForm] = useState(emptyProduct);
  const [images, setImages] = useState([]);
  const [brands, setBrands] = useState([]);
  const [categories, setCategories] = useState([]);
  const [uploadPreviews, setUploadPreviews] = useState([]);
  const [loading, setLoading] = useState(Boolean(sourceId));
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const previewUrls = useRef([]);

  useEffect(() => () => previewUrls.current.forEach((url) => URL.revokeObjectURL(url)), []);

  useEffect(() => {
    let active = true;
    Promise.all([catalogApi.brands(), catalogApi.categories()]).then(([nextBrands, nextCategories]) => {
      if (!active) return;
      setBrands(nextBrands);
      setCategories(nextCategories);
    }).catch((requestError) => {
      if (active && !handleAdminSessionError(requestError)) setError(requestError.message || 'Catalogue options could not be loaded.');
    });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!sourceId) return undefined;
    let active = true;
    productsApi.getAdmin(sourceId).then((product) => {
      if (!active) return;
      setForm({
        sku: isDuplicate ? '' : product.sku,
        brand: product.brand,
        name: isDuplicate ? `${product.name} Copy` : product.name,
        description: product.description,
        category: product.category,
        price: String(product.price),
        deliveryTime: product.deliveryTime,
        sizes: product.sizes.join(', '),
        preOrder: product.preOrder,
        stock: String(product.stock),
        status: product.status,
        productTags: product.productTags.join(', '),
        colorVariations: product.colorVariations.join(', '),
        metaTitle: product.metaTitle,
        metaDescription: product.metaDescription,
        imageAltText: product.imageAltText,
        cdnImages: product.cdnImages.join(', '),
      });
      setImages(product.uploadedImages);
      setLoading(false);
    }).catch((requestError) => {
      if (!active || handleAdminSessionError(requestError)) return;
      setError(requestError.message || 'Product details could not be loaded.');
      setLoading(false);
    });
    return () => { active = false; };
  }, [isDuplicate, sourceId]);

  const updateField = (event) => {
    const { name, value, checked, type } = event.target;
    setForm((current) => ({
      ...current,
      [name]: type === 'checkbox' ? checked : value,
      ...(name === 'status' && value === 'Out of Stock' ? { stock: '0' } : {}),
    }));
    setError('');
    setMessage('');
  };

  const uploadImages = async (event) => {
    const files = Array.from(event.target.files || []);
    event.target.value = '';
    if (!files.length) return;
    if (images.length + files.length > 8) {
      setError('A product can contain up to 8 images.');
      return;
    }
    if (files.some((file) => !['image/jpeg', 'image/png', 'image/webp'].includes(file.type))) {
      setError('Only JPG, PNG, and WebP images are supported.');
      return;
    }

    const previews = files.map((file) => ({ url: URL.createObjectURL(file), alt: file.name }));
    previewUrls.current = previews.map((preview) => preview.url);
    setUploadPreviews(previews);
    setUploading(true);
    setError('');
    try {
      const uploaded = await uploadsApi.productImages(files);
      setImages((current) => [...current, ...uploaded.map((image, index) => ({
        url: resolveApiAssetUrl(image.url),
        storageUrl: image.url,
        alt: `${form.name || 'KICKZ.LK product'} view ${current.length + index + 1}`,
        position: current.length + index + 1,
      }))]);
      setMessage(`${uploaded.length} image${uploaded.length === 1 ? '' : 's'} uploaded successfully.`);
    } catch (requestError) {
      if (!handleAdminSessionError(requestError)) {
        setError(requestError.code === 'NETWORK_ERROR'
          ? 'Image upload could not reach the KICKZ.LK server. Confirm the backend is running, then try again.'
          : requestError.message || 'Images could not be uploaded.');
      }
    } finally {
      previewUrls.current.forEach((url) => URL.revokeObjectURL(url));
      previewUrls.current = [];
      setUploadPreviews([]);
      setUploading(false);
    }
  };

  const removeImage = (index) => {
    setImages((current) => current.filter((image, imageIndex) => imageIndex !== index));
    setMessage('');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const sizes = [...new Set(form.sizes.split(',').map((size) => size.trim()).filter(Boolean))];
    const price = Number(form.price);
    const stock = Number(form.stock);
    const brand = brands.find((item) => item.name === form.brand);
    const category = categories.find((item) => item.name === form.category);
    const productTags = [...new Set(form.productTags.split(',').map((value) => value.trim()).filter(Boolean))];
    const colorVariations = [...new Set(form.colorVariations.split(',').map((value) => value.trim()).filter(Boolean))];
    const cdnImages = [...new Set(form.cdnImages.split(',').map((value) => value.trim()).filter(Boolean))];
    if (!form.sku.trim() || !form.name.trim() || !brand || !category || !form.description.trim()) return setError('Complete all required product information fields.');
    if (!Number.isFinite(price) || price <= 0) return setError('Enter a valid product price.');
    if (!sizes.length) return setError('Enter at least one available size.');
    if (!Number.isInteger(stock) || stock < 0) return setError('Stock must be a non-negative whole number.');
    if (form.status === 'Active' && !form.preOrder && stock === 0) return setError('Active ready-stock products require at least one item in stock.');
    if (!productTags.length) return setError('Enter at least one product tag.');
    if (!colorVariations.length) return setError('Enter at least one available colour.');
    if (!images.length && !cdnImages.length) return setError('Upload an image or provide at least one CDN image URL.');

    setSubmitting(true);
    setError('');
    setMessage('');
    const payload = {
      sku: form.sku.trim().toUpperCase(),
      name: form.name.trim(),
      brand: form.brand.trim(),
      brandId: brand.id,
      category: form.category.trim(),
      categoryId: category.id,
      price,
      description: form.description.trim(),
      sizes,
      preOrder: form.preOrder,
      stock: form.status === 'Out of Stock' ? 0 : stock,
      availability: form.status,
      deliveryTime: form.deliveryTime.trim(),
      images: images.map((image, index) => imagePayload(image, index, form.name.trim())),
      productTags,
      colorVariations,
      cdnImages,
      metaTitle: form.metaTitle.trim(),
      metaDescription: form.metaDescription.trim(),
      imageAltText: form.imageAltText.trim(),
    };

    try {
      if (isEdit) await productsApi.update(productId, payload);
      else await productsApi.create(payload);
      setMessage(isEdit ? 'Product updated successfully.' : isDuplicate ? 'Product copy created successfully.' : 'Product created successfully.');
      window.setTimeout(() => window.location.assign('/admin/products'), 650);
    } catch (requestError) {
      if (!handleAdminSessionError(requestError)) setError(requestError.message || 'The product could not be saved.');
      setSubmitting(false);
    }
  };

  const busy = loading || uploading || submitting;

  return (
    <AdminLayout title={isEdit ? 'Edit Product' : isDuplicate ? 'Duplicate Product' : 'Add Product'}>
      <AdminPageHeader eyebrow="CATALOG EDITOR" title={isEdit ? 'EDIT PRODUCT' : isDuplicate ? 'DUPLICATE PRODUCT' : 'ADD PRODUCT'} copy={isDuplicate ? 'Review the copied product and enter a new unique SKU before saving.' : 'Organize product details, pricing, sizing and imagery in one focused workspace.'} action={<a className="btn btn--ghost" href="/admin/products">BACK TO PRODUCTS</a>} />
      {loading ? <div className="admin-panel admin-data-state" role="status">LOADING PRODUCT…</div> : error && sourceId && !form.name ? <div className="admin-panel admin-data-state"><strong>PRODUCT UNAVAILABLE</strong><p>{error}</p><a href="/admin/products">RETURN TO PRODUCTS →</a></div> : <form className="admin-panel admin-form" onSubmit={handleSubmit} noValidate>
        {message && <p className="admin-feedback admin-feedback--success" role="status">{message}</p>}
        {error && <p className="admin-feedback admin-feedback--error" role="alert">{error}</p>}
        <section className="admin-form-section">
          <div className="admin-form-section__head"><span>01</span><div><strong>PRODUCT INFORMATION</strong><p>Core catalog information shown throughout the storefront.</p></div></div>
          <div className="admin-form-grid">
            <AdminField label="SKU" name="sku" value={form.sku} onChange={updateField} placeholder="NK-AJ1-SHD-0001" required disabled={busy} />
            <AdminField label="BRAND" name="brand" value={form.brand} onChange={updateField} as="select" options={['', ...brands.map((brand) => brand.name)]} required disabled={busy} />
            <AdminField label="PRODUCT NAME" name="name" value={form.name} onChange={updateField} placeholder="Product name" required disabled={busy} />
            <AdminField label="CATEGORY" name="category" value={form.category} onChange={updateField} as="select" options={['', ...categories.map((category) => category.name)]} required disabled={busy} />
            <AdminField label="PRICE (LKR)" name="price" value={form.price} onChange={updateField} type="number" placeholder="64900" required disabled={busy} />
            <AdminField label="DESCRIPTION" name="description" value={form.description} onChange={updateField} as="textarea" placeholder="Product description" required disabled={busy} />
            <AdminField label="PRODUCT TAGS" name="productTags" value={form.productTags} onChange={updateField} placeholder="New Arrival, Lifestyle" required disabled={busy} />
            <AdminField label="COLOUR VARIATIONS" name="colorVariations" value={form.colorVariations} onChange={updateField} placeholder="Black, White, Red" required disabled={busy} />
          </div>
        </section>
        <section className="admin-form-section">
          <div className="admin-form-section__head"><span>02</span><div><strong>AVAILABILITY & DELIVERY</strong><p>Customer-facing status, stock, sizing and fulfilment details.</p></div></div>
          <div className="admin-form-grid">
            <AdminField label="STATUS" name="status" value={form.status} onChange={updateField} as="select" options={['Active', 'Inactive', 'Out of Stock']} disabled={busy} />
            <AdminField label="STOCK" name="stock" value={form.stock} onChange={updateField} type="number" placeholder="0" required disabled={busy || form.status === 'Out of Stock'} />
            <AdminField label="DELIVERY TIMELINE" name="deliveryTime" value={form.deliveryTime} onChange={updateField} placeholder="14–28 days" disabled={busy} />
            <AdminField label="AVAILABLE SIZES" name="sizes" value={form.sizes} onChange={updateField} placeholder="7, 7.5, 8, 8.5..." required disabled={busy} />
          </div>
          <label className="admin-switch-field"><input name="preOrder" type="checkbox" checked={form.preOrder} onChange={updateField} disabled={busy} /><span><strong>PRE-ORDER AVAILABLE</strong><small>Customers can enquire even when local stock is zero.</small></span></label>
        </section>
        <section className="admin-form-section admin-form-section--media">
          <div className="admin-form-section__head"><span>03</span><div><strong>PRODUCT IMAGERY</strong><p>Upload up to eight JPG, PNG or WebP product views.</p></div></div>
          {(images.length > 0 || uploadPreviews.length > 0) && <div className="admin-image-previews">{[...images, ...uploadPreviews].map((image, index) => <figure key={`${image.url}-${index}`}><img src={image.url} alt={image.alt || `Product view ${index + 1}`} onError={replaceFailedProductImage} />{index < images.length && <button type="button" aria-label={`Remove image ${index + 1}`} onClick={() => removeImage(index)} disabled={busy}>×</button>}{index >= images.length && <span>UPLOADING</span>}</figure>)}</div>}
          <label className={`admin-upload${uploading ? ' is-uploading' : ''}`}><input type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={uploadImages} disabled={busy} /><span>{uploading ? '↻' : '＋'}</span><strong>{uploading ? 'UPLOADING IMAGES…' : 'SELECT PRODUCT IMAGES'}</strong><small>JPG, PNG or WebP · Maximum 8 files</small></label>
          <div className="admin-form-grid">
            <AdminField label="CDN IMAGE URLS" name="cdnImages" value={form.cdnImages} onChange={updateField} as="textarea" placeholder="https://cdn.example.com/front.jpg, https://cdn.example.com/side.jpg" disabled={busy} />
          </div>
        </section>
        <section className="admin-form-section">
          <div className="admin-form-section__head"><span>04</span><div><strong>PRODUCT SEO</strong><p>Stored catalogue metadata for the upcoming SEO integration.</p></div></div>
          <div className="admin-form-grid">
            <AdminField label="META TITLE (OPTIONAL)" name="metaTitle" value={form.metaTitle} onChange={updateField} placeholder="Product page title" disabled={busy} />
            <AdminField label="META DESCRIPTION (OPTIONAL)" name="metaDescription" value={form.metaDescription} onChange={updateField} as="textarea" placeholder="Search result description" disabled={busy} />
            <AdminField label="IMAGE ALT TEXT (OPTIONAL)" name="imageAltText" value={form.imageAltText} onChange={updateField} placeholder="Descriptive product image text" disabled={busy} />
          </div>
        </section>
        <div className="admin-form-actions"><button className="btn btn--acid" type="submit" disabled={busy}>{submitting ? 'SAVING PRODUCT…' : isEdit ? 'SAVE PRODUCT' : isDuplicate ? 'CREATE PRODUCT COPY' : 'CREATE PRODUCT'} <span>→</span></button></div>
      </form>}
    </AdminLayout>
  );
}
