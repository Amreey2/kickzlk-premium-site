import { useEffect, useState } from 'react';

export default function BankTransferModal({ open, settings, onClose }) {
  const [copied, setCopied] = useState('');
  useEffect(() => { if (!open) return undefined; const close = (event) => { if (event.key === 'Escape') onClose(); }; document.addEventListener('keydown', close); return () => document.removeEventListener('keydown', close); }, [onClose, open]);
  if (!open) return null;
  const rows = [['Bank Name', settings.bankName], ['Account Name', settings.accountName], ['Account Number', settings.accountNumber], ['Branch', settings.branch], ['Instructions', settings.instructions]];
  const copy = async (label, value) => { await navigator.clipboard.writeText(value); setCopied(label); window.setTimeout(() => setCopied(''), 1300); };
  const copyAll = () => copy('all', rows.map(([label, value]) => `${label}: ${value}`).join('\n'));
  return <div className="payment-modal" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}><section role="dialog" aria-modal="true" aria-labelledby="bank-title"><header><div><span className="section-kicker">PAYMENT METHOD</span><h2 id="bank-title">BANK TRANSFER DETAILS</h2></div><button type="button" onClick={onClose} aria-label="Close bank details">×</button></header><div className="bank-detail-list">{rows.map(([label, value]) => <div key={label}><span>{label}</span><strong>{value}</strong><button type="button" onClick={() => copy(label, value)}>{copied === label ? 'COPIED ✓' : 'COPY'}</button></div>)}</div><button className="btn btn--acid" type="button" onClick={copyAll}>{copied === 'all' ? 'ALL DETAILS COPIED ✓' : 'COPY ALL DETAILS'}</button></section></div>;
}
