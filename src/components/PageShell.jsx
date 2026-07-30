import AnnouncementBar from './AnnouncementBar';
import Footer from './Footer';
import Header from './Header';

export default function PageShell({ children, mainClassName = 'site-main' }) {
  return (
    <>
      <div className="noise" aria-hidden="true" />
      <AnnouncementBar />
      <Header />
      <main className={mainClassName}>{children}</main>
      <Footer />
    </>
  );
}
