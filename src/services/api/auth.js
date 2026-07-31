import { apiRequest } from './client';

export const authApi = {
  register: (data) => apiRequest('/auth/register', { method: 'POST', body: data }),
  login: (data) => apiRequest('/auth/login', { method: 'POST', body: data }),
  profile: () => apiRequest('/auth/profile'),
  adminLogin: (data) => apiRequest('/admin/login', { method: 'POST', body: data }),
};
