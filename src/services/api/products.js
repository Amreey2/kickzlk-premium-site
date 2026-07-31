import { apiRequest } from './client';

export const productsApi = {
  list: (filters = {}) => {
    const query = new URLSearchParams(Object.entries(filters).filter(([, value]) => value)).toString();
    return apiRequest(`/products${query ? `?${query}` : ''}`);
  },
  get: (id) => apiRequest(`/products/${id}`),
  create: (data) => apiRequest('/products', { method: 'POST', body: data }),
  update: (id, data) => apiRequest(`/products/${id}`, { method: 'PUT', body: data }),
  remove: (id) => apiRequest(`/products/${id}`, { method: 'DELETE' }),
};
