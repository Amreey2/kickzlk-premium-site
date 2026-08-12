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
      <PageHero
        kicker="LATEST ADDITIONS"
        title="NEW DROPS"
        copy="The newest products added to KICKZ.LK, automatically ordered from latest to earliest."
      />
      <ShopCatalog initialView="new" onSaved={(product, saved) => toast.showToast(saved ? `${product.name} saved.` : `${product.name} removed.`)} />
      <Toast message={toast.message} visible={toast.visible} />
    </PageShell>
  );
}
