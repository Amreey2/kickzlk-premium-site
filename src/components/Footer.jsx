import { logoWordmarkWhite } from '../assets';
import SocialIconLinks from './SocialIconLinks';

const columns = [
  ['SHOP', [['All Products', '/shop'], ['New Drops', '/new-drops'], ['Categories', '/categories'], ['Order Tracking', '/track-order']]],
  ['CONTACT US', [['My Account', '/account'], ['Sign In', '/login'], ['Authenticity', '/about'], ['Contact Us', '/contact']]],
  ['LEGAL', [['Terms', ''], ['Privacy', ''], ['Returns', '']]],
];

export default function Footer() {
  return <footer className="footer">
    <div className="container footer-grid">
      <div className="footer-brand"><img src={logoWordmarkWhite} alt="KICKZ.LK" width="1586" height="325" /><p>Premium authentic sneakers, imported for Sri Lanka’s culture.</p><SocialIconLinks className="footer-socials" /></div>
      {columns.map(([heading, links]) => <div className="footer-col" key={heading}><h3>{heading}</h3>{links.map(([label, href]) => <a href={href || '#'} key={label}>{label}</a>)}</div>)}
    </div>
    <div className="container footer-bottom"><span>© 2026 KICKZ.LK. ALL RIGHTS RESERVED.</span><a href="#top">BACK TO TOP ↑</a></div>
  </footer>;
}
