import PageShell from '../components/PageShell';
import useReveal from '../hooks/useReveal';
import { safeCustomerNext } from '../utils/customerNavigation';

export default function CheckoutChoicePage() {
  useReveal();
  const next = safeCustomerNext(new URLSearchParams(window.location.search).get('next'), '/checkout');
  const guest = `${next}${next.includes('?') ? '&' : '?'}guest=1`;
  return (
    <PageShell><section className="journey-choice section-pad"><div className="container"><div className="journey-choice__panel reveal">
      <span className="section-kicker">YOUR CHECKOUT, YOUR WAY</span><h1>HOW WOULD YOU<br />LIKE TO CONTINUE?</h1><p>Checkout without an account, sign in for your saved details, or create a KICKZ.LK profile. Guest checkout always stays available.</p>
      <div className="journey-choice__grid"><a href={guest}><strong>CONTINUE AS GUEST</strong><span>No account required. Enter delivery details at checkout.</span><i>→</i></a><a href={`/login?next=${encodeURIComponent(next)}`}><strong>LOGIN</strong><span>Use your profile and saved delivery addresses.</span><i>→</i></a><a href={`/register?next=${encodeURIComponent(next)}`}><strong>CREATE ACCOUNT</strong><span>Save details and keep future orders together.</span><i>→</i></a></div>
      <a className="journey-choice__back" href="/cart">← RETURN TO CART</a>
    </div></div></section></PageShell>
  );
}
