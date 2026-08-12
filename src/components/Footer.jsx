import { logoWordmarkWhite } from '../assets';

const columns = [
  ['SHOP', [['All Products', '/shop'], ['New Drops', '/new-drops'], ['Categories', '/categories'], ['Order Tracking', '/track-order']]],
  ['CONTACT US', [['My Account', '/account'], ['Sign In', '/login'], ['Authenticity', '/about'], ['Contact Us', '/contact']]],
  ['LEGAL', [['Terms', ''], ['Privacy', ''], ['Returns', '']]],
];

const socials = [
  ['Facebook', 'https://www.facebook.com/kickz.lk', <path d="M14 8h3V4h-3c-3 0-5 2-5 5v3H6v4h3v6h4v-6h3l1-4h-4V9c0-.7.3-1 1-1Z" />],
  ['Instagram', 'https://www.instagram.com/kickz.lk', <><rect x="3" y="3" width="18" height="18" rx="5" /><circle cx="12" cy="12" r="4" /><path d="M17.5 6.5h.01" /></>],
  ['TikTok', 'https://www.tiktok.com/@kickz.lk', <path d="M15 4c.5 2.2 1.8 3.5 4 4v4a8 8 0 0 1-4-1.1V16a6 6 0 1 1-6-6v4a2 2 0 1 0 2 2V4h4Z" />],
  ['YouTube', 'https://www.youtube.com/@kickz.lk', <><path d="M21 8.2a3 3 0 0 0-2.1-2.1C17 5.5 12 5.5 12 5.5s-5 0-6.9.6A3 3 0 0 0 3 8.2 31 31 0 0 0 2.5 12a31 31 0 0 0 .5 3.8 3 3 0 0 0 2.1 2.1c1.9.6 6.9.6 6.9.6s5 0 6.9-.6a3 3 0 0 0 2.1-2.1 31 31 0 0 0 .5-3.8 31 31 0 0 0-.5-3.8Z" /><path d="m10 15 5-3-5-3v6Z" /></>],
];

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container footer-grid">
        <div className="footer-brand">
          <img src={logoWordmarkWhite} alt="KICKZ.LK" />
          <p>Premium authentic sneakers, imported for Sri Lanka’s culture.</p>
          <div className="footer-socials">{socials.map(([label, href, icon]) => <a href={href} target="_blank" rel="noopener noreferrer" aria-label={label} key={label}><svg viewBox="0 0 24 24" aria-hidden="true">{icon}</svg></a>)}</div>
        </div>
        {columns.map(([heading, links]) => (
          <div className="footer-col" key={heading}>
            <h3>{heading}</h3>
            {links.map(([label, href]) => <a href={href || '#'} key={label}>{label}</a>)}
          </div>
        ))}
      </div>
      <div className="container footer-bottom"><span>© 2026 KICKZ.LK. ALL RIGHTS RESERVED.</span><a href="#top">BACK TO TOP ↑</a></div>
    </footer>
  );
}
