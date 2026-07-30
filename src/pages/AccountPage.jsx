import OrderCard from '../components/account/OrderCard';
import PageHero from '../components/PageHero';
import PageShell from '../components/PageShell';
import { products } from '../data/products';
import useReveal from '../hooks/useReveal';

const orders = [
  { id: '#KZ-24031', date: '28 JUL 2026', total: 64900, status: 'PROCESSING', currentStep: 2, product: products[0], size: 'US 9' },
  { id: '#KZ-23984', date: '06 JUL 2026', total: 52900, status: 'DELIVERED', currentStep: 5, product: products[3], size: 'US 8.5' },
];

export default function AccountPage() {
  useReveal();

  return (
    <PageShell>
      <PageHero kicker="CUSTOMER PROFILE" title="MY ACCOUNT" copy="Review your profile, order history and every stage of the KICKZ.LK delivery journey." />
      <section className="account-section section-pad">
        <div className="container account-layout">
          {/* SPRINT 3.2 PROFILE UI: static frontend state prepared for future authenticated customer data. */}
          <aside className="profile-card reveal">
            <span className="profile-avatar">MK</span>
            <span className="section-kicker">PROFILE</span>
            <h2>Malith K.</h2>
            <dl><div><dt>Email</dt><dd>malith@example.com</dd></div><div><dt>Phone</dt><dd>+94 77 000 0000</dd></div><div><dt>Delivery</dt><dd>Colombo, Sri Lanka</dd></div></dl>
            <button className="btn btn--ghost" type="button">EDIT PROFILE</button>
          </aside>
          <div className="order-history">
            <div className="account-heading"><span className="section-kicker">ORDER HISTORY</span><h2>YOUR ROTATION</h2></div>
            {orders.map((order) => <OrderCard order={order} key={order.id} />)}
          </div>
        </div>
      </section>
    </PageShell>
  );
}
