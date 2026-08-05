import { useState } from 'react';
import Footer from '../components/Footer';
import FloatingActions from '../components/FloatingActions';
import Header from '../components/Header';
import PageHero from '../components/PageHero';
import PageShell from '../components/PageShell';
import Toast from '../components/Toast';
import { MobileBuyBar, ProductDetails, ProductGallery, ProductInfo, Recommendations } from '../components/product/ProductSections';
import { useProduct, useProducts } from '../hooks/useProducts';
import useReveal from '../hooks/useReveal';
import useToast from '../hooks/useToast';

export default function ProductPage({ productId = 'air-jordan-1-retro-high-og' }) {
  useReveal();
  const { product, loading, error } = useProduct(productId);
  const catalog = useProducts();
  const toast = useToast('Please select a size.');
  const [selectedSize, setSelectedSize] = useState('');
  const [payment, setPayment] = useState('deposit');
  const [bagCount, setBagCount] = useState(0);

  const addToBag = () => {
    if (!product) return;
    if (!selectedSize) {
      toast.showToast('Please select your size first.', 2300);
      return;
    }
    setBagCount(1);
    const sizePrefix = product.brand === 'Balmain' ? 'EU' : 'US';
    toast.showToast(`${sizePrefix} ${selectedSize} added to your enquiry bag.`, 2300);
  };

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

  return (
    <>
      <div className="noise" aria-hidden="true" />
      <Header bagCount={bagCount} />
      <main className="product-main"><div className="container">
        <div className="breadcrumbs"><a href="/index.html">HOME</a><span>/</span><a href="/shop">SHOP</a><span>/</span><span>{product.name.toUpperCase()}</span></div>
        <div className="product-layout">
          <ProductGallery product={product} />
          <ProductInfo product={product} selectedSize={selectedSize} setSelectedSize={setSelectedSize} payment={payment} setPayment={setPayment} addToBag={addToBag} />
        </div>
      </div></main>
      <ProductDetails product={product} />
      <Recommendations productId={product.id} products={catalog.products} loading={catalog.loading} error={catalog.error} />
      <Footer />
      <FloatingActions aboveMobileBuyBar />
      <MobileBuyBar product={product} selectedSize={selectedSize} addToBag={addToBag} />
      <Toast message={toast.message} visible={toast.visible} />
    </>
  );
}
