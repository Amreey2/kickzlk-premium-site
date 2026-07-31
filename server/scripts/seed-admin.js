import bcrypt from 'bcryptjs';
import { query, closeDatabase } from '../config/database.js';
import { normalizeEmail } from '../utils/validation.js';

const email = normalizeEmail(process.env.ADMIN_EMAIL || '');
const password = process.env.ADMIN_PASSWORD || '';
if (!email || password.length < 12) throw new Error('Set ADMIN_EMAIL and an ADMIN_PASSWORD of at least 12 characters.');
try {
  const existing = await query('SELECT id FROM admins LIMIT 1');
  if (existing.length) throw new Error('An administrator already exists; this project supports one store administrator.');
  await query('INSERT INTO admins (email, password_hash) VALUES (?, ?)', [email, await bcrypt.hash(password, 12)]);
  console.log(`Administrator ${email} created.`);
} finally {
  await closeDatabase();
}
