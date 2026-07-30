import PageHero from '../components/PageHero';
import PageShell from '../components/PageShell';
import { PreorderSection, ReviewsSection, SocialSection, WhySection } from '../components/home/HomeSections';
import useReveal from '../hooks/useReveal';

export default function AboutPage() {
  useReveal();

  return (
    <PageShell>
      {/* SPRINT 3.1 ABOUT FOUNDATION: trust, authenticity, pre-order education and community now live together. */}
      <PageHero
        kicker="THE KICKZ STANDARD"
        title="ABOUT KICKZ.LK"
        copy="Premium authentic sneakers, imported for Sri Lanka's culture with clarity, sourcing discipline and human support."
      />
      <WhySection />
      <PreorderSection />
      <ReviewsSection />
      <SocialSection />
    </PageShell>
  );
}
