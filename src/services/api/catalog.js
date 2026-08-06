import { apiRequest, resolveApiAssetUrl } from './client';

const normalizeBrand = (brand) => ({
  id: Number(brand.id), name: String(brand.name || ''), status: String(brand.status || 'Active'),
  logoImage: brand.logoImage ? resolveApiAssetUrl(brand.logoImage) : '', storageLogoImage: brand.logoImage || '',
  metaTitle: String(brand.metaTitle || ''), metaDescription: String(brand.metaDescription || ''),
});
const normalizeCategory = (category) => ({
  id: Number(category.id), name: String(category.name || ''), status: String(category.status || 'Active'),
  image: category.image ? resolveApiAssetUrl(category.image) : '', storageImage: category.image || '',
  metaTitle: String(category.metaTitle || ''), metaDescription: String(category.metaDescription || ''),
  type: String(category.type || ''), gender: String(category.gender || ''), collection: String(category.collection || ''),
});
const mutate = async (path, method, data, normalize) => normalize(await apiRequest(path, { method, body: data }));

export const catalogApi = {
  brands: async () => (await apiRequest('/brands')).map(normalizeBrand),
  categories: async () => (await apiRequest('/categories')).map(normalizeCategory),
  options: () => apiRequest('/catalog-options'),
  adminBrands: async () => (await apiRequest('/admin/brands')).map(normalizeBrand),
  createBrand: (data) => mutate('/admin/brands', 'POST', data, normalizeBrand),
  updateBrand: (id, data) => mutate(`/admin/brands/${id}`, 'PUT', data, normalizeBrand),
  deleteBrand: (id) => apiRequest(`/admin/brands/${id}`, { method: 'DELETE' }),
  adminCategories: async () => (await apiRequest('/admin/categories')).map(normalizeCategory),
  createCategory: (data) => mutate('/admin/categories', 'POST', data, normalizeCategory),
  updateCategory: (id, data) => mutate(`/admin/categories/${id}`, 'PUT', data, normalizeCategory),
  deleteCategory: (id) => apiRequest(`/admin/categories/${id}`, { method: 'DELETE' }),
  adminOptions: () => apiRequest('/admin/catalog-options'),
  createOption: (data) => apiRequest('/admin/catalog-options', { method: 'POST', body: data }),
};
