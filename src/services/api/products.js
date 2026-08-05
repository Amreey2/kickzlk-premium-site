import { apiRequest, resolveApiAssetUrl } from './client';

const listCache = new Map();
const detailCache = new Map();

const normalizeImage = (image, index, productName) => {
  const source = typeof image === 'string' ? { url: image } : (image || {});
  return {
    url: resolveApiAssetUrl(source.url || source.src),
    alt: source.alt || `${productName} sneaker view ${index + 1}`,
    position: Number(source.position || index + 1),
  };
};

// Keep the storefront isolated from database naming and from optional API metadata.
const normalizeProduct = (product) => {
  const id = String(product.id || product.slug || '');
  return {
    id,
    slug: String(product.slug || id),
    name: String(product.name || ''),
    brand: String(product.brand || ''),
    category: String(product.category || ''),
    price: Number(product.price || 0),
    images: Array.isArray(product.images)
      ? product.images.map((image, index) => normalizeImage(image, index, product.name)).sort((a, b) => a.position - b.position)
      : [],
    sizes: Array.isArray(product.sizes) ? product.sizes.map(String) : [],
    description: String(product.description || ''),
    preOrder: Boolean(product.preOrder),
    stock: Number(product.stock || 0),
  };
};

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
    });
  },
  get: (slug) => cachedRequest(detailCache, String(slug), async () => normalizeProduct(
    await apiRequest(`/products/${encodeURIComponent(slug)}`),
  )),
  create: (data) => apiRequest('/products', { method: 'POST', body: data }),
  update: (id, data) => apiRequest(`/products/${id}`, { method: 'PUT', body: data }),
  remove: (id) => apiRequest(`/products/${id}`, { method: 'DELETE' }),
};
