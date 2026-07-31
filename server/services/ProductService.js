import AppError from '../utils/AppError.js';
import { requireFields } from '../utils/validation.js';

const productTypes = new Set(['Ready Stock', 'Pre Order']);
const normalize = (payload) => ({
  categoryId: payload.categoryId || null,
  brand: String(payload.brand).trim(),
  name: String(payload.name).trim(),
  description: String(payload.description).trim(),
  category: String(payload.category).trim(),
  price: Number(payload.price),
  sizes: payload.sizes,
  productType: payload.productType,
  deliveryTime: payload.deliveryTime?.trim() || null,
  availability: payload.availability?.trim() || 'Available',
  metaTitle: payload.metaTitle?.trim() || null,
  metaDescription: payload.metaDescription?.trim() || null,
  images: payload.images || [],
  imageAltText: payload.imageAltText?.trim() || null,
  variations: payload.variations || [],
  productTag: payload.productTag?.trim() || null,
});

const validate = (payload) => {
  requireFields(payload, ['brand', 'name', 'description', 'category', 'price', 'productType']);
  if (!Number.isFinite(Number(payload.price)) || Number(payload.price) < 0) throw new AppError('Product price must be valid.', 422, 'INVALID_PRICE');
  if (!Array.isArray(payload.sizes) || !payload.sizes.length) throw new AppError('At least one product size is required.', 422, 'INVALID_SIZES');
  if (!productTypes.has(payload.productType)) throw new AppError('Product type must be Ready Stock or Pre Order.', 422, 'INVALID_PRODUCT_TYPE');
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
      categoryId: current.category_id,
      brand: current.brand,
      name: current.name,
      description: current.description,
      category: current.category,
      price: current.price,
      sizes: current.size,
      productType: current.product_type,
      deliveryTime: current.delivery_time,
      availability: current.availability,
      metaTitle: current.meta_title,
      metaDescription: current.meta_description,
      images: current.images,
      imageAltText: current.image_alt_text,
      variations: current.variations,
      productTag: current.product_tag,
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
