import { ApiError, apiRequest, resolveApiAssetUrl } from './client';

const listCache = new Map();
const detailCache = new Map();

const normalizeImage = (image, index, productName) => {
  const source = typeof image === 'string' ? { url: image } : (image || {});
  return {
    url: resolveApiAssetUrl(source.url || source.src),
    storageUrl: source.storageUrl || source.url || source.src || '',
    alt: source.alt || `${productName} sneaker view ${index + 1}`,
    position: Number(source.position || index + 1),
  };
};

// Keep the storefront isolated from database naming and from optional API metadata.
const normalizeProduct = (product) => {
  const id = String(product.id || product.slug || '');
  const availability = String(product.availability || 'Active');
  const status = availability.toLowerCase() === 'inactive'
    ? 'Inactive'
    : availability.toLowerCase() === 'out of stock'
      ? 'Out of Stock'
      : 'Active';
  const uploadedImages = Array.isArray(product.images)
    ? product.images.map((image, index) => normalizeImage(image, index, product.name))
    : [];
  const cdnImages = Array.isArray(product.cdnImages) ? product.cdnImages.map(String) : [];
  return {
    id,
    slug: String(product.slug || id),
    sku: String(product.sku || ''),
    name: String(product.name || ''),
    brand: String(product.brand || ''),
    brandId: Number(product.brandId || 0),
    category: String(product.category || ''),
    categoryId: Number(product.categoryId || 0),
    price: Number(product.price || 0),
    images: [...uploadedImages, ...cdnImages.map((url, index) => normalizeImage({ url, alt: product.imageAltText }, uploadedImages.length + index, product.name))].sort((a, b) => a.position - b.position),
    uploadedImages,
    cdnImages,
    sizes: Array.isArray(product.sizes) ? product.sizes.map(String) : [],
    description: String(product.description || ''),
    preOrder: Boolean(product.preOrder),
    stock: Number(product.stock || 0),
    status,
    availability,
    deliveryTime: String(product.deliveryTime || ''),
    productTags: Array.isArray(product.productTags) ? product.productTags.map(String) : [],
    colorVariations: Array.isArray(product.colorVariations) ? product.colorVariations.map(String) : [],
    metaTitle: String(product.metaTitle || ''),
    metaDescription: String(product.metaDescription || ''),
    imageAltText: String(product.imageAltText || ''),
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
  adminList: () => cachedRequest(listCache, '', async () => {
    const products = await apiRequest('/admin/products');
    const normalized = Array.isArray(products) ? products.map(normalizeProduct) : [];
    normalized.forEach((product) => detailCache.set(product.slug, Promise.resolve(product)));
    return normalized;
  }),
  getAdmin: (slug) => cachedRequest(detailCache, String(slug), async () => normalizeProduct(
    await apiRequest(`/admin/products/${encodeURIComponent(slug)}`),
  )),
  get: async (slug) => {
    const product = await productsApi.getAdmin(slug);
    if (!isCustomerVisible(product)) throw new ApiError('Product was not found.', 404, 'PRODUCT_NOT_FOUND');
    return product;
  },
  create: async (data) => {
    const product = normalizeProduct(await apiRequest('/products', { method: 'POST', body: data }));
    listCache.clear();
    detailCache.clear();
    return product;
  },
  update: async (id, data) => {
    const product = normalizeProduct(await apiRequest(`/products/${encodeURIComponent(id)}`, { method: 'PUT', body: data }));
    listCache.clear();
    detailCache.clear();
    return product;
  },
  remove: async (id) => {
    await apiRequest(`/products/${encodeURIComponent(id)}`, { method: 'DELETE' });
    listCache.clear();
    detailCache.clear();
  },
  clearCache: () => {
    listCache.clear();
    detailCache.clear();
  },
};
