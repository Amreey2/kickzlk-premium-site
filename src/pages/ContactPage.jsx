import PageHero from '../components/PageHero';
import PageShell from '../components/PageShell';
import useReveal from '../hooks/useReveal';

const whatsappUrl = 'https://wa.me/94700000000?text=Hi%20KICKZ.LK%2C%20I%20need%20help%20with%20a%20sneaker%20enquiry.';

export default function ContactPage() {
  useReveal();

  return (
    <PageShell>
      <PageHero
        kicker="HUMAN SUPPORT"
        title="CONTACT"
        copy="Talk to KICKZ.LK for sizing guidance, current pricing, sourcing availability and order updates."
      />
      {/* SPRINT 3.1 CONTACT ENTRY: reuses the approved premium card and button language for direct support. */}
      <section className="contact-section section-pad">
        <div className="container contact-card reveal">
          <div><span className="section-kicker">WHATSAPP SUPPORT</span><h2>REAL GUIDANCE.<br />ONE MESSAGE AWAY.</h2></div>
          <div><p>Send the pair, colorway and size you are looking for. The KICKZ.LK team will confirm availability, today&apos;s price and the expected delivery timeline.</p><a className="btn btn--whatsapp" href={whatsappUrl} target="_blank" rel="noopener noreferrer">START WHATSAPP ENQUIRY <span>↗</span></a></div>
        </div>
      </section>
    </PageShell>
  );
}
