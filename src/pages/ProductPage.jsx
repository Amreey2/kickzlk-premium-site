import { useState } from 'react';
import AnnouncementBar from '../components/AnnouncementBar';
import Footer from '../components/Footer';
import Header from '../components/Header';
import Toast from '../components/Toast';
import { MobileBuyBar, ProductDetails, ProductGallery, ProductInfo, Recommendations } from '../components/product/ProductSections';
import useReveal from '../hooks/useReveal';
import useToast from '../hooks/useToast';

export default function ProductPage() {
  useReveal();
  const toast = useToast('Please select a size.');
  const [selectedSize, setSelectedSize] = useState('');
  const [payment, setPayment] = useState('deposit');
  const [bagCount, setBagCount] = useState(0);

  const addToBag = () => {
    if (!selectedSize) {
      toast.showToast('Please select your size first.', 2300);
      return;
    }
    setBagCount(1);
    toast.showToast(`US ${selectedSize} reserved in your pre-order bag.`, 2300);
  };

  return (
    <>
      <div className="noise" aria-hidden="true" />
      <AnnouncementBar />
      <Header productPage bagCount={bagCount} />
      <main className="product-main"><div className="container">
        <div className="breadcrumbs"><a href="index.html">HOME</a><span>/</span><a href="/new-drops">JORDAN</a><span>/</span><span>AIR JORDAN 1 RETRO HIGH OG</span></div>
        <div className="product-layout">
          <ProductGallery />
          <ProductInfo selectedSize={selectedSize} setSelectedSize={setSelectedSize} payment={payment} setPayment={setPayment} addToBag={addToBag} />
        </div>
      </div></main>
      <ProductDetails />
      <Recommendations />
      <Footer productPage />
      <MobileBuyBar selectedSize={selectedSize} addToBag={addToBag} />
      <Toast message={toast.message} visible={toast.visible} />
    </>
  );
}
