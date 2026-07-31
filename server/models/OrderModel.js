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
      const [result] = await connection.execute(
        `INSERT INTO orders
         (user_id, customer_name, email, phone_number, shipping_address, order_notes, order_number,
          total_amount, paid_amount, pending_amount, payment_status, order_status)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [data.userId, data.customerName, data.email, data.phoneNumber, data.shippingAddress, data.orderNotes,
          data.orderNumber, data.totalAmount, data.paidAmount, data.pendingAmount, data.paymentStatus, data.orderStatus],
      );
      for (const item of data.items) {
        await connection.execute(
          `INSERT INTO order_items (order_id, product_id, product_name, selected_size, quantity, price)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [result.insertId, item.productId, item.productName, item.selectedSize, item.quantity, item.price],
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
    return this.database.query('SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC', [userId]);
  }

  findAll() {
    return this.database.query('SELECT * FROM orders ORDER BY created_at DESC');
  }

  async updateStatus(id, status, note) {
    const connection = await this.database.pool.getConnection();
    try {
      await connection.beginTransaction();
      await connection.execute('UPDATE orders SET order_status = ? WHERE id = ?', [status, id]);
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
