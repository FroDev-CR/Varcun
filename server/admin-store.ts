import type { SupabaseClient } from '@supabase/supabase-js';
import { resolveContent, type SiteContent } from './content.js';

export type AdminAccount = { email: string; password_hash: string };
export type AdminSession = { token_hash: string; credential_version: string; expires_at: string };
export type ContentRecord = { data: SiteContent; version: number; updated_at: string | null };
export type QuoteRecord = { id: string; created_at: string; updated_at: string; name: string; email: string; phone: string | null; company: string | null; category: string; quantity: number; message: string; product_codes: string[]; status: string; internal_notes: string };
export type QuoteSummary = Pick<QuoteRecord, 'id' | 'created_at' | 'name' | 'company' | 'category' | 'quantity' | 'status'>;
export type QuoteInbox = { quotes: QuoteSummary[]; total: number; counts: Record<string, number> };
export type ContentRevision = ContentRecord & { id: string; actor: string };
export class StoreError extends Error { constructor(public code: string) { super('No se pudo completar la operación.'); } }
export type AdminStore = {
  account(): Promise<AdminAccount | null>;
  setup(email: string, passwordHash: string, tokenHash: string): Promise<void>;
  addSession(session: AdminSession): Promise<void>;
  session(tokenHash: string): Promise<AdminSession | null>;
  logout(tokenHash: string): Promise<void>;
  changePassword(passwordHash: string): Promise<void>;
  inbox(search: string, status: string, page: number): Promise<QuoteInbox>;
  quote(id: string): Promise<QuoteRecord | null>;
  updateQuote(id: string, status: string, notes: string, expectedUpdatedAt: string): Promise<QuoteRecord | null>;
  content(): Promise<ContentRecord>;
  publish(data: SiteContent, version: number, actor: string): Promise<ContentRecord>;
  revisions(): Promise<ContentRevision[]>;
};
const quoteColumns = 'id,created_at,updated_at,name,email,phone,company,category,quantity,message,product_codes,status,internal_notes';
function unwrap<T>(result: { data: T; error: { code: string } | null }): T {
  if (result.error) throw new StoreError(result.error.code);
  return result.data;
}
export function createAdminStore(client: SupabaseClient): AdminStore {
  return {
    async account() { return unwrap(await client.from('varcun_admin_accounts').select('email,password_hash').eq('id', true).maybeSingle()); },
    async setup(email, passwordHash, tokenHash) { unwrap(await client.rpc('varcun_admin_activate', { p_email: email, p_password_hash: passwordHash, p_token_hash: tokenHash })); },
    async addSession(session) {
      unwrap(await client.from('varcun_admin_sessions').delete().lt('expires_at', new Date().toISOString()));
      unwrap(await client.from('varcun_admin_sessions').insert(session));
    },
    async session(tokenHash) { return unwrap(await client.from('varcun_admin_sessions').select('token_hash,credential_version,expires_at').eq('token_hash', tokenHash).gt('expires_at', new Date().toISOString()).maybeSingle()); },
    async logout(tokenHash) { unwrap(await client.from('varcun_admin_sessions').delete().eq('token_hash', tokenHash)); },
    async changePassword(passwordHash) {
      unwrap(await client.from('varcun_admin_accounts').update({ password_hash: passwordHash }).eq('id', true));
      unwrap(await client.from('varcun_admin_sessions').delete().neq('token_hash', ''));
    },
    async inbox(search, status, page) { return unwrap(await client.rpc('varcun_admin_inbox', { p_search: search, p_status: status, p_page: page })) as QuoteInbox; },
    async quote(id) { return unwrap(await client.from('varcun_quote_requests').select(quoteColumns).eq('id', id).maybeSingle()); },
    async updateQuote(id, status, notes, expectedUpdatedAt) { return unwrap(await client.from('varcun_quote_requests').update({ status, internal_notes: notes, updated_at: new Date().toISOString() }).eq('id', id).eq('updated_at', expectedUpdatedAt).select(quoteColumns).maybeSingle()); },
    async content() {
      const row = unwrap(await client.from('varcun_site_content').select('data,version,updated_at').eq('id', true).single());
      if (!row) throw new StoreError('PGRST116');
      return { data: resolveContent(row.data), version: Number(row.version), updated_at: row.updated_at };
    },
    async publish(data, version, actor) {
      const row = unwrap(await client.rpc('varcun_admin_publish_content', { p_data: data, p_expected_version: version, p_actor: actor }));
      return { ...row, data: resolveContent(row.data) };
    },
    async revisions() { return (unwrap(await client.from('varcun_content_revisions').select('id,data,version,updated_at,actor').order('version', { ascending: false }).limit(10)) ?? []).map(row => ({ ...row, data: resolveContent(row.data) })); },
  };
}
