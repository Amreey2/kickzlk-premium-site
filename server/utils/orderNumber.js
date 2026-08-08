import crypto from 'node:crypto';

export const createOrderNumber = () => {
  const date = new Date().toISOString().slice(0, 10).replaceAll('-', '');
  return `KZ-${date}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
};

export const createTrackingNumber = () => {
  const date = new Date().toISOString().slice(0, 10).replaceAll('-', '');
  return `KZTRK-${date}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
};
