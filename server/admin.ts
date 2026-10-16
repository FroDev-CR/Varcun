import express from 'express';
import rateLimit from 'express-rate-limit';
import { z } from 'zod';
import { contentSchema } from './content.js';
import { StoreError, type AdminStore } from './admin-store.js';
import { digest, hashPassword, loginSchema, newSession, passwordChangeSchema, quoteStatuses, quoteUpdateSchema, SESSION_MS, sessionCookie, setupSchema, verifyPassword } from './admin-auth.js';

export function createAdminRouter({ store, secure, origins, onPublish = () => {} }: { store: AdminStore | null; secure: boolean; origins: string[]; onPublish?: () => void }) {
  const router = express.Router();
  const cookieName = secure ? '__Host-varcun_admin' : 'varcun_admin_dev';
  const cookieOptions = { httpOnly: true, secure, sameSite: 'strict' as const, path: '/', maxAge: SESSION_MS };
  const { maxAge: _maxAge, ...clearCookieOptions } = cookieOptions;
  const sessionStart = async (response: express.Response, passwordHash: string, email: string) => {
    const session = newSession(passwordHash);
    await store!.addSession({ token_hash: session.token_hash, credential_version: session.credential_version, expires_at: session.expires_at });
    response.cookie(cookieName, session.token, cookieOptions).json({ admin: { email }, expiresAt: session.expires_at });
  };
  router.use((request, response, next) => {
    response.set({ 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex, nofollow', 'Referrer-Policy': 'no-referrer' });
    if (secure && !request.secure) { response.status(403).json({ message: 'Entra al panel con HTTPS.' }); return; }
    if (!['GET', 'HEAD'].includes(request.method) && (!request.is('application/json') || !origins.includes(request.get('origin') ?? ''))) {
      response.status(403).json({ message: 'La solicitud debe hacerse desde el panel de Varcun.' }); return;
    }
    if (!store) { response.status(503).json({ message: 'El panel está pendiente de configuración.' }); return; }
    next();
  });
  const loginLimit = rateLimit({ windowMs: 15 * 60_000, limit: 10, standardHeaders: 'draft-8', legacyHeaders: false, message: { message: 'Demasiados intentos. Espera unos minutos antes de volver a entrar.' } });
  router.post('/login', loginLimit, async (request, response) => {
    const parsed = loginSchema.safeParse(request.body);
    if (!parsed.success) { response.status(400).json({ message: 'Revisa tu correo y contraseña.' }); return; }
    const account = await store!.account();
    const valid = await verifyPassword(parsed.data.password, account?.password_hash ?? null);
    if (!account || account.email !== parsed.data.email || !valid) { response.status(401).json({ message: 'El correo o la contraseña no coinciden.' }); return; }
    await sessionStart(response, account.password_hash, account.email);
  });
  router.post('/activate', loginLimit, async (request, response) => {
    const parsed = setupSchema.safeParse(request.body);
    if (!parsed.success) { response.status(400).json({ message: 'Revisa el correo y usa una contraseña de 12 a 128 caracteres.' }); return; }
    const passwordHash = await hashPassword(parsed.data.password);
    try { await store!.setup(parsed.data.email, passwordHash, digest(parsed.data.token)); }
    catch (error) {
      if (error instanceof StoreError && error.code === '28000') { response.status(403).json({ message: 'El enlace de activación venció o ya fue utilizado.' }); return; }
      throw error;
    }
    await sessionStart(response, passwordHash, parsed.data.email);
  });
  router.use(async (request, response, next) => {
    const token = sessionCookie(request.get('cookie'), cookieName);
    const session = token ? await store!.session(digest(token)) : null;
    const account = session ? await store!.account() : null;
    if (!session || Date.parse(session.expires_at) <= Date.now() || !account || session.credential_version !== digest(account.password_hash)) {
      response.clearCookie(cookieName, clearCookieOptions).status(401).json({ message: 'Inicia sesión para entrar al panel.' }); return;
    }
    response.locals.admin = { email: account.email, passwordHash: account.password_hash, tokenHash: session.token_hash, expiresAt: session.expires_at };
    next();
  });
  router.get('/session', (_request, response) => response.json({ admin: { email: response.locals.admin.email }, expiresAt: response.locals.admin.expiresAt }));
  router.post('/logout', async (_request, response) => {
    await store!.logout(response.locals.admin.tokenHash);
    response.clearCookie(cookieName, clearCookieOptions).json({ signedOut: true });
  });
  router.post('/password', loginLimit, async (request, response) => {
    const parsed = passwordChangeSchema.safeParse(request.body);
    if (!parsed.success) { response.status(400).json({ message: 'La nueva contraseña debe tener de 12 a 128 caracteres.' }); return; }
    if (!await verifyPassword(parsed.data.currentPassword, response.locals.admin.passwordHash)) { response.status(403).json({ message: 'La contraseña actual no coincide.' }); return; }
    const passwordHash = await hashPassword(parsed.data.newPassword);
    await store!.changePassword(passwordHash);
    await sessionStart(response, passwordHash, response.locals.admin.email);
  });
  router.get('/quotes', async (request, response) => {
    const parsed = z.object({ search: z.string().max(120).default(''), status: z.enum(['todas', ...quoteStatuses]).default('todas'), page: z.coerce.number().int().min(0).max(100000).default(0) }).strict().safeParse(request.query);
    if (!parsed.success) { response.status(400).json({ message: 'Los filtros no son válidos.' }); return; }
    response.json(await store!.inbox(parsed.data.search.trim(), parsed.data.status, parsed.data.page));
  });
  router.get('/quotes/:id', async (request, response) => {
    if (!z.uuid().safeParse(request.params.id).success) { response.status(404).json({ message: 'Cotización no encontrada.' }); return; }
    const quote = await store!.quote(request.params.id as string);
    if (!quote) { response.status(404).json({ message: 'Cotización no encontrada.' }); return; }
    response.json({ quote });
  });
  router.patch('/quotes/:id', async (request, response) => {
    const parsed = quoteUpdateSchema.safeParse(request.body);
    if (!z.uuid().safeParse(request.params.id).success || !parsed.success) { response.status(400).json({ message: 'Revisa el estado y las notas de la cotización.' }); return; }
    const quote = await store!.updateQuote(request.params.id as string, parsed.data.status, parsed.data.internal_notes, parsed.data.expectedUpdatedAt);
    if (!quote) { response.status(409).json({ message: 'La cotización cambió. Vuelve a abrirla antes de guardar.' }); return; }
    response.json({ quote });
  });
  router.get('/content', async (_request, response) => response.json(await store!.content()));
  router.put('/content', async (request, response) => {
    const parsed = z.object({ data: contentSchema, version: z.number().int().min(1) }).strict().safeParse(request.body);
    if (!parsed.success) { response.status(400).json({ message: 'Revisa los textos y sus límites antes de publicar.' }); return; }
    try {
      const content = await store!.publish(parsed.data.data, parsed.data.version, response.locals.admin.email);
      onPublish(); response.json(content);
    } catch (error) {
      if (error instanceof StoreError && error.code === '40001') { response.status(409).json({ message: 'Otra sesión publicó cambios. Recarga el contenido antes de guardar.' }); return; }
      throw error;
    }
  });
  router.get('/content/history', async (_request, response) => response.json({ revisions: await store!.revisions() }));
  router.use((_request, response) => response.status(404).json({ message: 'Ruta no disponible.' }));
  router.use((_error: Error, _request: express.Request, response: express.Response, _next: express.NextFunction) => {
    response.status(503).json({ message: 'No pudimos completar la operación. Inténtalo nuevamente.' });
  });
  return router;
}
