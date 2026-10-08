import express from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import { createClient } from '@supabase/supabase-js';
import { resolve } from 'node:path';
import { quoteRow, quoteSchema } from './quote.js';

const app = express();
const port = Number(process.env.PORT || 3000);
const database = process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY && process.env.SUPABASE_WRITE_KEY ? createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY, { auth: { persistSession: false, autoRefreshToken: false }, global: { headers: { Authorization: `Bearer ${process.env.SUPABASE_WRITE_KEY}` } } }) : null;
app.disable('x-powered-by');
app.set('trust proxy', 1);
app.use(helmet({ contentSecurityPolicy: { directives: {
  defaultSrc: ["'self'"], scriptSrc: ["'self'"], styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'], fontSrc: ["'self'", 'https://fonts.gstatic.com'], imgSrc: ["'self'", 'data:'], connectSrc: ["'self'"], objectSrc: ["'none'"], baseUri: ["'self'"], formAction: ["'self'"], upgradeInsecureRequests: process.env.PUBLIC_HTTPS === 'true' ? [] : null,
} }, crossOriginEmbedderPolicy: false, strictTransportSecurity: process.env.PUBLIC_HTTPS === 'true' ? undefined : false }));
app.use(express.json({ limit: '24kb' }));

app.get('/api/health', (_request, response) => response.json({ status: 'ok', quotesConfigured: Boolean(database) }));
app.use('/api/quotes', rateLimit({ windowMs: 15 * 60_000, limit: 10, standardHeaders: 'draft-8', legacyHeaders: false, message: { message: 'Has enviado varias solicitudes. Espera unos minutos antes de intentar de nuevo.' } }));
app.post('/api/quotes', async (request, response) => {
  const origin = request.get('origin');
  const allowed = (process.env.ALLOWED_ORIGINS || '').split(',').map(value => value.trim()).filter(Boolean);
  if (origin && allowed.length && !allowed.includes(origin)) { response.status(403).json({ message: 'La solicitud debe enviarse desde la web de Varcun.' }); return; }
  if (!request.is('application/json')) { response.status(415).json({ message: 'El formato de la solicitud no es válido.' }); return; }
  const parsed = quoteSchema.safeParse(request.body);
  if (!parsed.success) { response.status(400).json({ message: 'Revisa los datos del formulario, la cantidad y la autorización para contactarte.' }); return; }
  if (parsed.data.website) { response.status(400).json({ message: 'No pudimos registrar la solicitud.' }); return; }
  if (!database) { response.status(503).json({ message: 'El formulario no está disponible en este momento. Inténtalo más tarde.' }); return; }
  try {
    const { error } = await database.from('varcun_quote_requests').insert(quoteRow(parsed.data));
    // Reusing the same UUID after a network interruption prevents duplicate requests.
    if (error && error.code !== '23505') {
      console.error('Quote persistence failed', { code: error.code });
      response.status(503).json({ message: 'No pudimos guardar tu solicitud. Inténtalo nuevamente.' }); return;
    }
    response.status(201).json({ reference: parsed.data.requestId.slice(0, 8).toUpperCase() });
  } catch {
    response.status(503).json({ message: 'No pudimos conectar. Inténtalo nuevamente en unos minutos.' });
  }
});
app.use('/api', (_request, response) => response.status(404).json({ message: 'Ruta no disponible.' }));
app.use(express.static(resolve('dist'), { maxAge: '1h', setHeaders(response, path) { if (path.includes('assets')) response.setHeader('Cache-Control', 'public, max-age=31536000, immutable'); } }));
app.get('/{*path}', (_request, response) => response.sendFile(resolve('dist/index.html')));
app.use((error: Error, _request: express.Request, response: express.Response, _next: express.NextFunction) => {
  const malformed = error instanceof SyntaxError;
  response.status(malformed ? 400 : 500).json({ message: malformed ? 'El formato de la solicitud no es válido.' : 'No pudimos completar la solicitud.' });
});
const server = app.listen(port, '0.0.0.0', () => console.log(`Varcun listening on port ${port}; quotes ${database ? 'configured' : 'unconfigured'}`));
function shutdown() { server.close(() => process.exit(0)); setTimeout(() => process.exit(0), 10_000).unref(); }
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
