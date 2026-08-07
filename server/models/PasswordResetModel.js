export default class PasswordResetModel {
  constructor(database) { this.database = database; }

  async replace(customerId, tokenHash, expiresAt) {
    await this.database.query(
      'UPDATE customer_password_resets SET used_at = CURRENT_TIMESTAMP WHERE customer_id = ? AND used_at IS NULL',
      [customerId],
    );
    await this.database.query(
      'INSERT INTO customer_password_resets (customer_id, token_hash, expires_at) VALUES (?, ?, ?)',
      [customerId, tokenHash, expiresAt],
    );
  }

  async findUsable(tokenHash) {
    const rows = await this.database.query(
      `SELECT id, customer_id FROM customer_password_resets
       WHERE token_hash = ? AND used_at IS NULL AND expires_at > CURRENT_TIMESTAMP LIMIT 1`,
      [tokenHash],
    );
    return rows[0] || null;
  }

  async use(id) {
    const result = await this.database.query(
      'UPDATE customer_password_resets SET used_at = CURRENT_TIMESTAMP WHERE id = ? AND used_at IS NULL',
      [id],
    );
    return result.affectedRows === 1;
  }
}
