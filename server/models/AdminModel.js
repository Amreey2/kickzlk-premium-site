export default class AdminModel {
  constructor(database) {
    this.database = database;
  }

  async findByEmail(email) {
    const rows = await this.database.query('SELECT * FROM administrators WHERE email = ? LIMIT 1', [email]);
    return rows[0] || null;
  }
}
