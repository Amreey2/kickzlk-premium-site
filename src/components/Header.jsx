import { useEffect, useState } from 'react';
import { logoWordmarkWhite } from '../assets';

const navItems = [
  ['/', 'Home'],
  ['/shop', 'Shop'],
  ['/new-drops', 'New Drops'],
  ['/brands', 'Brands'],
  ['/categories', 'Categories'],
  ['/pre-order', 'Pre-Order'],
  ['/about', 'About'],
  ['/contact', 'Contact'],
];

export default function Header({ bagCount = 0 }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [hasScrolled, setHasScrolled] = useState(false);
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
    const handleScroll = () => {
      if (!menuOpen) setHasScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [menuOpen]);

  const closeMenu = () => setMenuOpen(false);

  return (
    <header className={`site-header${hasScrolled ? ' site-header--scrolled' : ''}`} id="top">
      <div className="container header__inner">
        <a href="/" className="brand" aria-label="KICKZ.LK home">
          <img src={logoWordmarkWhite} alt="KICKZ.LK" />
        </a>
        <nav className="desktop-nav" aria-label="Primary navigation">
          {navItems.map(([href, label]) => (
            <a href={href} className={activePath === href ? 'active' : ''} key={href}>{label}</a>
          ))}
        </nav>
        <div className="header-actions">
          <button className="icon-btn" aria-label="Search">
            <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.8-3.8" /></svg>
          </button>
          <a className="icon-btn account-btn" href="/account" aria-label="Customer account">
            <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="8" r="4" /><path d="M4.5 21a7.5 7.5 0 0 1 15 0" /></svg>
          </a>
          <a className="icon-btn bag-btn" href="/cart" aria-label="Shopping bag and cart">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 8h12l-1 12H7L6 8Z" /><path d="M9 8a3 3 0 0 1 6 0" /></svg>
            <span className="bag-count">{bagCount}</span>
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
          {navItems.map(([href, label], index) => (
            <a href={href} className={activePath === href ? 'active' : ''} key={href} onClick={closeMenu}>
              <small>{String(index + 1).padStart(2, '0')}</small><span>{label}</span><i aria-hidden="true">↗</i>
            </a>
          ))}
        </nav>
        <a className="mobile-account-link" href="/account" onClick={closeMenu}>MY ACCOUNT <span>→</span></a>
        <div className="mobile-drawer__meta"><span>Colombo, Sri Lanka</span><span>Online · Islandwide</span></div>
      </div>
    </header>
  );
}
