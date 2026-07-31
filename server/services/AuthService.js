import bcrypt from 'bcryptjs';
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

export default class AuthService {
  constructor({ userModel, adminModel }) {
    this.userModel = userModel;
    this.adminModel = adminModel;
  }

  async register(payload) {
    requireFields(payload, ['name', 'email', 'password']);
    assertEmail(payload.email);
    if (payload.phoneNumber) assertPhone(payload.phoneNumber);
    if (String(payload.password).length < 8) throw new AppError('Password must contain at least 8 characters.', 422, 'WEAK_PASSWORD');
    const email = normalizeEmail(payload.email);
    if (await this.userModel.findByEmail(email)) throw new AppError('An account already exists for this email.', 409, 'EMAIL_EXISTS');
    const user = await this.userModel.create({
      name: String(payload.name).trim(),
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
