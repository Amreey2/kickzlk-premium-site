import Footer from '../components/Footer';
import FloatingActions from '../components/FloatingActions';
import Header from '../components/Header';
import Toast from '../components/Toast';
import {
  BrandsSection,
  CultureTicker,
  FeaturedDrops,
  HeroSection,
  MediaSection,
  TrustpilotSection,
} from '../components/home/HomeSections';
import useReveal from '../hooks/useReveal';
import useToast from '../hooks/useToast';

export default function HomePage() {
  useReveal();
  const toast = useToast('Added to your saved list.');

  return (
    <>
      <div className="noise" aria-hidden="true" />
      <Header />
      <main className="home-main">
        <HeroSection />
        <CultureTicker />
        <FeaturedDrops showToast={toast.showToast} />
        <BrandsSection />
        <MediaSection />
        <TrustpilotSection />
      </main>
      <FloatingActions />
      <Footer />
      <Toast message={toast.message} visible={toast.visible} />
    </>
  );
}
