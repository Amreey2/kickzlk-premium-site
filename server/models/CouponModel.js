const mapCoupon = (row) => row ? ({
  id: Number(row.id), code: row.code, name: row.name, description: row.description || '',
  discountType: row.discount_type, discountValue: Number(row.discount_value), status: row.status,
  effectiveStatus: row.effective_status || (row.status === 'Active' && row.expires_at && new Date(row.expires_at) < new Date() ? 'Expired' : row.status),
  appliesTo: row.applies_to, minimumOrderAmount: Number(row.minimum_order_amount || 0),
  totalUsageLimit: row.total_usage_limit === null ? null : Number(row.total_usage_limit),
  perCustomerLimit: row.per_customer_limit === null ? null : Number(row.per_customer_limit),
  startsAt: row.starts_at, expiresAt: row.expires_at, archivedAt: row.archived_at,
  usageCount: Number(row.usage_count || 0), productIds: (row.product_ids || []).map(Number),
  categoryIds: (row.category_ids || []).map(Number), createdAt: row.created_at, updatedAt: row.updated_at,
}) : null;

const hydrateCoupon = async (connection, row) => {
  if (!row) return null;
  const [productRows] = await connection.execute('SELECT product_id FROM coupon_products WHERE coupon_id = ? ORDER BY product_id', [row.id]);
  const [categoryRows] = await connection.execute('SELECT category_id FROM coupon_categories WHERE coupon_id = ? ORDER BY category_id', [row.id]);
  return mapCoupon({ ...row, product_ids: productRows.map((item) => item.product_id), category_ids: categoryRows.map((item) => item.category_id) });
};

const replaceTargets = async (connection, couponId, data) => {
  await connection.execute('DELETE FROM coupon_products WHERE coupon_id = ?', [couponId]);
  await connection.execute('DELETE FROM coupon_categories WHERE coupon_id = ?', [couponId]);
  if (data.appliesTo === 'products') for (const id of data.productIds) await connection.execute('INSERT INTO coupon_products (coupon_id, product_id) VALUES (?, ?)', [couponId, id]);
  if (data.appliesTo === 'categories') for (const id of data.categoryIds) await connection.execute('INSERT INTO coupon_categories (coupon_id, category_id) VALUES (?, ?)', [couponId, id]);
};

export default class CouponModel {
  constructor(database) { this.database = database; }
  async list() {
    const rows = await this.database.query(
      `SELECT c.*, COUNT(cr.id) AS usage_count,
       CASE WHEN c.archived_at IS NOT NULL OR c.status = 'Inactive' THEN 'Inactive'
            WHEN c.expires_at IS NOT NULL AND c.expires_at < NOW() THEN 'Expired' ELSE 'Active' END AS effective_status
       FROM coupons c LEFT JOIN coupon_redemptions cr ON cr.coupon_id = c.id
       WHERE c.archived_at IS NULL GROUP BY c.id ORDER BY c.created_at DESC, c.id DESC`,
    );
    const connection = await this.database.pool.getConnection();
    try { const values = []; for (const row of rows) values.push(await hydrateCoupon(connection, row)); return values; }
    finally { connection.release(); }
  }
  async findById(id) {
    const rows = await this.database.query(
      `SELECT c.*, COUNT(cr.id) AS usage_count FROM coupons c
       LEFT JOIN coupon_redemptions cr ON cr.coupon_id = c.id WHERE c.id = ? GROUP BY c.id LIMIT 1`, [id],
    );
    if (!rows[0]) return null;
    const connection = await this.database.pool.getConnection();
    try { return await hydrateCoupon(connection, rows[0]); } finally { connection.release(); }
  }
  async findByCode(code, connection = null, lock = false) {
    const ownConnection = !connection; const activeConnection = connection || await this.database.pool.getConnection();
    try {
      const [rows] = await activeConnection.execute(
        `SELECT * FROM coupons WHERE code = ? AND archived_at IS NULL LIMIT 1${lock ? ' FOR UPDATE' : ''}`, [code],
      );
      return await hydrateCoupon(activeConnection, rows[0]);
    } finally { if (ownConnection) activeConnection.release(); }
  }
  async create(data) {
    const connection = await this.database.pool.getConnection();
    try {
      await connection.beginTransaction();
      const [result] = await connection.execute(
        `INSERT INTO coupons (code, name, description, discount_type, discount_value, status, applies_to,
         minimum_order_amount, total_usage_limit, per_customer_limit, starts_at, expires_at, created_by)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [data.code, data.name, data.description, data.discountType, data.discountValue, data.status, data.appliesTo,
          data.minimumOrderAmount, data.totalUsageLimit, data.perCustomerLimit, data.startsAt, data.expiresAt, data.createdBy],
      );
      await replaceTargets(connection, result.insertId, data); await connection.commit(); return this.findById(result.insertId);
    } catch (error) { await connection.rollback(); throw error; } finally { connection.release(); }
  }
  async update(id, data) {
    const connection = await this.database.pool.getConnection();
    try {
      await connection.beginTransaction();
      await connection.execute(
        `UPDATE coupons SET code = ?, name = ?, description = ?, discount_type = ?, discount_value = ?, status = ?,
         applies_to = ?, minimum_order_amount = ?, total_usage_limit = ?, per_customer_limit = ?, starts_at = ?, expires_at = ?
         WHERE id = ? AND archived_at IS NULL`,
        [data.code, data.name, data.description, data.discountType, data.discountValue, data.status, data.appliesTo,
          data.minimumOrderAmount, data.totalUsageLimit, data.perCustomerLimit, data.startsAt, data.expiresAt, id],
      );
      await replaceTargets(connection, id, data); await connection.commit(); return this.findById(id);
    } catch (error) { await connection.rollback(); throw error; } finally { connection.release(); }
  }
  async archive(id) {
    const result = await this.database.query("UPDATE coupons SET status = 'Inactive', archived_at = NOW() WHERE id = ? AND archived_at IS NULL", [id]);
    return result.affectedRows > 0;
  }
  async usage(couponId, customerKey, connection = null) {
    const sql = `SELECT COUNT(*) AS total_usage, SUM(CASE WHEN customer_key = ? THEN 1 ELSE 0 END) AS customer_usage
      FROM coupon_redemptions WHERE coupon_id = ?`;
    const rows = connection ? (await connection.execute(sql, [customerKey, couponId]))[0] : await this.database.query(sql, [customerKey, couponId]);
    return { total: Number(rows[0]?.total_usage || 0), customer: Number(rows[0]?.customer_usage || 0) };
  }
}
