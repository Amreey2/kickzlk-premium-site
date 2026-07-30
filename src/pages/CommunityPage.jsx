import PageHero from '../components/PageHero';
import PageShell from '../components/PageShell';
import { ReviewsSection, SocialSection } from '../components/home/HomeSections';
import useReveal from '../hooks/useReveal';

export default function CommunityPage() {
  useReveal();

  return (
    <PageShell>
      {/* Sprint 3A Page Structure: community proof and social culture now share a dedicated page. */}
      <PageHero
        kicker="@KICKZ.LK"
        title="COMMUNITY"
        copy="Verified orders, drop alerts, unboxings and styling inspiration from the KICKZ.LK rotation."
      />
      <ReviewsSection />
      <SocialSection />
    </PageShell>
  );
}
