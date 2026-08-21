import { useEffect } from 'react';
import { trackPageView } from '../utils/analytics';

export default function AnalyticsPageView() {
  useEffect(() => {
    let timer;
    const track = (delay = 0) => {
      window.clearTimeout(timer);
      timer = window.setTimeout(trackPageView, delay);
    };
    const trackSeo = () => track();
    const trackRouteFallback = () => track(500);
    trackRouteFallback();
    window.addEventListener('kickz:seo-ready', trackSeo);
    window.addEventListener('popstate', trackRouteFallback);
    window.addEventListener('kickz:location-change', trackRouteFallback);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener('kickz:seo-ready', trackSeo);
      window.removeEventListener('popstate', trackRouteFallback);
      window.removeEventListener('kickz:location-change', trackRouteFallback);
    };
  }, []);
  return null;
}
