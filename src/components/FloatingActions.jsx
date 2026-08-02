const whatsappUrl = 'https://wa.me/94700000000?text=Hi%20KICKZ.LK%2C%20I%20need%20help%20with%20a%20sneaker%20enquiry.';

export default function FloatingActions({ aboveMobileBuyBar = false }) {
  return (
    <nav className={`floating-actions${aboveMobileBuyBar ? ' floating-actions--with-buybar' : ''}`} aria-label="Quick actions">
      <a className="floating-action floating-action--whatsapp" href={whatsappUrl} target="_blank" rel="noopener noreferrer" aria-label="Contact KICKZ.LK on WhatsApp">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20.5 11.6a8.4 8.4 0 0 1-12.4 7.3L3.5 20l1.2-4.4a8.4 8.4 0 1 1 15.8-4Z" /><path d="M8.3 7.7c.2-.4.4-.4.7-.4h.5l.8 2c.1.3 0 .5-.2.7l-.6.7c.7 1.5 1.9 2.6 3.5 3.2l.6-.8c.2-.2.4-.3.7-.2l2 .9c.3.1.4.3.4.6 0 .7-.4 1.5-1 1.9-.5.4-1.2.6-1.9.5-2.1-.3-4-1.4-5.4-3-1.2-1.3-2-2.9-2.2-4.3-.1-.7.1-1.3.5-1.8.4-.4 1-.6 1.6 0Z" /></svg>
      </a>
      <button className="floating-action floating-action--top" type="button" aria-label="Scroll to top" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 14 6-6 6 6" /><path d="M12 8v12" /></svg>
      </button>
    </nav>
  );
}
