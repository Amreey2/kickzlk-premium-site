import {
  productBlue,
  productDunk,
  productJordan,
  productLuxury,
  productNewBalance,
  productYeezy,
} from '../assets';
import catalog from './products.json';

const imageAssets = {
  productBlue,
  productDunk,
  productJordan,
  productLuxury,
  productNewBalance,
  productYeezy,
};

export const formatPrice = (price) => `LKR ${price.toLocaleString('en-LK')}`;

/* SPRINT 3.1 LOCAL CATALOG ADAPTER
   JSON remains backend-ready while this small adapter resolves Vite-managed image assets for the frontend. */
export const products = catalog.map((product, index) => ({
  ...product,
  images: product.images.map((image) => imageAssets[image]),
  image: imageAssets[product.images[0]],
  alt: `${product.brand} ${product.name} sneaker`,
  badge: product.availability.toUpperCase(),
  badgeClass: product.availability === 'New Drop'
    ? 'badge--acid'
    : product.availability === 'Pre-Order'
      ? 'badge--sand'
      : product.availability === 'Luxury'
        ? 'badge--gold'
        : product.availability === 'Trending'
          ? 'badge--mint'
          : '',
  priceLabel: formatPrice(product.price),
  sizesLabel: product.sizes.length === 1 ? product.sizes[0] : `${product.sizes[0]}–${product.sizes.at(-1)}`,
  ariaLabel: `View ${product.name}`,
  loading: index === 0 ? 'eager' : 'lazy',
  delay: (index % 3) * 70,
}));

export const getProductById = (id) => products.find((product) => product.id === id);
