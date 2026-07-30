import AnnouncementBar from '../components/AnnouncementBar';
import Footer from '../components/Footer';
import Header from '../components/Header';
import Toast from '../components/Toast';
import {
  BrandsSection,
  CultureTicker,
  FeaturedDrops,
  HeroSection,
  NewsletterSection,
} from '../components/home/HomeSections';
import useReveal from '../hooks/useReveal';
import useToast from '../hooks/useToast';

export default function HomePage() {
  useReveal();
  const toast = useToast('Added to your saved list.');

  return (
    <>
      <div className="noise" aria-hidden="true" />
      <AnnouncementBar />
      <Header />
      <main className="home-main">
        <HeroSection />
        <CultureTicker />
        <FeaturedDrops showToast={toast.showToast} />
        <BrandsSection />
        <NewsletterSection showToast={toast.showToast} />
      </main>
      <button className="scroll-top-btn" type="button" aria-label="Scroll to top" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="m6 14 6-6 6 6" />
          <path d="M12 8v12" />
        </svg>
      </button>
      <Footer />
      <Toast message={toast.message} visible={toast.visible} />
    </>
  );
}
