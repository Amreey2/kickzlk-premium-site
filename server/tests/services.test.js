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
import SiteSettingService from '../services/SiteSettingService.js';
import { serializeCsv } from '../utils/csv.js';
import { ensureProductColorVariantsColumn } from '../scripts/migrations/ensure-product-color-variants.js';
import { formatOrderNumber } from '../utils/orderNumber.js';

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
});
