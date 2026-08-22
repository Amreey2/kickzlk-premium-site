import { useCallback, useEffect, useState } from 'react';
import { logoWordmarkWhite } from '../assets';
import { CART_EVENT, cartCount, readCart } from '../utils/cart';
import SearchOverlay from './SearchOverlay';

const navItems = [
  ['/', 'Home'],
  ['/shop', 'Shop All'],
  ['/new-drops', 'New Drops'],
  ['/categories', 'Categories'],
  ['/about', 'About'],
  ['/contact', 'Contact'],
];
const mobileNavItems = [...navItems, ['/track-order', 'Track Order']];

export default function Header({ bagCount = 0, cartHref = '/cart' }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [hasScrolled, setHasScrolled] = useState(false);
  const [storedCartCount, setStoredCartCount] = useState(() => typeof window === 'undefined' ? 0 : cartCount(readCart()));
  const currentPath = window.location.pathname;
  const activePath = currentPath.startsWith('/product/')
    || currentPath.endsWith('/product.html')
    ? '/shop'
    : currentPath === '/index.html'
      ? '/'
      : ['/about-us', '/community'].includes(currentPath)
        ? '/about'
        : currentPath;

  useEffect(() => {
    document.body.classList.toggle('nav-open', menuOpen);
    return () => document.body.classList.remove('nav-open');
  }, [menuOpen]);

  useEffect(() => {
    const update = () => setStoredCartCount(cartCount(readCart()));
    window.addEventListener(CART_EVENT, update); window.addEventListener('storage', update);
    return () => { window.removeEventListener(CART_EVENT, update); window.removeEventListener('storage', update); };
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      if (!menuOpen) setHasScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [menuOpen]);

  const closeMenu = () => setMenuOpen(false);
  const closeSearch = useCallback(() => setSearchOpen(false), []);

  return (
    <header className={`site-header${hasScrolled ? ' site-header--scrolled' : ''}`} id="top">
      <div className="container header__inner">
        <a href="/" className="brand" aria-label="KICKZ.LK home">
          <img src={logoWordmarkWhite} alt="KICKZ.LK" width="1586" height="325" />
        </a>
        <nav className="desktop-nav" aria-label="Primary navigation">
          {navItems.map(([href, label]) => (
            <a href={href} className={activePath === href ? 'active' : ''} key={href}>{label}</a>
          ))}
        </nav>
        <div className="header-actions">
          <button className="icon-btn" aria-label="Search" onClick={() => setSearchOpen(true)}>
            <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.8-3.8" /></svg>
          </button>
          <a className="icon-btn account-btn" href="/account" aria-label="Customer account">
            <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="8" r="4" /><path d="M4.5 21a7.5 7.5 0 0 1 15 0" /></svg>
          </a>
          <a className="icon-btn bag-btn" href={cartHref} aria-label={`Shopping cart${Math.max(bagCount, storedCartCount) ? `, ${Math.max(bagCount, storedCartCount)} item` : ''}`}>
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 8h12l-1 12H7L6 8Z" /><path d="M9 8a3 3 0 0 1 6 0" /></svg>
            <span className="bag-count">{Math.max(bagCount, storedCartCount)}</span>
          </a>
          <button
            className="menu-toggle"
            aria-label="Open menu"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((open) => !open)}
          >
            <span /><span /><span />
          </button>
        </div>
      </div>
      <div className={`mobile-drawer${menuOpen ? ' open' : ''}`} aria-hidden={!menuOpen}>
        <nav aria-label="Mobile navigation">
          {mobileNavItems.map(([href, label], index) => (
            <a href={href} className={activePath === href ? 'active' : ''} key={href} onClick={closeMenu}>
              <small>{String(index + 1).padStart(2, '0')}</small><span>{label}</span><i aria-hidden="true">↗</i>
            </a>
          ))}
        </nav>
        <button className="mobile-search-link" type="button" onClick={() => { closeMenu(); setSearchOpen(true); }}>
          SEARCH CATALOGUE <span aria-hidden="true">⌕</span>
        </button>
        <a className="mobile-account-link" href="/account" onClick={closeMenu}>MY ACCOUNT <span>→</span></a>
        <div className="mobile-drawer__meta"><span>Colombo, Sri Lanka</span><span>Online · Islandwide</span></div>
      </div>
      <SearchOverlay open={searchOpen} onClose={closeSearch} />
    </header>
  );
}
