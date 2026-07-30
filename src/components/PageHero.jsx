export default function PageHero({ kicker, title, copy }) {
  return (
    <section className="page-hero section-pad">
      <div className="container page-hero__inner reveal">
        <span className="section-kicker">{kicker}</span>
        <h1>{title}</h1>
        <p>{copy}</p>
      </div>
    </section>
  );
}
