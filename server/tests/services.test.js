import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import bcrypt from 'bcryptjs';
import AuthService from '../services/AuthService.js';
import OrderService from '../services/OrderService.js';
import ProductService from '../services/ProductService.js';

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

describe('catalogue product services', () => {
  const payload = {
    sku: 'NK-AJ1-SHD-0001', brand: 'Nike', brandId: 1, category: 'Sneakers', categoryId: 2,
    name: 'Air Jordan 1', description: 'A premium high-top sneaker.', price: 64900,
    sizes: ['8', '9'], preOrder: true, stock: 0, images: [], cdnImages: ['https://cdn.example.com/aj1.jpg'],
    productTags: ['New Arrival', 'Basketball'], colorVariations: ['Black', 'Red'],
    metaTitle: 'Air Jordan 1 Sri Lanka', metaDescription: 'Shop the Air Jordan 1 at KICKZ.LK.', imageAltText: 'Black and red Air Jordan 1',
  };

  test('creates products only with unique SKUs and valid catalogue relations', async () => {
    let saved;
    const service = new ProductService({
      productModel: { findBySku: async () => null, create: async (data) => { saved = data; return data; } },
      brandModel: { findById: async () => ({ id: 1, name: 'Nike', status: 'Active' }) },
      categoryModel: { findById: async () => ({ id: 2, name: 'Sneakers', status: 'Active' }) },
    });
    await service.create(payload);
    assert.equal(saved.sku, payload.sku);
    assert.deepEqual(saved.productTags, payload.productTags);
    assert.deepEqual(saved.colorVariations, payload.colorVariations);
  });

  test('rejects duplicate SKUs and invalid CDN URLs', async () => {
    const service = new ProductService({
      productModel: { findBySku: async () => ({ id: 'existing' }) },
      brandModel: { findById: async () => ({ id: 1, name: 'Nike', status: 'Active' }) },
      categoryModel: { findById: async () => ({ id: 2, name: 'Sneakers', status: 'Active' }) },
    });
    await assert.rejects(() => service.create(payload), (error) => error.code === 'SKU_EXISTS');
    await assert.rejects(() => service.create({ ...payload, sku: 'UNIQUE-2', cdnImages: ['not-a-url'] }), (error) => error.code === 'INVALID_IMAGE_URL');
  });
});
