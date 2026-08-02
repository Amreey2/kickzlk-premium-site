import bcrypt from 'bcryptjs';
import { query, closeDatabase } from '../config/database.js';
import { normalizeEmail } from '../utils/validation.js';

const email = normalizeEmail(process.env.ADMIN_EMAIL || '');
const password = process.env.ADMIN_PASSWORD || '';
if (!email || password.length < 12) throw new Error('Set ADMIN_EMAIL and an ADMIN_PASSWORD of at least 12 characters.');
try {
  const existing = await query('SELECT id, email FROM administrators LIMIT 1');
  if (existing.length) {
    console.log(`Administrator ${existing[0].email} already exists; no additional account was created.`);
    process.exitCode = 0;
  } else {
    await query('INSERT INTO administrators (email, password_hash) VALUES (?, ?)', [email, await bcrypt.hash(password, 12)]);
    console.log(`Administrator ${email} created.`);
  }
} finally {
  await closeDatabase();
}
