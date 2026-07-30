import PageHero from '../components/PageHero';
import PageShell from '../components/PageShell';
import ShopCatalog from '../components/shop/ShopCatalog';
import Toast from '../components/Toast';
import useReveal from '../hooks/useReveal';
import useToast from '../hooks/useToast';

export default function BrandsPage() {
  useReveal();
  const toast = useToast('Added to your saved list.');

  return (
    <PageShell>
      {/* Sprint 3A Page Structure: brand browsing now has its own route while reusing approved tiles. */}
      <PageHero
        kicker="GLOBAL LABELS"
        title="BRANDS"
        copy="From iconic sportswear to statement luxury, sourced to match your rotation."
      />
      <ShopCatalog initialView="brands" onSaved={(product, saved) => toast.showToast(saved ? `${product.name} saved.` : `${product.name} removed.`)} />
      <Toast message={toast.message} visible={toast.visible} />
    </PageShell>
  );
}
