import { logoWordmarkWhite } from '../assets';

const columns = [
  ['SHOP', [['New Drops', 'drops'], ['Brands', 'brands'], ['Pre-Orders', 'preorder'], ['Luxury', '']]],
  ['SUPPORT', [['Authenticity', 'why'], ['Delivery', 'preorder'], ['Size Guide', ''], ['Contact', '']]],
  ['LEGAL', [['Terms', ''], ['Privacy', ''], ['Returns', ''], ['Pre-Order Policy', '']]],
];

export default function Footer({ productPage = false }) {
  const homePrefix = productPage ? 'index.html' : '';
  const hrefFor = (id) => (id ? `${homePrefix}#${id}` : '#');

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
            {links.map(([label, id]) => <a href={hrefFor(id)} key={label}>{label}</a>)}
          </div>
        ))}
      </div>
      <div className="container footer-bottom"><span>© 2026 KICKZ.LK. ALL RIGHTS RESERVED.</span><a href="#top">BACK TO TOP ↑</a></div>
    </footer>
  );
}
