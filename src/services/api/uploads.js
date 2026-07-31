import { apiRequest } from './client';

export const uploadsApi = {
  productImages: (files) => {
    const form = new FormData();
    Array.from(files).forEach((file) => form.append('images', file));
    return apiRequest('/uploads/products', { method: 'POST', body: form });
  },
};
