import bcrypt from 'bcryptjs';
import { createHash, randomBytes } from 'node:crypto';
import { env } from '../config/env.js';
import AppError from '../utils/AppError.js';
import { createAdminToken, createCustomerToken } from '../utils/jwt.js';
import { assertEmail, assertPhone, normalizeEmail, requireFields } from '../utils/validation.js';

const customerView = (user) => ({
  id: user.id,
  name: user.name,
  email: user.email,
  phoneNumber: user.phone_number,
  createdAt: user.created_at,
});
const passwordHash = (token) => createHash('sha256').update(token).digest('hex');
const clean = (value, max) => String(value || '').trim().slice(0, max);

const validatePassword = (password) => {
  if (typeof password !== 'string' || password.length < 8 || password.length > 128) {
    throw new AppError('Password must contain between 8 and 128 characters.', 422, 'WEAK_PASSWORD');
  }
};

export default class AuthService {
  constructor({ userModel, adminModel, addressModel, passwordResetModel }) {
    this.userModel = userModel;
    this.adminModel = adminModel;
    this.addressModel = addressModel;
    this.passwordResetModel = passwordResetModel;
  }

  async register(payload) {
    requireFields(payload, ['name', 'email', 'phoneNumber', 'password']);
    assertEmail(payload.email);
    assertPhone(payload.phoneNumber);
    validatePassword(payload.password);
    if (clean(payload.name, 151).length > 150) throw new AppError('Full name cannot exceed 150 characters.', 422, 'INVALID_NAME');
    const email = normalizeEmail(payload.email);
    if (await this.userModel.findByEmail(email)) throw new AppError('An account already exists for this email.', 409, 'EMAIL_EXISTS');
    const user = await this.userModel.create({
      name: clean(payload.name, 150),
      email,
      passwordHash: await bcrypt.hash(payload.password, 12),
      phoneNumber: payload.phoneNumber?.trim(),
    });
    return { user: customerView(user), token: createCustomerToken(user) };
  }

  async login(payload) {
    requireFields(payload, ['email', 'password']);
    assertEmail(payload.email);
    const user = await this.userModel.findByEmail(normalizeEmail(payload.email));
    if (!user || !(await bcrypt.compare(payload.password, user.password_hash))) {
      throw new AppError('Email or password is incorrect.', 401, 'INVALID_CREDENTIALS');
    }
    return { user: customerView(user), token: createCustomerToken(user) };
  }

  async profile(id) {
    const user = await this.userModel.findById(id);
    if (!user) throw new AppError('Customer profile was not found.', 404, 'USER_NOT_FOUND');
    return customerView(user);
  }

  async updateProfile(id, payload) {
    requireFields(payload, ['name', 'email', 'phoneNumber']);
    assertEmail(payload.email);
    assertPhone(payload.phoneNumber);
    const name = clean(payload.name, 151);
    if (name.length < 2 || name.length > 150) throw new AppError('Full name must contain between 2 and 150 characters.', 422, 'INVALID_NAME');
    const email = normalizeEmail(payload.email);
    const duplicate = await this.userModel.findByEmail(email);
    if (duplicate && Number(duplicate.id) !== Number(id)) throw new AppError('An account already exists for this email.', 409, 'EMAIL_EXISTS');
    const user = await this.userModel.update(id, { name, email, phoneNumber: clean(payload.phoneNumber, 30) });
    if (!user) throw new AppError('Customer profile was not found.', 404, 'USER_NOT_FOUND');
    return customerView(user);
  }

  addresses(id) { return this.addressModel.list(id); }

  async createAddress(id, payload) {
    const addresses = await this.addressModel.list(id);
    if (addresses.length >= 2) throw new AppError('A customer can save a maximum of two addresses.', 409, 'ADDRESS_LIMIT');
    return this.addressModel.create(id, this.addressData(payload, addresses.length === 0));
  }

  async updateAddress(customerId, addressId, payload) {
    const current = await this.addressModel.find(addressId, customerId);
    if (!current) throw new AppError('Saved address was not found.', 404, 'ADDRESS_NOT_FOUND');
    const data = this.addressData(payload, current.isDefault);
    if (current.isDefault) data.isDefault = true;
    return this.addressModel.update(addressId, customerId, data);
  }

  async deleteAddress(customerId, addressId) {
    const deleted = await this.addressModel.delete(addressId, customerId);
    if (!deleted) throw new AppError('Saved address was not found.', 404, 'ADDRESS_NOT_FOUND');
  }

  addressData(payload, defaultFallback) {
    requireFields(payload, ['label', 'fullName', 'phoneNumber', 'addressLine1', 'city']);
    assertPhone(payload.phoneNumber);
    const data = {
      label: clean(payload.label, 61), fullName: clean(payload.fullName, 151), phoneNumber: clean(payload.phoneNumber, 30),
      addressLine1: clean(payload.addressLine1, 256), addressLine2: clean(payload.addressLine2, 255) || null,
      city: clean(payload.city, 121), postalCode: clean(payload.postalCode, 20) || null,
      country: clean(payload.country || 'Sri Lanka', 100), isDefault: Boolean(payload.isDefault || defaultFallback),
    };
    if (data.label.length > 60 || data.fullName.length > 150 || data.addressLine1.length > 255 || data.city.length > 120) {
      throw new AppError('One or more address fields exceed the allowed length.', 422, 'INVALID_ADDRESS');
    }
    return data;
  }

  async requestPasswordReset(payload) {
    requireFields(payload, ['email']);
    assertEmail(payload.email);
    const user = await this.userModel.findByEmail(normalizeEmail(payload.email));
    let resetToken;
    if (user) {
      resetToken = randomBytes(32).toString('hex');
      await this.passwordResetModel.replace(user.id, passwordHash(resetToken), new Date(Date.now() + 30 * 60 * 1000));
    }
    return {
      message: 'If an account exists for this email, password reset instructions have been prepared.',
      ...(env.nodeEnv !== 'production' && resetToken ? { resetToken } : {}),
    };
  }

  async resetPassword(payload) {
    requireFields(payload, ['token', 'password']);
    validatePassword(payload.password);
    const reset = await this.passwordResetModel.findUsable(passwordHash(payload.token));
    if (!reset) throw new AppError('Password reset link is invalid or has expired.', 422, 'INVALID_RESET_TOKEN');
    const nextPasswordHash = await bcrypt.hash(payload.password, 12);
    if (!(await this.passwordResetModel.use(reset.id))) throw new AppError('Password reset link has already been used.', 422, 'INVALID_RESET_TOKEN');
    await this.userModel.updatePassword(reset.customer_id, nextPasswordHash);
    return { message: 'Password updated. You can now sign in.' };
  }

  async adminLogin(payload) {
    requireFields(payload, ['email', 'password']);
    assertEmail(payload.email);
    const admin = await this.adminModel.findByEmail(normalizeEmail(payload.email));
    if (!admin || !(await bcrypt.compare(payload.password, admin.password_hash))) {
      throw new AppError('Administrator credentials are incorrect.', 401, 'INVALID_ADMIN_CREDENTIALS');
    }
    return { admin: { id: admin.id, email: admin.email }, token: createAdminToken(admin) };
  }
}
