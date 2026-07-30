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
      <Footer />
      <Toast message={toast.message} visible={toast.visible} />
    </>
  );
}
