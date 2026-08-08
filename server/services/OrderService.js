import AppError from '../utils/AppError.js';
import { calculateOrderAmounts, DEFAULT_ADVANCE_PERCENTAGE, PAYMENT_OPTIONS } from '../utils/orderPricing.js';
import { assertEmail, assertPhone, requireFields } from '../utils/validation.js';

export const orderStatuses = [
  'Payment Pending — 50% Advance', '50% Payment Confirmed',
  'Payment Pending — Full Amount', 'Full Payment Confirmed',
  'Order Confirmed', 'Processing', 'Quality Check Completed', 'Shipped',
  'Customs Clearance', 'Out for Delivery', 'Delivered',
];

export default class OrderService {
  constructor({ orderModel, productModel, siteSettingService }) {
    this.orderModel = orderModel; this.productModel = productModel; this.siteSettingService = siteSettingService;
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
      const price = Number(product.price);
      const originalPrice = Number(product.originalPrice || 0) > price ? Number(product.originalPrice) : null;
      items.push({ productId: product.databaseId || product.id, publicProductId: product.id, productName: product.name,
        selectedColor: selectedColor || null, selectedSize: String(requested.selectedSize), quantity, price, originalPrice,
        discountAmount: originalPrice ? (originalPrice - price) * quantity : 0 });
    }
    return items;
  }

  async quote(payload) {
    const items = await this.prepareItems(payload.items);
    const settings = this.siteSettingService ? await this.siteSettingService.paymentSettings() : { advancePercentage: DEFAULT_ADVANCE_PERCENTAGE };
    const subtotal = items.reduce((total, item) => total + item.price * item.quantity, 0);
    return { items, ...calculateOrderAmounts({ subtotal, couponCode: payload.couponCode,
      paymentOption: payload.paymentOption, advancePercentage: settings.advancePercentage }),
    paymentMethod: settings.methodName || 'Bank Transfer' };
  }

  async create(payload, userId = null) {
    requireFields(payload, ['customerName', 'email', 'phoneNumber', 'shippingAddress', 'shippingCity', 'idempotencyKey']);
    assertEmail(payload.email); assertPhone(payload.phoneNumber);
    const idempotencyKey = String(payload.idempotencyKey).trim();
    if (!/^[a-zA-Z0-9_-]{16,100}$/.test(idempotencyKey)) throw new AppError('Order submission reference is invalid.', 422, 'INVALID_IDEMPOTENCY_KEY');
    const existing = await this.orderModel.findByIdempotencyKey(idempotencyKey);
    if (existing) return existing;
    const quote = await this.quote(payload);
    const paymentStatus = quote.paymentOption === PAYMENT_OPTIONS.FULL
      ? 'Payment Pending — Full Amount' : `Payment Pending — ${quote.advancePercentage}% Advance`;
    const orderData = {
      userId, customerName: String(payload.customerName).trim(), email: String(payload.email).trim().toLowerCase(),
      phoneNumber: String(payload.phoneNumber).trim(), shippingAddress: String(payload.shippingAddress).trim(),
      shippingCity: String(payload.shippingCity).trim(), orderNotes: payload.orderNotes?.trim() || null,
      idempotencyKey,
      subtotalAmount: quote.subtotalAmount, discountAmount: quote.discountAmount, couponCode: quote.couponCode,
      totalAmount: quote.totalAmount, paymentOption: quote.paymentOption, advancePercentage: quote.advancePercentage,
      advanceAmount: quote.advanceAmount, paidAmount: 0,
      pendingAmount: quote.balanceAmount, paymentMethod: quote.paymentMethod,
      paymentStatus, orderStatus: paymentStatus, items: quote.items,
    };
    try {
      return await this.orderModel.create(orderData);
    } catch (error) {
      if (error.code === 'ER_DUP_ENTRY') {
        const duplicate = await this.orderModel.findByIdempotencyKey(idempotencyKey);
        if (duplicate) return duplicate;
      }
      throw error;
    }
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
