import { ApiError, apiRequest, resolveApiAssetUrl } from './client';

const listCache = new Map();
const adminListCache = new Map();
const detailCache = new Map();
const adminDetailCache = new Map();
const normalizeList = (values) => {
  const seen = new Set();
  return (Array.isArray(values) ? values : []).map(String).map((value) => value.trim()).filter((value) => {
    const key = value.toLowerCase();
    if (!value || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

const normalizeImage = (image, index, productName, adminAlt = '') => {
  const source = typeof image === 'string' ? { url: image } : (image || {});
  return {
    url: resolveApiAssetUrl(source.url || source.src),
    storageUrl: source.storageUrl || source.url || source.src || '',
    alt: adminAlt || source.alt || `${productName} sneaker view ${index + 1}`,
    position: Number(source.position || index + 1),
  };
};
const normalizeColorVariants = (variants, productName, adminAlt = '') => (Array.isArray(variants) ? variants : []).map((variant) => {
  const uploadedImages = Array.isArray(variant?.images)
    ? variant.images.map((image, index) => normalizeImage(image, index, `${productName} ${variant.color || ''}`.trim(), adminAlt))
    : [];
  const cdnImages = Array.isArray(variant?.cdnImages) ? variant.cdnImages.map(String).filter(Boolean) : [];
  return {
    color: String(variant?.color || '').trim(),
    images: [...uploadedImages, ...cdnImages.map((url, index) => normalizeImage({ url }, uploadedImages.length + index, `${productName} ${variant.color || ''}`.trim(), adminAlt))],
    uploadedImages,
    cdnImages,
  };
}).filter((variant) => variant.color);

// Keep the storefront isolated from database naming and from optional API metadata.
const normalizeProduct = (product) => {
  const id = String(product.id || product.slug || '');
  const availability = String(product.availability || 'Active');
  const status = availability.toLowerCase() === 'inactive'
    ? 'Inactive'
    : 'Active';
  const stock = Number(product.stock || 0);
  const imageAltText = String(product.imageAltText || '');
  const uploadedImages = Array.isArray(product.images)
    ? product.images.map((image, index) => normalizeImage(image, index, product.name, imageAltText))
    : [];
  const cdnImages = Array.isArray(product.cdnImages) ? product.cdnImages.map(String) : [];
  return {
    id,
    databaseId: Number(product.databaseId || 0),
    slug: String(product.slug || id),
    sku: String(product.sku || ''),
    name: String(product.name || ''),
    brand: String(product.brand || ''),
    brandId: Number(product.brandId || 0),
    category: String(product.category || ''),
    categoryGender: String(product.categoryGender || ''),
    categoryId: Number(product.categoryId || 0),
    price: Number(product.price || 0),
    originalPrice: Number(product.originalPrice || product.compareAtPrice || 0) || null,
    images: [...uploadedImages, ...cdnImages.map((url, index) => normalizeImage({ url }, uploadedImages.length + index, product.name, imageAltText))].sort((a, b) => a.position - b.position),
    uploadedImages,
    cdnImages,
    sizes: Array.isArray(product.sizes) ? product.sizes.map(String) : [],
    description: String(product.description || ''),
    preOrder: Boolean(product.preOrder),
    stock,
    stockStatus: stock <= 0 ? 'OUT OF STOCK' : stock <= 3 ? 'LOW STOCK' : 'IN STOCK',
    status,
    availability,
    deliveryTime: String(product.deliveryTime || ''),
    productTags: normalizeList(product.productTags),
    colorVariations: normalizeList(product.colorVariations),
    colorVariants: normalizeColorVariants(product.colorVariants, product.name, imageAltText),
    metaTitle: String(product.metaTitle || ''),
    metaDescription: String(product.metaDescription || ''),
    imageAltText,
    createdAt: String(product.createdAt || product.created_at || ''),
    updatedAt: String(product.updatedAt || product.updated_at || ''),
  };
};

const isCustomerVisible = (product) => product.status !== 'Inactive';

const cachedRequest = (cache, key, request) => {
  if (cache.has(key)) return cache.get(key);
  const pending = request().catch((error) => {
    cache.delete(key);
    throw error;
  });
  cache.set(key, pending);
  return pending;
};

export const productsApi = {
  list: (filters = {}) => {
    const query = new URLSearchParams(Object.entries(filters).filter(([, value]) => value)).toString();
    return cachedRequest(listCache, query, async () => {
      const products = await apiRequest(`/products${query ? `?${query}` : ''}`);
      const normalized = Array.isArray(products) ? products.map(normalizeProduct) : [];
      normalized.forEach((product) => detailCache.set(product.slug, Promise.resolve(product)));
      return normalized;
    }).then((products) => products.filter(isCustomerVisible));
  },
  adminList: () => cachedRequest(adminListCache, 'all', async () => {
    const products = await apiRequest('/admin/products');
    const normalized = Array.isArray(products) ? products.map(normalizeProduct) : [];
    normalized.forEach((product) => adminDetailCache.set(product.slug, Promise.resolve(product)));
    return normalized;
  }),
  getAdmin: (slug) => cachedRequest(adminDetailCache, String(slug), async () => normalizeProduct(
    await apiRequest(`/admin/products/${encodeURIComponent(slug)}`),
  )),
  get: async (slug) => {
    const product = await cachedRequest(detailCache, String(slug), async () => normalizeProduct(
      await apiRequest(`/products/${encodeURIComponent(slug)}`),
    ));
    if (!isCustomerVisible(product)) throw new ApiError('Product was not found.', 404, 'PRODUCT_NOT_FOUND');
    return product;
  },
  create: async (data) => {
    const product = normalizeProduct(await apiRequest('/products', { method: 'POST', body: data }));
    listCache.clear();
    adminListCache.clear();
    detailCache.clear();
    adminDetailCache.clear();
    return product;
  },
  update: async (id, data) => {
    const product = normalizeProduct(await apiRequest(`/products/${encodeURIComponent(id)}`, { method: 'PUT', body: data }));
    listCache.clear();
    adminListCache.clear();
    detailCache.clear();
    adminDetailCache.clear();
    return product;
  },
  remove: async (id) => {
    await apiRequest(`/products/${encodeURIComponent(id)}`, { method: 'DELETE' });
    listCache.clear();
    adminListCache.clear();
    detailCache.clear();
    adminDetailCache.clear();
  },
  clearCache: () => {
    listCache.clear();
    adminListCache.clear();
    detailCache.clear();
    adminDetailCache.clear();
  },
};
