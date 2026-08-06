const mapBrand = (row) => row ? ({
  id: Number(row.id), name: row.name, status: row.status, logoImage: row.logo_image,
  metaTitle: row.meta_title, metaDescription: row.meta_description,
  createdAt: row.created_at, updatedAt: row.updated_at,
}) : null;

export default class BrandModel {
  constructor(database) { this.database = database; }

  async list({ activeOnly = false } = {}) {
    const rows = await this.database.query(`SELECT * FROM brands${activeOnly ? " WHERE status = 'Active'" : ''} ORDER BY name ASC`);
    return rows.map(mapBrand);
  }

  async findById(id) {
    const rows = await this.database.query('SELECT * FROM brands WHERE id = ? LIMIT 1', [id]);
    return mapBrand(rows[0]);
  }

  async findByName(name) {
    const rows = await this.database.query('SELECT * FROM brands WHERE name = ? LIMIT 1', [name]);
    return mapBrand(rows[0]);
  }

  async create(data) {
    const result = await this.database.query(
      'INSERT INTO brands (name, status, logo_image, meta_title, meta_description) VALUES (?, ?, ?, ?, ?)',
      [data.name, data.status, data.logoImage, data.metaTitle, data.metaDescription],
    );
    return this.findById(result.insertId);
  }

  async update(id, data) {
    await this.database.query(
      'UPDATE brands SET name = ?, status = ?, logo_image = ?, meta_title = ?, meta_description = ? WHERE id = ?',
      [data.name, data.status, data.logoImage, data.metaTitle, data.metaDescription, id],
    );
    return this.findById(id);
  }

  async hasProducts(id) {
    const rows = await this.database.query('SELECT COUNT(*) AS count FROM products WHERE brand_id = ?', [id]);
    return Number(rows[0].count) > 0;
  }

  async delete(id) {
    const result = await this.database.query('DELETE FROM brands WHERE id = ?', [id]);
    return result.affectedRows > 0;
  }
}
