const parseJson = (value, fallback) => {
  if (value === null || value === undefined) return fallback;
  if (typeof value !== 'string') return value;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
};

const mapProduct = (row) => row ? ({
  ...row,
  size: parseJson(row.size, []),
  images: parseJson(row.images, []),
  variations: parseJson(row.variations, []),
}) : null;

export default class ProductModel {
  constructor(database) {
    this.database = database;
  }

  async findAll(filters = {}) {
    const clauses = [];
    const values = [];
    if (filters.category) { clauses.push('category = ?'); values.push(filters.category); }
    if (filters.brand) { clauses.push('brand = ?'); values.push(filters.brand); }
    if (filters.productType) { clauses.push('product_type = ?'); values.push(filters.productType); }
    const where = clauses.length ? ` WHERE ${clauses.join(' AND ')}` : '';
    const rows = await this.database.query(`SELECT * FROM products${where} ORDER BY created_at DESC`, values);
    return rows.map(mapProduct);
  }

  async findById(id) {
    const rows = await this.database.query('SELECT * FROM products WHERE id = ? LIMIT 1', [id]);
    return mapProduct(rows[0]);
  }

  async create(data) {
    const result = await this.database.query(
      `INSERT INTO products
       (category_id, brand, name, description, category, price, size, product_type, delivery_time,
        availability, meta_title, meta_description, images, image_alt_text, variations, product_tag)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [data.categoryId, data.brand, data.name, data.description, data.category, data.price, JSON.stringify(data.sizes),
        data.productType, data.deliveryTime, data.availability, data.metaTitle, data.metaDescription,
        JSON.stringify(data.images), data.imageAltText, JSON.stringify(data.variations), data.productTag],
    );
    return this.findById(result.insertId);
  }

  async update(id, data) {
    await this.database.query(
      `UPDATE products SET category_id = ?, brand = ?, name = ?, description = ?, category = ?, price = ?,
       size = ?, product_type = ?, delivery_time = ?, availability = ?, meta_title = ?, meta_description = ?,
       images = ?, image_alt_text = ?, variations = ?, product_tag = ? WHERE id = ?`,
      [data.categoryId, data.brand, data.name, data.description, data.category, data.price, JSON.stringify(data.sizes),
        data.productType, data.deliveryTime, data.availability, data.metaTitle, data.metaDescription,
        JSON.stringify(data.images), data.imageAltText, JSON.stringify(data.variations), data.productTag, id],
    );
    return this.findById(id);
  }

  async delete(id) {
    const result = await this.database.query('DELETE FROM products WHERE id = ?', [id]);
    return result.affectedRows > 0;
  }
}
