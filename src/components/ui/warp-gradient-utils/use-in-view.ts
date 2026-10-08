import { useCallback, useEffect, useState, type RefCallback } from 'react';

/** Observe the element and stop animation while its tab is in the background. */
export function useInView<T extends HTMLElement>({ rootMargin = '0px' }: { rootMargin?: string } = {}): [RefCallback<T>, boolean] {
  const [element, setElement] = useState<T | null>(null);
  const [inView, setInView] = useState(false);
  const observe = useCallback<RefCallback<T>>((node) => { setElement(node); }, []);

  useEffect(() => {
    if (!element) return;
    let intersecting = false;
    const update = () => setInView(intersecting && document.visibilityState === 'visible');
    const observer = typeof IntersectionObserver === 'undefined' ? null : new IntersectionObserver(([entry]) => {
      intersecting = entry.isIntersecting;
      update();
    }, { rootMargin });
    if (observer) observer.observe(element);
    else { intersecting = true; update(); }
    document.addEventListener('visibilitychange', update);
    return () => {
      observer?.disconnect();
      document.removeEventListener('visibilitychange', update);
    };
  }, [element, rootMargin]);

  return [observe, inView];
}
