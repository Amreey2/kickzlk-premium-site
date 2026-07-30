import { logoWordmarkWhite } from '../assets';

const columns = [
  ['SHOP', [['All Products', '/shop'], ['New Drops', '/new-drops'], ['Brands', '/brands'], ['Pre-Orders', '/pre-order']]],
  ['SUPPORT', [['Authenticity', '/about'], ['Delivery', '/about'], ['About', '/about'], ['Contact', '/contact']]],
  ['LEGAL', [['Terms', ''], ['Privacy', ''], ['Returns', ''], ['Pre-Order Policy', '']]],
];

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container footer-grid">
        <div className="footer-brand">
          <img src={logoWordmarkWhite} alt="KICKZ.LK" />
          <p>Premium authentic sneakers, imported for Sri Lanka’s culture.</p>
          <div className="footer-socials"><a href="#">IG</a><a href="#">TT</a><a href="#">WA</a></div>
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
