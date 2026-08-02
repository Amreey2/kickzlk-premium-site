import AppError from '../utils/AppError.js';
import { createOrderNumber } from '../utils/orderNumber.js';
import { assertEmail, assertPhone, requireFields } from '../utils/validation.js';

export const orderStatuses = [
  'Pending', 'Order Placed', 'Payment Pending', 'Payment Confirmed', 'Order Confirmed',
  'Processing', 'Quality Check Completed', 'Shipped', 'Customs Clearance',
  'Import/Clearing', 'Out for Delivery', 'Delivered',
];
const paymentStatuses = new Set(['Payment Pending', 'Deposit Paid', 'Paid', 'Refunded']);

export default class OrderService {
  constructor({ orderModel, productModel }) {
    this.orderModel = orderModel;
    this.productModel = productModel;
  }

  async create(payload, userId = null) {
    requireFields(payload, ['customerName', 'email', 'phoneNumber', 'shippingAddress']);
    assertEmail(payload.email);
    assertPhone(payload.phoneNumber);
    if (!Array.isArray(payload.items) || !payload.items.length) throw new AppError('At least one order item is required.', 422, 'EMPTY_ORDER');

    const items = [];
    for (const requested of payload.items) {
      const product = await this.productModel.findById(requested.productId);
      if (!product) throw new AppError(`Product ${requested.productId} was not found.`, 404, 'PRODUCT_NOT_FOUND');
      const quantity = Number(requested.quantity || 1);
      if (!Number.isInteger(quantity) || quantity < 1 || quantity > 10) throw new AppError('Item quantity must be between 1 and 10.', 422, 'INVALID_QUANTITY');
      const availableSizes = product.sizes || product.size || [];
      if (!availableSizes.map(String).includes(String(requested.selectedSize))) throw new AppError(`Selected size is unavailable for ${product.name}.`, 422, 'INVALID_SIZE');
      items.push({ productId: product.databaseId || product.id, productName: product.name, selectedSize: String(requested.selectedSize), quantity, price: Number(product.price) });
    }

    const totalAmount = items.reduce((total, item) => total + item.price * item.quantity, 0);
    const paidAmount = Number(payload.paidAmount || 0);
    if (!Number.isFinite(paidAmount) || paidAmount < 0 || paidAmount > totalAmount) throw new AppError('Paid amount is invalid.', 422, 'INVALID_PAYMENT_AMOUNT');
    const paymentStatus = payload.paymentStatus || (paidAmount ? 'Deposit Paid' : 'Payment Pending');
    if (!paymentStatuses.has(paymentStatus)) throw new AppError('Payment status is invalid.', 422, 'INVALID_PAYMENT_STATUS');

    return this.orderModel.create({
      userId,
      customerName: String(payload.customerName).trim(),
      email: String(payload.email).trim().toLowerCase(),
      phoneNumber: String(payload.phoneNumber).trim(),
      shippingAddress: String(payload.shippingAddress).trim(),
      orderNotes: payload.orderNotes?.trim() || null,
      orderNumber: createOrderNumber(),
      totalAmount,
      paidAmount,
      pendingAmount: totalAmount - paidAmount,
      paymentStatus,
      orderStatus: 'Order Placed',
      items,
    });
  }

  get(id) { return this.orderModel.findById(id); }
  listForUser(userId) { return this.orderModel.findByUserId(userId); }
  listAll() { return this.orderModel.findAll(); }

  async updateStatus(id, status, note) {
    if (!orderStatuses.includes(status)) throw new AppError('Order status is invalid.', 422, 'INVALID_ORDER_STATUS');
    if (!(await this.orderModel.findById(id))) throw new AppError('Order was not found.', 404, 'ORDER_NOT_FOUND');
    return this.orderModel.updateStatus(id, status, note);
  }
}
