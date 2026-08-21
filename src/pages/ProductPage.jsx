import { useEffect, useState } from 'react';
import Footer from '../components/Footer';
import FloatingActions from '../components/FloatingActions';
import Header from '../components/Header';
import { MediaSection, TrustpilotSection } from '../components/home/HomeSections';
import PageHero from '../components/PageHero';
import PageShell from '../components/PageShell';
import Toast from '../components/Toast';
import Seo from '../components/Seo';
import { MobileBuyBar, ProductDetails, ProductGallery, ProductHeading, ProductInfo, Recommendations, SizeGuideModal } from '../components/product/ProductSections';
import { useProduct, useProducts } from '../hooks/useProducts';
import useReveal from '../hooks/useReveal';
import useToast from '../hooks/useToast';
import { authApi, ordersApi, resolveApiAssetUrl, settingsApi } from '../services/api';
import { addCartItem, cartCount, readCart } from '../utils/cart';
import { PAYMENT_OPTIONS, writePaymentOption } from '../utils/paymentOption';
import { productSeo } from '../utils/seo';

export default function ProductPage({ productId = 'air-jordan-1-retro-high-og' }) {
  useReveal();
  const { product, loading, error } = useProduct(productId);
  const catalog = useProducts();
  const toast = useToast('Please select a size.');
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [payment, setPayment] = useState(PAYMENT_OPTIONS.ADVANCE);
  const [paymentQuote, setPaymentQuote] = useState(null);
  const [bagCount, setBagCount] = useState(0);
  const [cartHref, setCartHref] = useState('/cart');
  const [addedToCart, setAddedToCart] = useState(false);
  const [sizeGuide, setSizeGuide] = useState(null);
  const [sizeGuideOpen, setSizeGuideOpen] = useState(false);

  useEffect(() => {
    settingsApi.sizeGuide().then((guide) => setSizeGuide({ ...guide, imageUrl: resolveApiAssetUrl(guide.imageUrl) })).catch(() => setSizeGuide(null));
  }, []);

  const effectiveSize = selectedSize || (product?.sizes?.length === 1 ? product.sizes[0] : '');

  useEffect(() => {
    if (!product || !effectiveSize) return undefined;
    let active = true;
    ordersApi.quote({ items: [{ productId: product.id, selectedSize: effectiveSize, selectedColor: selectedColor || product.colorVariations?.[0] || '', quantity: 1 }], paymentOption: payment })
      .then((quote) => { if (active) setPaymentQuote(quote); }).catch(() => { if (active) setPaymentQuote(null); });
    return () => { active = false; };
  }, [effectiveSize, payment, product, selectedColor]);

  const purchase = async (buyImmediately) => {
    if (!product) return;
    if (!effectiveSize) {
      toast.showToast('Please select your size first.', 2300);
      return;
    }
    const color = selectedColor || product.colorVariations?.[0] || '';
    writePaymentOption(payment);
    const query = new URLSearchParams({ product: product.id, size: effectiveSize, quantity: '1', paymentOption: payment, ...(color ? { color } : {}) });
    if (!buyImmediately) {
      const currentCart = readCart();
      const currentLine = currentCart.find((item) => item.productId === product.id && item.selectedSize === effectiveSize && item.selectedColor === color);
      if (currentLine?.quantity >= 10) {
        toast.showToast('A maximum of 10 units can be ordered per selection.', 2300);
        return;
      }
      const maximum = product.preOrder ? 10 : Number(product.stock);
      const currentQuantity = currentCart.filter((item) => item.productId === product.id).reduce((total, item) => total + item.quantity, 0);
      if (currentQuantity >= maximum) {
        toast.showToast(`Only ${maximum} item${maximum === 1 ? '' : 's'} available for this product.`, 2300);
        return;
      }
      setBagCount(cartCount(addCartItem({ productId: product.id, selectedSize: effectiveSize, selectedColor: color, quantity: 1 })));
    }
    setCartHref('/cart');
    if (buyImmediately) {
      const checkoutHref = `/checkout?${query}`;
      const session = await authApi.session();
      window.location.assign(session.authenticated ? checkoutHref : `/checkout/start?next=${encodeURIComponent(checkoutHref)}`);
    } else {
      setAddedToCart(true);
      toast.showToast(`Added to Cart · ${effectiveSize}${color ? ` · ${color}` : ''}`, 1800);
    }
  };
  const addToBag = () => purchase(false);
  const buyNow = () => purchase(true);

  if (loading) {
    return (
      <PageShell>
        <Seo title="Loading Product | KICKZ.LK" description="Loading KICKZ.LK product details." canonicalPath={`/product/${productId}`} noIndex />
        <PageHero kicker="KICKZ.LK CATALOG" title="LOADING PAIR" copy="Retrieving the latest product details from KICKZ.LK." />
      </PageShell>
    );
  }

  if (error || !product) {
    const notFound = error?.status === 404;
    return (
      <PageShell>
        <Seo title={notFound ? 'Product Not Found | KICKZ.LK' : 'Catalogue Unavailable | KICKZ.LK'} description={notFound ? 'This KICKZ.LK product could not be found.' : 'KICKZ.LK product details are temporarily unavailable.'} canonicalPath={`/product/${productId}`} noIndex />
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
  const seo = productSeo(product);

  return (
    <>
      <Seo {...seo} />
      <div className="noise" aria-hidden="true" />
      <Header bagCount={bagCount} cartHref={cartHref} />
      <main className="product-main"><div className="container">
        <div className="breadcrumbs"><a href="/index.html">HOME</a><span>/</span><a href="/shop">SHOP</a><span>/</span><span>{product.name.toUpperCase()}</span></div>
        <div className="product-layout">
          <ProductHeading product={product} mobile />
          <ProductGallery key={activeColor || 'legacy-gallery'} product={product} selectedColor={activeColor} />
          <ProductInfo product={product} selectedSize={effectiveSize} setSelectedSize={(size) => { setSelectedSize(size); setAddedToCart(false); }} selectedColor={activeColor} setSelectedColor={(color) => { setSelectedColor(color); setAddedToCart(false); }} payment={payment} setPayment={setPayment} paymentQuote={paymentQuote} addToBag={addToBag} buyNow={buyNow} openSizeGuide={() => setSizeGuideOpen(true)} />
        </div>
      </div></main>
      <ProductDetails product={product} />
      <Recommendations product={product} products={catalog.products} loading={catalog.loading} error={catalog.error} />
      <MediaSection />
      <TrustpilotSection />
      <Footer />
      <FloatingActions aboveMobileBuyBar />
      <MobileBuyBar product={product} selectedSize={effectiveSize} addToBag={addToBag} buyNow={buyNow} addedToCart={addedToCart} />
      <SizeGuideModal guide={sizeGuide} open={sizeGuideOpen} onClose={() => setSizeGuideOpen(false)} />
      <Toast message={toast.message} visible={toast.visible} />
    </>
  );
}
