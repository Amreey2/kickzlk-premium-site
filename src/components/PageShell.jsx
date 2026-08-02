import Footer from './Footer';
import FloatingActions from './FloatingActions';
import Header from './Header';

export default function PageShell({ children, mainClassName = 'site-main' }) {
  return (
    <>
      <div className="noise" aria-hidden="true" />
      <Header />
      <main className={mainClassName}>{children}</main>
      <FloatingActions />
      <Footer />
    </>
  );
}
