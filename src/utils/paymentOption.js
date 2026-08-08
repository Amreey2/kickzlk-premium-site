const PAYMENT_KEY = 'kickz_payment_option';

export const PAYMENT_OPTIONS = Object.freeze({ ADVANCE: 'advance', FULL: 'full' });
export const normalizePaymentOption = (value) => value === PAYMENT_OPTIONS.FULL ? PAYMENT_OPTIONS.FULL : PAYMENT_OPTIONS.ADVANCE;

export const readPaymentOption = () => normalizePaymentOption(localStorage.getItem(PAYMENT_KEY));
export const writePaymentOption = (value) => {
  const option = normalizePaymentOption(value);
  localStorage.setItem(PAYMENT_KEY, option);
  return option;
};

export const paymentOptionLabel = (option, percentage = 50) => (
  normalizePaymentOption(option) === PAYMENT_OPTIONS.FULL ? 'PAY FULL AMOUNT NOW' : `PAY ${Number(percentage)}% NOW`
);
