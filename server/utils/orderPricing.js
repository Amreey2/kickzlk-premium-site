import AppError from './AppError.js';

export const DEFAULT_ADVANCE_PERCENTAGE = 50;
export const PAYMENT_OPTIONS = Object.freeze({ ADVANCE: 'advance', FULL: 'full' });

export const normalizePaymentOption = (value) => (
  String(value || '').trim().toLowerCase() === PAYMENT_OPTIONS.FULL ? PAYMENT_OPTIONS.FULL : PAYMENT_OPTIONS.ADVANCE
);
export const coupons = new Map([
  ['KICKZ10', { type: 'percentage', value: 10, label: '10% off' }],
  ['WELCOME5000', { type: 'fixed', value: 5000, label: 'LKR 5,000 off' }],
]);

export const calculateOrderAmounts = ({ subtotal, couponCode, paymentOption, advancePercentage = DEFAULT_ADVANCE_PERCENTAGE }) => {
  const normalizedCoupon = String(couponCode || '').trim().toUpperCase();
  const coupon = normalizedCoupon ? coupons.get(normalizedCoupon) : null;
  if (normalizedCoupon && !coupon) throw new AppError('Coupon code is invalid or unavailable.', 422, 'INVALID_COUPON');
  const rawDiscount = coupon?.type === 'percentage' ? subtotal * coupon.value / 100 : coupon?.value || 0;
  const discountAmount = Math.min(subtotal, Math.max(0, Math.round(rawDiscount)));
  const totalAmount = Math.max(0, subtotal - discountAmount);
  const option = normalizePaymentOption(paymentOption);
  const configuredPercentage = Math.min(100, Math.max(0, Number(advancePercentage) || DEFAULT_ADVANCE_PERCENTAGE));
  const percentage = option === PAYMENT_OPTIONS.FULL ? 100 : configuredPercentage;
  const advanceAmount = Math.min(totalAmount, Math.round(totalAmount * percentage / 100));
  return { subtotalAmount: subtotal, couponCode: coupon ? normalizedCoupon : null, couponLabel: coupon?.label || null,
    discountAmount, totalAmount, paymentOption: option, standardAdvancePercentage: configuredPercentage, advancePercentage: percentage,
    advanceAmount, balanceAmount: totalAmount - advanceAmount };
};
