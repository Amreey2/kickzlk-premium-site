import { useRef, useState } from 'react';
import {
  heroSneaker,
  productBlue,
  productDunk,
  productJordan,
  productLuxury,
  productNewBalance,
  productYeezy,
} from '../../assets';
import ProductCard from '../ProductCard';

const products = [
  { category: 'jordan', badge: 'NEW DROP', badgeClass: 'badge--acid', image: productJordan, alt: 'Red and black high-top sneaker', code: 'KZ-024 / 01', brand: 'JORDAN', name: 'Air Jordan 1 Retro High OG', price: 'LKR 64,900', sizes: 'US 7–12', ariaLabel: 'View Air Jordan 1 Retro High OG', loading: 'lazy' },
  { category: 'nike', badge: 'LIMITED', image: productDunk, alt: 'Grey and neon low-top sneaker', code: 'KZ-024 / 02', brand: 'NIKE', name: 'Dunk Low Premium', price: 'LKR 47,500', sizes: 'US 6–11', ariaLabel: 'View Nike Dunk Low Premium', loading: 'lazy', delay: 70 },
  { category: 'adidas', badge: 'PRE-ORDER', badgeClass: 'badge--sand', image: productYeezy, alt: 'Beige lifestyle sneaker', code: 'KZ-024 / 03', brand: 'ADIDAS', name: 'Yeezy 500 Utility', price: 'LKR 58,900', sizes: 'US 7–12', ariaLabel: 'View Adidas Yeezy 500 Utility', loading: 'lazy', delay: 140 },
  { category: 'nike', badge: 'JUST IN', image: productBlue, alt: 'Blue performance sneaker', code: 'KZ-024 / 04', brand: 'NIKE', name: 'Air Max Pulse', price: 'LKR 52,900', sizes: 'US 7–13', ariaLabel: 'View Nike Air Max Pulse', loading: 'lazy' },
  { category: 'luxury', badge: 'LUXURY', badgeClass: 'badge--gold', image: productLuxury, alt: 'Black and gold luxury sneaker', code: 'KZ-024 / 05', brand: 'BALMAIN', name: 'Unicorn Low Sneaker', price: 'LKR 189,000', sizes: 'EU 40–45', ariaLabel: 'View Balmain Unicorn Low', loading: 'lazy', delay: 70 },
  { category: 'luxury', badge: 'TRENDING', badgeClass: 'badge--mint', image: productNewBalance, alt: 'Green modern running sneaker', code: 'KZ-024 / 06', brand: 'NEW BALANCE', name: '9060 Sea Salt', price: 'LKR 56,500', sizes: 'US 6–12', ariaLabel: 'View New Balance 9060', loading: 'lazy', delay: 140 },
];

export function HeroSection() {
  const visualRef = useRef(null);
  const shoeRef = useRef(null);

  const handleMove = (event) => {
    if (!window.matchMedia('(pointer:fine)').matches) return;
    const rect = visualRef.current.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width - 0.5;
    const y = (event.clientY - rect.top) / rect.height - 0.5;
    shoeRef.current.style.animation = 'none';
    shoeRef.current.style.transform = `rotate(${(-4 + x * 4).toFixed(2)}deg) translate(${(x * 12).toFixed(1)}px, ${(y * 10).toFixed(1)}px)`;
  };
  const handleLeave = () => {
    shoeRef.current.style.transform = '';
    shoeRef.current.style.animation = '';
  };

  return (
    <section className="hero section-pad snap-section">
      <div className="hero-grid container">
        <div className="hero-copy reveal">
          <div className="eyebrow"><span className="pulse" /> CURATED GLOBAL DROPS · SRI LANKA</div>
          <h1>AUTHENTIC<br />SNEAKERS.<br /><span>BUILT FOR THE CULTURE.</span></h1>
          <p>Imported heat. Verified quality. A premium pre-order experience for Sri Lanka’s sneaker and streetwear community.</p>
          <div className="hero-actions">
            <a href="/new-drops" className="btn btn--acid">SHOP SNEAKERS <span>↗</span></a>
            <a href="/pre-order" className="btn btn--ghost">PRE-ORDER NOW</a>
          </div>
          <div className="hero-badges" aria-label="Trust badges">
            <div><strong>100%</strong><span>Authentic</span></div>
            <div><strong>2–4 WKS</strong><span>Typical import</span></div>
            <div><strong>4.9/5</strong><span>Community rating</span></div>
          </div>
        </div>
        <div className="hero-visual reveal delay-120" ref={visualRef} onMouseMove={handleMove} onMouseLeave={handleLeave}>
          <div className="hero-orbit hero-orbit--one" /><div className="hero-orbit hero-orbit--two" /><div className="hero-glow" />
          <div className="floating-label floating-label--top"><span>DROP 024</span><strong>LIMITED</strong></div>
          <img className="hero-shoe" ref={shoeRef} src={heroSneaker} alt="Limited edition black and neon sneaker illustration" />
          <div className="floating-label floating-label--bottom"><span>FROM</span><strong>LKR 42,900</strong></div>
          <div className="hero-index">01<span>/06</span></div>
        </div>
      </div>
      <div className="container hero-footer reveal delay-220">
        <div className="trust-chip">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3 4.5 6v5.5c0 4.6 3.2 8.9 7.5 10.5 4.3-1.6 7.5-5.9 7.5-10.5V6L12 3Z" /><path d="m8.8 12 2.1 2.1 4.4-4.5" /></svg>
          <span><strong>Authenticity first.</strong> Every order is sourced through trusted channels.</span>
        </div>
        <div className="scroll-cue"><span>SCROLL TO EXPLORE</span><i /></div>
      </div>
    </section>
  );
}

/* PREMIUM CULTURE TICKER
   Two identical groups create a seamless loop while the duplicate stays hidden from assistive technology. */
export function CultureTicker() {
  const messages = ['AUTHENTIC SNEAKERS', 'GLOBAL DROPS', 'PRE ORDER AVAILABLE', 'KICKZ.LK'];
  const renderGroup = (hidden = false) => (
    <div className="culture-ticker__group" aria-hidden={hidden || undefined}>
      {messages.map((message) => <span key={message}>{message}<i aria-hidden="true">★</i></span>)}
    </div>
  );

  return (
    <section className="culture-ticker" aria-label="Authentic sneakers, global drops, pre order available, KICKZ.LK">
      <div className="culture-ticker__track">{renderGroup()}{renderGroup(true)}</div>
    </section>
  );
}

export function FeaturedDrops({ showToast }) {
  const [filter, setFilter] = useState('all');
  const filters = [['all', 'ALL DROPS'], ['jordan', 'JORDAN'], ['nike', 'NIKE'], ['adidas', 'ADIDAS'], ['luxury', 'LUXURY']];
  return (
    <section className="drops section-pad snap-section" id="drops">
      <div className="container">
        <div className="section-head reveal"><div><span className="section-kicker">CURATED RELEASES</span><h2>FEATURED DROPS</h2></div><p>High-demand silhouettes and luxury pairs selected for the Sri Lankan market.</p></div>
        <div className="filter-row reveal delay-80" role="group" aria-label="Filter products">
          {filters.map(([value, label]) => <button className={`filter-btn${filter === value ? ' active' : ''}`} data-filter={value} key={value} onClick={() => setFilter(value)}>{label}</button>)}
        </div>
        <div className="product-grid">
          {products.map((product) => <ProductCard product={product} key={product.code} hidden={filter !== 'all' && filter !== product.category} onSaved={(saved) => showToast(saved ? 'Added to your saved list.' : 'Removed from your saved list.')} />)}
        </div>
        <div className="center-action reveal"><a href="/new-drops" className="text-link">VIEW ALL SNEAKERS <span>↗</span></a></div>
      </div>
    </section>
  );
}

export function EditorialSection() {
  return (
    <section className="editorial section-pad snap-section"><div className="container editorial-card reveal">
      <div className="editorial-card__copy"><span className="section-kicker">THE PRE-ORDER EDIT</span><h2>YOUR SIZE.<br />YOUR PAIR.<br /><em>NO COMPROMISE.</em></h2><p>Access rare colorways, exclusive releases and hard-to-find sizing without settling for what is locally available.</p><a href="/pre-order" className="btn btn--light">HOW PRE-ORDERS WORK <span>→</span></a></div>
      <div className="editorial-card__visual"><span className="editorial-number">02</span><img src={productDunk} alt="Premium sneaker floating in editorial layout" loading="lazy" /><div className="editorial-note">CURATED FOR<br />SRI LANKA</div></div>
    </div></section>
  );
}

export function BrandsSection() {
  const brands = [['NIKE', '01', 0], ['JORDAN', '02', 50], ['ADIDAS', '03', 100], ['NEW BALANCE', '04', 150], ['BALMAIN', '05', 0], ['LOUBOUTIN', '06', 50]];
  return (
    <section className="brands section-pad snap-section" id="brands"><div className="container">
      <div className="section-head reveal"><div><span className="section-kicker">GLOBAL LABELS</span><h2>SHOP BY BRAND</h2></div><p>From iconic sportswear to statement luxury, sourced to match your rotation.</p></div>
      <div className="brand-grid">{brands.map(([brand, number, delay]) => <a href="/new-drops" className={`brand-tile reveal${delay ? ` delay-${delay}` : ''}`} key={brand}><span>{brand}</span><small>{number}</small></a>)}</div>
    </div></section>
  );
}

export function WhySection() {
  const benefits = [
    ['01', '100% Authentic', 'Every pair is sourced from verified retailers and trusted global partners.', 0],
    ['02', 'Islandwide Delivery', 'Secure tracked delivery to your doorstep anywhere in Sri Lanka.', 80],
    ['03', 'Easy Pre-Orders', 'Reserve with a deposit and pay the balance before final delivery.', 160],
    ['04', 'Human Support', 'Real guidance through WhatsApp—from sizing to order updates.', 240],
  ];
  return (
    <section className="why section-pad snap-section" id="why"><div className="container why-grid">
      <div className="why-intro reveal"><span className="section-kicker">THE KICKZ STANDARD</span><h2>HYPE WITHOUT<br />THE UNCERTAINTY.</h2><p>Designed around trust, clarity and access—because buying your next grail should feel exciting, not risky.</p><div className="micro-stat"><strong>1,000+</strong><span>Pairs sourced for the community</span></div></div>
      <div className="benefit-grid">{benefits.map(([number, title, copy, delay]) => <article className={`benefit-card reveal${delay ? ` delay-${delay}` : ''}`} key={number}><div className="benefit-card__icon">{number}</div><h3>{title}</h3><p>{copy}</p></article>)}</div>
    </div></section>
  );
}

export function PreorderSection() {
  const steps = [['01', 'Select Your Pair', 'Choose the style, colorway and size you want.'], ['02', 'Pay the Deposit', 'Secure your order with the displayed deposit.'], ['03', 'We Import It', 'We source, verify and arrange international shipping.'], ['04', 'Delivered to You', 'Pay the balance and receive it islandwide.']];
  return (
    <section className="preorder section-pad snap-section" id="preorder"><div className="container">
      <div className="section-head section-head--center reveal"><div><span className="section-kicker">SIMPLE. CLEAR. SECURE.</span><h2>HOW PRE-ORDER WORKS</h2></div><p>Four simple steps between you and your next pair.</p></div>
      <div className="process-line reveal delay-100">{steps.map(([number, title, copy]) => <article className="process-step" key={number}><span>{number}</span><div><h3>{title}</h3><p>{copy}</p></div></article>)}</div>
      <div className="preorder-note reveal"><span>AVERAGE TIMELINE</span><strong>14–28 DAYS</strong><p>Exact delivery estimates are shown on each product page.</p></div>
    </div></section>
  );
}

export function ReviewsSection() {
  const reviews = [
    ['“The whole process felt premium—from sizing advice to regular order updates. The pair arrived perfect.”', 'AK', 'Akila K.', 'Air Jordan 1 · Colombo', 0],
    ['“Finally a sneaker page that explains deposits and delivery clearly. Authentic pair and great packaging.”', 'SN', 'Shenali N.', 'New Balance 9060 · Kandy', 80],
    ['“Found my exact size when nobody else had it locally. WhatsApp support was fast and genuinely helpful.”', 'RM', 'Raveen M.', 'Nike Dunk Low · Galle', 160],
  ];
  return (
    <section className="reviews section-pad snap-section"><div className="container">
      <div className="section-head reveal"><div><span className="section-kicker">COMMUNITY VERIFIED</span><h2>TRUSTED BY THE ROTATION</h2></div><div className="rating-summary"><strong>4.9</strong><span>★★★★★<small>Based on verified orders</small></span></div></div>
      <div className="review-grid">{reviews.map(([quote, initials, name, product, delay]) => <article className={`review-card reveal${delay ? ` delay-${delay}` : ''}`} key={name}><div className="review-card__top"><span>★★★★★</span><small>VERIFIED BUYER</small></div><blockquote>{quote}</blockquote><div className="review-person"><b>{initials}</b><span><strong>{name}</strong><small>{product}</small></span></div></article>)}</div>
    </div></section>
  );
}

export function SocialSection() {
  return (
    <section className="social section-pad snap-section" id="social"><div className="container social-grid">
      <div className="social-copy reveal"><span className="section-kicker">@KICKZ.LK</span><h2>FOLLOW THE<br /><em>CULTURE.</em></h2><p>Drop alerts, unboxings, styling inspiration and community fits—daily on Instagram and TikTok.</p><div className="social-actions"><a href="#" className="btn btn--acid">INSTAGRAM <span>↗</span></a><a href="#" className="btn btn--ghost">TIKTOK <span>↗</span></a></div></div>
      <div className="social-wall reveal delay-120"><div className="social-tile social-tile--one"><img src={productJordan} alt="Sneaker community post" loading="lazy" /><span>12.4K</span></div><div className="social-tile social-tile--two"><span className="social-quote">“WEAR<br />THE HYPE.”</span><small>KICKZ.LK</small></div><div className="social-tile social-tile--three"><img src={productLuxury} alt="Luxury sneaker social post" loading="lazy" /><span>8.7K</span></div><div className="social-tile social-tile--four"><img src={productNewBalance} alt="New Balance sneaker social post" loading="lazy" /><span>9.1K</span></div></div>
    </div></section>
  );
}

export function NewsletterSection({ showToast }) {
  const handleSubmit = (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const input = form.elements.email;
    if (input.value.trim()) {
      showToast('You are now on the private drop list.');
      form.reset();
    }
  };
  return (
    <section className="newsletter section-pad snap-section"><div className="container newsletter-card reveal">
      <div><span className="section-kicker">PRIVATE DROP LIST</span><h2>GET THE DROP<br />BEFORE IT DROPS.</h2></div>
      <form className="newsletter-form" onSubmit={handleSubmit}><label htmlFor="email">Email address</label><div><input type="email" id="email" name="email" placeholder="you@email.com" required /><button type="submit" aria-label="Join newsletter">→</button></div><small>No spam. Only new arrivals, price updates and limited releases.</small></form>
    </div></section>
  );
}
