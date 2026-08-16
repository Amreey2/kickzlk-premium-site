import AppError from '../utils/AppError.js';
import { DEFAULT_ADVANCE_PERCENTAGE, PAYMENT_OPTIONS } from '../utils/orderPricing.js';
import { calculatePaymentAmounts } from './PromotionPricingService.js';
import { assertEmail, assertPhone, requireFields } from '../utils/validation.js';

export const orderStatuses = [
  'Order Placed',
  'Payment Pending — 50% Advance', '50% Payment Confirmed',
  'Payment Pending — Full Amount', 'Full Payment Confirmed',
  'Order Confirmed', 'Processing', 'Quality Check Completed', 'Shipped',
  'Customs Clearance', 'Out for Delivery', 'Delivered',
];

export default class OrderService {
  constructor({ orderModel, productModel, userModel, siteSettingService, couponService }) {
    this.orderModel = orderModel; this.productModel = productModel; this.userModel = userModel;
    this.siteSettingService = siteSettingService; this.couponService = couponService;
  }

  async prepareItems(requestedItems) {
    if (!Array.isArray(requestedItems) || !requestedItems.length) throw new AppError('At least one order item is required.', 422, 'EMPTY_ORDER');
    const items = [];
    for (const requested of requestedItems) {
      const product = await this.productModel.findById(requested.productId);
      if (!product) throw new AppError(`Product ${requested.productId} was not found.`, 404, 'PRODUCT_NOT_FOUND');
      const quantity = Number(requested.quantity || 1);
      if (!Number.isInteger(quantity) || quantity < 1 || quantity > 10) throw new AppError('Item quantity must be between 1 and 10.', 422, 'INVALID_QUANTITY');
      const availableSizes = product.sizes || product.size || [];
      if (!availableSizes.map(String).includes(String(requested.selectedSize))) throw new AppError(`Selected size is unavailable for ${product.name}.`, 422, 'INVALID_SIZE');
      const selectedColor = String(requested.selectedColor || '').trim();
      const colors = (product.colorVariations || []).map((color) => String(color).toLowerCase());
      if (selectedColor && colors.length && !colors.includes(selectedColor.toLowerCase())) throw new AppError(`Selected colour is unavailable for ${product.name}.`, 422, 'INVALID_COLOR');
      const price = Number(product.price); const originalPrice = Number(product.originalPrice || 0) > price ? Number(product.originalPrice) : null;
      items.push({ productId: product.databaseId || product.id, publicProductId: product.id, categoryId: product.categoryId,
        productName: product.name, selectedColor: selectedColor || null, selectedSize: String(requested.selectedSize), quantity,
        price, originalPrice, discountAmount: originalPrice ? (originalPrice - price) * quantity : 0 });
    }
    return items;
  }

  async buildQuote(payload, userId = null, connection = null, lockCoupon = false) {
    const items = await this.prepareItems(payload.items);
    const settings = this.siteSettingService ? await this.siteSettingService.paymentSettings() : { advancePercentage: DEFAULT_ADVANCE_PERCENTAGE };
    const subtotal = items.reduce((total, item) => total + item.price * item.quantity, 0);
    const promotion = this.couponService
      ? await this.couponService.validate({ code: payload.couponCode, items, subtotal, customerId: userId, email: payload.email, connection, lock: lockCoupon })
      : { coupon: null, couponCode: null, couponLabel: null, eligibleSubtotalAmount: 0, discountAmount: 0 };
    return {
      items, ...calculatePaymentAmounts({ subtotal, discountAmount: promotion.discountAmount,
        paymentOption: payload.paymentOption, advancePercentage: settings.advancePercentage }),
      couponId: promotion.coupon?.id || null, couponCode: promotion.couponCode, couponLabel: promotion.couponLabel,
      couponDiscountType: promotion.coupon?.discountType || null, couponDiscountValue: promotion.coupon?.discountValue || null,
      eligibleSubtotalAmount: promotion.eligibleSubtotalAmount, customerKey: promotion.customerKey || null,
      paymentMethod: settings.methodName || 'Bank Transfer',
    };
  }

  quote(payload, userId = null) { return this.buildQuote(payload, userId); }

  async create(payload, userId = null, { initialOrderStatus } = {}) {
    requireFields(payload, ['customerName', 'email', 'phoneNumber', 'shippingAddress', 'shippingCity', 'idempotencyKey']);
    assertEmail(payload.email); assertPhone(payload.phoneNumber);
    const idempotencyKey = String(payload.idempotencyKey).trim();
    if (!/^[a-zA-Z0-9_-]{16,100}$/.test(idempotencyKey)) throw new AppError('Order submission reference is invalid.', 422, 'INVALID_IDEMPOTENCY_KEY');
    const existing = await this.orderModel.findByIdempotencyKey(idempotencyKey);
    if (existing) return existing;
    const identity = { userId, email: String(payload.email).trim().toLowerCase() };
    if (!this.orderModel.createWithPricing) {
      const quote = await this.buildQuote({ ...payload, email: identity.email }, userId);
      const paymentStatus = quote.paymentOption === PAYMENT_OPTIONS.FULL ? 'Payment Pending — Full Amount' : 'Payment Pending — ' + quote.advancePercentage + '% Advance';
      return this.orderModel.create({ userId, customerName: String(payload.customerName).trim(), email: identity.email, phoneNumber: String(payload.phoneNumber).trim(), shippingAddress: String(payload.shippingAddress).trim(), shippingCity: String(payload.shippingCity).trim(), orderNotes: payload.orderNotes?.trim() || null, idempotencyKey, subtotalAmount: quote.subtotalAmount, eligibleSubtotalAmount: quote.eligibleSubtotalAmount, discountAmount: quote.discountAmount, couponId: quote.couponId, couponCode: quote.couponCode, couponDiscountType: quote.couponDiscountType, couponDiscountValue: quote.couponDiscountValue, totalAmount: quote.totalAmount, paymentOption: quote.paymentOption, advancePercentage: quote.advancePercentage, advanceAmount: quote.advanceAmount, paidAmount: 0, pendingAmount: quote.balanceAmount, paymentMethod: quote.paymentMethod, paymentStatus, orderStatus: initialOrderStatus || paymentStatus, items: quote.items });
    }
    return this.orderModel.createWithPricing({
      idempotencyKey,
      build: async (connection) => {
        const quote = await this.buildQuote({ ...payload, email: identity.email }, userId, connection, true);
        const paymentStatus = quote.paymentOption === PAYMENT_OPTIONS.FULL
          ? 'Payment Pending — Full Amount' : `Payment Pending — ${quote.advancePercentage}% Advance`;
        return {
          userId, customerName: String(payload.customerName).trim(), email: identity.email,
          phoneNumber: String(payload.phoneNumber).trim(), shippingAddress: String(payload.shippingAddress).trim(),
          shippingCity: String(payload.shippingCity).trim(), orderNotes: payload.orderNotes?.trim() || null, idempotencyKey,
          subtotalAmount: quote.subtotalAmount, eligibleSubtotalAmount: quote.eligibleSubtotalAmount,
          discountAmount: quote.discountAmount, couponId: quote.couponId, couponCode: quote.couponCode,
          couponDiscountType: quote.couponDiscountType, couponDiscountValue: quote.couponDiscountValue,
          totalAmount: quote.totalAmount, paymentOption: quote.paymentOption, advancePercentage: quote.advancePercentage,
          advanceAmount: quote.advanceAmount, paidAmount: 0, pendingAmount: quote.balanceAmount,
          paymentMethod: quote.paymentMethod, paymentStatus, orderStatus: initialOrderStatus || paymentStatus, items: quote.items,
          couponCustomerKey: quote.customerKey || (userId ? `customer:${userId}` : `email:${identity.email}`),
        };
      },
    });
  }

  async searchCustomers(query) {
    if (!this.userModel?.search) return [];
    const rows = await this.userModel.search(query);
    return rows.map((row) => ({
      id: Number(row.id), name: row.name, email: row.email, phoneNumber: row.phone_number || '',
      address: row.address_line_1 ? [row.address_line_1, row.address_line_2].filter(Boolean).join(', ') : '',
      city: row.city || '', addressLabel: row.address_id ? 'Default address' : '',
    }));
  }

  async adminQuote(payload) {
    const customerId = payload.customerId ? Number(payload.customerId) : null;
    const customer = customerId ? await this.userModel?.findById(customerId) : null;
    if (customerId && !customer) throw new AppError('Customer was not found.', 404, 'CUSTOMER_NOT_FOUND');
    return this.quote({ ...payload, email: customer?.email || payload.email }, customerId);
  }

  async adminCreate(payload) {
    const customerId = payload.customerId ? Number(payload.customerId) : null;
    let customerPayload = payload;
    if (customerId) {
      const customer = await this.userModel?.findById(customerId);
      if (!customer) throw new AppError('Customer was not found.', 404, 'CUSTOMER_NOT_FOUND');
      customerPayload = {
        ...payload,
        customerName: customer.name,
        email: customer.email,
        phoneNumber: payload.phoneNumber || customer.phone_number,
      };
    }
    return this.create(customerPayload, customerId, { initialOrderStatus: 'Order Placed' });
  }

  get(id) { return this.orderModel.findById(id); }
  listForUser(userId) { return this.orderModel.findByUserId(userId); }
  listAll() { return this.orderModel.findAll(); }
  async updateStatus(id, status, note) {
    const order = await this.orderModel.findById(id);
    if (!order) throw new AppError('Order was not found.', 404, 'ORDER_NOT_FOUND');
    const percentage = Number(order.advance_percentage || DEFAULT_ADVANCE_PERCENTAGE);
    const paymentStates = order.payment_option === PAYMENT_OPTIONS.FULL
      ? ['Payment Pending — Full Amount', 'Full Payment Confirmed']
      : [`Payment Pending — ${percentage}% Advance`, `${percentage}% Payment Confirmed`];
    const fulfilmentStates = orderStatuses.filter((value) => !value.startsWith('Payment Pending') && !value.endsWith('Payment Confirmed'));
    if (![...paymentStates, ...fulfilmentStates].includes(status)) throw new AppError('Order status is invalid for the selected payment option.', 422, 'INVALID_ORDER_STATUS');
    return this.orderModel.updateStatus(id, status, note);
  }
}
