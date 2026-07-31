const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace(/\/$/, '');

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
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
    credentials: 'include',
    body: options.body && !(options.body instanceof FormData) ? JSON.stringify(options.body) : options.body,
  });
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
