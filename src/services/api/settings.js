import { apiRequest } from './client';

export const settingsApi = {
  sizeGuide: () => apiRequest('/size-guide'),
  updateSizeGuide: (data) => apiRequest('/admin/size-guide', { method: 'PUT', body: data }),
  paymentSettings: () => apiRequest('/payment-settings'),
  updatePaymentSettings: (data) => apiRequest('/admin/payment-settings', { method: 'PUT', body: data }),
  homepageMedia: () => apiRequest('/homepage-media'),
  adminHomepageMedia: () => apiRequest('/admin/homepage-media'),
  updateHomepageMedia: (items) => apiRequest('/admin/homepage-media', { method: 'PUT', body: { items } }),
};
