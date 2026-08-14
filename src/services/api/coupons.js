import { apiRequest } from './client';

export const couponsApi = {
  adminList: () => apiRequest('/admin/coupons'),
  create: (data) => apiRequest('/admin/coupons', { method: 'POST', body: data }),
  update: (id, data) => apiRequest(`/admin/coupons/${id}`, { method: 'PUT', body: data }),
  archive: (id) => apiRequest(`/admin/coupons/${id}`, { method: 'DELETE' }),
};
