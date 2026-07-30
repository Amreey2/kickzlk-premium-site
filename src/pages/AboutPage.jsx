import PageHero from '../components/PageHero';
import PageShell from '../components/PageShell';
import { WhySection } from '../components/home/HomeSections';
import useReveal from '../hooks/useReveal';

export default function AboutPage() {
  useReveal();

  return (
    <PageShell>
      {/* Sprint 3A Page Structure: the KICKZ trust story now lives on the About Us page. */}
      <PageHero
        kicker="THE KICKZ STANDARD"
        title="ABOUT KICKZ.LK"
        copy="Premium authentic sneakers, imported for Sri Lanka's culture with clarity, sourcing discipline and human support."
      />
      <WhySection />
    </PageShell>
  );
}
