import PageHero from '../components/PageHero';
import PageShell from '../components/PageShell';
import ShopCatalog from '../components/shop/ShopCatalog';
import Toast from '../components/Toast';
import useReveal from '../hooks/useReveal';
import useToast from '../hooks/useToast';

export default function ShopPage({ initialView = 'all' }) {
  useReveal();
  const toast = useToast('Added to your saved list.');

  const handleSaved = (product, saved) => {
    toast.showToast(saved ? `${product.name} added to your saved list.` : `${product.name} removed from your saved list.`);
  };

  return (
    <PageShell>
      {/* SPRINT 3.1 SHOP FOUNDATION: shared entry point for every local catalog view. */}
      <PageHero
        kicker="CURATED FOR SRI LANKA"
        title="SHOP"
        copy="Explore authentic new drops and global pairs selected for the KICKZ.LK rotation."
      />
      <ShopCatalog initialView={initialView} onSaved={handleSaved} />
      <Toast message={toast.message} visible={toast.visible} />
    </PageShell>
  );
}
