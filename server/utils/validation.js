import AppError from './AppError.js';

export const requireFields = (payload, fields) => {
  const missing = fields.filter((field) => payload[field] === undefined || payload[field] === null || String(payload[field]).trim() === '');
  if (missing.length) throw new AppError(`Missing required fields: ${missing.join(', ')}.`, 422, 'VALIDATION_ERROR', { missing });
};

export const assertEmail = (value) => {
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value).trim())) {
    throw new AppError('A valid email address is required.', 422, 'INVALID_EMAIL');
  }
};

export const assertPhone = (value) => {
  if (!/^[+\d][\d\s()-]{6,24}$/.test(String(value).trim())) {
    throw new AppError('A valid phone or WhatsApp number is required.', 422, 'INVALID_PHONE');
  }
};

export const normalizeEmail = (value) => String(value).trim().toLowerCase();
