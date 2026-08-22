import { lazy, Suspense } from 'react';
import RouteSeo from './components/RouteSeo';

const HomePage = lazy(() => import('./pages/HomePage'));
const AccountPage = lazy(() => import('./pages/AccountPage'));
const AboutPage = lazy(() => import('./pages/AboutPage'));
const BrandsPage = lazy(() => import('./pages/BrandsPage'));
const CartPage = lazy(() => import('./pages/CartPage'));
const CategoriesPage = lazy(() => import('./pages/CategoriesPage'));
const CheckoutPage = lazy(() => import('./pages/CheckoutPage'));
const ContactPage = lazy(() => import('./pages/ContactPage'));
const CheckoutChoicePage = lazy(() => import('./pages/CheckoutChoicePage'));
const ForgotPasswordPage = lazy(() => import('./pages/ForgotPasswordPage'));
const LoginPage = lazy(() => import('./pages/LoginPage'));
const NewDropsPage = lazy(() => import('./pages/NewDropsPage'));
const ProductPage = lazy(() => import('./pages/ProductPage'));
const RegisterPage = lazy(() => import('./pages/RegisterPage'));
const ResetPasswordPage = lazy(() => import('./pages/ResetPasswordPage'));
const OrderConfirmationPage = lazy(() => import('./pages/OrderConfirmationPage'));
const OrderTrackingPage = lazy(() => import('./pages/OrderTrackingPage'));
const ShopPage = lazy(() => import('./pages/ShopPage'));
const AdminCustomersPage = lazy(() => import('./pages/admin/AdminCustomersPage'));
const AdminCouponsPage = lazy(() => import('./pages/admin/AdminCouponsPage'));
const AdminBrandsPage = lazy(() => import('./pages/admin/AdminBrandsPage'));
const AdminCategoriesPage = lazy(() => import('./pages/admin/AdminCategoriesPage'));
const AdminDashboardPage = lazy(() => import('./pages/admin/AdminDashboardPage'));
const AdminLoginPage = lazy(() => import('./pages/admin/AdminLoginPage'));
const AdminOrdersPage = lazy(() => import('./pages/admin/AdminOrdersPage'));
const AdminProductFormPage = lazy(() => import('./pages/admin/AdminProductFormPage'));
const AdminProductImportPage = lazy(() => import('./pages/admin/AdminProductImportPage'));
const AdminProductsPage = lazy(() => import('./pages/admin/AdminProductsPage'));
const AdminSettingsPage = lazy(() => import('./pages/admin/AdminSettingsPage'));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'));

const deferred = (content) => <Suspense fallback={null}>{content}</Suspense>;

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
  if (adminProductDuplicate) return <><RouteSeo pathname={pathname} />{deferred(<AdminProductFormPage duplicateFrom={decodeURIComponent(adminProductDuplicate[1])} />)}</>;
  const adminProductEdit = pathname.match(/^\/admin\/products\/([^/]+)\/edit$/);
  if (adminProductEdit) return <><RouteSeo pathname={pathname} />{deferred(<AdminProductFormPage productId={decodeURIComponent(adminProductEdit[1])} />)}</>;
  if (pathname.endsWith('/product.html')) {
    window.location.replace('/product/air-jordan-1-retro-high-og');
    return null;
  }
  if (pathname.startsWith('/product/')) return deferred(<ProductPage productId={decodeURIComponent(pathname.slice('/product/'.length))} />);
  const brandRoute = pathname.match(/^\/brand\/([^/]+)$/);
  if (brandRoute) return deferred(<BrandsPage brandSlug={decodeURIComponent(brandRoute[1])} />);
  const categoryRoute = pathname.match(/^\/category\/([^/]+)$/);
  if (categoryRoute) return deferred(<CategoriesPage categorySlug={decodeURIComponent(categoryRoute[1])} />);

  const Page = routes[pathname] || (pathname.startsWith('/admin/') ? AdminLoginPage : NotFoundPage);
  return <><RouteSeo pathname={pathname} />{deferred(<Page />)}</>;
}
