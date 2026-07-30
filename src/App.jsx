import HomePage from './pages/HomePage';
import AccountPage from './pages/AccountPage';
import AboutPage from './pages/AboutPage';
import BrandsPage from './pages/BrandsPage';
import CheckoutPage from './pages/CheckoutPage';
import ContactPage from './pages/ContactPage';
import LoginPage from './pages/LoginPage';
import NewDropsPage from './pages/NewDropsPage';
import PreOrderPage from './pages/PreOrderPage';
import ProductPage from './pages/ProductPage';
import RegisterPage from './pages/RegisterPage';
import ShopPage from './pages/ShopPage';

const routes = {
  '/': HomePage,
  '/index.html': HomePage,
  '/shop': ShopPage,
  '/new-drops': NewDropsPage,
  '/brands': BrandsPage,
  '/pre-order': PreOrderPage,
  '/about': AboutPage,
  '/about-us': AboutPage,
  '/community': AboutPage,
  '/contact': ContactPage,
  '/login': LoginPage,
  '/register': RegisterPage,
  '/account': AccountPage,
  '/checkout': CheckoutPage,
};

export default function App() {
  const { pathname } = window.location;
  if (pathname.endsWith('/product.html')) return <ProductPage />;
  if (pathname.startsWith('/product/')) return <ProductPage productId={decodeURIComponent(pathname.slice('/product/'.length))} />;

  const Page = routes[pathname] || HomePage;
  return <Page />;
}
