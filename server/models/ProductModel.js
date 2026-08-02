const parseJson = (value, fallback) => {
  if (value === null || value === undefined) return fallback;
  if (typeof value !== 'string') return value;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
};

// Database naming stays private; every product endpoint returns this React-facing shape.
const mapProduct = (row) => {
  if (!row) return null;
  const product = {
    id: row.slug || String(row.id),
    name: row.name,
    brand: row.brand,
    category: row.category,
    price: Number(row.price),
    images: parseJson(row.images, []),
    sizes: parseJson(row.size, []),
    description: row.description,
    preOrder: row.product_type === 'Pre Order',
    stock: Number(row.stock || 0),
    availability: row.availability,
    deliveryTime: row.delivery_time,
    productTag: row.product_tag,
    categoryId: row.category_id,
    metaTitle: row.meta_title,
    metaDescription: row.meta_description,
    imageAltText: row.image_alt_text,
    variations: parseJson(row.variations, []),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };

  // Orders need the numeric foreign key, but API JSON must expose only the public slug id.
  Object.defineProperty(product, 'databaseId', { value: row.id, enumerable: false });
  return product;
};

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
    const numeric = /^\d+$/.test(String(id));
    const rows = await this.database.query(
      numeric ? 'SELECT * FROM products WHERE id = ? LIMIT 1' : 'SELECT * FROM products WHERE slug = ? LIMIT 1',
      [id],
    );
    return mapProduct(rows[0]);
  }

  async create(data) {
    const result = await this.database.query(
      `INSERT INTO products
       (slug, category_id, brand, name, description, category, price, size, product_type, delivery_time,
        availability, stock, meta_title, meta_description, images, image_alt_text, variations, product_tag)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [data.slug, data.categoryId, data.brand, data.name, data.description, data.category, data.price, JSON.stringify(data.sizes),
        data.productType, data.deliveryTime, data.availability, data.stock, data.metaTitle, data.metaDescription,
        JSON.stringify(data.images), data.imageAltText, JSON.stringify(data.variations), data.productTag],
    );
    return this.findById(result.insertId);
  }

  async update(id, data) {
    await this.database.query(
      `UPDATE products SET slug = ?, category_id = ?, brand = ?, name = ?, description = ?, category = ?, price = ?,
       size = ?, product_type = ?, delivery_time = ?, availability = ?, stock = ?, meta_title = ?, meta_description = ?,
       images = ?, image_alt_text = ?, variations = ?, product_tag = ? WHERE ${/^\d+$/.test(String(id)) ? 'id' : 'slug'} = ?`,
      [data.slug, data.categoryId, data.brand, data.name, data.description, data.category, data.price, JSON.stringify(data.sizes),
        data.productType, data.deliveryTime, data.availability, data.stock, data.metaTitle, data.metaDescription,
        JSON.stringify(data.images), data.imageAltText, JSON.stringify(data.variations), data.productTag, id],
    );
    return this.findById(data.slug);
  }

  async delete(id) {
    const result = await this.database.query(
      /^\d+$/.test(String(id)) ? 'DELETE FROM products WHERE id = ?' : 'DELETE FROM products WHERE slug = ?',
      [id],
    );
    return result.affectedRows > 0;
  }
}
