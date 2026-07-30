import PageHero from '../components/PageHero';
import PageShell from '../components/PageShell';
import Toast from '../components/Toast';
import ShopCatalog from '../components/shop/ShopCatalog';
import useReveal from '../hooks/useReveal';
import useToast from '../hooks/useToast';

export default function NewDropsPage() {
  useReveal();
  const toast = useToast('Added to your saved list.');

  return (
    <PageShell>
      {/* Sprint 3A Page Structure: dedicated ecommerce landing page for the approved drops grid. */}
      <PageHero
        kicker="CURATED RELEASES"
        title="NEW DROPS"
        copy="High-demand silhouettes and luxury pairs selected for the Sri Lankan market."
      />
      <ShopCatalog initialView="new" onSaved={(product, saved) => toast.showToast(saved ? `${product.name} saved.` : `${product.name} removed.`)} />
      <Toast message={toast.message} visible={toast.visible} />
    </PageShell>
  );
}
