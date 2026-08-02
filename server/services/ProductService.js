import AppError from '../utils/AppError.js';
import { requireFields } from '../utils/validation.js';

const productTypes = new Set(['Ready Stock', 'Pre Order']);
const slugify = (value) => String(value).toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
const resolveProductType = (payload) => typeof payload.preOrder === 'boolean'
  ? (payload.preOrder ? 'Pre Order' : 'Ready Stock')
  : (payload.productType || 'Ready Stock');
const normalize = (payload) => ({
  slug: slugify(payload.slug || payload.name),
  categoryId: payload.categoryId || null,
  brand: String(payload.brand).trim(),
  name: String(payload.name).trim(),
  description: String(payload.description).trim(),
  category: String(payload.category).trim(),
  price: Number(payload.price),
  sizes: payload.sizes,
  productType: resolveProductType(payload),
  deliveryTime: payload.deliveryTime?.trim() || null,
  availability: payload.availability?.trim() || 'Available',
  stock: Number(payload.stock || 0),
  metaTitle: payload.metaTitle?.trim() || null,
  metaDescription: payload.metaDescription?.trim() || null,
  images: payload.images || [],
  imageAltText: payload.imageAltText?.trim() || null,
  variations: payload.variations || [],
  productTag: payload.productTag?.trim() || null,
});

const validate = (payload) => {
  requireFields(payload, ['brand', 'name', 'description', 'category', 'price']);
  if (!Number.isFinite(Number(payload.price)) || Number(payload.price) < 0) throw new AppError('Product price must be valid.', 422, 'INVALID_PRICE');
  if (!Array.isArray(payload.sizes) || !payload.sizes.length) throw new AppError('At least one product size is required.', 422, 'INVALID_SIZES');
  const productType = resolveProductType(payload);
  if (!productTypes.has(productType)) throw new AppError('Product type must be Ready Stock or Pre Order.', 422, 'INVALID_PRODUCT_TYPE');
  if (!Number.isInteger(Number(payload.stock || 0)) || Number(payload.stock || 0) < 0) throw new AppError('Product stock must be a non-negative integer.', 422, 'INVALID_STOCK');
  if (payload.images !== undefined && !Array.isArray(payload.images)) throw new AppError('Product images must be an array.', 422, 'INVALID_IMAGES');
};

export default class ProductService {
  constructor(productModel) {
    this.productModel = productModel;
  }

  list(filters) { return this.productModel.findAll(filters); }

  async get(id) {
    const product = await this.productModel.findById(id);
    if (!product) throw new AppError('Product was not found.', 404, 'PRODUCT_NOT_FOUND');
    return product;
  }

  async create(payload) {
    validate(payload);
    return this.productModel.create(normalize(payload));
  }

  async update(id, payload) {
    const current = await this.get(id);
    const merged = {
      slug: current.id,
      categoryId: current.categoryId,
      brand: current.brand,
      name: current.name,
      description: current.description,
      category: current.category,
      price: current.price,
      sizes: current.sizes,
      productType: current.preOrder ? 'Pre Order' : 'Ready Stock',
      deliveryTime: current.deliveryTime,
      availability: current.availability,
      stock: current.stock,
      metaTitle: current.metaTitle,
      metaDescription: current.metaDescription,
      images: current.images,
      imageAltText: current.imageAltText,
      variations: current.variations,
      productTag: current.productTag,
      ...payload,
    };
    validate(merged);
    return this.productModel.update(id, normalize(merged));
  }

  async delete(id) {
    await this.get(id);
    await this.productModel.delete(id);
  }
}
