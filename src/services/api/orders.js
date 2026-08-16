import { apiRequest } from './client';

export const ordersApi = {
  quote: (data) => apiRequest('/orders/quote', { method: 'POST', body: data }),
  create: (data) => apiRequest('/orders', { method: 'POST', body: data }),
  get: (id, verification = {}) => {
    const query = new URLSearchParams(verification).toString();
    return apiRequest(`/orders/${id}${query ? `?${query}` : ''}`);
  },
  forUser: (userId) => apiRequest(`/orders/user/${userId}`),
  adminList: () => apiRequest('/admin/orders'),
  adminCustomers: (query = '') => apiRequest(`/admin/customers/search?q=${encodeURIComponent(query)}`),
  adminQuote: (data) => apiRequest('/admin/orders/quote', { method: 'POST', body: data }),
  adminCreate: (data) => apiRequest('/admin/orders', { method: 'POST', body: data }),
  updateStatus: (id, status, note) => apiRequest(`/admin/orders/${id}/status`, {
    method: 'PUT',
    body: { status, note },
  }),
};
