import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import mysql from 'mysql2/promise';
import { env } from '../config/env.js';
import { ensureProductColorVariantsColumn } from './migrations/ensure-product-color-variants.js';

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

const constraintExists = async (table, constraint) => {
  const [rows] = await connection.execute(
    'SELECT 1 FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS WHERE CONSTRAINT_SCHEMA = ? AND TABLE_NAME = ? AND CONSTRAINT_NAME = ? LIMIT 1',
    [env.database.name, table, constraint],
  );
  return rows.length > 0;
};

const assertNoOrphans = async ({ childTable, childColumn, parentTable, message }) => {
  const [rows] = await connection.query(
    `SELECT COUNT(*) AS total FROM \`${childTable}\` child LEFT JOIN \`${parentTable}\` parent ON parent.id = child.\`${childColumn}\` WHERE child.\`${childColumn}\` IS NOT NULL AND parent.id IS NULL`,
  );
  if (Number(rows[0]?.total || 0) > 0) throw new Error(message);
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
  await ensureProductColorVariantsColumn(connection, env.database.name);
  if (!(await columnExists('products', 'cdn_images'))) await connection.query('ALTER TABLE products ADD COLUMN cdn_images JSON NULL AFTER color_variants');
  if (!(await columnExists('products', 'original_price'))) await connection.query('ALTER TABLE products ADD COLUMN original_price DECIMAL(12,2) NULL AFTER price');
  if (!(await columnExists('orders', 'tracking_number'))) await connection.query('ALTER TABLE orders ADD COLUMN tracking_number VARCHAR(50) NULL AFTER order_number');
  if (!(await columnExists('orders', 'idempotency_key'))) await connection.query('ALTER TABLE orders ADD COLUMN idempotency_key VARCHAR(100) NULL AFTER tracking_number');
  if (!(await columnExists('orders', 'shipping_city'))) await connection.query('ALTER TABLE orders ADD COLUMN shipping_city VARCHAR(120) NULL AFTER shipping_address');
  if (!(await columnExists('orders', 'subtotal_amount'))) await connection.query('ALTER TABLE orders ADD COLUMN subtotal_amount DECIMAL(12,2) NOT NULL DEFAULT 0 AFTER idempotency_key');
  if (!(await columnExists('orders', 'discount_amount'))) await connection.query('ALTER TABLE orders ADD COLUMN discount_amount DECIMAL(12,2) NOT NULL DEFAULT 0 AFTER subtotal_amount');
  if (!(await columnExists('orders', 'eligible_subtotal_amount'))) await connection.query('ALTER TABLE orders ADD COLUMN eligible_subtotal_amount DECIMAL(12,2) NOT NULL DEFAULT 0 AFTER discount_amount');
  if (!(await columnExists('orders', 'coupon_id'))) await connection.query('ALTER TABLE orders ADD COLUMN coupon_id BIGINT UNSIGNED NULL AFTER eligible_subtotal_amount');
  if (!(await columnExists('orders', 'coupon_code'))) await connection.query('ALTER TABLE orders ADD COLUMN coupon_code VARCHAR(50) NULL AFTER coupon_id');
  if (!(await columnExists('orders', 'coupon_discount_type'))) await connection.query('ALTER TABLE orders ADD COLUMN coupon_discount_type VARCHAR(20) NULL AFTER coupon_code');
  if (!(await columnExists('orders', 'coupon_discount_value'))) await connection.query('ALTER TABLE orders ADD COLUMN coupon_discount_value DECIMAL(12,2) NULL AFTER coupon_discount_type');
  if (!(await columnExists('orders', 'payment_option'))) await connection.query("ALTER TABLE orders ADD COLUMN payment_option VARCHAR(20) NOT NULL DEFAULT 'advance' AFTER total_amount");
  if (!(await columnExists('orders', 'advance_percentage'))) await connection.query('ALTER TABLE orders ADD COLUMN advance_percentage DECIMAL(5,2) NOT NULL DEFAULT 50 AFTER payment_option');
  if (!(await columnExists('orders', 'advance_amount'))) await connection.query('ALTER TABLE orders ADD COLUMN advance_amount DECIMAL(12,2) NOT NULL DEFAULT 0 AFTER total_amount');
  if (!(await columnExists('orders', 'payment_method'))) await connection.query("ALTER TABLE orders ADD COLUMN payment_method VARCHAR(50) NOT NULL DEFAULT 'Bank Transfer' AFTER pending_amount");
  if (!(await columnExists('order_items', 'selected_color'))) await connection.query('ALTER TABLE order_items ADD COLUMN selected_color VARCHAR(100) NULL AFTER product_name');
  if (!(await columnExists('order_items', 'original_price'))) await connection.query('ALTER TABLE order_items ADD COLUMN original_price DECIMAL(12,2) NULL AFTER price');
  if (!(await columnExists('order_items', 'discount_amount'))) await connection.query('ALTER TABLE order_items ADD COLUMN discount_amount DECIMAL(12,2) NOT NULL DEFAULT 0 AFTER original_price');
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
  if (!(await indexExists('products', 'idx_products_availability_created'))) await connection.query('ALTER TABLE products ADD KEY idx_products_availability_created (availability, created_at, id)');
  if (!(await constraintExists('products', 'fk_products_brand'))) {
    await assertNoOrphans({ childTable: 'products', childColumn: 'brand_id', parentTable: 'brands', message: 'Cannot add the product-brand constraint because orphaned brand references exist. Resolve them before retrying.' });
    await connection.query('ALTER TABLE products ADD CONSTRAINT fk_products_brand FOREIGN KEY (brand_id) REFERENCES brands(id) ON DELETE SET NULL');
  }
  if (!(await indexExists('categories', 'uq_categories_name'))) {
    const [duplicates] = await connection.query('SELECT name FROM categories GROUP BY name HAVING COUNT(*) > 1 LIMIT 1');
    if (duplicates.length) throw new Error(`Cannot add category-name uniqueness because duplicate category "${duplicates[0].name}" exists. Resolve it before retrying.`);
    await connection.query('ALTER TABLE categories ADD UNIQUE KEY uq_categories_name (name)');
  }
  await connection.query("UPDATE orders SET tracking_number = CONCAT('KZTRK-', DATE_FORMAT(created_at, '%Y%m%d'), '-', LPAD(id, 8, '0')) WHERE tracking_number IS NULL OR tracking_number = ''");
  await connection.query("UPDATE orders SET order_number = CONCAT('KZ-', LPAD(CAST(id AS CHAR), GREATEST(5, CHAR_LENGTH(CAST(id AS CHAR))), '0'))");
  await connection.query('UPDATE orders SET subtotal_amount = total_amount + discount_amount WHERE subtotal_amount = 0');
  await connection.query('UPDATE orders SET eligible_subtotal_amount = subtotal_amount WHERE eligible_subtotal_amount = 0 AND coupon_code IS NOT NULL');
  await connection.query("UPDATE orders SET payment_option = CASE WHEN pending_amount = 0 AND total_amount > 0 THEN 'full' ELSE 'advance' END WHERE payment_option IS NULL OR payment_option NOT IN ('advance', 'full')");
  await connection.query("UPDATE orders SET advance_percentage = CASE WHEN payment_option = 'full' THEN 100 ELSE 50 END, advance_amount = CASE WHEN payment_option = 'full' THEN total_amount ELSE ROUND(total_amount * 0.5) END, pending_amount = CASE WHEN payment_option = 'full' THEN 0 ELSE total_amount - ROUND(total_amount * 0.5) END WHERE advance_amount = 0 AND paid_amount = 0 AND payment_status IN ('Payment Pending', 'Pending', 'Unpaid')");
  await connection.query("UPDATE orders SET payment_status = CASE WHEN payment_status IN ('Payment Confirmed', 'Deposit Paid') THEN CASE WHEN payment_option = 'full' THEN 'Full Payment Confirmed' ELSE '50% Payment Confirmed' END WHEN payment_status = 'Paid' THEN 'Full Payment Confirmed' ELSE CASE WHEN payment_option = 'full' THEN 'Payment Pending — Full Amount' ELSE 'Payment Pending — 50% Advance' END END WHERE payment_status IN ('Payment Confirmed', 'Deposit Paid', 'Paid', 'Payment Pending', 'Pending', 'Unpaid')");
  await connection.query("UPDATE orders SET order_status = CASE WHEN order_status IN ('Pending', 'Order Placed', 'Payment Pending') THEN CASE WHEN payment_option = 'full' THEN 'Payment Pending — Full Amount' ELSE 'Payment Pending — 50% Advance' END WHEN order_status = 'Payment Confirmed' THEN CASE WHEN payment_option = 'full' THEN 'Full Payment Confirmed' ELSE '50% Payment Confirmed' END ELSE order_status END");
  await connection.query("UPDATE orders SET paid_amount = CASE WHEN payment_status = 'Full Payment Confirmed' THEN total_amount WHEN payment_status = '50% Payment Confirmed' THEN advance_amount ELSE paid_amount END WHERE payment_status IN ('Full Payment Confirmed', '50% Payment Confirmed')");
  await connection.query("UPDATE site_settings SET setting_value = JSON_SET(setting_value, '$.advancePercentage', 50) WHERE setting_key = 'payment_settings' AND CAST(JSON_UNQUOTE(JSON_EXTRACT(setting_value, '$.advancePercentage')) AS DECIMAL(5,2)) = 30");
  await connection.query('ALTER TABLE orders MODIFY tracking_number VARCHAR(50) NOT NULL');
  if (!(await indexExists('orders', 'idx_orders_coupon'))) await connection.query('ALTER TABLE orders ADD KEY idx_orders_coupon (coupon_id)');
  if (!(await indexExists('orders', 'idx_orders_created'))) await connection.query('ALTER TABLE orders ADD KEY idx_orders_created (created_at, id)');
  if (!(await indexExists('order_status_history', 'idx_status_history_order_created'))) await connection.query('ALTER TABLE order_status_history ADD KEY idx_status_history_order_created (order_id, created_at, id)');
  if (!(await constraintExists('orders', 'fk_orders_coupon'))) {
    await assertNoOrphans({ childTable: 'orders', childColumn: 'coupon_id', parentTable: 'coupons', message: 'Cannot add the order-coupon constraint because orphaned coupon references exist. Resolve them before retrying.' });
    await connection.query('ALTER TABLE orders ADD CONSTRAINT fk_orders_coupon FOREIGN KEY (coupon_id) REFERENCES coupons(id) ON DELETE SET NULL');
  }
  if (!(await indexExists('orders', 'uq_orders_tracking'))) await connection.query('ALTER TABLE orders ADD UNIQUE KEY uq_orders_tracking (tracking_number)');
  if (!(await indexExists('orders', 'uq_orders_idempotency'))) await connection.query('ALTER TABLE orders ADD UNIQUE KEY uq_orders_idempotency (idempotency_key)');


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
