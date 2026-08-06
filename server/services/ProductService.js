import AppError from '../utils/AppError.js';
import { requireFields } from '../utils/validation.js';

const productTypes = new Set(['Ready Stock', 'Pre Order']);
const SKU_PATTERN = /^[A-Z0-9][A-Z0-9_-]{1,99}$/;
const list = (value) => {
  const seen = new Set();
  return (Array.isArray(value) ? value : []).map((item) => String(item).trim()).filter((item) => {
    const key = item.toLowerCase();
    if (!item || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};
const validUrl = (value) => {
  try { return ['http:', 'https:'].includes(new URL(value).protocol); } catch { return false; }
};
const slugify = (value) => String(value).toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
const resolveProductType = (payload) => typeof payload.preOrder === 'boolean'
  ? (payload.preOrder ? 'Pre Order' : 'Ready Stock')
  : (payload.productType || 'Ready Stock');
const normalize = (payload) => ({
  slug: slugify(payload.slug || payload.name),
  sku: String(payload.sku).trim().toUpperCase(),
  brandId: Number(payload.brandId),
  categoryId: Number(payload.categoryId),
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
  metaTitle: String(payload.metaTitle || '').trim() || null,
  metaDescription: String(payload.metaDescription || '').trim() || null,
  images: payload.images || [],
  imageAltText: String(payload.imageAltText || '').trim() || null,
  variations: payload.variations || [],
  productTag: payload.productTag?.trim() || null,
  productTags: list(payload.productTags),
  colorVariations: list(payload.colorVariations),
  cdnImages: list(payload.cdnImages),
});

const validate = (payload) => {
  requireFields(payload, ['sku', 'brand', 'brandId', 'name', 'description', 'category', 'categoryId', 'price']);
  if (!SKU_PATTERN.test(String(payload.sku).trim().toUpperCase())) throw new AppError('SKU must contain 2–100 letters, numbers, hyphens, or underscores.', 422, 'INVALID_SKU');
  if (!Number.isFinite(Number(payload.price)) || Number(payload.price) < 0) throw new AppError('Product price must be valid.', 422, 'INVALID_PRICE');
  if (!Array.isArray(payload.sizes) || !payload.sizes.length) throw new AppError('At least one product size is required.', 422, 'INVALID_SIZES');
  const productType = resolveProductType(payload);
  if (!productTypes.has(productType)) throw new AppError('Product type must be Ready Stock or Pre Order.', 422, 'INVALID_PRODUCT_TYPE');
  if (!Number.isInteger(Number(payload.stock || 0)) || Number(payload.stock || 0) < 0) throw new AppError('Product stock must be a non-negative integer.', 422, 'INVALID_STOCK');
  if (payload.images !== undefined && !Array.isArray(payload.images)) throw new AppError('Product images must be an array.', 422, 'INVALID_IMAGES');
  if (!Array.isArray(payload.productTags) || list(payload.productTags).some((value) => value.length > 60 || /[,\r\n]/.test(value))) throw new AppError('Product tags must be valid values with a maximum of 60 characters each.', 422, 'INVALID_PRODUCT_TAGS');
  if (!Array.isArray(payload.colorVariations) || list(payload.colorVariations).some((value) => value.length > 60 || /[,\r\n]/.test(value))) throw new AppError('Colours must be valid values with a maximum of 60 characters each.', 422, 'INVALID_COLORS');
  if (String(payload.metaTitle).trim().length > 255) throw new AppError('Meta title cannot exceed 255 characters.', 422, 'INVALID_META_TITLE');
  if (String(payload.metaDescription).trim().length > 320) throw new AppError('Meta description cannot exceed 320 characters.', 422, 'INVALID_META_DESCRIPTION');
  if (String(payload.imageAltText).trim().length > 255) throw new AppError('Image alt text cannot exceed 255 characters.', 422, 'INVALID_IMAGE_ALT_TEXT');
  if (payload.cdnImages !== undefined && (!Array.isArray(payload.cdnImages) || payload.cdnImages.some((url) => !validUrl(String(url).trim())))) throw new AppError('CDN images must contain valid HTTP or HTTPS URLs.', 422, 'INVALID_IMAGE_URL');
};

export default class ProductService {
  constructor({ productModel, brandModel, categoryModel }) {
    this.productModel = productModel;
    this.brandModel = brandModel;
    this.categoryModel = categoryModel;
  }

  list(filters) { return this.productModel.findAll(filters); }

  async get(id) {
    const product = await this.productModel.findById(id);
    if (!product) throw new AppError('Product was not found.', 404, 'PRODUCT_NOT_FOUND');
    return product;
  }

  async create(payload) {
    validate(payload);
    await this.validateRelations(payload);
    if (await this.productModel.findBySku(String(payload.sku).trim().toUpperCase())) throw new AppError('A product with this SKU already exists.', 409, 'SKU_EXISTS');
    return this.productModel.create(normalize(payload));
  }

  async update(id, payload) {
    const current = await this.get(id);
    const merged = {
      slug: current.id,
      sku: current.sku,
      brandId: current.brandId,
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
      productTags: current.productTags,
      colorVariations: current.colorVariations,
      cdnImages: current.cdnImages,
      ...payload,
    };
    validate(merged);
    await this.validateRelations(merged);
    const duplicate = await this.productModel.findBySku(String(merged.sku).trim().toUpperCase());
    if (duplicate && duplicate.id !== current.id) throw new AppError('A product with this SKU already exists.', 409, 'SKU_EXISTS');
    return this.productModel.update(id, normalize(merged));
  }

  async delete(id) {
    await this.get(id);
    await this.productModel.delete(id);
  }

  async validateRelations(payload) {
    const brand = await this.brandModel.findById(payload.brandId);
    if (!brand || brand.status !== 'Active' || brand.name !== String(payload.brand).trim()) throw new AppError('Select an active catalogue brand.', 422, 'INVALID_BRAND');
    const category = await this.categoryModel.findById(payload.categoryId);
    if (!category || category.status !== 'Active' || category.name !== String(payload.category).trim()) throw new AppError('Select an active catalogue category.', 422, 'INVALID_CATEGORY');
  }
}
