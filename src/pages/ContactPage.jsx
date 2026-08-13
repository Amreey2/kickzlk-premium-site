import PageShell from '../components/PageShell';
import useReveal from '../hooks/useReveal';
import { contactEmail, whatsappEnquiryUrl } from '../config/contact';

export default function ContactPage() {
  useReveal();

  return (
    <PageShell mainClassName="site-main contact-page">
      <section className="contact-intro">
        <div className="container contact-intro__inner reveal">
          <span className="section-kicker">SIZING · SOURCING · ORDERS</span>
          <h1>CONTACT US</h1>
          <p>Talk to KICKZ.LK for sizing guidance, current pricing, sourcing availability and order updates.</p>
        </div>
      </section>

      <section className="contact-section">
        <div className="container contact-card reveal">
          <div className="contact-card__heading">
            <span className="section-kicker">DIRECT SUPPORT</span>
            <h2>HELP WITH YOUR<br />NEXT PAIR.</h2>
          </div>
          <div className="contact-card__details">
            <p>Send the pair, colourway and size you are looking for. The KICKZ.LK team will confirm availability, today&apos;s price and the expected delivery timeline.</p>
            <div className="contact-actions">
              <a className="btn btn--whatsapp" href={whatsappEnquiryUrl} target="_blank" rel="noopener noreferrer">START WHATSAPP ENQUIRY <span>↗</span></a>
              <a className="contact-email" href={`mailto:${contactEmail}`}>
                <span>EMAIL KICKZ.LK</span>
                <strong>{contactEmail}</strong>
              </a>
            </div>
          </div>
        </div>
      </section>
    </PageShell>
  );
}
