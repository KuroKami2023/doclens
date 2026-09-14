import { useEffect, useRef } from 'react';

/**
 * useReveal — IntersectionObserver scroll-reveal.
 * Returns a ref to attach to a wrapper; all descendants with
 * `.reveal` get `.is-visible` added once they enter the viewport.
 * Respects prefers-reduced-motion (CSS keeps everything visible).
 */
export default function useReveal(options = {}) {
  const ref = useRef(null);

  useEffect(() => {
    const root = ref.current;
    if (!root) return undefined;
    const els = root.querySelectorAll('.reveal');
    if (els.length === 0) return undefined;
    if (typeof IntersectionObserver === 'undefined') {
      els.forEach((el) => el.classList.add('is-visible'));
      return undefined;
    }
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            io.unobserve(entry.target);
          }
        });
      },
      { rootMargin: '0px 0px -8% 0px', threshold: 0.12, ...options }
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return ref;
}
