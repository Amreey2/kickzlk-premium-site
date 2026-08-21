const MEASUREMENT_ID = String(import.meta.env.VITE_GA_MEASUREMENT_ID || '').trim();
const DEBUG_MODE = String(import.meta.env.VITE_GA_DEBUG || '').toLowerCase() === 'true';
const PURCHASE_KEY_PREFIX = 'kickz_ga4_purchase_';
const PURCHASE_SNAPSHOT_KEY = 'kickz_ga4_pending_purchase';
const SENSITIVE_KEY = /(email|phone|address|password|bank|account|customer_name|full_name)/i;
const EMAIL_LIKE = /\b[^\s@]+@[^\s@]+\.[^\s@]+\b/;
const PHONE_LIKE = /(?:\+?\d[\s().-]*){7,}/;

let initialized = false;
let lastPagePath = '';
const recentEvents = new Map();
const completedPurchases = new Set();

const compact = (value) => {
  if (Array.isArray(value)) return value.map(compact).filter((item) => item !== undefined);
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value)
      .filter(([key]) => !SENSITIVE_KEY.test(key))
      .map(([key, item]) => [key, compact(item)])
      .filter(([, item]) => item !== undefined));
  }
  if (typeof value === 'string') return value.trim().slice(0, 200);
  if (typeof value === 'number') return Number.isFinite(value) ? value : undefined;
  if (typeof value === 'boolean') return value;
  return value == null ? undefined : value;
};

const isSafeSearchTerm = (value) => !EMAIL_LIKE.test(value) && !PHONE_LIKE.test(value);
const hasWindow = () => typeof window !== 'undefined';
const readStorage = (storage, key) => { try { return storage.getItem(key); } catch { return null; } };
const writeStorage = (storage, key, value) => { try { storage.setItem(key, value); return true; } catch { return false; } };
const removeStorage = (storage, key) => { try { storage.removeItem(key); } catch { /* Storage may be unavailable in privacy mode. */ } };

export const analyticsConfigured = () => Boolean(MEASUREMENT_ID);

export const initializeAnalytics = () => {
  if (!hasWindow() || !analyticsConfigured()) return false;
  if (initialized) return true;
  initialized = true;
  window.dataLayer = window.dataLayer || [];
  window.gtag = window.gtag || function gtag() { window.dataLayer.push(arguments); };
  window.gtag('js', new Date());
  window.gtag('config', MEASUREMENT_ID, { send_page_view: false, ...(DEBUG_MODE ? { debug_mode: true } : {}) });
  if (!document.querySelector(`script[data-kickz-ga4="${MEASUREMENT_ID}"]`)) {
    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(MEASUREMENT_ID)}`;
    script.dataset.kickzGa4 = MEASUREMENT_ID;
    document.head.appendChild(script);
  }
  return true;
};

const trackEvent = (name, parameters = {}) => {
  if (!initializeAnalytics()) return false;
  const clean = compact(parameters);
  window.gtag('event', name, clean);
  if (DEBUG_MODE) console.debug('[KICKZ GA4]', name, clean);
  return true;
};

const trackRecentOnce = (name, key, parameters, windowMs = 1500) => {
  const now = Date.now();
  const fingerprint = `${name}:${key}`;
  if (now - (recentEvents.get(fingerprint) || 0) < windowMs) return false;
  const sent = trackEvent(name, parameters);
  if (sent) recentEvents.set(fingerprint, now);
  return sent;
};

export const isPublicAnalyticsPath = (pathname) => [
  /^\/$/, /^\/index\.html$/, /^\/shop$/, /^\/product\/[^/]+$/, /^\/category\/[^/]+$/,
  /^\/brand\/[^/]+$/, /^\/categories$/, /^\/brands$/, /^\/new-drops$/,
  /^\/about(?:-us)?$/, /^\/community$/, /^\/contact$/,
].some((pattern) => pattern.test(pathname));

export const trackPageView = () => {
  if (!hasWindow() || !isPublicAnalyticsPath(window.location.pathname)) return false;
  if (/loading|not found|unavailable/i.test(document.title)) return false;
  const path = window.location.pathname;
  if (path === lastPagePath) return false;
  const sent = trackEvent('page_view', {
    page_title: document.title,
    page_location: `${window.location.origin}${path}`,
    page_path: path,
  });
  if (sent) lastPagePath = path;
  return sent;
};

export const toAnalyticsItem = (product, selection = {}) => {
  const selectedColor = selection.selectedColor || selection.selected_color || '';
  const selectedSize = selection.selectedSize || selection.selected_size || '';
  const variant = [selectedColor, selectedSize ? `Size ${selectedSize}` : ''].filter(Boolean).join(' · ');
  return compact({
    item_id: product.sku || product.item_id || product.id || product.product_id,
    item_name: product.name || product.item_name || product.product_name,
    item_brand: product.brand || product.item_brand,
    item_category: product.category || product.item_category,
    price: Number(product.price),
    quantity: Number(selection.quantity || product.quantity || 1),
    ...(variant ? { item_variant: variant } : {}),
  });
};

export const entriesToAnalyticsItems = (entries) => entries.map((entry) => toAnalyticsItem(entry.product || entry, entry.item || entry));

export const trackViewItem = (product) => trackRecentOnce('view_item', product.sku || product.id, {
  currency: 'LKR', value: Number(product.price), items: [toAnalyticsItem(product)],
}, 5000);

export const trackAddToCart = (product, selection = {}) => trackEvent('add_to_cart', {
  currency: 'LKR', value: Number(product.price) * Number(selection.quantity || 1), items: [toAnalyticsItem(product, selection)],
});

export const trackRemoveFromCart = (product, selection = {}) => trackEvent('remove_from_cart', {
  currency: 'LKR', value: Number(product.price) * Number(selection.quantity || 1), items: [toAnalyticsItem(product, selection)],
});

export const trackViewCart = (entries, value) => trackEvent('view_cart', {
  currency: 'LKR', value: Number(value), items: entriesToAnalyticsItems(entries),
});

export const trackBeginCheckout = (entries, quote, checkoutType) => trackEvent('begin_checkout', {
  currency: 'LKR', value: Number(quote.totalAmount), coupon: quote.couponCode || undefined,
  checkout_type: checkoutType,
  payment_option: quote.paymentOption === 'full' ? 'full_payment' : 'advance_50_percent',
  items: entriesToAnalyticsItems(entries),
});

export const trackPaymentOption = (option, context, value) => trackRecentOnce('select_payment_option', `${context}:${option}`, {
  payment_option: option === 'full' ? 'full_payment' : 'advance_50_percent',
  checkout_stage: context, currency: 'LKR', value: Number(value || 0),
});

export const trackPromotion = (quote) => trackRecentOnce('add_promotion', `${quote.couponCode}:${quote.discountAmount}`, {
  promotion_id: quote.couponCode,
  promotion_name: quote.couponLabel || quote.couponCode,
  currency: 'LKR', value: Number(quote.discountAmount),
});

export const trackSearch = (term, resultCount, source = 'shop') => {
  const searchTerm = String(term || '').trim();
  if (searchTerm.length < 2 || !isSafeSearchTerm(searchTerm)) return false;
  return trackRecentOnce('search', `${source}:${searchTerm.toLowerCase()}:${resultCount}`, {
    search_term: searchTerm, result_count: Number(resultCount), search_source: source,
  }, 2500);
};

export const trackCatalogSelection = (type, value) => trackRecentOnce(`select_${type}`, value, {
  [`${type}_name`]: value,
});

export const trackProductFilter = (type, value, selected) => trackRecentOnce('filter_products', `${type}:${value}:${selected}`, {
  filter_type: type, filter_value: String(value), filter_action: selected ? 'apply' : 'remove',
});

export const storePurchaseSnapshot = ({ order, entries, checkoutType }) => {
  if (!hasWindow()) return;
  const snapshot = {
    orderNumber: order.order_number,
    checkoutType,
    items: entriesToAnalyticsItems(entries),
  };
  writeStorage(sessionStorage, PURCHASE_SNAPSHOT_KEY, JSON.stringify(snapshot));
};

export const trackPurchase = (order) => {
  if (!hasWindow() || !order?.order_number || !analyticsConfigured()) return false;
  const key = `${PURCHASE_KEY_PREFIX}${order.order_number}`;
  if (completedPurchases.has(order.order_number) || readStorage(localStorage, key)) return false;
  let snapshot = null;
  try { snapshot = JSON.parse(readStorage(sessionStorage, PURCHASE_SNAPSHOT_KEY) || 'null'); } catch { /* Ignore malformed local analytics state. */ }
  const items = snapshot?.orderNumber === order.order_number && snapshot.items?.length
    ? snapshot.items
    : (order.items || []).map((item) => toAnalyticsItem(item, item));
  const sent = trackEvent('purchase', {
    transaction_id: order.order_number,
    currency: 'LKR', value: Number(order.total_amount), discount: Number(order.discount_amount || 0),
    coupon: order.coupon_code || undefined,
    checkout_type: snapshot?.orderNumber === order.order_number ? snapshot.checkoutType : order.user_id ? 'logged_in' : 'guest',
    payment_option: order.payment_option === 'full' ? 'full_payment' : 'advance_50_percent',
    items,
  });
  if (sent) {
    completedPurchases.add(order.order_number);
    writeStorage(localStorage, key, '1');
    removeStorage(sessionStorage, PURCHASE_SNAPSHOT_KEY);
  }
  return sent;
};
