import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import bcrypt from 'bcryptjs';
import AuthService from '../services/AuthService.js';
import OrderService from '../services/OrderService.js';

describe('authentication services', () => {
  test('registration hashes passwords and returns a customer JWT', async () => {
    let created;
    const service = new AuthService({
      userModel: {
        findByEmail: async () => null,
        create: async (payload) => {
          created = payload;
          return { id: 8, name: payload.name, email: payload.email, phone_number: payload.phoneNumber };
        },
      },
      adminModel: {},
    });
    const result = await service.register({
      name: 'Test Customer', email: 'TEST@example.com', password: 'StrongPassword1', phoneNumber: '+94771234567',
    });
    assert.equal(result.user.email, 'test@example.com');
    assert.notEqual(created.passwordHash, 'StrongPassword1');
    assert.equal(await bcrypt.compare('StrongPassword1', created.passwordHash), true);
    assert.equal(typeof result.token, 'string');
  });

  test('admin login uses the separate administrator store', async () => {
    const hash = await bcrypt.hash('AdminPassword1', 4);
    const service = new AuthService({
      userModel: {},
      adminModel: { findByEmail: async () => ({ id: 1, email: 'admin@kickz.lk', password_hash: hash }) },
    });
    const result = await service.adminLogin({ email: 'admin@kickz.lk', password: 'AdminPassword1' });
    assert.equal(result.admin.id, 1);
    assert.equal(typeof result.token, 'string');
  });
});

describe('order services', () => {
  test('guest orders use database product prices and compute balances server-side', async () => {
    let saved;
    const service = new OrderService({
      productModel: { findById: async () => ({ id: 5, name: 'Retro High', price: 64900, size: ['US 9'] }) },
      orderModel: { create: async (payload) => { saved = payload; return payload; } },
    });
    await service.create({
      customerName: 'Guest', email: 'guest@example.com', phoneNumber: '+94771234567',
      shippingAddress: 'Colombo', paidAmount: 10000,
      items: [{ productId: 5, selectedSize: 'US 9', quantity: 2, price: 1 }],
    });
    assert.equal(saved.userId, null);
    assert.equal(saved.totalAmount, 129800);
    assert.equal(saved.pendingAmount, 119800);
    assert.match(saved.orderNumber, /^KZ-/);
  });

  test('logged-in orders retain the authenticated customer id', async () => {
    const service = new OrderService({
      productModel: { findById: async () => ({ id: 6, name: 'Dunk Low', price: 47500, size: ['US 8'] }) },
      orderModel: { create: async (payload) => payload },
    });
    const result = await service.create({
      customerName: 'Customer', email: 'customer@example.com', phoneNumber: '+94771234567',
      shippingAddress: 'Kandy', items: [{ productId: 6, selectedSize: 'US 8' }],
    }, 42);
    assert.equal(result.userId, 42);
  });
});
