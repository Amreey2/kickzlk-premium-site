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
try {
  await connection.query(`CREATE DATABASE IF NOT EXISTS \`${env.database.name}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
  await connection.query(`USE \`${env.database.name}\``);
  await connection.query(schema);
  console.log(`Database ${env.database.name} initialized.`);
} finally {
  await connection.end();
}
