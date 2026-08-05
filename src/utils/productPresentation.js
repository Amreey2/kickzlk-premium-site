import { productDunk } from '../assets';

export const formatProductPrice = (price) => `LKR ${Number(price || 0).toLocaleString('en-LK')}`;

export const productImage = (product, index = 0) => product?.images?.[index]?.url || productDunk;
export const productImageAlt = (product, index = 0) => product?.images?.[index]?.alt || `${product?.brand || ''} ${product?.name || 'KICKZ.LK'} sneaker`;

export const replaceFailedProductImage = (event) => {
  if (event.currentTarget.dataset.fallbackApplied) return;
  event.currentTarget.dataset.fallbackApplied = 'true';
  event.currentTarget.src = productDunk;
};

export const productAvailability = (product) => {
  if (product.preOrder) return 'PRE-ORDER';
  return product.stock > 0 ? 'AVAILABLE' : 'OUT OF STOCK';
};

export const productDeliveryTime = (product) => product.preOrder ? '14–28 days' : '3–5 days';

export const productBadgeClass = (product) => {
  if (product.preOrder) return 'badge--sand';
  if (product.stock > 0) return 'badge--acid';
  return '';
};

export const productSizesLabel = (product) => {
  if (!product.sizes?.length) return 'SIZE ENQUIRY';
  const prefix = product.brand === 'Balmain' ? 'EU' : 'US';
  return `${prefix} ${product.sizes[0]}–${product.sizes.at(-1)}`;
};
