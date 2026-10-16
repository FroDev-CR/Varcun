import { useEffect, useState } from 'react';
import { defaultContent, resolveContent } from '../server/content';

export function useSiteContent() {
  const [content, setContent] = useState(defaultContent);
  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      try {
        const response = await fetch('/api/content', { signal: controller.signal, cache: 'no-store' });
        if (response.ok) setContent(resolveContent((await response.json()).content));
      } catch { /* Keep the existing public copy when offline. */ }
    }
    void load();
    const refresh = () => { if (document.visibilityState === 'visible') void load(); };
    document.addEventListener('visibilitychange', refresh);
    return () => { controller.abort(); document.removeEventListener('visibilitychange', refresh); };
  }, []);
  return content;
}
