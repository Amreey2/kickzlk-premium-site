import { useEffect, useMemo, useState } from 'react';
import { ordersApi, productsApi } from '../../services/api';
import { formatProductPrice } from '../../utils/productPresentation';
import { PAYMENT_OPTIONS } from '../../utils/paymentOption';

const blankCustomer = { customerName: '', email: '', phoneNumber: '', shippingAddress: '', shippingCity: '', orderNotes: '' };
const idempotencyKey = () => `admin_${crypto.randomUUID().replaceAll('-', '')}`;

export default function AdminCreateOrderModal({ open, onClose, onCreated }) {
  const [mode, setMode] = useState('existing');
  const [customers, setCustomers] = useState([]);
  const [customerSearch, setCustomerSearch] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [customer, setCustomer] = useState(blankCustomer);
  const [products, setProducts] = useState([]);
  const [productSearch, setProductSearch] = useState('');
  const [items, setItems] = useState([]);
  const [couponCode, setCouponCode] = useState('');
  const [paymentOption, setPaymentOption] = useState(PAYMENT_OPTIONS.ADVANCE);
  const [quote, setQuote] = useState(null);
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open) return;
    productsApi.adminList().then(setProducts).catch((error) => setMessage(error.message));
  }, [open]);

  useEffect(() => {
    if (!open || mode !== 'existing') return undefined;
    const timer = window.setTimeout(() => {
      ordersApi.adminCustomers(customerSearch).then(setCustomers).catch((error) => setMessage(error.message));
    }, 180);
    return () => window.clearTimeout(timer);
  }, [customerSearch, mode, open]);

  const requestItems = useMemo(() => items.map((item) => ({
    productId: item.product.id,
    selectedSize: item.selectedSize,
    selectedColor: item.selectedColor,
    quantity: item.quantity,
  })), [items]);

  useEffect(() => {
    if (!open || !requestItems.length || requestItems.some((item) => !item.selectedSize)) return undefined;
    let active = true;
    const timer = window.setTimeout(() => {
      ordersApi.adminQuote({ items: requestItems, couponCode, paymentOption, email: customer.email, customerId: selectedCustomer?.id || null })
        .then((value) => { if (active) { setQuote(value); setMessage(''); } })
        .catch((error) => { if (active) { setQuote(null); setMessage(error.message); } });
    }, 220);
    return () => { active = false; window.clearTimeout(timer); };
  }, [couponCode, customer.email, open, paymentOption, requestItems, selectedCustomer?.id]);

  if (!open) return null;
  const matchingProducts = products.filter((product) => [product.name, product.sku, product.brand]
    .some((value) => String(value).toLowerCase().includes(productSearch.toLowerCase()))).slice(0, 8);
  const selectCustomer = (value) => {
    setSelectedCustomer(value);
    setCustomer({ customerName: value.name, email: value.email, phoneNumber: value.phoneNumber || '', shippingAddress: value.address || '', shippingCity: value.city || '', orderNotes: '' });
  };
  const addProduct = (product) => {
    setItems((current) => [...current, {
      key: crypto.randomUUID(), product, selectedColor: product.colorVariations?.[0] || '',
      selectedSize: product.sizes?.[0] || '', quantity: 1,
    }]);
    setProductSearch('');
  };
  const updateItem = (key, values) => setItems((current) => current.map((item) => item.key === key ? { ...item, ...values } : item));
  const updateCustomer = (event) => setCustomer((current) => ({ ...current, [event.target.name]: event.target.value }));
  const createOrder = async (event) => {
    event.preventDefault();
    if (!quote || !items.length || (mode === 'existing' && !selectedCustomer)) { setMessage('Select a customer and at least one valid product.'); return; }
    setBusy(true); setMessage('');
    try {
      const created = await ordersApi.adminCreate({
        ...customer, customerId: mode === 'existing' ? selectedCustomer.id : null,
        items: requestItems, couponCode, paymentOption, idempotencyKey: idempotencyKey(),
      });
      onCreated(created);
    } catch (error) { setMessage(error.message); } finally { setBusy(false); }
  };

  return <div className="admin-modal admin-create-order" role="dialog" aria-modal="true" aria-labelledby="admin-create-order-title" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
    <form className="admin-modal__surface" onSubmit={createOrder}>
      <header className="admin-modal__header"><div><span>ADMIN ORDER ENTRY</span><h2 id="admin-create-order-title">CREATE ORDER</h2><p>Use the live catalogue and server-calculated KICKZ pricing.</p></div><button type="button" onClick={onClose} aria-label="Close create order">×</button></header>
      <div className="admin-create-order__grid">
        <section className="admin-create-order__section">
          <div className="admin-create-order__section-head"><span>01</span><h3>CUSTOMER</h3></div>
          <div className="admin-create-order__mode"><button type="button" className={mode === 'existing' ? 'active' : ''} onClick={() => { setMode('existing'); setSelectedCustomer(null); setCustomer(blankCustomer); }}>EXISTING CUSTOMER</button><button type="button" className={mode === 'guest' ? 'active' : ''} onClick={() => { setMode('guest'); setSelectedCustomer(null); setCustomer(blankCustomer); }}>GUEST</button></div>
          {mode === 'existing' && <div className="admin-customer-picker"><label><span>SEARCH NAME, EMAIL OR PHONE</span><input value={customerSearch} onChange={(event) => setCustomerSearch(event.target.value)} placeholder="Start typing..." /></label><div>{customers.map((value) => <button type="button" className={selectedCustomer?.id === value.id ? 'active' : ''} key={value.id} onClick={() => selectCustomer(value)}><strong>{value.name}</strong><span>{value.email} · {value.phoneNumber || 'No phone'}</span></button>)}</div></div>}
          <div className="admin-create-order__fields">
            <label><span>CUSTOMER NAME</span><input name="customerName" value={customer.customerName} onChange={updateCustomer} required readOnly={mode === 'existing'} /></label>
            <label><span>EMAIL</span><input name="email" type="email" value={customer.email} onChange={updateCustomer} required readOnly={mode === 'existing'} /></label>
            <label><span>PHONE / WHATSAPP</span><input name="phoneNumber" value={customer.phoneNumber} onChange={updateCustomer} required /></label>
            <label className="wide"><span>SHIPPING ADDRESS</span><input name="shippingAddress" value={customer.shippingAddress} onChange={updateCustomer} required /></label>
            <label><span>CITY</span><input name="shippingCity" value={customer.shippingCity} onChange={updateCustomer} required /></label>
            <label><span>ORDER NOTES</span><input name="orderNotes" value={customer.orderNotes} onChange={updateCustomer} /></label>
          </div>
        </section>

        <section className="admin-create-order__section">
          <div className="admin-create-order__section-head"><span>02</span><h3>PRODUCTS</h3></div>
          <label className="admin-product-picker"><span>SEARCH PRODUCT, SKU OR BRAND</span><input value={productSearch} onChange={(event) => setProductSearch(event.target.value)} placeholder="Search the live catalogue..." />{productSearch && <div>{matchingProducts.map((product) => <button type="button" key={product.id} onClick={() => addProduct(product)}><strong>{product.name}</strong><span>{product.brand} · {product.sku} · {formatProductPrice(product.price)}</span></button>)}</div>}</label>
          <div className="admin-create-order__items">{items.map((item) => <article key={item.key}><div><strong>{item.product.name}</strong><span>{item.product.brand} · {item.product.sku}</span><b>{formatProductPrice(item.product.price)}</b></div>{item.product.colorVariations?.length > 0 && <label><span>COLOUR</span><select value={item.selectedColor} onChange={(event) => updateItem(item.key, { selectedColor: event.target.value })}>{item.product.colorVariations.map((color) => <option key={color}>{color}</option>)}</select></label>}<label><span>SIZE</span><select value={item.selectedSize} onChange={(event) => updateItem(item.key, { selectedSize: event.target.value })}>{item.product.sizes.map((size) => <option key={size}>{size}</option>)}</select></label><label><span>QTY</span><input type="number" min="1" max="10" value={item.quantity} onChange={(event) => updateItem(item.key, { quantity: Number(event.target.value) })} /></label><button type="button" onClick={() => { setItems((current) => current.filter((value) => value.key !== item.key)); setQuote(null); }}>REMOVE</button></article>)}</div>
          {!items.length && <p className="admin-create-order__empty">Search and select products to build this order.</p>}
        </section>
      </div>

      <section className="admin-create-order__section admin-create-order__pricing">
        <div className="admin-create-order__section-head"><span>03</span><h3>PRICING & PAYMENT</h3></div>
        <label><span>COUPON (OPTIONAL)</span><input value={couponCode} onChange={(event) => setCouponCode(event.target.value.toUpperCase())} placeholder="Coupon code" /></label>
        <div className="admin-create-order__payment"><button type="button" className={paymentOption === PAYMENT_OPTIONS.ADVANCE ? 'active' : ''} onClick={() => setPaymentOption(PAYMENT_OPTIONS.ADVANCE)}>50% / ADVANCE</button><button type="button" className={paymentOption === PAYMENT_OPTIONS.FULL ? 'active' : ''} onClick={() => setPaymentOption(PAYMENT_OPTIONS.FULL)}>FULL PAYMENT</button></div>
        <dl>{[['Subtotal', quote?.subtotalAmount], ['Discount', quote?.discountAmount], ['Order Total', quote?.totalAmount], ['Pay Now', quote?.advanceAmount], ['Balance', quote?.balanceAmount]].map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{quote ? formatProductPrice(value) : '—'}</dd></div>)}</dl>
        <p>Payment is not marked as received when this order is created.</p>
      </section>
      {message && <p className="admin-feedback admin-feedback--error" role="alert">{message}</p>}
      <footer className="admin-create-order__actions"><button className="btn btn--ghost" type="button" onClick={onClose}>CANCEL</button><button className="btn btn--acid" type="submit" disabled={busy || !quote}>{busy ? 'CREATING…' : 'CREATE ORDER'} <span>→</span></button></footer>
    </form>
  </div>;
}
