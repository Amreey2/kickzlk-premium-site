import { PAYMENT_OPTIONS } from '../../utils/paymentOption';

export default function PaymentOptionSelector({ value, onChange, quote, compact = false }) {
  const percentage = Number(quote?.standardAdvancePercentage || 50);
  return <fieldset className={`checkout-payment-options${compact ? ' checkout-payment-options--compact' : ''}`}>
    <legend>PAYMENT OPTION</legend>
    <label className={value === PAYMENT_OPTIONS.ADVANCE ? 'is-selected' : ''}><input type="radio" name="checkout-payment-option" value={PAYMENT_OPTIONS.ADVANCE} checked={value === PAYMENT_OPTIONS.ADVANCE} onChange={(event) => onChange(event.target.value)} /><span><strong>Pay {percentage}% Now</strong><small>Pay now {percentage}% · Balance on delivery {100 - percentage}%</small></span></label>
    <label className={value === PAYMENT_OPTIONS.FULL ? 'is-selected' : ''}><input type="radio" name="checkout-payment-option" value={PAYMENT_OPTIONS.FULL} checked={value === PAYMENT_OPTIONS.FULL} onChange={(event) => onChange(event.target.value)} /><span><strong>Pay Full Amount Now</strong><small>Pay now 100% · Balance LKR 0</small></span></label>
  </fieldset>;
}
