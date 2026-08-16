export default class UserModel {
  constructor(database) {
    this.database = database;
  }

  async findByEmail(email) {
    const rows = await this.database.query('SELECT * FROM customers WHERE email = ? LIMIT 1', [email]);
    return rows[0] || null;
  }

  async findById(id) {
    const rows = await this.database.query('SELECT id, name, email, phone_number, created_at FROM customers WHERE id = ? LIMIT 1', [id]);
    return rows[0] || null;
  }

  async search(query = '') {
    const term = String(query || '').trim();
    const like = `%${term}%`;
    return this.database.query(
      `SELECT c.id, c.name, c.email, c.phone_number, c.created_at,
              a.id AS address_id, a.full_name AS address_full_name,
              a.phone_number AS address_phone_number, a.address_line_1,
              a.address_line_2, a.city, a.postal_code, a.country
       FROM customers c
       LEFT JOIN customer_addresses a
         ON a.customer_id = c.id AND a.is_default = TRUE
       WHERE ? = '' OR c.name LIKE ? OR c.email LIKE ? OR c.phone_number LIKE ?
       ORDER BY c.name ASC, c.id ASC
       LIMIT 25`,
      [term, like, like, like],
    );
  }

  async create({ name, email, passwordHash, phoneNumber }) {
    const result = await this.database.query(
      'INSERT INTO customers (name, email, password_hash, phone_number) VALUES (?, ?, ?, ?)',
      [name, email, passwordHash, phoneNumber || null],
    );
    return this.findById(result.insertId);
  }

  async update(id, { name, email, phoneNumber }) {
    await this.database.query(
      'UPDATE customers SET name = ?, email = ?, phone_number = ? WHERE id = ?',
      [name, email, phoneNumber, id],
    );
    return this.findById(id);
  }

  async updatePassword(id, passwordHash) {
    await this.database.query('UPDATE customers SET password_hash = ? WHERE id = ?', [passwordHash, id]);
  }
}
