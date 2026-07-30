import PageHero from '../components/PageHero';
import PageShell from '../components/PageShell';
import { EditorialSection, PreorderSection } from '../components/home/HomeSections';
import useReveal from '../hooks/useReveal';

export default function PreOrderPage() {
  useReveal();

  return (
    <PageShell>
      {/* Sprint 3A Page Structure: pre-order education moved out of the homepage into its own journey. */}
      <PageHero
        kicker="SIMPLE. CLEAR. SECURE."
        title="PRE-ORDER"
        copy="A premium, transparent import flow for rare sneakers and hard-to-find sizing."
      />
      <EditorialSection />
      <PreorderSection />
    </PageShell>
  );
}
