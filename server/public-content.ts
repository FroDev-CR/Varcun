import type { SupabaseClient } from '@supabase/supabase-js';
import { defaultContent, resolveContent, type SiteContent } from './content.js';

export function createPublicContent(client: SupabaseClient | null) {
  let cached: SiteContent | null = null;
  let expires = 0;
  let generation = 0;
  let pending: Promise<SiteContent> | null = null;
  return {
    invalidate() { generation++; cached = null; pending = null; expires = 0; },
    async read(): Promise<SiteContent> {
      if (!client) return defaultContent;
      if (cached && Date.now() < expires) return cached;
      if (pending) return pending;
      const currentGeneration = generation;
      pending = (async () => {
        let content = defaultContent;
        try {
          const { data, error } = await client.from('varcun_site_content').select('data').eq('id', true).single();
          if (!error) content = resolveContent(data?.data);
        } catch { /* The public site remains available during a database outage. */ }
        if (currentGeneration === generation) { cached = content; expires = Date.now() + 15_000; pending = null; }
        return content;
      })();
      return pending;
    },
  };
}
