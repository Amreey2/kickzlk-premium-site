import crypto from 'node:crypto';
import { formatOrderNumber } from '../utils/orderNumber.js';

const loadOrderRelations = async (connection, order) => {
  if (!order) return null;
  const [items] = await connection.execute('SELECT * FROM order_items WHERE order_id = ? ORDER BY id', [order.id]);
  const [history] = await connection.execute('SELECT * FROM order_status_history WHERE order_id = ? ORDER BY created_at, id', [order.id]);
  return { ...order, items, status_history: history };
};

export default class OrderModel {
  constructor(database) {
    this.database = database;
  }

  async create(data) {
    const connection = await this.database.pool.getConnection();
    try {
      await connection.beginTransaction();
      const temporaryReference = `PENDING-${crypto.randomBytes(8).toString('hex').toUpperCase()}`;
      const [result] = await connection.execute(
        `INSERT INTO orders
         (user_id, customer_name, email, phone_number, shipping_address, shipping_city, order_notes, order_number,
          tracking_number, idempotency_key, subtotal_amount, discount_amount, coupon_code, total_amount, payment_option,
          advance_percentage, advance_amount, paid_amount, pending_amount, payment_method, payment_status, order_status)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [data.userId, data.customerName, data.email, data.phoneNumber, data.shippingAddress, data.shippingCity, data.orderNotes,
          temporaryReference, temporaryReference, data.idempotencyKey, data.subtotalAmount, data.discountAmount, data.couponCode,
          data.totalAmount, data.paymentOption, data.advancePercentage, data.advanceAmount, data.paidAmount,
          data.pendingAmount, data.paymentMethod, data.paymentStatus, data.orderStatus],
      );
      const orderNumber = formatOrderNumber(result.insertId);
      await connection.execute('UPDATE orders SET order_number = ?, tracking_number = ? WHERE id = ?', [orderNumber, orderNumber, result.insertId]);
      for (const item of data.items) {
        await connection.execute(
          `INSERT INTO order_items (order_id, product_id, product_name, selected_color, selected_size, quantity, price, original_price, discount_amount)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [result.insertId, item.productId, item.productName, item.selectedColor, item.selectedSize, item.quantity, item.price, item.originalPrice, item.discountAmount],
        );
      }
      await connection.execute(
        'INSERT INTO order_status_history (order_id, status, note) VALUES (?, ?, ?)',
        [result.insertId, data.orderStatus, 'Order created.'],
      );
      await connection.commit();
      return this.findById(result.insertId);
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  async findById(identifier) {
    const numeric = /^\d+$/.test(String(identifier));
    const sql = numeric ? 'SELECT * FROM orders WHERE id = ? LIMIT 1' : 'SELECT * FROM orders WHERE order_number = ? LIMIT 1';
    const rows = await this.database.query(sql, [identifier]);
    if (!rows[0]) return null;
    const connection = await this.database.pool.getConnection();
    try {
      return await loadOrderRelations(connection, rows[0]);
    } finally {
      connection.release();
    }
  }

  async findByUserId(userId) {
    const orders = await this.database.query('SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC', [userId]);
    const connection = await this.database.pool.getConnection();
    try {
      const hydrated = [];
      for (const order of orders) hydrated.push(await loadOrderRelations(connection, order));
      return hydrated;
    } finally { connection.release(); }
  }

  async findByIdempotencyKey(key) {
    const rows = await this.database.query('SELECT * FROM orders WHERE idempotency_key = ? LIMIT 1', [key]);
    if (!rows[0]) return null;
    const connection = await this.database.pool.getConnection();
    try { return await loadOrderRelations(connection, rows[0]); } finally { connection.release(); }
  }

  async findAll() {
    const orders = await this.database.query('SELECT * FROM orders ORDER BY created_at DESC');
    const connection = await this.database.pool.getConnection();
    try {
      const hydrated = [];
      for (const order of orders) hydrated.push(await loadOrderRelations(connection, order));
      return hydrated;
    } finally { connection.release(); }
  }

  async updateStatus(id, status, note) {
    const connection = await this.database.pool.getConnection();
    try {
      await connection.beginTransaction();
      await connection.execute(
        `UPDATE orders SET order_status = ?,
          payment_status = CASE
            WHEN ? LIKE '%Payment Confirmed' THEN ?
            WHEN ? LIKE 'Payment Pending%' THEN ?
            ELSE payment_status END,
          paid_amount = CASE
            WHEN ? = 'Full Payment Confirmed' THEN total_amount
            WHEN ? LIKE '%Payment Confirmed' THEN advance_amount
            WHEN ? LIKE 'Payment Pending%' THEN 0
            ELSE paid_amount END
         WHERE id = ?`,
        [status, status, status, status, status, status, status, status, id],
      );
      await connection.execute(
        'INSERT INTO order_status_history (order_id, status, note) VALUES (?, ?, ?)',
        [id, status, note || null],
      );
      await connection.commit();
      return this.findById(id);
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

}
