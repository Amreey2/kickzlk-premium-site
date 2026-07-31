import AppError from '../utils/AppError.js';
import { verifyAdminToken, verifyCustomerToken } from '../utils/jwt.js';

const tokenFrom = (request, cookieName) => {
  const header = request.headers.authorization;
  if (header?.startsWith('Bearer ')) return header.slice(7);
  return request.cookies?.[cookieName];
};

export const requireCustomer = (request, response, next) => {
  void response;
  try {
    const token = tokenFrom(request, 'customer_token');
    if (!token) throw new AppError('Customer authentication is required.', 401, 'AUTH_REQUIRED');
    request.user = verifyCustomerToken(token);
    next();
  } catch (error) {
    next(error instanceof AppError ? error : new AppError('Customer session is invalid or expired.', 401, 'INVALID_SESSION'));
  }
};

export const optionalCustomer = (request, response, next) => {
  void response;
  const token = tokenFrom(request, 'customer_token');
  if (!token) return next();
  try {
    request.user = verifyCustomerToken(token);
    return next();
  } catch {
    return next(new AppError('Customer session is invalid or expired.', 401, 'INVALID_SESSION'));
  }
};

export const requireAdmin = (request, response, next) => {
  void response;
  try {
    const token = tokenFrom(request, 'admin_token');
    if (!token) throw new AppError('Administrator authentication is required.', 401, 'ADMIN_AUTH_REQUIRED');
    request.admin = verifyAdminToken(token);
    next();
  } catch (error) {
    next(error instanceof AppError ? error : new AppError('Administrator session is invalid or expired.', 401, 'INVALID_ADMIN_SESSION'));
  }
};
