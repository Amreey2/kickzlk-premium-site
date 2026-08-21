import HomePage from './pages/HomePage';
import AccountPage from './pages/AccountPage';
import AboutPage from './pages/AboutPage';
import BrandsPage from './pages/BrandsPage';
import CartPage from './pages/CartPage';
import CategoriesPage from './pages/CategoriesPage';
import CheckoutPage from './pages/CheckoutPage';
import ContactPage from './pages/ContactPage';
import CheckoutChoicePage from './pages/CheckoutChoicePage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import LoginPage from './pages/LoginPage';
import NewDropsPage from './pages/NewDropsPage';
import ProductPage from './pages/ProductPage';
import RegisterPage from './pages/RegisterPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import OrderConfirmationPage from './pages/OrderConfirmationPage';
import OrderTrackingPage from './pages/OrderTrackingPage';
import ShopPage from './pages/ShopPage';
import AdminCustomersPage from './pages/admin/AdminCustomersPage';
import AdminCouponsPage from './pages/admin/AdminCouponsPage';
import AdminBrandsPage from './pages/admin/AdminBrandsPage';
import AdminCategoriesPage from './pages/admin/AdminCategoriesPage';
import AdminDashboardPage from './pages/admin/AdminDashboardPage';
import AdminLoginPage from './pages/admin/AdminLoginPage';
import AdminOrdersPage from './pages/admin/AdminOrdersPage';
import AdminProductFormPage from './pages/admin/AdminProductFormPage';
import AdminProductImportPage from './pages/admin/AdminProductImportPage';
import AdminProductsPage from './pages/admin/AdminProductsPage';
import AdminSettingsPage from './pages/admin/AdminSettingsPage';
import RouteSeo from './components/RouteSeo';
import NotFoundPage from './pages/NotFoundPage';

const routes = {
  '/': HomePage,
  '/index.html': HomePage,
  '/shop': ShopPage,
  '/new-drops': NewDropsPage,
  '/brands': BrandsPage,
  '/categories': CategoriesPage,
  '/about': AboutPage,
  '/about-us': AboutPage,
  '/community': AboutPage,
  '/contact': ContactPage,
  '/login': LoginPage,
  '/register': RegisterPage,
  '/forgot-password': ForgotPasswordPage,
  '/reset-password': ResetPasswordPage,
  '/account': AccountPage,
  '/cart': CartPage,
  '/checkout': CheckoutPage,
  '/checkout/start': CheckoutChoicePage,
  '/order-confirmation': OrderConfirmationPage,
  '/track-order': OrderTrackingPage,
  '/admin/login': AdminLoginPage,
  '/admin/dashboard': AdminDashboardPage,
  '/admin/products': AdminProductsPage,
  '/admin/products/import': AdminProductImportPage,
  '/admin/brands': AdminBrandsPage,
  '/admin/categories': AdminCategoriesPage,
  '/admin/products/new': AdminProductFormPage,
  '/admin/orders': AdminOrdersPage,
  '/admin/customers': AdminCustomersPage,
  '/admin/coupons': AdminCouponsPage,
  '/admin/settings': AdminSettingsPage,
};

export default function App() {
  const { pathname } = window.location;
  if (pathname === '/pre-order') {
    window.location.replace('/shop');
    return null;
  }
  const adminProductDuplicate = pathname.match(/^\/admin\/products\/([^/]+)\/duplicate$/);
  if (adminProductDuplicate) return <><RouteSeo pathname={pathname} /><AdminProductFormPage duplicateFrom={decodeURIComponent(adminProductDuplicate[1])} /></>;
  const adminProductEdit = pathname.match(/^\/admin\/products\/([^/]+)\/edit$/);
  if (adminProductEdit) return <><RouteSeo pathname={pathname} /><AdminProductFormPage productId={decodeURIComponent(adminProductEdit[1])} /></>;
  if (pathname.endsWith('/product.html')) {
    window.location.replace('/product/air-jordan-1-retro-high-og');
    return null;
  }
  if (pathname.startsWith('/product/')) return <ProductPage productId={decodeURIComponent(pathname.slice('/product/'.length))} />;
  const brandRoute = pathname.match(/^\/brand\/([^/]+)$/);
  if (brandRoute) return <BrandsPage brandSlug={decodeURIComponent(brandRoute[1])} />;
  const categoryRoute = pathname.match(/^\/category\/([^/]+)$/);
  if (categoryRoute) return <CategoriesPage categorySlug={decodeURIComponent(categoryRoute[1])} />;

  const Page = routes[pathname] || (pathname.startsWith('/admin/') ? AdminLoginPage : NotFoundPage);
  return <><RouteSeo pathname={pathname} /><Page /></>;
}
