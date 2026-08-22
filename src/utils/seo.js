import logoIcon from '../assets/logo-icon.webp';
import { productImage, productImageAlt } from './productPresentation';

export const SITE_ORIGIN = String(import.meta.env.VITE_SITE_URL || 'https://kickz.lk').replace(/\/$/, '');
export const SITE_NAME = 'KICKZ.LK';
export const DEFAULT_TITLE = 'KICKZ.LK | Authentic Sneakers in Sri Lanka';
export const DEFAULT_DESCRIPTION = 'Shop authentic sneakers and curated global drops from KICKZ.LK, sourced for sneaker culture in Sri Lanka.';

export const slugifySeo = (value) => String(value || '').toLowerCase().normalize('NFKD')
  .replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

export const absoluteSeoUrl = (value = '/') => {
  if (/^https?:\/\//i.test(value)) return value;
  return new URL(value.startsWith('/') ? value : `/${value}`, `${SITE_ORIGIN}/`).href;
};

export const fallbackImage = () => absoluteSeoUrl(logoIcon);

export const productSeo = (product) => {
  const canonicalPath = `/product/${product.slug || product.id}`;
  const title = product.metaTitle || `${product.name} | ${product.brand} | ${SITE_NAME}`;
  const description = product.metaDescription || `${product.name} by ${product.brand}. Shop authentic ${product.category || 'sneakers'} from KICKZ.LK in Sri Lanka.`;
  const primaryImage = productImage(product);
  const hasIndexableImage = Boolean(primaryImage) && !/^(data:|blob:)/i.test(primaryImage);
  const productImageUrl = hasIndexableImage ? absoluteSeoUrl(primaryImage) : null;
  const image = productImageUrl || fallbackImage();
  const availability = product.preOrder
    ? 'https://schema.org/PreOrder'
    : product.stock > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock';
  const categoryPath = `/category/${slugifySeo(product.category)}`;
  const brandPath = `/brand/${slugifySeo(product.brand)}`;
  return {
    title,
    description,
    canonicalPath,
    image,
    type: 'product',
    jsonLd: [
      {
        '@context': 'https://schema.org',
        '@type': 'Product',
        name: product.name,
        description: product.metaDescription || product.description || description,
        ...(productImageUrl ? { image: [productImageUrl] } : {}),
        url: absoluteSeoUrl(canonicalPath),
        sku: product.sku,
        brand: { '@type': 'Brand', name: product.brand },
        category: product.category,
        offers: {
          '@type': 'Offer',
          url: absoluteSeoUrl(canonicalPath),
          priceCurrency: 'LKR',
          price: Number(product.price).toFixed(2),
          availability,
          itemCondition: 'https://schema.org/NewCondition',
        },
      },
      breadcrumbSchema([
        ['Home', '/'],
        [product.category || 'Categories', categoryPath],
        [product.brand, brandPath],
        [product.name, canonicalPath],
      ]),
    ],
    imageAlt: productImageAlt(product),
  };
};

export const breadcrumbSchema = (items) => ({
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: items.map(([name, path], index) => ({
    '@type': 'ListItem',
    position: index + 1,
    name,
    item: absoluteSeoUrl(path),
  })),
});

export const organizationSchema = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: SITE_NAME,
  url: absoluteSeoUrl('/'),
};

export const websiteSchema = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: SITE_NAME,
  url: absoluteSeoUrl('/'),
};
