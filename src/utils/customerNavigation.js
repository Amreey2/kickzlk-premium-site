export const safeCustomerNext = (value, fallback = '/account') => {
  if (!value || typeof value !== 'string' || !value.startsWith('/') || value.startsWith('//')) return fallback;
  return value;
};

export const currentNext = (fallback = '/account') => {
  const value = new URLSearchParams(window.location.search).get('next');
  return safeCustomerNext(value, fallback);
};
