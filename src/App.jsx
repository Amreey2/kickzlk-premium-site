import HomePage from './pages/HomePage';
import ProductPage from './pages/ProductPage';

export default function App() {
  return window.location.pathname.endsWith('/product.html') ? <ProductPage /> : <HomePage />;
}
