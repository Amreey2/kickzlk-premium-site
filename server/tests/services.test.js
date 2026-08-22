import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import bcrypt from 'bcryptjs';
import AuthService from '../services/AuthService.js';
import OrderService from '../services/OrderService.js';
import ProductService from '../services/ProductService.js';
import CatalogService from '../services/CatalogService.js';
import ProductImportService, { CSV_COLUMNS } from '../services/ProductImportService.js';
import ProductImportModel from '../models/ProductImportModel.js';
import ProductModel from '../models/ProductModel.js';
import OrderModel from '../models/OrderModel.js';
import CouponService from '../services/CouponService.js';
import SiteSettingService from '../services/SiteSettingService.js';
import { serializeCsv } from '../utils/csv.js';
import { ensureProductColorVariantsColumn } from '../scripts/migrations/ensure-product-color-variants.js';
import { formatOrderNumber } from '../utils/orderNumber.js';

test('CSV exports neutralize spreadsheet formula injection', () => {
  assert.equal(serializeCsv([['sku', '=HYPERLINK("https://evil.example")']]), 'sku,"\'=HYPERLINK(""https://evil.example"")"');
});

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

  test('customer login returns a controlled error for a wrong password', async () => {
    const service = new AuthService({
      adminModel: {}, addressModel: {}, passwordResetModel: {},
      userModel: { findByEmail: async () => ({ id: 7, email: 'customer@example.com', password_hash: await bcrypt.hash('CorrectPassword1', 4) }) },
    });
    await assert.rejects(
      () => service.login({ email: 'customer@example.com', password: 'WrongPassword1' }),
      (error) => error.code === 'INVALID_CREDENTIALS' && error.status === 401,
    );
  });

  test('enforces the two-address maximum', async () => {
    const service = new AuthService({
      userModel: {}, adminModel: {}, passwordResetModel: {},
      addressModel: { list: async () => [{ id: 1 }, { id: 2 }] },
    });
    await assert.rejects(
      () => service.createAddress(7, { label: 'Other', fullName: 'Customer', phoneNumber: '+94771234567', addressLine1: 'Street', city: 'Colombo' }),
      (error) => error.code === 'ADDRESS_LIMIT',
    );
  });

  test('prepares hashed one-time password reset tokens', async () => {
    let storedHash; let updatedPasswordHash;
    const user = { id: 7, email: 'customer@example.com' };
    const service = new AuthService({
      adminModel: {}, addressModel: {},
      userModel: {
        findByEmail: async () => user,
        updatePassword: async (id, hash) => { assert.equal(id, user.id); updatedPasswordHash = hash; },
      },
      passwordResetModel: {
        replace: async (id, hash) => { assert.equal(id, user.id); storedHash = hash; },
        findUsable: async (hash) => hash === storedHash ? { id: 9, customer_id: user.id } : null,
        use: async (id) => id === 9,
      },
    });
    const prepared = await service.requestPasswordReset({ email: user.email });
    assert.equal(storedHash.length, 64);
    assert.notEqual(storedHash, prepared.resetToken);
    await service.resetPassword({ token: prepared.resetToken, password: 'NewPassword1' });
    assert.equal(await bcrypt.compare('NewPassword1', updatedPasswordHash), true);
  });
});

describe('order services', () => {
  test('guest orders use database product prices and compute balances server-side', async () => {
    let saved;
    const service = new OrderService({
      productModel: { findById: async () => ({ id: 5, name: 'Retro High', price: 64900, size: ['US 9'] }) },
      orderModel: { findByIdempotencyKey: async () => null, create: async (payload) => { saved = payload; return payload; } },
    });
    await service.create({
      customerName: 'Guest', email: 'guest@example.com', phoneNumber: '+94771234567',
      shippingAddress: 'Colombo', shippingCity: 'Colombo', idempotencyKey: 'guest-order-test-0001',
      paymentStatus: 'Payment Confirmed', items: [{ productId: 5, selectedSize: 'US 9', quantity: 2, price: 1 }],
    });
    assert.equal(saved.userId, null);
    assert.equal(saved.totalAmount, 129800);
    assert.equal(saved.advanceAmount, 64900);
    assert.equal(saved.pendingAmount, 64900);
    assert.equal(saved.paidAmount, 0);
    assert.equal(saved.paymentOption, 'advance');
    assert.equal(saved.advancePercentage, 50);
    assert.equal(saved.paymentStatus, 'Payment Pending — 50% Advance');
    assert.equal(saved.orderStatus, 'Payment Pending — 50% Advance');
  });

  test('logged-in orders retain the authenticated customer id', async () => {
    const service = new OrderService({
      productModel: { findById: async () => ({ id: 6, name: 'Dunk Low', price: 47500, size: ['US 8'] }) },
      orderModel: { findByIdempotencyKey: async () => null, create: async (payload) => payload },
    });
    const result = await service.create({
      customerName: 'Customer', email: 'customer@example.com', phoneNumber: '+94771234567',
      shippingAddress: 'Kandy', shippingCity: 'Kandy', idempotencyKey: 'customer-order-test-0001', items: [{ productId: 6, selectedSize: 'US 8' }],
    }, 42);
    assert.equal(result.userId, 42);
  });

  test('validates coupons and calculates advance amounts from server prices', async () => {
    const service = new OrderService({
      productModel: { findById: async () => ({ id: 6, name: 'Dunk Low', price: 50000, originalPrice: 60000, size: ['40'], colorVariations: ['Black'] }) },
      orderModel: {}, siteSettingService: { paymentSettings: async () => ({ advancePercentage: 50, methodName: 'Bank Transfer' }) },
      couponService: new CouponService({ couponModel: { findByCode: async (code) => code === 'KICKZ10' ? { id: 1, code, status: 'Active', discountType: 'Percentage', discountValue: 10, appliesTo: 'store', minimumOrderAmount: 0, totalUsageLimit: null, perCustomerLimit: null, productIds: [], categoryIds: [] } : null, usage: async () => ({ total: 0, customer: 0 }) }, productModel: {}, categoryModel: {} }),
    });
    const quote = await service.quote({ couponCode: 'KICKZ10', items: [{ productId: 6, selectedSize: '40', selectedColor: 'Black', quantity: 2 }] });
    assert.equal(quote.subtotalAmount, 100000);
    assert.equal(quote.discountAmount, 10000);
    assert.equal(quote.totalAmount, 90000);
    assert.equal(quote.advanceAmount, 45000);
    assert.equal(quote.balanceAmount, 45000);
    const fullQuote = await service.quote({ paymentOption: 'full', items: [{ productId: 6, selectedSize: '40', selectedColor: 'Black', quantity: 2 }] });
    assert.equal(fullQuote.advanceAmount, 100000);
    assert.equal(fullQuote.balanceAmount, 0);
    assert.equal(fullQuote.advancePercentage, 100);
    await assert.rejects(() => service.quote({ couponCode: 'INVALID', items: [{ productId: 6, selectedSize: '40' }] }), (error) => error.code === 'INVALID_COUPON');
  });

  test('returns the original order when an idempotency key is submitted again', async () => {
    const existing = { id: 91, order_number: 'KZ-EXISTING', idempotency_key: 'repeat-order-test-0001' };
    const service = new OrderService({
      productModel: { findById: async () => { throw new Error('Products should not be reprocessed.'); } },
      orderModel: { findByIdempotencyKey: async () => existing, create: async () => { throw new Error('Duplicate order created.'); } },
    });
    const result = await service.create({
      customerName: 'Guest', email: 'guest@example.com', phoneNumber: '+94771234567', shippingAddress: 'Colombo',
      shippingCity: 'Colombo', idempotencyKey: 'repeat-order-test-0001', items: [{ productId: 5, selectedSize: '9' }],
    });
    assert.equal(result, existing);
  });

  test('uses auto-increment ids for readable order numbers and enforces the selected payment workflow', async () => {
    assert.equal(formatOrderNumber(1), 'KZ-00001');
    assert.equal(formatOrderNumber(42), 'KZ-00042');
    let savedStatus;
    const service = new OrderService({
      productModel: {},
      orderModel: {
        findById: async () => ({ id: 42, payment_option: 'full', advance_percentage: 100 }),
        updateStatus: async (id, status) => { savedStatus = status; return { id, order_status: status }; },
      },
    });
    await assert.rejects(() => service.updateStatus(42, '50% Payment Confirmed'), (error) => error.code === 'INVALID_ORDER_STATUS');
    await service.updateStatus(42, 'Full Payment Confirmed');
    assert.equal(savedStatus, 'Full Payment Confirmed');
  });

  test('admin-created customer and guest orders reuse server pricing and start at Order Placed', async () => {
    const saved = [];
    const service = new OrderService({
      userModel: {
        findById: async (id) => Number(id) === 7 ? { id: 7, name: 'Account Customer', email: 'account@example.com', phone_number: '+94770000001' } : null,
        search: async () => [{ id: 7, name: 'Account Customer', email: 'account@example.com', phone_number: '+94770000001', address_line_1: 'Main Road', city: 'Colombo' }],
      },
      productModel: { findById: async () => ({ id: 5, name: 'Dunk Low', price: 100000, size: ['42'], colorVariations: ['Black'] }) },
      orderModel: { findByIdempotencyKey: async () => null, create: async (payload) => { saved.push(payload); return payload; } },
    });
    const base = { shippingAddress: 'Main Road', shippingCity: 'Colombo', items: [{ productId: 5, selectedSize: '42', selectedColor: 'Black' }] };
    const accountOrder = await service.adminCreate({ ...base, customerId: 7, phoneNumber: '+94770000001', idempotencyKey: 'admin-account-order-0001' });
    const guestOrder = await service.adminCreate({ ...base, customerName: 'Admin Guest', email: 'guest@example.com', phoneNumber: '+94770000002', paymentOption: 'full', idempotencyKey: 'admin-guest-order-00002' });
    assert.equal(accountOrder.userId, 7);
    assert.equal(accountOrder.customerName, 'Account Customer');
    assert.equal(accountOrder.orderStatus, 'Order Placed');
    assert.equal(accountOrder.advanceAmount, 50000);
    assert.equal(accountOrder.paidAmount, 0);
    assert.equal(guestOrder.userId, null);
    assert.equal(guestOrder.orderStatus, 'Order Placed');
    assert.equal(guestOrder.advanceAmount, 100000);
    assert.equal(guestOrder.pendingAmount, 0);
    assert.equal(saved.length, 2);
    assert.equal((await service.searchCustomers('account'))[0].address, 'Main Road');
  });

  test('enforces general ready-stock limits across cart lines while preserving pre-orders', async () => {
    const products = new Map([
      ['ready', { id: 'ready', databaseId: 8, name: 'Ready Pair', price: 25000, size: ['40', '41'], stock: 2, preOrder: false, availability: 'Active' }],
      ['preorder', { id: 'preorder', databaseId: 9, name: 'Future Pair', price: 30000, size: ['42'], stock: 0, preOrder: true, availability: 'Active' }],
      ['inactive', { id: 'inactive', databaseId: 10, name: 'Hidden Pair', price: 30000, size: ['42'], stock: 5, preOrder: false, availability: 'Inactive' }],
    ]);
    const service = new OrderService({ productModel: { findById: async (id) => products.get(id) }, orderModel: {} });
    await assert.rejects(
      () => service.quote({ items: [{ productId: 'ready', selectedSize: '40', quantity: 2 }, { productId: 'ready', selectedSize: '41', quantity: 1 }] }),
      (error) => error.code === 'INSUFFICIENT_STOCK' && error.status === 409,
    );
    const preorder = await service.quote({ items: [{ productId: 'preorder', selectedSize: '42', quantity: 5 }] });
    assert.equal(preorder.items[0].requiresStock, false);
    await assert.rejects(
      () => service.quote({ items: [{ productId: 'inactive', selectedSize: '42', quantity: 1 }] }),
      (error) => error.code === 'PRODUCT_UNAVAILABLE' && error.status === 409,
    );
  });

  test('atomically allows only one order to consume the final ready-stock unit', async () => {
    let stock = 1;
    let nextOrderId = 1;
    const connection = () => ({
      beginTransaction: async () => undefined,
      commit: async () => undefined,
      rollback: async () => undefined,
      release: () => undefined,
      execute: async (sql, parameters = []) => {
        if (sql.startsWith('SELECT * FROM orders WHERE idempotency_key')) return [[]];
        if (sql.startsWith('UPDATE products SET stock = stock -')) {
          const quantity = Number(parameters[0]);
          if (stock < quantity) return [{ affectedRows: 0 }];
          stock -= quantity;
          return [{ affectedRows: 1 }];
        }
        if (sql.startsWith('INSERT INTO orders')) return [{ insertId: nextOrderId++ }];
        return [{ affectedRows: 1 }];
      },
    });
    const model = new OrderModel({ pool: { getConnection: async () => connection() } });
    model.findById = async (id) => ({ id });
    const data = (key) => ({
      userId: null, customerName: 'Guest', email: `${key}@example.com`, phoneNumber: '+94770000000',
      shippingAddress: 'Colombo', shippingCity: 'Colombo', orderNotes: null, idempotencyKey: key,
      subtotalAmount: 1000, discountAmount: 0, eligibleSubtotalAmount: 0, couponId: null, couponCode: null,
      couponDiscountType: null, couponDiscountValue: null, totalAmount: 1000, paymentOption: 'advance',
      advancePercentage: 50, advanceAmount: 500, paidAmount: 0, pendingAmount: 500,
      paymentMethod: 'Bank Transfer', paymentStatus: 'Payment Pending — 50% Advance', orderStatus: 'Order Placed',
      items: [{ productId: 77, productName: 'Final Pair', selectedColor: null, selectedSize: '42', quantity: 1, price: 1000, originalPrice: null, discountAmount: 0, requiresStock: true }],
    });
    const results = await Promise.allSettled([
      model.createWithPricing({ idempotencyKey: 'stock-race-order-0001', build: async () => data('stock-race-order-0001') }),
      model.createWithPricing({ idempotencyKey: 'stock-race-order-0002', build: async () => data('stock-race-order-0002') }),
    ]);
    assert.equal(results.filter((result) => result.status === 'fulfilled').length, 1);
    assert.equal(results.filter((result) => result.status === 'rejected' && result.reason.code === 'INSUFFICIENT_STOCK').length, 1);
    assert.equal(stock, 0);
  });
});

describe('catalogue product services', () => {
  const payload = {
    sku: 'NK-AJ1-SHD-0001', brand: 'Nike', brandId: 1, category: 'Sneakers', categoryId: 2,
    name: 'Air Jordan 1', description: 'A premium high-top sneaker.', price: 64900,
    sizes: ['8', '9'], preOrder: true, stock: 0, images: [], cdnImages: ['https://cdn.example.com/aj1.jpg'],
    productTags: ['New Arrival', 'Basketball'], colorVariations: ['Black', 'Red'],
    colorVariants: [{ color: 'Black', images: [{ url: '/uploads/black.jpg' }], cdnImages: ['https://cdn.example.com/black.jpg'] }],
    metaTitle: 'Air Jordan 1 Sri Lanka', metaDescription: 'Shop the Air Jordan 1 at KICKZ.LK.', imageAltText: 'Black and red Air Jordan 1',
  };

  test('public catalogue reads enforce active products while admin reads retain all statuses', async () => {
    let receivedFilters;
    const inactive = { id: 'hidden-pair', availability: 'Inactive' };
    const service = new ProductService({
      productModel: {
        findAll: async (filters) => { receivedFilters = filters; return []; },
        findById: async () => inactive,
      },
      brandModel: {}, categoryModel: {},
    });
    await service.listPublic({ search: 'hidden' });
    assert.deepEqual(receivedFilters, { search: 'hidden', excludeAvailability: 'Inactive' });
    await assert.rejects(() => service.getPublic('hidden-pair'), (error) => error.code === 'PRODUCT_NOT_FOUND' && error.status === 404);
    assert.equal((await service.get('hidden-pair')).availability, 'Inactive');
  });

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
    assert.equal(saved.colorVariants[0].color, 'Black');
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

  test('allows products to save without optional SEO metadata', async () => {
    let saved;
    const service = new ProductService({
      productModel: { findBySku: async () => null, create: async (data) => { saved = data; return data; } },
      brandModel: { findById: async () => ({ id: 1, name: 'Nike', status: 'Active' }) },
      categoryModel: { findById: async () => ({ id: 2, name: 'Sneakers', status: 'Active' }) },
    });
    await service.create({ ...payload, metaTitle: '', metaDescription: '', imageAltText: '' });
    assert.equal(saved.metaTitle, null);
    assert.equal(saved.metaDescription, null);
    assert.equal(saved.imageAltText, null);
  });

  test('rejects duplicate colour names and invalid variant CDN images', async () => {
    const service = new ProductService({
      productModel: { findBySku: async () => null, create: async (data) => data },
      brandModel: { findById: async () => ({ id: 1, name: 'Nike', status: 'Active' }) },
      categoryModel: { findById: async () => ({ id: 2, name: 'Sneakers', status: 'Active' }) },
    });
    await assert.rejects(() => service.create({ ...payload, colorVariants: [{ color: 'Black' }, { color: 'black' }] }), (error) => error.code === 'INVALID_COLOR_VARIANTS');
    await assert.rejects(() => service.create({ ...payload, colorVariants: [{ color: 'Black', cdnImages: ['invalid'] }] }), (error) => error.code === 'INVALID_IMAGE_URL');
  });

  test('supports legacy, CDN-only, uploaded, and mixed colour galleries', async () => {
    const saved = [];
    const service = new ProductService({
      productModel: { findBySku: async () => null, create: async (data) => { saved.push(data); return data; } },
      brandModel: { findById: async () => ({ id: 1, name: 'Nike', status: 'Active' }) },
      categoryModel: { findById: async () => ({ id: 2, name: 'Sneakers', status: 'Active' }) },
    });
    await service.create({ ...payload, sku: 'VARIANT-NONE', colorVariations: [], colorVariants: [] });
    await service.create({ ...payload, sku: 'VARIANT-CDN', colorVariations: ['Black'], colorVariants: [{ color: 'Black', cdnImages: ['https://cdn.example.com/black.jpg'] }] });
    await service.create({ ...payload, sku: 'VARIANT-UPLOAD', colorVariations: ['White'], colorVariants: [{ color: 'White', images: [{ url: '/uploads/white.jpg' }] }] });
    await service.create({
      ...payload,
      sku: 'VARIANT-MIXED',
      colorVariations: ['Black', 'White'],
      colorVariants: [
        { color: 'Black', images: [{ url: '/uploads/black.jpg' }], cdnImages: ['https://cdn.example.com/black-alt.jpg'] },
        { color: 'White', images: [{ url: '/uploads/white.jpg' }], cdnImages: ['https://cdn.example.com/white-alt.jpg'] },
      ],
    });

    assert.deepEqual(saved[0].colorVariants, []);
    assert.deepEqual(saved[1].colorVariants[0].cdnImages, ['https://cdn.example.com/black.jpg']);
    assert.equal(saved[2].colorVariants[0].images[0].url, '/uploads/white.jpg');
    assert.deepEqual(saved[3].colorVariants.map((variant) => [variant.color, variant.images[0].url, variant.cdnImages[0]]), [
      ['Black', '/uploads/black.jpg', 'https://cdn.example.com/black-alt.jpg'],
      ['White', '/uploads/white.jpg', 'https://cdn.example.com/white-alt.jpg'],
    ]);
  });

  test('updates colour variants without changing the product SKU', async () => {
    let updated;
    const current = { ...payload, id: 'air-jordan-1', preOrder: true, availability: 'Active', deliveryTime: null, variations: [] };
    const service = new ProductService({
      productModel: {
        findById: async () => current,
        findBySku: async () => current,
        update: async (id, data) => { updated = { id, ...data }; return updated; },
      },
      brandModel: { findById: async () => ({ id: 1, name: 'Nike', status: 'Active' }) },
      categoryModel: { findById: async () => ({ id: 2, name: 'Sneakers', status: 'Active' }) },
    });
    await service.update(current.id, {
      colorVariants: [
        { color: 'Black', images: [{ url: '/uploads/black-new.jpg' }] },
        { color: 'White', cdnImages: ['https://cdn.example.com/white.jpg'] },
      ],
      colorVariations: ['Black', 'White'],
    });

    assert.equal(updated.sku, payload.sku);
    assert.equal(updated.colorVariants.length, 2);
    assert.equal(updated.colorVariants[0].images[0].url, '/uploads/black-new.jpg');
    assert.equal(updated.colorVariants[1].cdnImages[0], 'https://cdn.example.com/white.jpg');
  });
});

describe('product colour variant persistence', () => {
  test('writes colour-to-image mappings to color_variants on create and update', async () => {
    const writes = [];
    const database = {
      query: async (sql, parameters) => {
        if (/^(INSERT|UPDATE)/.test(sql.trim())) writes.push({ sql, parameters });
        if (/^INSERT/.test(sql.trim())) return { insertId: 9 };
        return [];
      },
    };
    const model = new ProductModel(database);
    const data = {
      slug: 'variant-pair', sku: 'VARIANT-PAIR', brandId: 1, categoryId: 2, brand: 'Nike', name: 'Variant Pair',
      description: 'Variant product', category: 'Sneakers', price: 50000, sizes: ['EU 40'], productType: 'Ready Stock',
      deliveryTime: null, availability: 'Active', stock: 2, metaTitle: null, metaDescription: null, images: [], imageAltText: null,
      variations: [], productTags: ['New Arrival'], colorVariations: ['Black', 'White'],
      colorVariants: [
        { color: 'Black', images: [{ url: '/uploads/black.jpg' }], cdnImages: [] },
        { color: 'White', images: [], cdnImages: ['https://cdn.example.com/white.jpg'] },
      ],
      cdnImages: [],
    };

    await model.create(data);
    await model.update('variant-pair', data);

    for (const write of writes) {
      assert.match(write.sql, /color_variants/);
      const variantParameter = write.parameters.find((value) => value === JSON.stringify(data.colorVariants));
      assert.deepEqual(JSON.parse(variantParameter), data.colorVariants);
      assert.equal(write.parameters.includes(undefined), false);
    }
  });

  test('adds the color_variants column once and is safe on repeated initialization', async () => {
    let exists = false;
    let alterCount = 0;
    const statements = [];
    const connection = {
      execute: async (sql, parameters) => {
        statements.push({ sql, parameters });
        return [exists ? [{ present: 1 }] : []];
      },
      query: async (sql) => {
        assert.equal(sql, 'ALTER TABLE products ADD COLUMN color_variants JSON NULL AFTER color_variations');
        alterCount += 1;
        exists = true;
      },
    };

    assert.equal(await ensureProductColorVariantsColumn(connection, 'kickz'), true);
    assert.equal(await ensureProductColorVariantsColumn(connection, 'kickz'), false);
    assert.equal(alterCount, 1);
    assert.deepEqual(statements[0].parameters, ['kickz', 'products', 'color_variants']);
    assert.equal(statements.flatMap((statement) => statement.parameters).includes(undefined), false);
  });
});

describe('catalogue management services', () => {
  test('allows brands and categories without images or SEO metadata', async () => {
    let brandData; let categoryData;
    const service = new CatalogService({
      brandModel: { findByName: async () => null, create: async (data) => { brandData = data; return data; } },
      categoryModel: { findByName: async () => null, create: async (data) => { categoryData = data; return data; } },
      optionModel: { find: async () => ({ status: 'Active' }) },
    });
    await service.createBrand({ name: 'Text Brand', status: 'Active', displayMode: 'Text' });
    await service.createCategory({ name: 'Minimal Category', status: 'Active' });
    assert.equal(brandData.logoImage, null);
    assert.equal(brandData.metaTitle, null);
    assert.equal(categoryData.image, null);
    assert.equal(categoryData.metaDescription, null);
  });
});

describe('bulk product import services', () => {
  const values = (overrides) => CSV_COLUMNS.map((column) => ({
    sku: 'KZ-NEW-001', brand: 'Nike', category: 'Lifestyle Sneakers', product_name: 'Imported Pair',
    price: '45000', status: 'Active', description: '', stock: '5', delivery_timeline: '2 Weeks',
    available_sizes: '40,41,42', pre_order_available: '', product_tags: 'New Arrival,new arrival,Exclusive',
    color_variations: 'Black,White', cdn_images: 'https://cdn.example.com/one.jpg,https://cdn.example.com/two.jpg',
    image_alt_text: '', meta_title: '', meta_description: '', ...overrides,
  })[column]);

  const csv = serializeCsv([
    CSV_COLUMNS,
    values({}),
    values({ sku: 'KZ-EXIST-001', product_name: 'Updated Pair', pre_order_available: 'YES' }),
    values({ sku: 'KZ-DUP-001', product_name: 'Duplicate One' }),
    values({ sku: 'KZ-DUP-001', product_name: 'Duplicate Two' }),
    values({ sku: 'KZ-BRAND-FAIL', brand: 'Missing Brand' }),
    values({ sku: 'KZ-CATEGORY-FAIL', category: 'Missing Category' }),
  ]);

  test('previews, validates, imports valid rows, updates by SKU, and reports failures', async () => {
    const created = []; const updated = []; let storedFailures = []; let completed;
    const existing = { id: 'existing-pair', sku: 'KZ-EXIST-001', description: 'Existing description', sizes: ['39'] };
    const importModel = {
      create: async () => 55,
      addFailures: async (id, failures) => { assert.equal(id, 55); storedFailures = failures; },
      complete: async (id, summary) => { assert.equal(id, 55); completed = summary; },
      list: async () => [],
      findById: async () => ({ id: 55 }),
      failures: async () => storedFailures.map((failure) => ({
        rowNumber: failure.rowNumber, sku: failure.sku,
        errorCodes: failure.errors.map((error) => error.code), reasons: failure.errors.map((error) => error.message), source: failure.source,
      })),
    };
    const service = new ProductImportService({
      productService: {
        create: async (payload) => { created.push(payload); return payload; },
        update: async (id, payload) => { updated.push({ id, payload }); return payload; },
      },
      productModel: { findBySku: async (sku) => sku === existing.sku ? existing : null },
      brandModel: { list: async () => [{ id: 1, name: 'Nike', status: 'Active' }] },
      categoryModel: { list: async () => [{ id: 2, name: 'Lifestyle Sneakers', status: 'Active' }] },
      importModel,
    });

    const preview = await service.preview(csv, 'products.csv');
    assert.equal(preview.totalRows, 6);
    assert.equal(preview.validRows, 2);
    assert.equal(preview.failedRows, 4);
    assert.equal(preview.rows.find((row) => row.sku === existing.sku).notices[0].code, 'SKU_EXISTS');
    assert.equal(preview.rows.filter((row) => row.sku === 'KZ-DUP-001').every((row) => row.errors[0].code === 'DUPLICATE_SKU_IN_CSV'), true);

    const result = await service.import(csv, { fileName: 'products.csv', adminId: 1 });
    assert.deepEqual(completed, { totalRows: 6, successfulRows: 2, failedRows: 4, createdRows: 1, updatedRows: 1 });
    assert.equal(result.importId, 55);
    assert.equal(created[0].preOrder, false);
    assert.deepEqual(created[0].productTags, ['New Arrival', 'Exclusive']);
    assert.equal(created[0].cdnImages.length, 2);
    assert.equal(updated[0].id, existing.id);
    assert.equal(updated[0].payload.preOrder, true);

    const report = await service.failedReport(55);
    assert.match(report.csv, /DUPLICATE_SKU_IN_CSV/);
    assert.match(report.csv, /BRAND_NOT_FOUND/);
  });

  test('accepts zero stock and rejects negative or fractional CSV stock values', async () => {
    const service = new ProductImportService({
      productService: {}, productModel: { findBySku: async () => null },
      brandModel: { list: async () => [{ id: 1, name: 'Nike', status: 'Active' }] },
      categoryModel: { list: async () => [{ id: 2, name: 'Lifestyle Sneakers', status: 'Active' }] },
      importModel: {},
    });
    const preview = await service.preview(serializeCsv([
      CSV_COLUMNS,
      values({ sku: 'KZ-STOCK-ZERO', stock: '0' }),
      values({ sku: 'KZ-STOCK-NEG', stock: '-1' }),
      values({ sku: 'KZ-STOCK-FRACTION', stock: '1.5' }),
    ]));
    assert.equal(preview.rows.find((row) => row.sku === 'KZ-STOCK-ZERO').errors.length, 0);
    assert.equal(preview.rows.find((row) => row.sku === 'KZ-STOCK-NEG').errors.some((error) => error.code === 'INVALID_STOCK'), true);
    assert.equal(preview.rows.find((row) => row.sku === 'KZ-STOCK-FRACTION').errors.some((error) => error.code === 'INVALID_STOCK'), true);
  });
});

describe('product import history model', () => {
  test('lists an empty import history without binding a LIMIT parameter', async () => {
    let statement; let parameters;
    const model = new ProductImportModel({
      query: async (sql, values) => {
        statement = sql;
        parameters = values;
        return [];
      },
    });

    assert.deepEqual(await model.list(), []);
    assert.match(statement, /LIMIT 50$/);
    assert.equal(parameters, undefined);
    assert.equal((statement.match(/\?/g) || []).length, 0);
  });

  test('normalizes custom history limits before placing them in SQL', async () => {
    const statements = [];
    const model = new ProductImportModel({
      query: async (sql) => { statements.push(sql); return []; },
    });

    await model.list(25);
    await model.list(500);
    await model.list(undefined);
    await model.list('invalid');

    assert.match(statements[0], /LIMIT 25$/);
    assert.match(statements[1], /LIMIT 100$/);
    assert.match(statements[2], /LIMIT 50$/);
    assert.match(statements[3], /LIMIT 50$/);
  });
});

describe('bulk colour variant import', () => {
  test('appends repeated SKU colour rows to one product', async () => {
    const row = (color, image) => CSV_COLUMNS.map((column) => ({
      sku: 'AJ1-RETRO-001', brand: 'Nike', category: 'Lifestyle Sneakers', product_name: 'Air Jordan 1 Retro',
      price: '65000', status: 'Active', stock: '4', available_sizes: 'EU 40,UK 8', pre_order_available: 'NO',
      product_tags: 'Limited Edition', color, color_variations: '', cdn_images: image,
    })[column]);
    const csv = serializeCsv([CSV_COLUMNS, row('Black', 'https://cdn.example.com/black.jpg'), row('White', 'https://cdn.example.com/white.jpg')]);
    const created = []; const updated = [];
    const service = new ProductImportService({
      productService: {
        create: async (payload) => { const product = { ...payload, id: payload.slug }; created.push(product); return product; },
        update: async (id, payload) => { const product = { ...payload, id }; updated.push(product); return product; },
      },
      productModel: { findBySku: async () => null },
      brandModel: { list: async () => [{ id: 1, name: 'Nike', status: 'Active' }] },
      categoryModel: { list: async () => [{ id: 2, name: 'Lifestyle Sneakers', status: 'Active' }] },
      importModel: { create: async () => 80, addFailures: async () => undefined, complete: async () => undefined },
    });

    const preview = await service.preview(csv);
    assert.equal(preview.validRows, 2);
    assert.deepEqual(preview.rows.map((item) => item.action), ['CREATE', 'APPEND_VARIANT']);
    const result = await service.import(csv, { adminId: 1 });
    assert.equal(result.createdRows, 1);
    assert.equal(result.updatedRows, 1);
    assert.equal(created[0].colorVariants[0].color, 'Black');
    assert.deepEqual(updated[0].colorVariants.map((variant) => variant.color), ['Black', 'White']);
  });
});

describe('global size guide settings', () => {
  test('validates and persists one global uploaded image', async () => {
    let saved;
    const service = new SiteSettingService({ get: async () => saved, set: async (key, value) => { assert.equal(key, 'size_guide'); saved = value; return value; } });
    const guide = await service.updateSizeGuide({ imageUrl: '/uploads/guide.webp', altText: 'Sneaker size conversion chart' });
    assert.equal(guide.imageUrl, '/uploads/guide.webp');
    await assert.rejects(() => service.updateSizeGuide({ imageUrl: 'javascript:alert(1)' }), (error) => error.code === 'INVALID_SIZE_GUIDE_IMAGE');
  });

  test('validates, sorts, and hides inactive homepage media', async () => {
    let saved;
    const service = new SiteSettingService({ get: async () => saved, set: async (key, value) => { assert.equal(key, 'homepage_media'); saved = value; return value; } });
    await service.updateHomepageMedia({ items: [
      { id: 'second', type: 'video', url: 'https://cdn.example.com/unboxing.mp4', title: 'Unboxing', status: 'Active', sortOrder: 2 },
      { id: 'hidden', type: 'image', url: '/uploads/behind-scenes.webp', title: 'Behind the scenes', status: 'Inactive', sortOrder: 1 },
      { id: 'first', type: 'image', url: 'https://cdn.example.com/drop.webp', title: 'Latest drop', status: 'Active', sortOrder: 0 },
    ] });
    const publicMedia = await service.homepageMedia();
    assert.deepEqual(publicMedia.items.map((item) => item.id), ['first', 'second']);
    assert.equal((await service.adminHomepageMedia()).items.length, 3);
    await assert.rejects(() => service.updateHomepageMedia({ items: [{ url: 'javascript:alert(1)' }] }), (error) => error.code === 'INVALID_MEDIA_URL');
  });
});


describe('coupon promotion services', () => {
  const item = { productId: 11, categoryId: 5, productName: 'Dunk', price: 50000, quantity: 2 };
  const base = { id: 1, code: 'SAVE10', status: 'Active', discountType: 'Percentage', discountValue: 10,
    appliesTo: 'store', minimumOrderAmount: 0, totalUsageLimit: null, perCustomerLimit: null,
    productIds: [], categoryIds: [], startsAt: null, expiresAt: null };
  const serviceFor = (coupon = base, usage = { total: 0, customer: 0 }) => new CouponService({
    couponModel: { findByCode: async (code) => code === coupon?.code ? coupon : null, usage: async () => usage },
    productModel: {}, categoryModel: {},
  });

  test('normalizes case and calculates percentage and fixed discounts against eligible items', async () => {
    const percentage = await serviceFor().validate({ code: ' save10 ', items: [item], subtotal: 100000, email: 'Guest@Example.com' });
    assert.equal(percentage.couponCode, 'SAVE10');
    assert.equal(percentage.discountAmount, 10000);
    assert.equal(percentage.customerKey, 'email:guest@example.com');

    const fixedCoupon = { ...base, code: 'FIXED', discountType: 'Fixed', discountValue: 120000 };
    const fixed = await serviceFor(fixedCoupon).validate({ code: 'fixed', items: [item], subtotal: 100000 });
    assert.equal(fixed.discountAmount, 100000);
  });

  test('limits product and category coupons to the eligible subtotal', async () => {
    const other = { ...item, productId: 12, categoryId: 6, price: 40000, quantity: 1 };
    const productCoupon = { ...base, appliesTo: 'products', productIds: [11] };
    const productResult = await serviceFor(productCoupon).validate({ code: 'SAVE10', items: [item, other], subtotal: 140000 });
    assert.equal(productResult.eligibleSubtotalAmount, 100000);
    assert.equal(productResult.discountAmount, 10000);

    const categoryCoupon = { ...base, appliesTo: 'categories', categoryIds: [6] };
    const categoryResult = await serviceFor(categoryCoupon).validate({ code: 'SAVE10', items: [item, other], subtotal: 140000 });
    assert.equal(categoryResult.eligibleSubtotalAmount, 40000);
    assert.equal(categoryResult.discountAmount, 4000);
  });

  test('returns customer-friendly errors for invalid, inactive, expired, minimum, targeting, and usage rules', async () => {
    await assert.rejects(() => serviceFor().validate({ code: 'NOPE', items: [item], subtotal: 100000 }), (error) => error.code === 'INVALID_COUPON');
    await assert.rejects(() => serviceFor({ ...base, status: 'Inactive' }).validate({ code: 'SAVE10', items: [item], subtotal: 100000 }), (error) => error.code === 'COUPON_INACTIVE');
    await assert.rejects(() => serviceFor({ ...base, expiresAt: new Date(Date.now() - 1000) }).validate({ code: 'SAVE10', items: [item], subtotal: 100000 }), (error) => error.code === 'COUPON_EXPIRED');
    await assert.rejects(() => serviceFor({ ...base, minimumOrderAmount: 110000 }).validate({ code: 'SAVE10', items: [item], subtotal: 100000 }), (error) => error.code === 'COUPON_MINIMUM_NOT_REACHED');
    await assert.rejects(() => serviceFor({ ...base, appliesTo: 'products', productIds: [99] }).validate({ code: 'SAVE10', items: [item], subtotal: 100000 }), (error) => error.code === 'COUPON_NOT_APPLICABLE');
    await assert.rejects(() => serviceFor({ ...base, totalUsageLimit: 2 }, { total: 2, customer: 0 }).validate({ code: 'SAVE10', items: [item], subtotal: 100000 }), (error) => error.code === 'COUPON_LIMIT_REACHED');
    await assert.rejects(() => serviceFor({ ...base, perCustomerLimit: 1 }, { total: 1, customer: 1 }).validate({ code: 'SAVE10', items: [item], subtotal: 100000, email: 'guest@example.com' }), (error) => error.code === 'COUPON_ALREADY_USED');
  });
});
