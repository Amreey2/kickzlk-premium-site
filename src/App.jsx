import HomePage from './pages/HomePage';
import AboutPage from './pages/AboutPage';
import BrandsPage from './pages/BrandsPage';
import CommunityPage from './pages/CommunityPage';
import NewDropsPage from './pages/NewDropsPage';
import PreOrderPage from './pages/PreOrderPage';
import ProductPage from './pages/ProductPage';

const routes = {
  '/': HomePage,
  '/index.html': HomePage,
  '/new-drops': NewDropsPage,
  '/brands': BrandsPage,
  '/pre-order': PreOrderPage,
  '/about-us': AboutPage,
  '/community': CommunityPage,
};

export default function App() {
  if (window.location.pathname.endsWith('/product.html')) return <ProductPage />;

  const Page = routes[window.location.pathname] || HomePage;
  return <Page />;
}
