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
import PreOrderPage from './pages/PreOrderPage';
import ProductPage from './pages/ProductPage';
import RegisterPage from './pages/RegisterPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import ShopPage from './pages/ShopPage';
import AdminCustomersPage from './pages/admin/AdminCustomersPage';
import AdminBrandsPage from './pages/admin/AdminBrandsPage';
import AdminCategoriesPage from './pages/admin/AdminCategoriesPage';
import AdminDashboardPage from './pages/admin/AdminDashboardPage';
import AdminLoginPage from './pages/admin/AdminLoginPage';
import AdminOrdersPage from './pages/admin/AdminOrdersPage';
import AdminProductFormPage from './pages/admin/AdminProductFormPage';
import AdminProductImportPage from './pages/admin/AdminProductImportPage';
import AdminProductsPage from './pages/admin/AdminProductsPage';
import AdminSettingsPage from './pages/admin/AdminSettingsPage';

const routes = {
  '/': HomePage,
  '/index.html': HomePage,
  '/shop': ShopPage,
  '/new-drops': NewDropsPage,
  '/brands': BrandsPage,
  '/categories': CategoriesPage,
  '/pre-order': PreOrderPage,
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
  '/admin/login': AdminLoginPage,
  '/admin/dashboard': AdminDashboardPage,
  '/admin/products': AdminProductsPage,
  '/admin/products/import': AdminProductImportPage,
  '/admin/brands': AdminBrandsPage,
  '/admin/categories': AdminCategoriesPage,
  '/admin/products/new': AdminProductFormPage,
  '/admin/orders': AdminOrdersPage,
  '/admin/customers': AdminCustomersPage,
  '/admin/settings': AdminSettingsPage,
};

export default function App() {
  const { pathname } = window.location;
  const adminProductDuplicate = pathname.match(/^\/admin\/products\/([^/]+)\/duplicate$/);
  if (adminProductDuplicate) return <AdminProductFormPage duplicateFrom={decodeURIComponent(adminProductDuplicate[1])} />;
  const adminProductEdit = pathname.match(/^\/admin\/products\/([^/]+)\/edit$/);
  if (adminProductEdit) return <AdminProductFormPage productId={decodeURIComponent(adminProductEdit[1])} />;
  if (pathname.endsWith('/product.html')) return <ProductPage />;
  if (pathname.startsWith('/product/')) return <ProductPage productId={decodeURIComponent(pathname.slice('/product/'.length))} />;

  const Page = routes[pathname] || (pathname.startsWith('/admin/') ? AdminLoginPage : HomePage);
  return <Page />;
}
