import PageHero from '../components/PageHero';
import PageShell from '../components/PageShell';
import ShopCatalog from '../components/shop/ShopCatalog';
import Toast from '../components/Toast';
import useReveal from '../hooks/useReveal';
import useToast from '../hooks/useToast';

export default function CategoriesPage() {
  useReveal();
  const toast = useToast('Added to your saved list.');
  return <PageShell>
    <PageHero kicker="LIVE CATALOGUE" title="CATEGORIES" copy="Browse the current KICKZ.LK catalogue by active category." />
    <ShopCatalog initialView="categories" onSaved={(product, saved) => toast.showToast(saved ? `${product.name} saved.` : `${product.name} removed.`)} />
    <Toast message={toast.message} visible={toast.visible} />
  </PageShell>;
}
