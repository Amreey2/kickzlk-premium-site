import { useEffect, useState } from 'react';
import {
  formatProductPrice,
  categoryGenderLabel,
  productDeliveryTime,
  productImage,
  productImageAlt,
  productGallery,
  replaceFailedProductImage,
  productTags,
} from '../../utils/productPresentation';
import ProductCard from '../ProductCard';
import ProductCollectionState from '../ProductCollectionState';

const WHATSAPP_NUMBER = '94700000000';

const createWhatsAppUrl = (product) => {
  const message = `Hi KICKZ.LK, I want to enquire about the ${product.name}.`;
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
};

export function ProductGallery({ product, selectedColor }) {
  const galleryImages = productGallery(product, selectedColor);
  const initialImage = galleryImages[0]?.url || productImage(product);
  const [selectedImage, setSelectedImage] = useState(initialImage);

  const selectImage = (image) => {
    setSelectedImage(image);
  };

  return (
    <section className="gallery reveal" aria-label={`${product.name} image gallery`}>
      <div className="gallery-thumbs">
        {(galleryImages.length ? galleryImages : [{ url: initialImage, alt: productImageAlt(product) }]).map((image, index) => (
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
        <img className="gallery-active-image" key={`${selectedColor}-${selectedImage}`} src={selectedImage} alt={productImageAlt(product)} onError={replaceFailedProductImage} />
      </div>
    </section>
  );
}

export function ProductHeading({ product, mobile = false }) {
  const tags = productTags(product);
  const gender = categoryGenderLabel(product);
  return (
    <header className={mobile ? 'product-heading product-heading--mobile' : 'product-heading product-heading--desktop'}>
      <div className="product-flags">
        {tags.map((tag, index) => <span className={`badge badge--static${index === 0 ? ' badge--acid' : ''}`} key={tag.toLowerCase()}>{tag.toUpperCase()}</span>)}
      </div>
      <span className="product-brand">{product.brand.toUpperCase()}{gender ? ` · ${gender}` : ''}</span>
      <h1 className="product-title">{product.name}</h1>
      <p className="product-subtitle">{product.category.toUpperCase()} · {product.preOrder ? 'PRE-ORDER AVAILABLE' : `${product.stock} IN STOCK`}</p>
    </header>
  );
}

export function ProductInfo({ product, selectedSize, setSelectedSize, selectedColor, setSelectedColor, payment, setPayment, addToBag, buyNow, openSizeGuide }) {
  const deposit = Math.round((product.price * 0.3) / 1000) * 1000;
  const amount = payment === 'deposit' ? `${formatProductPrice(deposit)} DEPOSIT` : formatProductPrice(product.price);
  const unavailable = product.status === 'Out of Stock' || (!product.preOrder && product.stock <= 0);
  const action = 'ADD TO CART';
  const actionText = unavailable ? 'OUT OF STOCK' : selectedSize ? `${action} · ${amount}` : action;
  const whatsappUrl = createWhatsAppUrl(product);
  const deliveryTime = productDeliveryTime(product);

  return (
    <section className="product-info reveal delay-100">
      <ProductHeading product={product} />
      <div className="product-rating"><span>★★★★★</span><strong>4.9</strong><span>Verified KICKZ.LK sourcing</span></div>
      <div className="product-price"><strong>{formatProductPrice(product.price)}</strong><span>Taxes and import handling included</span></div>
      <div className="product-catalog-attributes"><div><span>BRAND</span><strong>{product.brand}</strong></div><div><span>CATEGORY</span><strong>{product.category}</strong></div><div><span>DELIVERY TIMELINE</span><strong>{deliveryTime}</strong></div><div><span>STOCK STATUS</span><strong>{product.preOrder ? 'PRE-ORDER AVAILABLE' : product.stock > 0 ? `${product.stock} AVAILABLE` : 'OUT OF STOCK'}</strong></div></div>

      {/* SPRINT 3.1 PRICE NOTICE: required confirmation guidance remains prominent before selection and enquiry. */}
      <p className="price-notice">Due to Sri Lanka&apos;s fluctuating USD exchange rate, customers should confirm today&apos;s final price before placing an order.</p>

      {product.colorVariations?.length > 0 && <div className="option-section">
        <div className="option-head"><h3>SELECT COLOUR</h3><span>{selectedColor || 'CHOOSE A COLOUR'}</span></div>
        <div className="color-options" role="group" aria-label="Available colours">{product.colorVariations.map((color) => <button className={`color-btn${selectedColor === color ? ' active' : ''}`} type="button" key={color} onClick={() => setSelectedColor(color)}><i aria-hidden="true" />{color}</button>)}</div>
      </div>}
      <div className="option-section">
        <div className="option-head"><h3>SELECT SIZE</h3><button className="size-guide-link" type="button" onClick={openSizeGuide}>SIZE GUIDE ↗</button></div>
        <div className="sizes" role="group" aria-label="Available sizes">
          {product.sizes.map((size) => (
            <button className={`size-btn${selectedSize === size ? ' active' : ''}`} key={size} onClick={() => setSelectedSize(size)}>
              {size}
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
        <button className="btn btn--acid" id="preorder-button" onClick={addToBag} disabled={unavailable}>{actionText} <span>→</span></button>
        <button className="btn btn--ghost" type="button" onClick={buyNow} disabled={unavailable}>BUY NOW <span>↗</span></button>
      </div>
      <a className="product-whatsapp-link" id="whatsapp-button" href={whatsappUrl} target="_blank" rel="noopener noreferrer">NEED HELP? WHATSAPP ENQUIRY <span>↗</span></a>
      <div className="auth-box"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3 4.5 6v5.5c0 4.6 3.2 8.9 7.5 10.5 4.3-1.6 7.5-5.9 7.5-10.5V6L12 3Z" /><path d="m8.8 12 2.1 2.1 4.4-4.5" /></svg><div><h4>KICKZ AUTHENTICITY GUARANTEE</h4><p>Sourced from verified retail and trusted global channels. Order documentation is retained for quality assurance.</p></div></div>
      <div className="product-trust-grid"><div><span>01</span><strong>VERIFIED SOURCING</strong><small>Trusted global channels</small></div><div><span>02</span><strong>QUALITY CHECKED</strong><small>Inspected before dispatch</small></div><div><span>03</span><strong>ISLANDWIDE SUPPORT</strong><small>Updates throughout delivery</small></div></div>
    </section>
  );
}

export function ProductDetails({ product }) {
  const [activeTab, setActiveTab] = useState('details');
  const tabs = [
    { id: 'details', label: 'PRODUCT DETAILS', content: <><h3>{product.name}</h3><p>{product.description}</p><ul><li>Curated by KICKZ.LK</li><li>Verified global sourcing</li><li>Premium protective packaging</li><li>Islandwide delivery support</li></ul></> },
    { id: 'delivery', label: 'DELIVERY & PRE-ORDER', content: <><h3>Clear delivery timeline.</h3><p>{product.preOrder ? 'Secure the order with the selected deposit. KICKZ.LK confirms sourcing, shares progress through WhatsApp, and collects the remaining balance before islandwide dispatch.' : 'This pair is currently available for local fulfilment. KICKZ.LK confirms the order and shares dispatch progress through WhatsApp.'} Estimated delivery is {productDeliveryTime(product)}.</p></> },
    { id: 'care', label: 'CARE', content: <><h3>Keep the pair fresh.</h3><p>Use a soft dry brush after wear, spot-clean with a sneaker-safe solution, air-dry away from direct heat and store with shoe trees or paper inserts.</p></> },
  ];

  return (
    <section className="product-details"><div className="container">
      <div className="tabs" role="tablist">{tabs.map((tab) => <button className={`tab-btn${activeTab === tab.id ? ' active' : ''}`} key={tab.id} role="tab" aria-selected={activeTab === tab.id} onClick={() => setActiveTab(tab.id)}>{tab.label}</button>)}</div>
      {tabs.map((tab) => <div className={`tab-panel${activeTab === tab.id ? ' active' : ''}`} id={tab.id} key={tab.id}>{tab.content}</div>)}
    </div></section>
  );
}

export function Recommendations({ product, products, loading, error }) {
  const recommendations = products
    .filter((candidate) => candidate.id !== product.id)
    .sort((a, b) => Number(b.category === product.category) - Number(a.category === product.category) || Number(b.brand === product.brand) - Number(a.brand === product.brand))
    .slice(0, 6);

  return (
    <section className="drops section-pad"><div className="container">
      <div className="section-head reveal"><div><span className="section-kicker">KEEP SCROLLING</span><h2>YOU MAY ALSO LIKE</h2></div><a className="btn btn--ghost" href={`/shop?category=${encodeURIComponent(product.category)}`}>VIEW ALL <span>↗</span></a></div>
      <ProductCollectionState loading={loading} error={error} empty={!loading && !error && recommendations.length === 0} />
      <div className="product-grid">{recommendations.map((product) => <ProductCard product={product} key={product.id} showHeart={false} showCommerceDetails />)}</div>
    </div></section>
  );
}

export function MobileBuyBar({ product, selectedSize, addToBag }) {
  const unavailable = product.status === 'Out of Stock' || (!product.preOrder && product.stock <= 0);
  return <div className="mobile-buybar"><div className="mobile-buybar__price"><span>PRICE</span><strong>{formatProductPrice(product.price)}</strong></div><button className="btn btn--acid" onClick={addToBag} disabled={unavailable}>{unavailable ? 'OUT OF STOCK' : selectedSize ? 'ADD TO CART' : 'SELECT SIZE'}</button></div>;
}

export function SizeGuideModal({ guide, open, onClose }) {
  useEffect(() => {
    if (!open) return undefined;
    const close = (event) => { if (event.key === 'Escape') onClose(); };
    document.addEventListener('keydown', close);
    return () => document.removeEventListener('keydown', close);
  }, [onClose, open]);
  if (!open) return null;
  return <div className="size-guide-modal" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}><section role="dialog" aria-modal="true" aria-labelledby="size-guide-title"><header><div><span className="section-kicker">GLOBAL FIT REFERENCE</span><h2 id="size-guide-title">SIZE GUIDE</h2></div><button type="button" onClick={onClose} aria-label="Close size guide">×</button></header>{guide?.imageUrl ? <img src={guide.imageUrl} alt={guide.altText || 'KICKZ.LK sneaker size guide'} onError={replaceFailedProductImage} /> : <div className="size-guide-empty"><strong>SIZE GUIDE COMING SOON</strong><p>Contact KICKZ.LK through WhatsApp for personal sizing guidance.</p></div>}</section></div>;
}
