import { apiRequest } from './client';

export const authApi = {
  session: () => apiRequest('/auth/session'),
  register: (data) => apiRequest('/auth/register', { method: 'POST', body: data }),
  login: (data) => apiRequest('/auth/login', { method: 'POST', body: data }),
  logout: () => apiRequest('/auth/logout', { method: 'POST' }),
  profile: () => apiRequest('/auth/profile'),
  updateProfile: (data) => apiRequest('/auth/profile', { method: 'PUT', body: data }),
  addresses: () => apiRequest('/auth/addresses'),
  createAddress: (data) => apiRequest('/auth/addresses', { method: 'POST', body: data }),
  updateAddress: (id, data) => apiRequest(`/auth/addresses/${id}`, { method: 'PUT', body: data }),
  deleteAddress: (id) => apiRequest(`/auth/addresses/${id}`, { method: 'DELETE' }),
  forgotPassword: (email) => apiRequest('/auth/forgot-password', { method: 'POST', body: { email } }),
  resetPassword: (token, password) => apiRequest('/auth/reset-password', { method: 'POST', body: { token, password } }),
  adminLogin: (data) => apiRequest('/admin/login', { method: 'POST', body: data }),
};
