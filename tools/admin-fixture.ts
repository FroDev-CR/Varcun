// Only for automated tests and the localhost UI preview. Never used by production.
import { randomBytes, randomUUID } from 'node:crypto';
import { digest, hashPassword } from '../server/admin-auth.js';
import { StoreError, type AdminAccount, type AdminSession, type AdminStore, type ContentRecord, type ContentRevision, type QuoteRecord } from '../server/admin-store.js';
import { defaultContent } from '../server/content.js';

export async function adminFixture(activated = false) {
  const activationToken = randomBytes(32).toString('base64url');
  const password = 'Una frase de prueba privada 2026';
  const email = 'admin@example.test';
  const state = {
    account: activated ? { email, password_hash: await hashPassword(password) } as AdminAccount : null as AdminAccount | null,
    activation: digest(activationToken) as string | null,
    sessions: new Map<string, AdminSession>(),
    content: { data: { ...defaultContent }, version: 1, updated_at: new Date().toISOString() } as ContentRecord,
    revisions: [] as ContentRevision[],
    quotes: [
      { id: 'd3abc789-bd25-4d23-a161-b3551a2e7759', name: 'Contacto de demostración', email: 'proyectos@example.test', phone: null, company: 'Empresa Aurora · DEMO', category: 'botellas', quantity: 150, message: 'Datos ficticios para revisar el panel. Nos interesa personalizar botellas para un evento del equipo.', product_codes: ['BO-2401', 'BO-2602'], status: 'nueva', internal_notes: '', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
      { id: 'e3abc789-bd25-4d23-a161-b3551a2e7759', name: 'Proyecto de demostración', email: 'diseno@example.test', phone: null, company: 'Estudio Norte · DEMO', category: 'oficina', quantity: 80, message: 'Ejemplo ficticio de una solicitud de libretas con el logo del estudio.', product_codes: ['AO-2601'], status: 'en_revision', internal_notes: 'Nota ficticia: revisar opciones de impresión.', created_at: new Date(Date.now() - 86400000).toISOString(), updated_at: new Date().toISOString() },
    ] as QuoteRecord[],
  };
  const store: AdminStore = {
    async account() { return state.account; },
    async setup(email, password_hash, tokenHash) { if (!state.activation || state.activation !== tokenHash || state.account) throw new StoreError('28000'); state.account = { email, password_hash }; state.activation = null; },
    async addSession(session) { state.sessions.set(session.token_hash, session); },
    async session(hash) { return state.sessions.get(hash) ?? null; },
    async logout(hash) { state.sessions.delete(hash); },
    async changePassword(hash) { state.account!.password_hash = hash; state.sessions.clear(); },
    async inbox(search, status, page) {
      const matches = state.quotes.filter(quote => (status === 'todas' || quote.status === status) && `${quote.name} ${quote.email} ${quote.company}`.toLowerCase().includes(search.toLowerCase()));
      return { quotes: matches.slice(page * 20, (page + 1) * 20).map(({ id, created_at, name, company, category, quantity, status }) => ({ id, created_at, name, company, category, quantity, status })), total: matches.length, counts: Object.fromEntries(['nueva', 'en_revision', 'respondida', 'cerrada'].map(status => [status, state.quotes.filter(quote => quote.status === status).length])) };
    },
    async quote(id) { return state.quotes.find(quote => quote.id === id) ?? null; },
    async updateQuote(id, status, internal_notes, expectedUpdatedAt) { const quote = state.quotes.find(quote => quote.id === id && quote.updated_at === expectedUpdatedAt); if (!quote) return null; Object.assign(quote, { status, internal_notes, updated_at: new Date(Date.now() + 5).toISOString() }); return { ...quote }; },
    async content() { return structuredClone(state.content); },
    async publish(data, version, actor) { if (version !== state.content.version) throw new StoreError('40001'); state.revisions.unshift({ ...structuredClone(state.content), actor, id: randomUUID() }); state.content = { data, version: version + 1, updated_at: new Date().toISOString() }; return structuredClone(state.content); },
    async revisions() { return structuredClone(state.revisions); },
  };
  return { state, store, activationToken, password, email };
}
