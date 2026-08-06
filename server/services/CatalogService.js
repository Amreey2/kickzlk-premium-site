import AppError from '../utils/AppError.js';
import { requireFields } from '../utils/validation.js';

const statuses = new Set(['Active', 'Inactive']);
const optionKinds = new Set(['type', 'gender', 'collection']);
const validUrl = (value) => {
  if (!value) return true;
  try { return ['http:', 'https:'].includes(new URL(value).protocol); } catch { return false; }
};
const text = (value) => String(value || '').trim();
const validateCommon = (payload, imageField) => {
  requireFields(payload, ['name', 'metaTitle', 'metaDescription']);
  if (text(payload.name).length > 150) throw new AppError('Name cannot exceed 150 characters.', 422, 'INVALID_NAME');
  if (!statuses.has(payload.status || 'Active')) throw new AppError('Status must be Active or Inactive.', 422, 'INVALID_STATUS');
  if (text(payload.metaTitle).length > 255) throw new AppError('Meta title cannot exceed 255 characters.', 422, 'INVALID_META_TITLE');
  if (text(payload.metaDescription).length > 320) throw new AppError('Meta description cannot exceed 320 characters.', 422, 'INVALID_META_DESCRIPTION');
  if (!validUrl(text(payload[imageField]))) throw new AppError('Image must be a valid HTTP or HTTPS URL.', 422, 'INVALID_IMAGE_URL');
};

export default class CatalogService {
  constructor({ brandModel, categoryModel, optionModel }) {
    this.brandModel = brandModel;
    this.categoryModel = categoryModel;
    this.optionModel = optionModel;
  }

  listBrands(activeOnly = false) { return this.brandModel.list({ activeOnly }); }
  listCategories(activeOnly = false) { return this.categoryModel.list({ activeOnly }); }
  listOptions(activeOnly = false) { return this.optionModel.list({ activeOnly }); }

  async createBrand(payload) {
    validateCommon(payload, 'logoImage');
    if (await this.brandModel.findByName(text(payload.name))) throw new AppError('A brand with this name already exists.', 409, 'BRAND_EXISTS');
    return this.brandModel.create(this.brandData(payload));
  }

  async updateBrand(id, payload) {
    const current = await this.brandModel.findById(id);
    if (!current) throw new AppError('Brand was not found.', 404, 'BRAND_NOT_FOUND');
    const merged = { ...current, ...payload };
    validateCommon(merged, 'logoImage');
    const duplicate = await this.brandModel.findByName(text(merged.name));
    if (duplicate && duplicate.id !== current.id) throw new AppError('A brand with this name already exists.', 409, 'BRAND_EXISTS');
    return this.brandModel.update(id, this.brandData(merged));
  }

  async deleteBrand(id) {
    if (!await this.brandModel.findById(id)) throw new AppError('Brand was not found.', 404, 'BRAND_NOT_FOUND');
    if (await this.brandModel.hasProducts(id)) throw new AppError('Deactivate this brand instead; it is used by products.', 409, 'BRAND_IN_USE');
    await this.brandModel.delete(id);
  }

  async createCategory(payload) {
    await this.validateCategory(payload);
    if (await this.categoryModel.findByName(text(payload.name))) throw new AppError('A category with this name already exists.', 409, 'CATEGORY_EXISTS');
    return this.categoryModel.create(this.categoryData(payload));
  }

  async updateCategory(id, payload) {
    const current = await this.categoryModel.findById(id);
    if (!current) throw new AppError('Category was not found.', 404, 'CATEGORY_NOT_FOUND');
    const merged = { ...current, ...payload };
    await this.validateCategory(merged);
    const duplicate = await this.categoryModel.findByName(text(merged.name));
    if (duplicate && duplicate.id !== current.id) throw new AppError('A category with this name already exists.', 409, 'CATEGORY_EXISTS');
    return this.categoryModel.update(id, this.categoryData(merged));
  }

  async deleteCategory(id) {
    if (!await this.categoryModel.findById(id)) throw new AppError('Category was not found.', 404, 'CATEGORY_NOT_FOUND');
    if (await this.categoryModel.hasProducts(id)) throw new AppError('Deactivate this category instead; it is used by products.', 409, 'CATEGORY_IN_USE');
    await this.categoryModel.delete(id);
  }

  async createOption(payload) {
    requireFields(payload, ['kind', 'value']);
    if (!optionKinds.has(payload.kind)) throw new AppError('Catalogue option kind is invalid.', 422, 'INVALID_OPTION_KIND');
    const value = text(payload.value);
    if (value.length > 150) throw new AppError('Catalogue option cannot exceed 150 characters.', 422, 'INVALID_OPTION');
    if (await this.optionModel.find(payload.kind, value)) throw new AppError('This catalogue option already exists.', 409, 'OPTION_EXISTS');
    return this.optionModel.create({ kind: payload.kind, value, status: 'Active' });
  }

  brandData(payload) {
    return { name: text(payload.name), status: payload.status || 'Active', logoImage: text(payload.logoImage) || null, metaTitle: text(payload.metaTitle), metaDescription: text(payload.metaDescription) };
  }

  categoryData(payload) {
    return { name: text(payload.name), status: payload.status || 'Active', image: text(payload.image) || null, metaTitle: text(payload.metaTitle), metaDescription: text(payload.metaDescription), type: text(payload.type) || null, gender: text(payload.gender) || null, collection: text(payload.collection) || null };
  }

  async validateCategory(payload) {
    validateCommon(payload, 'image');
    for (const kind of optionKinds) {
      if (payload[kind] && !(await this.optionModel.find(kind, text(payload[kind])))) throw new AppError(`Select a valid category ${kind}.`, 422, 'INVALID_CATEGORY_OPTION');
    }
  }
}
