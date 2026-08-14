export const DEFAULT_ADVANCE_PERCENTAGE = 50;
export const PAYMENT_OPTIONS = Object.freeze({ ADVANCE: 'advance', FULL: 'full' });

export const normalizePaymentOption = (value) => (
  String(value || '').trim().toLowerCase() === PAYMENT_OPTIONS.FULL ? PAYMENT_OPTIONS.FULL : PAYMENT_OPTIONS.ADVANCE
);
