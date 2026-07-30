import { useState } from 'react';
import AnnouncementBar from '../components/AnnouncementBar';
import Footer from '../components/Footer';
import Header from '../components/Header';
import PageHero from '../components/PageHero';
import PageShell from '../components/PageShell';
import Toast from '../components/Toast';
import { MobileBuyBar, ProductDetails, ProductGallery, ProductInfo, Recommendations } from '../components/product/ProductSections';
import { getProductById } from '../data/products';
import useReveal from '../hooks/useReveal';
import useToast from '../hooks/useToast';

export default function ProductPage({ productId = 'air-jordan-1-retro-high-og' }) {
  useReveal();
  const product = getProductById(productId);
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

  if (!product) {
    return (
      <PageShell>
        <PageHero kicker="KICKZ.LK CATALOG" title="PAIR NOT FOUND" copy="This sneaker is no longer available in the current local catalog." />
        <section className="empty-state section-pad"><div className="container"><a href="/shop" className="btn btn--acid">RETURN TO SHOP <span>→</span></a></div></section>
      </PageShell>
    );
  }

  return (
    <>
      <div className="noise" aria-hidden="true" />
      <AnnouncementBar />
      <Header bagCount={bagCount} />
      <main className="product-main"><div className="container">
        <div className="breadcrumbs"><a href="/index.html">HOME</a><span>/</span><a href="/shop">SHOP</a><span>/</span><span>{product.name.toUpperCase()}</span></div>
        <div className="product-layout">
          <ProductGallery product={product} />
          <ProductInfo product={product} selectedSize={selectedSize} setSelectedSize={setSelectedSize} payment={payment} setPayment={setPayment} addToBag={addToBag} />
        </div>
      </div></main>
      <ProductDetails product={product} />
      <Recommendations productId={product.id} />
      <Footer />
      <MobileBuyBar product={product} selectedSize={selectedSize} addToBag={addToBag} />
      <Toast message={toast.message} visible={toast.visible} />
    </>
  );
}
