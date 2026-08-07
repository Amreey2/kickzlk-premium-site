import { productDunk } from '../assets';

export const formatProductPrice = (price) => `LKR ${Number(price || 0).toLocaleString('en-LK')}`;

export const productImage = (product, index = 0) => product?.images?.[index]?.url || productDunk;
export const productImageAlt = (product, index = 0) => product?.images?.[index]?.alt || `${product?.brand || ''} ${product?.name || 'KICKZ.LK'} sneaker`;

export const productGallery = (product, color) => {
  const variant = product?.colorVariants?.find((item) => item.color.toLowerCase() === String(color || '').toLowerCase());
  return variant?.images?.length ? variant.images : (product?.images || []);
};

export const replaceFailedProductImage = (event) => {
  if (event.currentTarget.dataset.fallbackApplied) return;
  event.currentTarget.dataset.fallbackApplied = 'true';
  event.currentTarget.src = productDunk;
};

export const productAvailability = (product) => {
  if (product.status === 'Out of Stock') return 'OUT OF STOCK';
  if (product.preOrder) return 'PRE-ORDER';
  return product.stock > 0 ? 'AVAILABLE' : 'OUT OF STOCK';
};

export const productDeliveryTime = (product) => product.preOrder ? '14–28 days' : '3–5 days';

const tagPriority = new Map([
  ['limited edition', 10],
  ['exclusive', 20],
  ['new arrival', 30],
  ['new drop', 40],
  ['luxury', 50],
  ['sale', 60],
  ['pre-order', 90],
  ['pre order', 90],
]);

export const productTags = (product) => {
  const seen = new Set();
  return (Array.isArray(product?.productTags) ? product.productTags : [])
    .map((tag, index) => ({ value: String(tag).trim(), index }))
    .filter(({ value }) => {
      const key = value.toLowerCase();
      if (!value || seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .sort((a, b) => (tagPriority.get(a.value.toLowerCase()) ?? 70) - (tagPriority.get(b.value.toLowerCase()) ?? 70) || a.index - b.index)
    .map(({ value }) => value);
};

export const categoryGenderLabel = (product) => ({
  Men: "MEN'S",
  Women: "WOMEN'S",
  Kids: "KIDS'",
  Unisex: 'UNISEX',
}[product?.categoryGender] || '');

export const productSizesLabel = (product) => {
  if (!product.sizes?.length) return 'SIZE ENQUIRY';
  return product.sizes.length === 1 ? product.sizes[0] : `${product.sizes[0]}–${product.sizes.at(-1)}`;
};
