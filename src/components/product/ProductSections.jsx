import { useEffect, useRef, useState } from 'react';
import {
  formatProductPrice,
  productAvailability,
  productBadgeClass,
  productDeliveryTime,
  productImage,
  productImageAlt,
  replaceFailedProductImage,
} from '../../utils/productPresentation';
import ProductCard from '../ProductCard';
import ProductCollectionState from '../ProductCollectionState';

const WHATSAPP_NUMBER = '94700000000';

const createWhatsAppUrl = (product) => {
  const message = `Hi KICKZ.LK, I want to enquire about the ${product.name}.`;
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
};

export function ProductGallery({ product }) {
  const initialImage = productImage(product);
  const [selectedImage, setSelectedImage] = useState(initialImage);
  const [displayedImage, setDisplayedImage] = useState(initialImage);
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
    <section className="gallery reveal" aria-label={`${product.name} image gallery`}>
      <div className="gallery-thumbs">
        {(product.images.length ? product.images : [{ url: initialImage, alt: productImageAlt(product) }]).map((image, index) => (
          <button
            className={`gallery-thumb${selectedImage === image.url ? ' active' : ''}`}
            key={`${product.id}-${index}`}
            aria-label={`View ${product.name} image ${index + 1}`}
            onClick={() => selectImage(image.url)}
          >
            <img src={image.url} alt={image.alt} onError={replaceFailedProductImage} />
          </button>
        ))}
      </div>
      <div className="gallery-main">
        <span className="zoom-note">HOVER TO FOCUS</span>
        <img className={imageVisible ? '' : 'image-hidden'} src={displayedImage} alt={productImageAlt(product)} onError={replaceFailedProductImage} />
      </div>
    </section>
  );
}

export function ProductInfo({ product, selectedSize, setSelectedSize, payment, setPayment, addToBag }) {
  const deposit = Math.round((product.price * 0.3) / 1000) * 1000;
  const amount = payment === 'deposit' ? `${formatProductPrice(deposit)} DEPOSIT` : formatProductPrice(product.price);
  const action = product.preOrder ? 'PRE-ORDER' : 'ADD';
  const actionText = selectedSize ? `${action} SIZE ${selectedSize} · ${amount}` : `SELECT A SIZE TO ${action}`;
  const sizePrefix = product.brand === 'Balmain' ? 'EU' : 'US';
  const whatsappUrl = createWhatsAppUrl(product);
  const availability = productAvailability(product);
  const deliveryTime = productDeliveryTime(product);

  return (
    <section className="product-info reveal delay-100">
      <div className="product-flags">
        <span className={`badge ${productBadgeClass(product)} badge--static`}>{availability}</span>
        {product.preOrder && <span className="badge badge--static">PRE-ORDER</span>}
      </div>
      <span className="product-brand">{product.brand.toUpperCase()} · MEN&apos;S / UNISEX</span>
      <h1 className="product-title">{product.name}</h1>
      <p className="product-subtitle">{product.category.toUpperCase()} · {product.preOrder ? 'PRE-ORDER AVAILABLE' : `${product.stock} IN STOCK`}</p>
      <div className="product-rating"><span>★★★★★</span><strong>4.9</strong><span>Verified KICKZ.LK sourcing</span></div>
      <div className="product-price"><strong>{formatProductPrice(product.price)}</strong><span>Taxes and import handling included</span></div>

      {/* SPRINT 3.1 PRICE NOTICE: required confirmation guidance remains prominent before selection and enquiry. */}
      <p className="price-notice">Due to Sri Lanka&apos;s fluctuating USD exchange rate, customers should confirm today&apos;s final price before placing an order.</p>

      <div className="option-section">
        <div className="option-head"><h3>SELECT SIZE</h3><a href="#size-guide">SIZE GUIDE ↗</a></div>
        <div className="sizes" role="group" aria-label={`Available ${sizePrefix} sizes`}>
          {product.sizes.map((size) => (
            <button className={`size-btn${selectedSize === size ? ' active' : ''}`} key={size} onClick={() => setSelectedSize(size)}>
              {sizePrefix} {size}
            </button>
          ))}
        </div>
      </div>
      {product.preOrder && (
        <div className="option-section">
          <div className="option-head"><h3>PAYMENT OPTION</h3><span>FRONTEND DEMO</span></div>
          <div className="payment-options">
            <label className="payment-card"><input type="radio" name="payment" value="deposit" checked={payment === 'deposit'} onChange={(event) => setPayment(event.target.value)} /><span><strong>Pay deposit</strong><small>{formatProductPrice(deposit)} today</small></span></label>
            <label className="payment-card"><input type="radio" name="payment" value="full" checked={payment === 'full'} onChange={(event) => setPayment(event.target.value)} /><span><strong>Pay in full</strong><small>{formatProductPrice(product.price)} today</small></span></label>
          </div>
        </div>
      )}
      <div className="delivery-box"><b>↗</b><div><strong>Estimated delivery: {deliveryTime}</strong><span>Regular WhatsApp updates from sourcing to islandwide delivery.</span></div></div>
      <div className="product-cta">
        <button className="btn btn--acid" id="preorder-button" onClick={addToBag}>{actionText} <span>→</span></button>
        <a className="btn btn--whatsapp" id="whatsapp-button" href={whatsappUrl} target="_blank" rel="noopener noreferrer">WHATSAPP ENQUIRY <span>↗</span></a>
      </div>
      <div className="auth-box"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3 4.5 6v5.5c0 4.6 3.2 8.9 7.5 10.5 4.3-1.6 7.5-5.9 7.5-10.5V6L12 3Z" /><path d="m8.8 12 2.1 2.1 4.4-4.5" /></svg><div><h4>KICKZ AUTHENTICITY GUARANTEE</h4><p>Sourced from verified retail and trusted global channels. Order documentation is retained for quality assurance.</p></div></div>
    </section>
  );
}

export function ProductDetails({ product }) {
  const [activeTab, setActiveTab] = useState('details');
  const tabs = [
    { id: 'details', label: 'PRODUCT DETAILS', content: <><h3>{product.name}</h3><p>{product.description}</p><ul><li>Curated by KICKZ.LK</li><li>Verified global sourcing</li><li>Premium protective packaging</li><li>Islandwide delivery support</li></ul></> },
    { id: 'delivery', label: 'DELIVERY & PRE-ORDER', content: <><h3>Clear delivery timeline.</h3><p>{product.preOrder ? 'Secure the order with the selected deposit. KICKZ.LK confirms sourcing, shares progress through WhatsApp, and collects the remaining balance before islandwide dispatch.' : 'This pair is currently available for local fulfilment. KICKZ.LK confirms the order and shares dispatch progress through WhatsApp.'} Estimated delivery is {productDeliveryTime(product)}.</p></> },
    { id: 'size-guide', label: 'SIZE GUIDE', content: <><h3>Choose your usual sneaker size.</h3><p>Fit can vary by silhouette. Contact KICKZ.LK through WhatsApp for personal sizing guidance before confirming your pair.</p></> },
    { id: 'care', label: 'CARE', content: <><h3>Keep the pair fresh.</h3><p>Use a soft dry brush after wear, spot-clean with a sneaker-safe solution, air-dry away from direct heat and store with shoe trees or paper inserts.</p></> },
  ];

  return (
    <section className="product-details"><div className="container">
      <div className="tabs" role="tablist">{tabs.map((tab) => <button className={`tab-btn${activeTab === tab.id ? ' active' : ''}`} key={tab.id} role="tab" aria-selected={activeTab === tab.id} onClick={() => setActiveTab(tab.id)}>{tab.label}</button>)}</div>
      {tabs.map((tab) => <div className={`tab-panel${activeTab === tab.id ? ' active' : ''}`} id={tab.id} key={tab.id}>{tab.content}</div>)}
    </div></section>
  );
}

export function Recommendations({ productId, products, loading, error }) {
  const recommendations = products.filter((product) => product.id !== productId).slice(0, 3);

  return (
    <section className="drops section-pad"><div className="container">
      <div className="section-head reveal"><div><span className="section-kicker">KEEP SCROLLING</span><h2>YOU MAY ALSO LIKE</h2></div><p>More pairs selected to complement your rotation.</p></div>
      <ProductCollectionState loading={loading} error={error} empty={!loading && !error && recommendations.length === 0} />
      <div className="product-grid">{recommendations.map((product) => <ProductCard product={product} key={product.id} showHeart={false} showCommerceDetails />)}</div>
    </div></section>
  );
}

export function MobileBuyBar({ product, selectedSize, addToBag }) {
  const openWhatsApp = () => document.getElementById('whatsapp-button')?.click();
  const action = product.preOrder ? 'PRE-ORDER' : 'ADD';
  return <div className="mobile-buybar"><button className="btn btn--ghost" onClick={openWhatsApp}>WHATSAPP</button><button className="btn btn--acid" onClick={addToBag}>{selectedSize ? `${action} SIZE ${selectedSize}` : 'SELECT SIZE'}</button></div>;
}
