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
    sku: row.sku,
    name: row.name,
    brand: row.brand,
    brandId: row.brand_id,
    category: row.category,
    categoryGender: row.category_gender || null,
    price: Number(row.price),
    originalPrice: row.original_price === null || row.original_price === undefined ? null : Number(row.original_price),
    images: parseJson(row.images, []),
    sizes: parseJson(row.size, []),
    description: row.description,
    preOrder: row.product_type === 'Pre Order',
    stock: Number(row.stock || 0),
    availability: row.availability,
    deliveryTime: row.delivery_time,
    productTag: row.product_tag,
    productTags: parseJson(row.product_tags, row.product_tag ? [row.product_tag] : []),
    colorVariations: parseJson(row.color_variations, []),
    colorVariants: parseJson(row.color_variants, []),
    cdnImages: parseJson(row.cdn_images, []),
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
    if (filters.category) { clauses.push('p.category = ?'); values.push(filters.category); }
    if (filters.brand) { clauses.push('p.brand = ?'); values.push(filters.brand); }
    if (filters.productType) { clauses.push('p.product_type = ?'); values.push(filters.productType); }
    if (filters.search) {
      clauses.push('(p.sku LIKE ? OR p.name LIKE ? OR p.brand LIKE ?)');
      const term = `%${filters.search}%`;
      values.push(term, term, term);
    }
    const where = clauses.length ? ` WHERE ${clauses.join(' AND ')}` : '';
    const rows = await this.database.query(`SELECT p.*, c.gender AS category_gender FROM products p LEFT JOIN categories c ON c.id = p.category_id${where} ORDER BY p.created_at DESC, p.id DESC`, values);
    return rows.map(mapProduct);
  }

  async findById(id) {
    const numeric = /^\d+$/.test(String(id));
    const rows = await this.database.query(
      numeric
        ? 'SELECT p.*, c.gender AS category_gender FROM products p LEFT JOIN categories c ON c.id = p.category_id WHERE p.id = ? LIMIT 1'
        : 'SELECT p.*, c.gender AS category_gender FROM products p LEFT JOIN categories c ON c.id = p.category_id WHERE p.slug = ? LIMIT 1',
      [id],
    );
    return mapProduct(rows[0]);
  }

  async findBySku(sku) {
    const rows = await this.database.query('SELECT * FROM products WHERE sku = ? LIMIT 1', [sku]);
    return mapProduct(rows[0]);
  }

  async create(data) {
    const result = await this.database.query(
      `INSERT INTO products
       (slug, sku, brand_id, category_id, brand, name, description, category, price, original_price, size, product_type, delivery_time,
        availability, stock, meta_title, meta_description, images, image_alt_text, variations, product_tag,
        product_tags, color_variations, color_variants, cdn_images)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [data.slug, data.sku, data.brandId, data.categoryId, data.brand, data.name, data.description, data.category, data.price, data.originalPrice ?? null, JSON.stringify(data.sizes),
        data.productType, data.deliveryTime, data.availability, data.stock, data.metaTitle, data.metaDescription,
        JSON.stringify(data.images), data.imageAltText, JSON.stringify(data.variations), data.productTags[0] || null,
        JSON.stringify(data.productTags), JSON.stringify(data.colorVariations), JSON.stringify(data.colorVariants), JSON.stringify(data.cdnImages)],
    );
    return this.findById(result.insertId);
  }

  async update(id, data) {
    await this.database.query(
      `UPDATE products SET slug = ?, sku = ?, brand_id = ?, category_id = ?, brand = ?, name = ?, description = ?, category = ?, price = ?, original_price = ?,
       size = ?, product_type = ?, delivery_time = ?, availability = ?, stock = ?, meta_title = ?, meta_description = ?,
       images = ?, image_alt_text = ?, variations = ?, product_tag = ?, product_tags = ?, color_variations = ?, color_variants = ?, cdn_images = ?
       WHERE ${/^\d+$/.test(String(id)) ? 'id' : 'slug'} = ?`,
      [data.slug, data.sku, data.brandId, data.categoryId, data.brand, data.name, data.description, data.category, data.price, data.originalPrice ?? null, JSON.stringify(data.sizes),
        data.productType, data.deliveryTime, data.availability, data.stock, data.metaTitle, data.metaDescription,
        JSON.stringify(data.images), data.imageAltText, JSON.stringify(data.variations), data.productTags[0] || null,
        JSON.stringify(data.productTags), JSON.stringify(data.colorVariations), JSON.stringify(data.colorVariants), JSON.stringify(data.cdnImages), id],
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
