export const orderStatusStep = (status) => {
  if (status === 'Delivered') return 5;
  if (status === 'Out for Delivery') return 4;
  if (['Shipped', 'Customs Clearance'].includes(status)) return 3;
  if (['Processing', 'Quality Check Completed'].includes(status)) return 2;
  if (['Order Confirmed', '50% Payment Confirmed', 'Full Payment Confirmed'].includes(status)) return 1;
  return 0;
};

export const isPaymentPending = (order) => String(order?.payment_status || '').startsWith('Payment Pending');
export const paymentRequirement = (order) => order?.payment_option === 'full'
  ? 'FULL PAYMENT REQUIRED'
  : `${Number(order?.advance_percentage || 50)}% ADVANCE PAYMENT REQUIRED`;
