import { products } from './products';

export const adminOrders = [
  { id: 'KZ-24031', customer: 'Malith K.', email: 'malith@example.com', phone: '+94 77 000 0000', product: products[0], size: 'US 9', amount: 64900, paymentStatus: 'Deposit Paid', status: 'Processing', date: '30 Jul 2026', address: 'Colombo 05' },
  { id: 'KZ-24030', customer: 'Shenali N.', email: 'shenali@example.com', phone: '+94 76 000 0000', product: products[1], size: 'US 7.5', amount: 47500, paymentStatus: 'Pending', status: 'Pending', date: '30 Jul 2026', address: 'Kandy' },
  { id: 'KZ-24029', customer: 'Raveen M.', email: 'raveen@example.com', phone: '+94 71 000 0000', product: products[4], size: 'EU 42', amount: 189000, paymentStatus: 'Paid', status: 'Import/Clearing', date: '29 Jul 2026', address: 'Galle' },
  { id: 'KZ-24028', customer: 'Akila K.', email: 'akila@example.com', phone: '+94 75 000 0000', product: products[3], size: 'US 10', amount: 52900, paymentStatus: 'Paid', status: 'Shipped', date: '28 Jul 2026', address: 'Negombo' },
  { id: 'KZ-24027', customer: 'Dinithi S.', email: 'dinithi@example.com', phone: '+94 78 000 0000', product: products[5], size: 'US 8', amount: 56500, paymentStatus: 'Paid', status: 'Delivered', date: '26 Jul 2026', address: 'Colombo 03' },
];

export const adminCustomers = [
  { id: 'C-1024', name: 'Malith K.', email: 'malith@example.com', whatsapp: '+94 77 000 0000', totalOrders: 4, lastOrder: 'KZ-24031' },
  { id: 'C-1023', name: 'Shenali N.', email: 'shenali@example.com', whatsapp: '+94 76 000 0000', totalOrders: 2, lastOrder: 'KZ-24030' },
  { id: 'C-1022', name: 'Raveen M.', email: 'raveen@example.com', whatsapp: '+94 71 000 0000', totalOrders: 5, lastOrder: 'KZ-24029' },
  { id: 'C-1021', name: 'Akila K.', email: 'akila@example.com', whatsapp: '+94 75 000 0000', totalOrders: 3, lastOrder: 'KZ-24028' },
  { id: 'C-1020', name: 'Dinithi S.', email: 'dinithi@example.com', whatsapp: '+94 78 000 0000', totalOrders: 1, lastOrder: 'KZ-24027' },
];

export const adminActivity = [
  { time: '10 min ago', title: 'New pre-order received', detail: 'KZ-24031 · Air Jordan 1 Retro High OG' },
  { time: '42 min ago', title: 'Payment confirmation added', detail: 'KZ-24029 · LKR 189,000' },
  { time: '2 hrs ago', title: 'Order moved to shipped', detail: 'KZ-24028 · Air Max Pulse' },
  { time: 'Yesterday', title: 'New customer profile', detail: 'Dinithi S. · Colombo' },
];
