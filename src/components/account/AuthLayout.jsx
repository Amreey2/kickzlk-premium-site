export default function AuthLayout({ kicker, title, copy, children, footer }) {
  return (
    <section className="auth-section section-pad">
      <div className="container auth-layout">
        <div className="auth-intro reveal">
          <span className="section-kicker">{kicker}</span>
          <h1>{title}</h1>
          <p>{copy}</p>
          <div className="auth-assurance"><strong>AUTHENTICITY FIRST</strong><span>Secure customer access with the same premium KICKZ.LK experience.</span></div>
        </div>
        <div className="auth-panel reveal delay-100">
          {children}
          {footer}
        </div>
      </div>
    </section>
  );
}
