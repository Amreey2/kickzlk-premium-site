const CART_KEY = 'kickz_cart_v1';
export const CART_EVENT = 'kickz:cart-change';

const sanitize = (items) => (Array.isArray(items) ? items : []).map((item) => ({
  productId: String(item.productId || ''), selectedSize: String(item.selectedSize || ''),
  selectedColor: String(item.selectedColor || ''), quantity: Math.min(10, Math.max(1, Number(item.quantity) || 1)),
})).filter((item) => item.productId && item.selectedSize);

export const readCart = () => {
  try { return sanitize(JSON.parse(localStorage.getItem(CART_KEY) || '[]')); } catch { return []; }
};

export const writeCart = (items) => {
  const clean = sanitize(items);
  localStorage.setItem(CART_KEY, JSON.stringify(clean));
  window.dispatchEvent(new CustomEvent(CART_EVENT, { detail: clean }));
  return clean;
};

export const addCartItem = (item) => {
  const items = readCart();
  const index = items.findIndex((existing) => existing.productId === item.productId
    && existing.selectedSize === item.selectedSize && existing.selectedColor === (item.selectedColor || ''));
  if (index >= 0) items[index] = { ...items[index], quantity: Math.min(10, items[index].quantity + (item.quantity || 1)) };
  else items.push({ ...item, quantity: item.quantity || 1 });
  return writeCart(items);
};

export const clearCart = () => writeCart([]);
export const cartCount = (items = readCart()) => items.reduce((total, item) => total + item.quantity, 0);
export const cartKey = (item) => `${item.productId}\u0000${item.selectedSize}\u0000${item.selectedColor || ''}`;
