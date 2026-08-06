// Development uses Vite's same-origin proxy by default. Deployments can point
// VITE_API_URL at a dedicated API origin without changing application code.
export const API_URL = (import.meta.env.VITE_API_URL || '/api').replace(/\/$/, '');

// Product media may be hosted by the API today and a CDN later.
export function resolveApiAssetUrl(value) {
  if (!value) return '';
  if (/^(https?:|data:|blob:)/i.test(value)) return value;
  const apiUrl = new URL(API_URL, window.location.origin);
  return new URL(value.startsWith('/') ? value : `/${value}`, apiUrl.origin).href;
}

export class ApiError extends Error {
  constructor(message, status, code, details) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export async function apiRequest(path, options = {}) {
  const headers = new Headers(options.headers);
  if (options.body && !(options.body instanceof FormData)) headers.set('Content-Type', 'application/json');
  let response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      ...options,
      headers,
      credentials: 'include',
      body: options.body && !(options.body instanceof FormData) ? JSON.stringify(options.body) : options.body,
    });
  } catch (error) {
    throw new ApiError(
      'Unable to reach the KICKZ.LK server. Check the API connection and try again.',
      0,
      'NETWORK_ERROR',
      error instanceof Error ? error.message : String(error),
    );
  }
  if (response.status === 204) return null;
  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    throw new ApiError(
      payload?.error?.message || 'The request could not be completed.',
      response.status,
      payload?.error?.code || 'REQUEST_FAILED',
      payload?.error?.details,
    );
  }
  return payload.data;
}
