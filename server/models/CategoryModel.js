const mapCategory = (row) => row ? ({
  id: Number(row.id), name: row.name, status: row.status, metaTitle: row.meta_title,
  metaDescription: row.meta_description, image: row.image, type: row.type,
  gender: row.gender, collection: row.collection, createdAt: row.created_at, updatedAt: row.updated_at,
}) : null;

export default class CategoryModel {
  constructor(database) {
    this.database = database;
  }

  async list({ activeOnly = false } = {}) {
    const rows = await this.database.query(`SELECT * FROM categories${activeOnly ? " WHERE status = 'Active'" : ''} ORDER BY name ASC`);
    return rows.map(mapCategory);
  }

  async findById(id) {
    const rows = await this.database.query('SELECT * FROM categories WHERE id = ? LIMIT 1', [id]);
    return mapCategory(rows[0]);
  }

  async findByName(name) {
    const rows = await this.database.query('SELECT * FROM categories WHERE name = ? LIMIT 1', [name]);
    return mapCategory(rows[0]);
  }

  async create(data) {
    const result = await this.database.query(
      `INSERT INTO categories (name, meta_title, meta_description, image, status, type, gender, collection)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [data.name, data.metaTitle, data.metaDescription, data.image, data.status, data.type, data.gender, data.collection],
    );
    return this.findById(result.insertId);
  }

  async update(id, data) {
    await this.database.query('UPDATE products SET category = ? WHERE category_id = ?', [data.name, id]);
    await this.database.query(
      'UPDATE categories SET name = ?, meta_title = ?, meta_description = ?, image = ?, status = ?, type = ?, gender = ?, collection = ? WHERE id = ?',
      [data.name, data.metaTitle, data.metaDescription, data.image, data.status, data.type, data.gender, data.collection, id],
    );
    return this.findById(id);
  }

  async hasProducts(id) {
    const rows = await this.database.query('SELECT COUNT(*) AS count FROM products WHERE category_id = ?', [id]);
    return Number(rows[0].count) > 0;
  }

  async delete(id) {
    const result = await this.database.query('DELETE FROM categories WHERE id = ?', [id]);
    return result.affectedRows > 0;
  }
}
