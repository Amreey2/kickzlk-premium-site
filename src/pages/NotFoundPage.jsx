import PageHero from '../components/PageHero';
import PageShell from '../components/PageShell';
import Seo from '../components/Seo';

export default function NotFoundPage() {
  return <PageShell>
    <Seo title="Page Not Found | KICKZ.LK" description="The requested KICKZ.LK page could not be found." canonicalPath={window.location.pathname} noIndex />
    <PageHero kicker="404" title="PAGE NOT FOUND" copy="This page is no longer available or the address may be incorrect." />
    <section className="empty-state section-pad"><div className="container"><a className="btn btn--acid" href="/shop">RETURN TO SHOP <span>→</span></a></div></section>
  </PageShell>;
}
