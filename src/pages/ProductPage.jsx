import { useEffect, useState } from 'react';
import Footer from '../components/Footer';
import FloatingActions from '../components/FloatingActions';
import Header from '../components/Header';
import PageHero from '../components/PageHero';
import PageShell from '../components/PageShell';
import Toast from '../components/Toast';
import { MobileBuyBar, ProductDetails, ProductGallery, ProductHeading, ProductInfo, Recommendations, SizeGuideModal } from '../components/product/ProductSections';
import { useProduct, useProducts } from '../hooks/useProducts';
import useReveal from '../hooks/useReveal';
import useToast from '../hooks/useToast';
import { resolveApiAssetUrl, settingsApi } from '../services/api';
import { addCartItem, cartCount } from '../utils/cart';

export default function ProductPage({ productId = 'air-jordan-1-retro-high-og' }) {
  useReveal();
  const { product, loading, error } = useProduct(productId);
  const catalog = useProducts();
  const toast = useToast('Please select a size.');
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [payment, setPayment] = useState('deposit');
  const [bagCount, setBagCount] = useState(0);
  const [cartHref, setCartHref] = useState('/cart');
  const [addedToCart, setAddedToCart] = useState(false);
  const [sizeGuide, setSizeGuide] = useState(null);
  const [sizeGuideOpen, setSizeGuideOpen] = useState(false);

  useEffect(() => {
    settingsApi.sizeGuide().then((guide) => setSizeGuide({ ...guide, imageUrl: resolveApiAssetUrl(guide.imageUrl) })).catch(() => setSizeGuide(null));
  }, []);

  const purchase = (buyImmediately) => {
    if (!product) return;
    if (!selectedSize) {
      toast.showToast('Please select your size first.', 2300);
      return;
    }
    const color = selectedColor || product.colorVariations?.[0] || '';
    const query = new URLSearchParams({ product: product.id, size: selectedSize, quantity: '1', ...(color ? { color } : {}) });
    if (!buyImmediately) setBagCount(cartCount(addCartItem({ productId: product.id, selectedSize, selectedColor: color, quantity: 1 })));
    setCartHref('/cart');
    if (buyImmediately) {
      const checkoutHref = `/checkout?${query}`;
      window.location.assign(`/checkout/start?next=${encodeURIComponent(checkoutHref)}`);
    } else {
      setAddedToCart(true);
      toast.showToast(`Added to Cart · ${selectedSize}${color ? ` · ${color}` : ''}`, 1800);
    }
  };
  const addToBag = () => purchase(false);
  const buyNow = () => purchase(true);

  if (loading) {
    return (
      <PageShell>
        <PageHero kicker="KICKZ.LK CATALOG" title="LOADING PAIR" copy="Retrieving the latest product details from KICKZ.LK." />
      </PageShell>
    );
  }

  if (error || !product) {
    const notFound = error?.status === 404;
    return (
      <PageShell>
        <PageHero
          kicker="KICKZ.LK CATALOG"
          title={notFound ? 'PAIR NOT FOUND' : 'CATALOG UNAVAILABLE'}
          copy={notFound ? 'This sneaker is no longer available in the current catalog.' : 'Product details could not be loaded. Please refresh or try again shortly.'}
        />
        <section className="empty-state section-pad"><div className="container"><a href="/shop" className="btn btn--acid">RETURN TO SHOP <span>→</span></a></div></section>
      </PageShell>
    );
  }

  const activeColor = selectedColor || product.colorVariations?.[0] || '';

  return (
    <>
      <div className="noise" aria-hidden="true" />
      <Header bagCount={bagCount} cartHref={cartHref} />
      <main className="product-main"><div className="container">
        <div className="breadcrumbs"><a href="/index.html">HOME</a><span>/</span><a href="/shop">SHOP</a><span>/</span><span>{product.name.toUpperCase()}</span></div>
        <div className="product-layout">
          <ProductHeading product={product} mobile />
          <ProductGallery key={activeColor || 'legacy-gallery'} product={product} selectedColor={activeColor} />
          <ProductInfo product={product} selectedSize={selectedSize} setSelectedSize={(size) => { setSelectedSize(size); setAddedToCart(false); }} selectedColor={activeColor} setSelectedColor={(color) => { setSelectedColor(color); setAddedToCart(false); }} payment={payment} setPayment={setPayment} addToBag={addToBag} buyNow={buyNow} openSizeGuide={() => setSizeGuideOpen(true)} />
        </div>
      </div></main>
      <ProductDetails product={product} />
      <Recommendations product={product} products={catalog.products} loading={catalog.loading} error={catalog.error} />
      <Footer />
      <FloatingActions aboveMobileBuyBar />
      <MobileBuyBar product={product} selectedSize={selectedSize} addToBag={addToBag} buyNow={buyNow} addedToCart={addedToCart} />
      <SizeGuideModal guide={sizeGuide} open={sizeGuideOpen} onClose={() => setSizeGuideOpen(false)} />
      <Toast message={toast.message} visible={toast.visible} />
    </>
  );
}
