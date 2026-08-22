import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

export const createCustomerToken = (user) => jwt.sign(
  { sub: String(user.id), type: 'customer' },
  env.jwt.customerSecret,
  { expiresIn: env.jwt.customerExpiresIn, issuer: 'kickz.lk' },
);

export const createAdminToken = (admin) => jwt.sign(
  { sub: String(admin.id), type: 'admin' },
  env.jwt.adminSecret,
  { expiresIn: env.jwt.adminExpiresIn, issuer: 'kickz.lk-admin' },
);

export const verifyCustomerToken = (token) => jwt.verify(token, env.jwt.customerSecret, { issuer: 'kickz.lk' });
export const verifyAdminToken = (token) => jwt.verify(token, env.jwt.adminSecret, { issuer: 'kickz.lk-admin' });
