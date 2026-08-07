const view = (row) => ({
  id: Number(row.id),
  customerId: Number(row.customer_id),
  label: row.label,
  fullName: row.full_name,
  phoneNumber: row.phone_number,
  addressLine1: row.address_line_1,
  addressLine2: row.address_line_2 || '',
  city: row.city,
  postalCode: row.postal_code || '',
  country: row.country,
  isDefault: Boolean(row.is_default),
});

export default class CustomerAddressModel {
  constructor(database) { this.database = database; }

  async list(customerId) {
    const rows = await this.database.query(
      'SELECT * FROM customer_addresses WHERE customer_id = ? ORDER BY is_default DESC, created_at, id',
      [customerId],
    );
    return rows.map(view);
  }

  async find(id, customerId) {
    const rows = await this.database.query(
      'SELECT * FROM customer_addresses WHERE id = ? AND customer_id = ? LIMIT 1',
      [id, customerId],
    );
    return rows[0] ? view(rows[0]) : null;
  }

  async create(customerId, data) {
    if (data.isDefault) await this.clearDefault(customerId);
    const result = await this.database.query(
      `INSERT INTO customer_addresses
       (customer_id, label, full_name, phone_number, address_line_1, address_line_2, city, postal_code, country, is_default)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [customerId, data.label, data.fullName, data.phoneNumber, data.addressLine1, data.addressLine2,
        data.city, data.postalCode, data.country, data.isDefault],
    );
    return this.find(result.insertId, customerId);
  }

  async update(id, customerId, data) {
    if (data.isDefault) await this.clearDefault(customerId);
    await this.database.query(
      `UPDATE customer_addresses SET label = ?, full_name = ?, phone_number = ?, address_line_1 = ?,
       address_line_2 = ?, city = ?, postal_code = ?, country = ?, is_default = ? WHERE id = ? AND customer_id = ?`,
      [data.label, data.fullName, data.phoneNumber, data.addressLine1, data.addressLine2,
        data.city, data.postalCode, data.country, data.isDefault, id, customerId],
    );
    return this.find(id, customerId);
  }

  async delete(id, customerId) {
    const current = await this.find(id, customerId);
    if (!current) return null;
    await this.database.query('DELETE FROM customer_addresses WHERE id = ? AND customer_id = ?', [id, customerId]);
    if (current.isDefault) {
      const remaining = await this.list(customerId);
      if (remaining[0]) await this.database.query('UPDATE customer_addresses SET is_default = TRUE WHERE id = ? AND customer_id = ?', [remaining[0].id, customerId]);
    }
    return current;
  }

  clearDefault(customerId) {
    return this.database.query('UPDATE customer_addresses SET is_default = FALSE WHERE customer_id = ?', [customerId]);
  }
}
