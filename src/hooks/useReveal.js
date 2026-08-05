import { useEffect } from 'react';

export default function useReveal() {
  useEffect(() => {
    const revealItems = document.querySelectorAll('.reveal');

    if (!('IntersectionObserver' in window)) {
      revealItems.forEach((item) => item.classList.add('is-visible'));
      const fallbackObserver = new MutationObserver(() => {
        document.querySelectorAll('.reveal:not(.is-visible)').forEach((item) => item.classList.add('is-visible'));
      });
      fallbackObserver.observe(document.body, { childList: true, subtree: true });
      return () => fallbackObserver.disconnect();
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -35px' },
    );

    revealItems.forEach((item) => observer.observe(item));
    // API-backed cards mount after the first render and must retain the approved reveal animation.
    const mutationObserver = new MutationObserver(() => {
      document.querySelectorAll('.reveal:not(.is-visible)').forEach((item) => observer.observe(item));
    });
    mutationObserver.observe(document.body, { childList: true, subtree: true });
    return () => {
      mutationObserver.disconnect();
      observer.disconnect();
    };
  }, []);
}
