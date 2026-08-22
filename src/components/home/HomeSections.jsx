import { useEffect, useRef, useState } from 'react';
import {
  heroJordanCinematic,
  productDunk,
  productJordan,
  productLuxury,
  productNewBalance,
} from '../../assets';
import { useProducts } from '../../hooks/useProducts';
import { resolveApiAssetUrl, settingsApi } from '../../services/api';
import ProductCard from '../ProductCard';
import ProductCollectionState from '../ProductCollectionState';
import SocialIconLinks from '../SocialIconLinks';

export function HeroSection() {
  const visualRef = useRef(null);
  const shoeRef = useRef(null);

  const handleMove = (event) => {
    if (!window.matchMedia('(pointer:fine)').matches) return;
    const rect = visualRef.current.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width - 0.5;
    const y = (event.clientY - rect.top) / rect.height - 0.5;
    shoeRef.current.style.animation = 'none';
    shoeRef.current.style.transform = `translate3d(${(x * 12).toFixed(1)}px, ${(y * 9).toFixed(1)}px, 0) scale(1.012)`;
  };
  const handleLeave = () => {
    shoeRef.current.style.transform = '';
    shoeRef.current.style.animation = '';
  };

  return (
    <section className="hero section-pad snap-section">
      <div className="hero-grid container">
        <div className="hero-copy reveal">
          <div className="eyebrow"><span className="pulse" /> CURATED DROPS · SRI LANKA</div>
          <h1 className="hero-title hero-title--desktop">AUTHENTIC<br />SNEAKERS.<br /><span>BUILT FOR THE CULTURE.</span></h1>
          <h1 className="hero-title hero-title--mobile">AUTHENTIC<br />SNEAKERS.<br /><span>BUILT FOR THE CULTURE.</span></h1>
          <p>Imported heat. Verified quality. A premium sourcing experience for Sri Lanka’s sneaker and streetwear community.</p>
          <div className="hero-actions">
            <a href="/shop" className="btn btn--acid">SHOP SNEAKERS <span>↗</span></a>
          </div>
        </div>
        <div className="hero-visual reveal delay-120" ref={visualRef} onMouseMove={handleMove} onMouseLeave={handleLeave}>
          <div className="hero-orbit hero-orbit--one" /><div className="hero-orbit hero-orbit--two" /><div className="hero-glow" />
          <img className="hero-shoe" ref={shoeRef} src={heroJordanCinematic} alt="Premium red and black high-top sneaker in cinematic studio lighting" />
        </div>
        <div className="hero-badges reveal delay-220" aria-label="Trust badges">
          <div><strong>100%</strong><span>Authentic</span></div>
          <div><strong>2–4 WKS</strong><span>Typical import</span></div>
          <div><strong>4.9/5</strong><span>Community rating</span></div>
        </div>
      </div>
      <div className="container hero-footer reveal delay-220">
        <div className="trust-chip">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3 4.5 6v5.5c0 4.6 3.2 8.9 7.5 10.5 4.3-1.6 7.5-5.9 7.5-10.5V6L12 3Z" /><path d="m8.8 12 2.1 2.1 4.4-4.5" /></svg>
          <span><strong>Authenticity first.</strong> Every order is sourced through trusted channels.</span>
        </div>
      </div>
    </section>
  );
}

/* PREMIUM CULTURE TICKER
   Two identical groups create a seamless loop while the duplicate stays hidden from assistive technology. */
export function CultureTicker() {
  const messages = ['AUTHENTIC SNEAKERS', 'GLOBAL DROPS', 'ISLANDWIDE DELIVERY', 'KICKZ.LK'];
  const renderGroup = (hidden = false) => (
    <div className="culture-ticker__group" aria-hidden={hidden || undefined}>
      {messages.map((message) => <span key={message}>{message}<i aria-hidden="true">★</i></span>)}
    </div>
  );

  return (
    <section className="culture-ticker" aria-label="Authentic sneakers, global drops, islandwide delivery, KICKZ.LK">
      <div className="culture-ticker__track">{renderGroup()}{renderGroup(true)}</div>
    </section>
  );
}

export function FeaturedDrops({ showToast }) {
  const [filter, setFilter] = useState('all');
  const { products, loading, error } = useProducts();
  const tags = [...new Map(products.flatMap((product) => product.productTags || []).map((tag) => [tag.toLowerCase(), tag])).entries()];
  const filters = [['all', 'ALL DROPS'], ...tags.slice(0, 6)];
  const featuredProducts = products.filter((product) => filter === 'all' || product.productTags?.some((tag) => tag.toLowerCase() === filter)).slice(0, 6);
  return (
    <section className="drops section-pad snap-section" id="drops">
      <div className="container">
        <div className="section-head reveal"><div><span className="section-kicker">CURATED RELEASES</span><h2>FEATURED DROPS</h2></div><div className="section-head__aside"><p>High-demand silhouettes and luxury pairs selected for the Sri Lankan market.</p><a href="/shop">SHOP ALL <span>→</span></a></div></div>
        <div className="filter-row reveal delay-80" role="group" aria-label="Filter products">
          {filters.map(([value, label]) => <button className={`filter-btn${filter === value ? ' active' : ''}`} data-filter={value} key={value} onClick={() => setFilter(value)}>{label}</button>)}
        </div>
        <ProductCollectionState loading={loading} error={error} empty={!loading && !error && featuredProducts.length === 0} />
        <div className="product-grid">
          {featuredProducts.map((product) => <ProductCard product={product} key={product.id} onSaved={(saved) => showToast(saved ? 'Added to your saved list.' : 'Removed from your saved list.')} />)}
        </div>
        <div className="center-action reveal"><a href="/shop" className="btn btn--ghost">VIEW ALL SNEAKERS <span>↗</span></a></div>
      </div>
    </section>
  );
}

export function WhySection() {
  const benefits = [
    ['01', '100% Authentic', 'Every pair is sourced from verified retailers and trusted global partners.', 0],
    ['02', 'Islandwide Delivery', 'Secure tracked delivery to your doorstep anywhere in Sri Lanka.', 80],
    ['03', 'Flexible Sourcing', 'Secure imported pairs with clear payment and delivery milestones.', 160],
    ['04', 'Human Support', 'Real guidance through WhatsApp—from sizing to order updates.', 240],
  ];
  return (
    <section className="why section-pad snap-section" id="why"><div className="container why-grid">
      <div className="why-intro reveal"><span className="section-kicker">THE KICKZ STANDARD</span><h2>HYPE WITHOUT<br />THE UNCERTAINTY.</h2><p>Designed around trust, clarity and access—because buying your next grail should feel exciting, not risky.</p><div className="micro-stat"><strong>1,000+</strong><span>Pairs sourced for the community</span></div></div>
      <div className="benefit-grid">{benefits.map(([number, title, copy, delay]) => <article className={`benefit-card reveal${delay ? ` delay-${delay}` : ''}`} key={number}><div className="benefit-card__icon">{number}</div><h3>{title}</h3><p>{copy}</p></article>)}</div>
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
      <div className="social-copy reveal"><span className="section-kicker">@KICKZ.LK</span><h2>FOLLOW THE<br /><em>CULTURE.</em></h2><p>Drop alerts, unboxings, styling inspiration and community fits across the official KICKZ.LK channels.</p><SocialIconLinks className="social-actions" /></div>
      <div className="social-wall reveal delay-120"><div className="social-tile social-tile--one"><img src={productJordan} alt="Sneaker community post" loading="lazy" /><span>12.4K</span></div><div className="social-tile social-tile--two"><span className="social-quote">“WEAR<br />THE HYPE.”</span><small>KICKZ.LK</small></div><div className="social-tile social-tile--three"><img src={productLuxury} alt="Luxury sneaker social post" loading="lazy" /><span>8.7K</span></div><div className="social-tile social-tile--four"><img src={productNewBalance} alt="New Balance sneaker social post" loading="lazy" /><span>9.1K</span></div></div>
    </div></section>
  );
}

export function MediaSection() {
  const trackRef = useRef(null);
  const fallback = [
    { id: 'fallback-1', type: 'image', url: productJordan, title: 'Air Jordan unboxing' },
    { id: 'fallback-2', type: 'image', url: productDunk, title: 'Fresh arrival details' },
    { id: 'fallback-3', type: 'image', url: productLuxury, title: 'Luxury rotation' },
    { id: 'fallback-4', type: 'image', url: productNewBalance, title: 'Community selection' },
  ];
  const [items, setItems] = useState(fallback);
  useEffect(() => { let active = true; settingsApi.homepageMedia().then((value) => { if (active && value.items?.length) setItems(value.items); }).catch(() => undefined); return () => { active = false; }; }, []);
  return <section className="home-media section-pad snap-section"><div className="container"><div className="section-head reveal"><div><span className="section-kicker">KICKZ.LK MEDIA</span><h2>GET THE DROP.<br />BEFORE IT DROPS.</h2></div><div className="carousel-controls"><button type="button" aria-label="Previous media" onClick={() => trackRef.current?.scrollBy({ left: -trackRef.current.clientWidth * .8, behavior: 'smooth' })}>←</button><button type="button" aria-label="Next media" onClick={() => trackRef.current?.scrollBy({ left: trackRef.current.clientWidth * .8, behavior: 'smooth' })}>→</button></div></div><div className="media-carousel reveal" ref={trackRef}>{items.map((item) => <article className="media-card" key={item.id}><div>{item.type === 'video' ? <video src={resolveApiAssetUrl(item.url)} controls playsInline preload="metadata" /> : <img src={resolveApiAssetUrl(item.url)} alt={item.title || 'KICKZ.LK media'} loading="lazy" />}{item.type === 'video' && <span className="media-card__play" aria-hidden="true">▶</span>}<small>{item.type === 'video' ? 'WATCH' : 'VIEW'} ↗</small></div><h3>{item.title || 'Inside the KICKZ.LK rotation'}</h3></article>)}</div></div></section>;
}

export function TrustpilotSection() {
  const widgetRef = useRef(null);
  useEffect(() => {
    const loadWidget = () => window.Trustpilot?.loadFromElement(widgetRef.current, true);
    const existing = document.querySelector('script[data-kickz-trustpilot]');
    if (existing) { if (window.Trustpilot) loadWidget(); else existing.addEventListener('load', loadWidget, { once: true }); return undefined; }
    const script = document.createElement('script'); script.type = 'text/javascript'; script.src = '//widget.trustpilot.com/bootstrap/v5/tp.widget.bootstrap.min.js'; script.async = true; script.dataset.kickzTrustpilot = 'true'; script.addEventListener('load', loadWidget, { once: true }); document.head.appendChild(script);
    return undefined;
  }, []);
  return <section className="trustpilot-section"><div className="container"><div ref={widgetRef} className="trustpilot-widget" data-locale="en-US" data-template-id="56278e9abfbbba0bdcd568bc" data-businessunit-id="6a736c6391612fc362076337" data-style-height="52px" data-style-width="100%" data-token="83f3a49b-1130-474b-8973-d4fd01eee126"><a href="https://www.trustpilot.com/review/kickz.lk" target="_blank" rel="noopener">Trustpilot</a></div></div></section>;
}
