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
