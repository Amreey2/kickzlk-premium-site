import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';

const serverDirectory = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(serverDirectory, '../.env'), quiet: true });

const bool = (value, fallback = false) => value === undefined ? fallback : value === 'true';
const number = (value, fallback) => Number.isFinite(Number(value)) ? Number(value) : fallback;

export const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: number(process.env.PORT, 5000),
  siteUrl: String(process.env.SITE_URL || 'https://kickz.lk').replace(/\/$/, ''),
  clientOrigins: (process.env.CLIENT_ORIGIN || 'http://localhost:5173').split(',').map((value) => value.trim()),
  database: {
    host: process.env.DB_HOST || '127.0.0.1',
    port: number(process.env.DB_PORT, 3306),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    name: process.env.DB_NAME || 'kickz_lk',
    ssl: bool(process.env.DB_SSL),
    required: bool(process.env.DB_REQUIRED),
  },
  jwt: {
    customerSecret: process.env.JWT_CUSTOMER_SECRET || 'development-customer-secret-change-me',
    adminSecret: process.env.JWT_ADMIN_SECRET || 'development-admin-secret-change-me',
    customerExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
    adminExpiresIn: process.env.ADMIN_JWT_EXPIRES_IN || '8h',
  },
  cookieSecure: bool(process.env.COOKIE_SECURE, process.env.NODE_ENV === 'production'),
  maxUploadMb: number(process.env.MAX_UPLOAD_MB, 8),
};

if (env.nodeEnv === 'production') {
  const invalid = [env.jwt.customerSecret, env.jwt.adminSecret]
    .some((secret) => secret.length < 32 || secret.includes('change-me'));
  if (invalid || env.jwt.customerSecret === env.jwt.adminSecret) {
    throw new Error('Production JWT secrets must be different and at least 32 characters long.');
  }
}
