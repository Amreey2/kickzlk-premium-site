import { useEffect, useRef, useState } from 'react';
import { productBlue, productDunk, productJordan, productLuxury, productNewBalance } from '../../assets';
import ProductCard from '../ProductCard';

export const WHATSAPP_URL = 'https://wa.me/94700000000?text=Hi%20KICKZ.LK%2C%20I%20want%20to%20order%20the%20Air%20Jordan%201%20Retro%20High%20OG';

const galleryImages = [
  [productJordan, 'View red colorway', 'Red sneaker thumbnail'],
  [productDunk, 'View neutral angle', 'Neutral sneaker thumbnail'],
  [productBlue, 'View blue colorway', 'Blue sneaker thumbnail'],
  [productLuxury, 'View black colorway', 'Black sneaker thumbnail'],
];

const sizes = ['7', '7.5', '8', '8.5', '9', '9.5', '10', '10.5', '11', '11.5', '12', '13'];

export function ProductGallery() {
  const [selectedImage, setSelectedImage] = useState(productJordan);
  const [displayedImage, setDisplayedImage] = useState(productJordan);
  const [imageVisible, setImageVisible] = useState(true);
  const imageTimer = useRef(null);

  useEffect(() => () => window.clearTimeout(imageTimer.current), []);

  const selectImage = (image) => {
    setSelectedImage(image);
    setImageVisible(false);
    window.clearTimeout(imageTimer.current);
    imageTimer.current = window.setTimeout(() => {
      setDisplayedImage(image);
      setImageVisible(true);
    }, 140);
  };

  return (
    <section className="gallery reveal" aria-label="Product image gallery">
      <div className="gallery-thumbs">
        {galleryImages.map(([image, ariaLabel, alt]) => (
          <button className={`gallery-thumb${selectedImage === image ? ' active' : ''}`} key={ariaLabel} aria-label={ariaLabel} onClick={() => selectImage(image)}>
            <img src={image} alt={alt} />
          </button>
        ))}
      </div>
      <div className="gallery-main"><span className="zoom-note">HOVER TO FOCUS</span><img className={imageVisible ? '' : 'image-hidden'} src={displayedImage} alt="Air Jordan 1 Retro High OG sneaker" /></div>
    </section>
  );
}

export function ProductInfo({ selectedSize, setSelectedSize, payment, setPayment, addToBag }) {
  const amount = payment === 'deposit' ? 'LKR 20,000 DEPOSIT' : 'LKR 64,900';
  const preorderText = selectedSize ? `PRE-ORDER US ${selectedSize} · ${amount}` : 'SELECT A SIZE TO PRE-ORDER';

  return (
    <section className="product-info reveal delay-100">
      <div className="product-flags"><span className="badge badge--acid badge--static">NEW DROP</span><span className="badge badge--static">PRE-ORDER</span></div>
      <span className="product-brand">JORDAN · MEN&apos;S / UNISEX</span>
      <h1 className="product-title">AIR JORDAN 1<br />RETRO HIGH OG</h1>
      <p className="product-subtitle">Black / University Red / Sail · Style KZ-JD-001</p>
      <div className="product-rating"><span>★★★★★</span><strong>4.9</strong><span>28 verified orders</span></div>
      <div className="product-price"><strong>LKR 64,900</strong><span>Taxes and import handling included</span></div>
      <div className="option-section">
        <div className="option-head"><h3>SELECT SIZE</h3><a href="#size-guide">SIZE GUIDE ↗</a></div>
        <div className="sizes" role="group" aria-label="Available US sizes">
          {sizes.map((size) => <button className={`size-btn${selectedSize === size ? ' active' : ''}`} disabled={size === '11.5'} key={size} onClick={() => setSelectedSize(size)}>US {size}</button>)}
        </div>
      </div>
      <div className="option-section">
        <div className="option-head"><h3>PAYMENT OPTION</h3><span>SECURE CHECKOUT</span></div>
        <div className="payment-options">
          <label className="payment-card"><input type="radio" name="payment" value="deposit" checked={payment === 'deposit'} onChange={(event) => setPayment(event.target.value)} /><span><strong>Pay deposit</strong><small>LKR 20,000 today</small></span></label>
          <label className="payment-card"><input type="radio" name="payment" value="full" checked={payment === 'full'} onChange={(event) => setPayment(event.target.value)} /><span><strong>Pay in full</strong><small>LKR 64,900 today</small></span></label>
        </div>
      </div>
      <div className="delivery-box"><b>↗</b><div><strong>Estimated delivery: 14–28 days</strong><span>Regular WhatsApp updates from sourcing to islandwide delivery.</span></div></div>
      <div className="product-cta">
        <button className="btn btn--acid" id="preorder-button" onClick={addToBag}>{preorderText} <span>→</span></button>
        <a className="btn btn--whatsapp" id="whatsapp-button" href={WHATSAPP_URL} target="_blank" rel="noopener">ORDER VIA WHATSAPP <span>↗</span></a>
      </div>
      <div className="auth-box"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3 4.5 6v5.5c0 4.6 3.2 8.9 7.5 10.5 4.3-1.6 7.5-5.9 7.5-10.5V6L12 3Z" /><path d="m8.8 12 2.1 2.1 4.4-4.5" /></svg><div><h4>KICKZ AUTHENTICITY GUARANTEE</h4><p>Sourced from verified retail and trusted global channels. Order documentation is retained for quality assurance.</p></div></div>
    </section>
  );
}

const tabs = [
  { id: 'details', label: 'PRODUCT DETAILS', content: <><h3>An icon built for the rotation.</h3><p>The Air Jordan 1 Retro High OG combines a structured high-top profile, premium panel construction and a timeless black, red and sail palette. This concept page presents the product in a high-end editorial format designed for trust and conversion.</p><ul><li>Premium leather-inspired upper</li><li>Padded ankle support</li><li>Durable rubber outsole</li><li>Classic lace-up construction</li></ul></> },
  { id: 'delivery', label: 'DELIVERY & PRE-ORDER', content: <><h3>Clear pre-order timeline.</h3><p>Secure the order with the selected deposit. KICKZ.LK confirms sourcing, shares progress through WhatsApp, and collects the remaining balance before islandwide dispatch. Typical timelines are 14–28 days, depending on release availability and logistics.</p></> },
  { id: 'size-guide', label: 'SIZE GUIDE', content: <><h3>Choose your usual sneaker size.</h3><p>For most customers, the Jordan 1 fits true to size. Customers between sizes may prefer the larger size for a roomier streetwear fit. Add a detailed centimetre conversion chart before production launch.</p></> },
  { id: 'care', label: 'CARE', content: <><h3>Keep the pair fresh.</h3><p>Use a soft dry brush after wear, spot-clean with a sneaker-safe solution, air-dry away from direct heat and store with shoe trees or paper inserts.</p></> },
];

export function ProductDetails() {
  const [activeTab, setActiveTab] = useState('details');
  return (
    <section className="product-details"><div className="container">
      <div className="tabs" role="tablist">{tabs.map((tab) => <button className={`tab-btn${activeTab === tab.id ? ' active' : ''}`} key={tab.id} role="tab" onClick={() => setActiveTab(tab.id)}>{tab.label}</button>)}</div>
      {tabs.map((tab) => <div className={`tab-panel${activeTab === tab.id ? ' active' : ''}`} id={tab.id} key={tab.id}>{tab.content}</div>)}
    </div></section>
  );
}

const recommendations = [
  { category: 'nike', badge: 'LIMITED', image: productDunk, alt: 'Grey and neon sneaker', code: 'KZ-024 / 02', brand: 'NIKE', name: 'Dunk Low Premium', price: 'LKR 47,500', sizes: 'US 6–11' },
  { category: 'luxury', badge: 'LUXURY', badgeClass: 'badge--gold', image: productLuxury, alt: 'Black luxury sneaker', code: 'KZ-024 / 05', brand: 'BALMAIN', name: 'Unicorn Low Sneaker', price: 'LKR 189,000', sizes: 'EU 40–45', delay: 80 },
  { category: 'luxury', badge: 'TRENDING', badgeClass: 'badge--mint', image: productNewBalance, alt: 'Green modern sneaker', code: 'KZ-024 / 06', brand: 'NEW BALANCE', name: '9060 Sea Salt', price: 'LKR 56,500', sizes: 'US 6–12', delay: 160 },
];

export function Recommendations() {
  return (
    <section className="drops section-pad"><div className="container">
      <div className="section-head reveal"><div><span className="section-kicker">KEEP SCROLLING</span><h2>YOU MAY ALSO LIKE</h2></div><p>More pairs selected to complement your rotation.</p></div>
      <div className="product-grid">{recommendations.map((product) => <ProductCard product={product} key={product.code} showHeart={false} />)}</div>
    </div></section>
  );
}

export function MobileBuyBar({ selectedSize, addToBag }) {
  const openWhatsApp = () => document.getElementById('whatsapp-button')?.click();
  return <div className="mobile-buybar"><button className="btn btn--ghost" onClick={openWhatsApp}>WHATSAPP</button><button className="btn btn--acid" onClick={addToBag}>{selectedSize ? `PRE-ORDER US ${selectedSize}` : 'SELECT SIZE'}</button></div>;
}
