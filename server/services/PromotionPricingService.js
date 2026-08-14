import { normalizePaymentOption, PAYMENT_OPTIONS, DEFAULT_ADVANCE_PERCENTAGE } from '../utils/orderPricing.js';

export const calculatePaymentAmounts = ({ subtotal, discountAmount = 0, paymentOption, advancePercentage = DEFAULT_ADVANCE_PERCENTAGE }) => {
  const safeSubtotal = Math.max(0, Number(subtotal) || 0);
  const safeDiscount = Math.min(safeSubtotal, Math.max(0, Number(discountAmount) || 0));
  const totalAmount = safeSubtotal - safeDiscount;
  const option = normalizePaymentOption(paymentOption);
  const configuredPercentage = Math.min(100, Math.max(0, Number(advancePercentage) || DEFAULT_ADVANCE_PERCENTAGE));
  const percentage = option === PAYMENT_OPTIONS.FULL ? 100 : configuredPercentage;
  const advanceAmount = Math.min(totalAmount, Math.round(totalAmount * percentage / 100));
  return {
    subtotalAmount: safeSubtotal, discountAmount: safeDiscount, totalAmount, paymentOption: option,
    standardAdvancePercentage: configuredPercentage, advancePercentage: percentage,
    advanceAmount, balanceAmount: totalAmount - advanceAmount,
  };
};
