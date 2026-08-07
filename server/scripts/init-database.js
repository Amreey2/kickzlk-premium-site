import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import mysql from 'mysql2/promise';
import { env } from '../config/env.js';

if (!/^[a-zA-Z0-9_]+$/.test(env.database.name)) throw new Error('DB_NAME contains unsupported characters.');
const directory = path.dirname(fileURLToPath(import.meta.url));
const schema = await fs.readFile(path.resolve(directory, '../config/schema.sql'), 'utf8');
const connection = await mysql.createConnection({
  host: env.database.host,
  port: env.database.port,
  user: env.database.user,
  password: env.database.password,
  ssl: env.database.ssl ? { minVersion: 'TLSv1.2' } : undefined,
  multipleStatements: true,
});

const tableExists = async (name) => {
  const [rows] = await connection.execute(
    'SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? LIMIT 1',
    [env.database.name, name],
  );
  return rows.length > 0;
};

const columnExists = async (table, column) => {
  const [rows] = await connection.execute(
    'SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? AND COLUMN_NAME = ? LIMIT 1',
    [env.database.name, table, column],
  );
  return rows.length > 0;
};

const indexExists = async (table, index) => {
  const [rows] = await connection.execute(
    'SELECT 1 FROM INFORMATION_SCHEMA.STATISTICS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? AND INDEX_NAME = ? LIMIT 1',
    [env.database.name, table, index],
  );
  return rows.length > 0;
};

const slugify = (value, id) => {
  const base = String(value).toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  return `${base || 'product'}-${id}`;
};

try {
  await connection.query(`CREATE DATABASE IF NOT EXISTS \`${env.database.name}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
  await connection.query(`USE \`${env.database.name}\``);

  // Preserve existing Sprint 5 data while adopting the finalized ecommerce table names.
  if (await tableExists('users') && !(await tableExists('customers'))) await connection.query('RENAME TABLE users TO customers');
  if (await tableExists('admins') && !(await tableExists('administrators'))) await connection.query('RENAME TABLE admins TO administrators');

  await connection.query(schema);

  if (!(await columnExists('customers', 'updated_at'))) await connection.query('ALTER TABLE customers ADD COLUMN updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP AFTER created_at');

  // CREATE TABLE IF NOT EXISTS does not add Sprint 6 product fields to an existing database.
  if (!(await columnExists('products', 'slug'))) await connection.query('ALTER TABLE products ADD COLUMN slug VARCHAR(180) NULL AFTER id');
  if (!(await columnExists('products', 'stock'))) await connection.query('ALTER TABLE products ADD COLUMN stock INT UNSIGNED NOT NULL DEFAULT 0 AFTER availability');
  if (!(await columnExists('products', 'sku'))) await connection.query('ALTER TABLE products ADD COLUMN sku VARCHAR(100) NULL AFTER slug');
  if (!(await columnExists('products', 'brand_id'))) await connection.query('ALTER TABLE products ADD COLUMN brand_id BIGINT UNSIGNED NULL AFTER sku');
  if (!(await columnExists('products', 'product_tags'))) await connection.query('ALTER TABLE products ADD COLUMN product_tags JSON NULL AFTER product_tag');
  if (!(await columnExists('products', 'color_variations'))) await connection.query('ALTER TABLE products ADD COLUMN color_variations JSON NULL AFTER product_tags');
  if (!(await columnExists('products', 'cdn_images'))) await connection.query('ALTER TABLE products ADD COLUMN cdn_images JSON NULL AFTER color_variations');
  if (!(await columnExists('categories', 'meta_description'))) await connection.query('ALTER TABLE categories ADD COLUMN meta_description VARCHAR(320) NULL AFTER meta_title');
  if (!(await columnExists('categories', 'updated_at'))) await connection.query('ALTER TABLE categories ADD COLUMN updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP AFTER created_at');
  if (!(await columnExists('brands', 'display_mode'))) await connection.query("ALTER TABLE brands ADD COLUMN display_mode ENUM('Text', 'Image') NOT NULL DEFAULT 'Text' AFTER status");
  await connection.query('ALTER TABLE categories MODIFY gender VARCHAR(100) NULL');

  const [productsWithoutSlugs] = await connection.query('SELECT id, name FROM products WHERE slug IS NULL OR slug = ? ORDER BY id', ['']);
  for (const product of productsWithoutSlugs) {
    await connection.execute('UPDATE products SET slug = ? WHERE id = ?', [slugify(product.name, product.id), product.id]);
  }
  const [legacyProducts] = await connection.query('SELECT id, name, brand, category, product_tag, description, images FROM products');
  for (const product of legacyProducts) {
    await connection.execute(
      `UPDATE products SET sku = COALESCE(NULLIF(sku, ''), ?),
       product_tags = COALESCE(product_tags, ?), color_variations = COALESCE(color_variations, JSON_ARRAY()),
       meta_title = COALESCE(NULLIF(meta_title, ''), ?), meta_description = COALESCE(NULLIF(meta_description, ''), ?),
       image_alt_text = COALESCE(NULLIF(image_alt_text, ''), ?) WHERE id = ?`,
      [`KZ-LEGACY-${String(product.id).padStart(6, '0')}`, JSON.stringify(product.product_tag ? [product.product_tag] : []),
        String(product.name).slice(0, 255), String(product.description || product.name).slice(0, 320), `${product.brand} ${product.name}`, product.id],
    );
    await connection.execute(
      'INSERT IGNORE INTO brands (name, status, meta_title, meta_description) VALUES (?, ?, ?, ?)',
      [product.brand, 'Active', product.brand, `Shop ${product.brand} footwear at KICKZ.LK.`],
    );
    await connection.execute(
      'INSERT INTO categories (name, status, meta_title, meta_description) SELECT ?, ?, ?, ? WHERE NOT EXISTS (SELECT 1 FROM categories WHERE name = ?)',
      [product.category, 'Active', product.category, `Shop ${product.category} at KICKZ.LK.`, product.category],
    );
  }
  await connection.query('UPDATE products p JOIN brands b ON b.name = p.brand SET p.brand_id = b.id WHERE p.brand_id IS NULL');
  await connection.query('UPDATE products p JOIN categories c ON c.name = p.category SET p.category_id = c.id WHERE p.category_id IS NULL');
  await connection.query('ALTER TABLE products MODIFY slug VARCHAR(180) NOT NULL');
  await connection.query('ALTER TABLE products MODIFY sku VARCHAR(100) NOT NULL, MODIFY product_tags JSON NOT NULL, MODIFY color_variations JSON NOT NULL');
  if (!(await indexExists('products', 'uq_products_slug'))) await connection.query('ALTER TABLE products ADD UNIQUE KEY uq_products_slug (slug)');
  if (!(await indexExists('products', 'uq_products_sku'))) await connection.query('ALTER TABLE products ADD UNIQUE KEY uq_products_sku (sku)');
  if (!(await indexExists('products', 'idx_products_brand_id'))) await connection.query('ALTER TABLE products ADD KEY idx_products_brand_id (brand_id)');

  const defaultBrands = ['Nike', 'Jordan', 'Adidas', 'New Balance', 'Puma', 'Balmain', 'Christian Louboutin'];
  for (const brand of defaultBrands) {
    await connection.execute(
      'INSERT IGNORE INTO brands (name, status, meta_title, meta_description) VALUES (?, ?, ?, ?)',
      [brand, 'Active', brand, `Shop ${brand} footwear at KICKZ.LK.`],
    );
  }
  const options = {
    type: ['Lifestyle Sneakers', 'Running Shoes', 'Basketball Shoes', 'Casual Sneakers', 'Luxury Sneakers', 'Limited Edition', 'Collaboration'],
    gender: ['Men', 'Women', 'Kids', 'Unisex'],
    collection: ['New Arrivals', 'Best Sellers', 'Trending Now', 'Exclusive Drops', 'Pre-Order', 'Sale / Offers'],
  };
  for (const [kind, values] of Object.entries(options)) {
    for (const value of values) await connection.execute('INSERT IGNORE INTO catalog_options (kind, value) VALUES (?, ?)', [kind, value]);
  }

  console.log(`Database ${env.database.name} initialized.`);
} finally {
  await connection.end();
}
