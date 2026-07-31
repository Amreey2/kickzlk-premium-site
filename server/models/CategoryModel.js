export default class CategoryModel {
  constructor(database) {
    this.database = database;
  }

  list() {
    return this.database.query('SELECT * FROM categories ORDER BY name ASC');
  }

  async create(data) {
    const result = await this.database.query(
      `INSERT INTO categories
       (name, meta_title, description, image, status, brand, type, gender, collection)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [data.name, data.metaTitle || null, data.description || null, data.image || null, data.status || 'Active',
        data.brand || null, data.type || null, data.gender || null, data.collection || null],
    );
    const rows = await this.database.query('SELECT * FROM categories WHERE id = ?', [result.insertId]);
    return rows[0];
  }
}
