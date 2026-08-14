import AppError from '../utils/AppError.js';

const text = (value) => String(value ?? '').trim();
const normalizeCode = (value) => text(value).toUpperCase();
const ids = (value) => [...new Set((Array.isArray(value) ? value : []).map(Number).filter((id) => Number.isInteger(id) && id > 0))];
const optionalPositiveInteger = (value, field) => {
  if (value === '' || value === null || value === undefined) return null;
  const number = Number(value);
  if (!Number.isInteger(number) || number < 1) throw new AppError(`${field} must be a positive whole number.`, 422, 'INVALID_COUPON_LIMIT');
  return number;
};
const customerKey = ({ customerId, email }) => customerId ? `customer:${customerId}` : text(email) ? `email:${text(email).toLowerCase()}` : null;

export default class CouponService {
  constructor({ couponModel, productModel, categoryModel }) {
    this.couponModel = couponModel; this.productModel = productModel; this.categoryModel = categoryModel;
  }

  list() { return this.couponModel.list(); }

  async data(payload, current = {}) {
    const merged = { ...current, ...payload };
    const code = normalizeCode(merged.code);
    const name = text(merged.name);
    if (!/^[A-Z0-9][A-Z0-9_-]{2,49}$/.test(code)) throw new AppError('Coupon code must contain 3–50 letters, numbers, hyphens, or underscores.', 422, 'INVALID_COUPON_CODE');
    if (!name || name.length > 150) throw new AppError('Coupon name must contain 1–150 characters.', 422, 'INVALID_COUPON_NAME');
    if (!['Percentage', 'Fixed'].includes(merged.discountType)) throw new AppError('Select Percentage or Fixed discount.', 422, 'INVALID_DISCOUNT_TYPE');
    const discountValue = Number(merged.discountValue);
    if (!Number.isFinite(discountValue) || discountValue <= 0 || (merged.discountType === 'Percentage' && discountValue > 100)) {
      throw new AppError('Enter a valid discount value.', 422, 'INVALID_DISCOUNT_VALUE');
    }
    if (!['Active', 'Inactive'].includes(merged.status || 'Active')) throw new AppError('Coupon status is invalid.', 422, 'INVALID_COUPON_STATUS');
    if (!['store', 'products', 'categories'].includes(merged.appliesTo || 'store')) throw new AppError('Coupon targeting is invalid.', 422, 'INVALID_COUPON_TARGET');
    const minimumOrderAmount = Number(merged.minimumOrderAmount || 0);
    if (!Number.isFinite(minimumOrderAmount) || minimumOrderAmount < 0) throw new AppError('Minimum order value cannot be negative.', 422, 'INVALID_MINIMUM_ORDER');
    const productIds = ids(merged.productIds); const categoryIds = ids(merged.categoryIds);
    if (merged.appliesTo === 'products' && !productIds.length) throw new AppError('Select at least one product.', 422, 'COUPON_PRODUCTS_REQUIRED');
    if (merged.appliesTo === 'categories' && !categoryIds.length) throw new AppError('Select at least one category.', 422, 'COUPON_CATEGORIES_REQUIRED');
    for (const id of productIds) if (!await this.productModel.findById(id)) throw new AppError('A selected product no longer exists.', 422, 'COUPON_PRODUCT_NOT_FOUND');
    for (const id of categoryIds) if (!await this.categoryModel.findById(id)) throw new AppError('A selected category no longer exists.', 422, 'COUPON_CATEGORY_NOT_FOUND');
    const startsAt = merged.startsAt ? new Date(merged.startsAt) : null;
    const expiresAt = merged.expiresAt ? new Date(merged.expiresAt) : null;
    if (startsAt && Number.isNaN(startsAt.getTime())) throw new AppError('Start date is invalid.', 422, 'INVALID_COUPON_START');
    if (expiresAt && Number.isNaN(expiresAt.getTime())) throw new AppError('Expiry date is invalid.', 422, 'INVALID_COUPON_EXPIRY');
    if (startsAt && expiresAt && expiresAt <= startsAt) throw new AppError('Expiry must be later than the start date.', 422, 'INVALID_COUPON_DATES');
    return {
      code, name, description: text(merged.description).slice(0, 500) || null,
      discountType: merged.discountType, discountValue, status: merged.status || 'Active',
      appliesTo: merged.appliesTo || 'store', minimumOrderAmount,
      totalUsageLimit: optionalPositiveInteger(merged.totalUsageLimit, 'Total usage limit'),
      perCustomerLimit: optionalPositiveInteger(merged.perCustomerLimit, 'Per-customer limit'),
      startsAt, expiresAt, productIds, categoryIds,
    };
  }

  async create(payload, adminId) {
    const data = await this.data(payload);
    if (await this.couponModel.findByCode(data.code)) throw new AppError('A coupon with this code already exists.', 409, 'COUPON_EXISTS');
    return this.couponModel.create({ ...data, createdBy: adminId || null });
  }

  async update(id, payload) {
    const current = await this.couponModel.findById(id);
    if (!current) throw new AppError('Coupon was not found.', 404, 'COUPON_NOT_FOUND');
    const data = await this.data(payload, current);
    const duplicate = await this.couponModel.findByCode(data.code);
    if (duplicate && Number(duplicate.id) !== Number(id)) throw new AppError('A coupon with this code already exists.', 409, 'COUPON_EXISTS');
    return this.couponModel.update(id, data);
  }

  async archive(id) {
    if (!await this.couponModel.findById(id)) throw new AppError('Coupon was not found.', 404, 'COUPON_NOT_FOUND');
    await this.couponModel.archive(id);
  }

  async validate({ code, items, subtotal, customerId, email, connection = null, lock = false }) {
    const normalized = normalizeCode(code);
    if (!normalized) return { coupon: null, couponCode: null, couponLabel: null, eligibleSubtotalAmount: 0, discountAmount: 0 };
    const coupon = await this.couponModel.findByCode(normalized, connection, lock);
    if (!coupon) throw new AppError("That coupon code isn't valid.", 422, 'INVALID_COUPON');
    const now = new Date();
    if (coupon.status !== 'Active') throw new AppError('This coupon is currently unavailable.', 422, 'COUPON_INACTIVE');
    if (coupon.startsAt && new Date(coupon.startsAt) > now) throw new AppError('This coupon is not active yet.', 422, 'COUPON_NOT_STARTED');
    if (coupon.expiresAt && new Date(coupon.expiresAt) <= now) throw new AppError('This coupon has expired.', 422, 'COUPON_EXPIRED');
    const key = customerKey({ customerId, email });
    const usage = await this.couponModel.usage(coupon.id, key || '', connection);
    if (coupon.totalUsageLimit !== null && usage.total >= coupon.totalUsageLimit) throw new AppError('This coupon has reached its usage limit.', 422, 'COUPON_LIMIT_REACHED');
    if (key && coupon.perCustomerLimit !== null && usage.customer >= coupon.perCustomerLimit) throw new AppError('You have already used this coupon.', 422, 'COUPON_ALREADY_USED');
    const eligible = items.filter((item) => coupon.appliesTo === 'store'
      || (coupon.appliesTo === 'products' && coupon.productIds.includes(Number(item.productId)))
      || (coupon.appliesTo === 'categories' && coupon.categoryIds.includes(Number(item.categoryId))));
    const eligibleSubtotalAmount = eligible.reduce((total, item) => total + Number(item.price) * Number(item.quantity), 0);
    if (!eligibleSubtotalAmount) throw new AppError("This coupon doesn't apply to the items in your cart.", 422, 'COUPON_NOT_APPLICABLE');
    if (eligibleSubtotalAmount < coupon.minimumOrderAmount) {
      const missing = Math.ceil(coupon.minimumOrderAmount - eligibleSubtotalAmount);
      throw new AppError(`Add LKR ${missing.toLocaleString('en-LK')} more to use this coupon.`, 422, 'COUPON_MINIMUM_NOT_REACHED');
    }
    const raw = coupon.discountType === 'Percentage' ? eligibleSubtotalAmount * coupon.discountValue / 100 : coupon.discountValue;
    const discountAmount = Math.min(Number(subtotal), eligibleSubtotalAmount, Math.max(0, Math.round(raw)));
    return {
      coupon, couponCode: coupon.code,
      couponLabel: coupon.discountType === 'Percentage' ? `${coupon.discountValue}% off` : `LKR ${coupon.discountValue.toLocaleString('en-LK')} off`,
      eligibleSubtotalAmount, discountAmount,
      customerKey: key,
    };
  }
}
