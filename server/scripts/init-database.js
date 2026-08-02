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

  // CREATE TABLE IF NOT EXISTS does not add Sprint 6 product fields to an existing database.
  if (!(await columnExists('products', 'slug'))) await connection.query('ALTER TABLE products ADD COLUMN slug VARCHAR(180) NULL AFTER id');
  if (!(await columnExists('products', 'stock'))) await connection.query('ALTER TABLE products ADD COLUMN stock INT UNSIGNED NOT NULL DEFAULT 0 AFTER availability');

  const [productsWithoutSlugs] = await connection.query('SELECT id, name FROM products WHERE slug IS NULL OR slug = ? ORDER BY id', ['']);
  for (const product of productsWithoutSlugs) {
    await connection.execute('UPDATE products SET slug = ? WHERE id = ?', [slugify(product.name, product.id), product.id]);
  }
  await connection.query('ALTER TABLE products MODIFY slug VARCHAR(180) NOT NULL');
  if (!(await indexExists('products', 'uq_products_slug'))) await connection.query('ALTER TABLE products ADD UNIQUE KEY uq_products_slug (slug)');

  console.log(`Database ${env.database.name} initialized.`);
} finally {
  await connection.end();
}
