const statuses = [
  'Order placed',
  'Payment confirmed',
  'Processing',
  'Import/customs',
  'Out for delivery',
  'Delivered',
];

export default function OrderTracking({ currentStep = 0 }) {
  return (
    <ol className="order-tracking" aria-label="Order tracking status">
      {statuses.map((status, index) => {
        const state = index < currentStep ? 'complete' : index === currentStep ? 'current' : '';
        return (
          <li className={state} key={status} aria-current={state === 'current' ? 'step' : undefined}>
            <span>{index < currentStep ? '✓' : String(index + 1).padStart(2, '0')}</span>
            <strong>{status}</strong>
          </li>
        );
      })}
    </ol>
  );
}
