import PageHero from '../components/PageHero';
import PageShell from '../components/PageShell';
import { BrandsSection } from '../components/home/HomeSections';
import useReveal from '../hooks/useReveal';

export default function BrandsPage() {
  useReveal();

  return (
    <PageShell>
      {/* Sprint 3A Page Structure: brand browsing now has its own route while reusing approved tiles. */}
      <PageHero
        kicker="GLOBAL LABELS"
        title="BRANDS"
        copy="From iconic sportswear to statement luxury, sourced to match your rotation."
      />
      <BrandsSection />
    </PageShell>
  );
}
