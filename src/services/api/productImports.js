import { API_URL, ApiError, apiRequest } from './client';

const fileRequest = async (file, mode) => {
  const body = new FormData();
  body.append('file', file);
  body.append('mode', mode);
  let response;
  try {
    response = await fetch(`${API_URL}/admin/products/import`, { method: 'POST', credentials: 'include', body });
  } catch (error) {
    throw new ApiError('Unable to reach the KICKZ.LK server.', 0, 'NETWORK_ERROR', error.message);
  }
  const payload = await response.json().catch(() => null);
  if (!response.ok) throw new ApiError(payload?.error?.message || 'CSV request failed.', response.status, payload?.error?.code || 'REQUEST_FAILED', payload?.error?.details);
  return payload.data;
};

const download = async (path, fallbackName) => {
  const response = await fetch(`${API_URL}${path}`, { credentials: 'include' });
  if (!response.ok) {
    const payload = await response.json().catch(() => null);
    throw new ApiError(payload?.error?.message || 'Download failed.', response.status, payload?.error?.code || 'REQUEST_FAILED');
  }
  const disposition = response.headers.get('content-disposition') || '';
  const fileName = disposition.match(/filename="([^"]+)"/)?.[1] || fallbackName;
  const url = URL.createObjectURL(await response.blob());
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = fileName;
  anchor.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
};

export const productImportsApi = {
  preview: (file) => fileRequest(file, 'preview'),
  import: (file) => fileRequest(file, 'import'),
  history: () => apiRequest('/admin/products/import/history'),
  downloadTemplate: () => download('/admin/products/import/template', 'kickz-product-import-template.csv'),
  downloadFailures: (id) => download(`/admin/products/import/history/${id}/failures.csv`, `kickz-import-${id}-failed-rows.csv`),
};
