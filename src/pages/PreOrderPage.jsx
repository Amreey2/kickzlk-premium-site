import PageHero from '../components/PageHero';
import PageShell from '../components/PageShell';
import ShopCatalog from '../components/shop/ShopCatalog';
import Toast from '../components/Toast';
import useReveal from '../hooks/useReveal';
import useToast from '../hooks/useToast';

export default function PreOrderPage() {
  useReveal();
  const toast = useToast('Added to your saved list.');

  return (
    <PageShell>
      {/* Sprint 3A Page Structure: pre-order education moved out of the homepage into its own journey. */}
      <PageHero
        kicker="SIMPLE. CLEAR. SECURE."
        title="PRE-ORDER"
        copy="A premium, transparent import flow for rare sneakers and hard-to-find sizing."
      />
      <ShopCatalog initialView="preorder" onSaved={(product, saved) => toast.showToast(saved ? `${product.name} saved.` : `${product.name} removed.`)} />
      <Toast message={toast.message} visible={toast.visible} />
    </PageShell>
  );
}
