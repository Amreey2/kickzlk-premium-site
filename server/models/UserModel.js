export default class UserModel {
  constructor(database) {
    this.database = database;
  }

  async findByEmail(email) {
    const rows = await this.database.query('SELECT * FROM users WHERE email = ? LIMIT 1', [email]);
    return rows[0] || null;
  }

  async findById(id) {
    const rows = await this.database.query('SELECT id, name, email, phone_number, created_at FROM users WHERE id = ? LIMIT 1', [id]);
    return rows[0] || null;
  }

  async create({ name, email, passwordHash, phoneNumber }) {
    const result = await this.database.query(
      'INSERT INTO users (name, email, password_hash, phone_number) VALUES (?, ?, ?, ?)',
      [name, email, passwordHash, phoneNumber || null],
    );
    return this.findById(result.insertId);
  }
}
