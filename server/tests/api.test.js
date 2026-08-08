import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import request from 'supertest';
import { createApp } from '../app.js';
import { createAdminToken, createCustomerToken } from '../utils/jwt.js';

const customer = { id: 7, name: 'Customer', email: 'customer@example.com' };
const admin = { id: 1, email: 'admin@example.com' };
const customerToken = createCustomerToken(customer);
const adminToken = createAdminToken(admin);
const product = { id: 12, brand: 'Nike', name: 'Dunk Low Premium', price: 47500, size: ['US 8', 'US 9'] };
const order = {
  id: 22,
  user_id: null,
  order_number: 'KZ-20260731-TEST',
  email: 'guest@example.com',
  phone_number: '+94771234567',
  order_status: 'Order Placed',
};

const services = () => ({
  authService: {
    register: async () => ({ user: customer, token: customerToken }),
    login: async () => ({ user: customer, token: customerToken }),
    profile: async () => customer,
    updateProfile: async (id, payload) => ({ id: Number(id), ...payload }),
    addresses: async () => [],
    createAddress: async (id, payload) => ({ id: 1, customerId: Number(id), ...payload }),
    updateAddress: async (customerId, id, payload) => ({ id: Number(id), customerId: Number(customerId), ...payload }),
    deleteAddress: async () => undefined,
    requestPasswordReset: async () => ({ message: 'Reset prepared.' }),
    resetPassword: async () => ({ message: 'Password updated.' }),
    adminLogin: async () => ({ admin, token: adminToken }),
  },
  productService: {
    list: async () => [product],
    get: async () => product,
    create: async (payload) => ({ id: 13, ...payload }),
    update: async (id, payload) => ({ id: Number(id), ...payload }),
    delete: async () => undefined,
  },
  orderService: {
    quote: async () => ({ subtotalAmount: 47500, discountAmount: 0, totalAmount: 47500, advanceAmount: 14250, balanceAmount: 33250 }),
    create: async (payload, userId) => ({ ...order, user_id: userId, ...payload }),
    get: async () => order,
    listForUser: async () => [{ ...order, user_id: customer.id }],
    listAll: async () => [order],
    updateStatus: async (id, status, note) => ({ ...order, id: Number(id), order_status: status, note }),
    updatePaymentStatus: async (id, status) => ({ ...order, id: Number(id), payment_status: status }),
  },
  imageService: { serializeUploads: (files) => files },
  siteSettingService: {
    sizeGuide: async () => ({ imageUrl: '/uploads/size-guide.webp', altText: 'Size guide' }),
    updateSizeGuide: async (payload) => payload,
    paymentSettings: async () => ({ methodName: 'Bank Transfer', bankName: 'Test Bank', accountName: 'KICKZ.LK', accountNumber: '123', branch: 'Colombo', advancePercentage: 30 }),
    updatePaymentSettings: async (payload) => payload,
  },
  catalogService: {
    listBrands: async () => [{ id: 1, name: 'Nike', status: 'Active' }],
    listCategories: async () => [{ id: 1, name: 'Sneakers', status: 'Active' }],
    listOptions: async () => [{ id: 1, kind: 'gender', value: 'Unisex', status: 'Active' }],
    createBrand: async (payload) => ({ id: 2, ...payload }), updateBrand: async (id, payload) => ({ id: Number(id), ...payload }), deleteBrand: async () => undefined,
    createCategory: async (payload) => ({ id: 2, ...payload }), updateCategory: async (id, payload) => ({ id: Number(id), ...payload }), deleteCategory: async () => undefined,
    createOption: async (payload) => ({ id: 2, ...payload }),
  },
  productImportService: {
    template: () => 'sku,brand,category,product_name,price,status\n',
    preview: async () => ({ mode: 'preview', totalRows: 1, validRows: 1, failedRows: 0, canImport: true, rows: [] }),
    import: async () => ({ mode: 'import', importId: 1, totalRows: 1, successfulRows: 1, failedRows: 0, createdRows: 1, updatedRows: 0, failures: [] }),
    history: async () => [],
    failedReport: async () => ({ fileName: 'failed.csv', csv: 'row,sku,reason\n' }),
  },
});

const app = () => createApp({ services: services(), databaseCheck: async () => true });

describe('API contract', () => {
  test('health reports a connected database', async () => {
    const response = await request(app()).get('/api/health').expect(200);
    assert.equal(response.body.data.database, 'connected');
  });

  test('customer registration creates a secure session usable by profile', async () => {
    const agent = request.agent(app());
    const response = await agent.post('/api/auth/register').send({
      name: 'Customer', email: customer.email, phoneNumber: '+94771234567', password: 'StrongPassword1',
    }).expect(201);
    assert.match(response.headers['set-cookie'][0], /customer_token=.*HttpOnly/);
    assert.equal((await agent.get('/api/auth/profile').expect(200)).body.data.id, customer.id);
  });

  test('customer profile, addresses, recovery, and logout APIs are correctly protected', async () => {
    const instance = app();
    await request(instance).get('/api/auth/addresses').expect(401);
    const updated = await request(instance).put('/api/auth/profile').set('Authorization', `Bearer ${customerToken}`)
      .send({ name: 'Updated Customer', email: customer.email, phoneNumber: '+94771234567' }).expect(200);
    assert.equal(updated.body.data.name, 'Updated Customer');
    await request(instance).post('/api/auth/addresses').set('Authorization', `Bearer ${customerToken}`)
      .send({ label: 'Home' }).expect(201);
    await request(instance).post('/api/auth/forgot-password').send({ email: customer.email }).expect(200);
    await request(instance).post('/api/auth/reset-password').send({ token: 'token', password: 'NewPassword1' }).expect(200);
    await request(instance).post('/api/auth/logout').set('Authorization', `Bearer ${customerToken}`).expect(204);
  });

  test('customer and administrator login issue separate secure sessions', async () => {
    const instance = app();
    const customerLogin = await request(instance).post('/api/auth/login').send({
      email: customer.email, password: 'StrongPassword1',
    }).expect(200);
    assert.match(customerLogin.headers['set-cookie'][0], /customer_token=.*HttpOnly/);

    const adminLogin = await request(instance).post('/api/admin/login').send({
      email: admin.email, password: 'AdminPassword1',
    }).expect(200);
    assert.match(adminLogin.headers['set-cookie'][0], /admin_token=.*HttpOnly/);
  });

  test('product reads are public and writes require admin authentication', async () => {
    const instance = app();
    await request(instance).get('/api/products').expect(200);
    await request(instance).post('/api/products').send(product).expect(401);
    const response = await request(instance)
      .post('/api/products')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(product)
      .expect(201);
    assert.equal(response.body.data.name, product.name);
  });

  test('live brands are public while brand management is administrator-only', async () => {
    const instance = app();
    assert.equal((await request(instance).get('/api/brands').expect(200)).body.data[0].name, 'Nike');
    await request(instance).post('/api/admin/brands').send({ name: 'Puma' }).expect(401);
    const created = await request(instance).post('/api/admin/brands').set('Authorization', `Bearer ${adminToken}`).send({ name: 'Puma' }).expect(201);
    assert.equal(created.body.data.name, 'Puma');
  });

  test('global size guide is public and management remains administrator-only', async () => {
    const instance = app();
    assert.equal((await request(instance).get('/api/size-guide').expect(200)).body.data.imageUrl, '/uploads/size-guide.webp');
    await request(instance).put('/api/admin/size-guide').send({ imageUrl: '/uploads/new.webp' }).expect(401);
    await request(instance).put('/api/admin/size-guide').set('Authorization', `Bearer ${adminToken}`).send({ imageUrl: '/uploads/new.webp' }).expect(200);
  });

  test('payment settings are public, editable only by admins, and checkout quotes are server-calculated', async () => {
    const instance = app();
    assert.equal((await request(instance).get('/api/payment-settings').expect(200)).body.data.bankName, 'Test Bank');
    await request(instance).put('/api/admin/payment-settings').send({ bankName: 'Other' }).expect(401);
    await request(instance).put('/api/admin/payment-settings').set('Authorization', `Bearer ${adminToken}`).send({ bankName: 'Other' }).expect(200);
    const quote = await request(instance).post('/api/orders/quote').send({ items: [{ productId: 12, selectedSize: 'US 9' }] }).expect(200);
    assert.equal(quote.body.data.advanceAmount, 14250);
  });

  test('bulk product import APIs require admin authentication', async () => {
    const instance = app();
    await request(instance).get('/api/admin/products/import/template').expect(401);
    const template = await request(instance).get('/api/admin/products/import/template').set('Authorization', `Bearer ${adminToken}`).expect(200);
    assert.match(template.text, /^sku,brand/);
    const preview = await request(instance).post('/api/admin/products/import')
      .set('Authorization', `Bearer ${adminToken}`)
      .field('mode', 'preview')
      .attach('file', Buffer.from('sku,brand,category,product_name,price,status\nKZ-1,Nike,Sneakers,Pair,100,Active'), { filename: 'products.csv', contentType: 'text/csv' })
      .expect(200);
    assert.equal(preview.body.data.mode, 'preview');
  });

  test('guest checkout and verified guest tracking work without an account', async () => {
    const instance = app();
    const payload = {
      customerName: 'Guest', email: order.email, phoneNumber: order.phone_number,
      shippingAddress: 'Colombo', items: [{ productId: 12, selectedSize: 'US 9', quantity: 1 }],
    };
    assert.equal((await request(instance).post('/api/orders').send(payload).expect(201)).body.data.user_id, null);
    await request(instance).get(`/api/orders/${order.id}`).expect(401);
    const tracked = await request(instance).get(`/api/orders/${order.id}`).query({ email: order.email }).expect(200);
    assert.equal(tracked.body.data.order_number, order.order_number);
  });

  test('customer order history and admin status changes are protected', async () => {
    const instance = app();
    await request(instance).get(`/api/orders/user/${customer.id}`).expect(401);
    await request(instance).get(`/api/orders/user/${customer.id}`).set('Authorization', `Bearer ${customerToken}`).expect(200);
    await request(instance).get('/api/admin/orders').expect(401);
    const updated = await request(instance)
      .put(`/api/admin/orders/${order.id}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'Processing' })
      .expect(200);
    assert.equal(updated.body.data.order_status, 'Processing');
    const payment = await request(instance)
      .put(`/api/admin/orders/${order.id}/payment-status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'Payment Confirmed' })
      .expect(200);
    assert.equal(payment.body.data.payment_status, 'Payment Confirmed');
  });
});
