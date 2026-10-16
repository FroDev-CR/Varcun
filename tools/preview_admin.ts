// Local UI preview with disposable, clearly labelled fixtures; no database credentials.
import express from 'express';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { adminFixture } from './admin-fixture.js';
import { newSession } from '../server/admin-auth.js';
import { createAdminRouter } from '../server/admin.js';
import { renderPageHtml } from '../server/site-metadata.js';

const fixture = await adminFixture(true);
const app = express();
app.use(express.json({ limit: '24kb' }));
app.get('/api/content', (_request, response) => response.json({ content: fixture.state.content.data }));
app.use('/api/admin', createAdminRouter({ store: fixture.store, secure: false, origins: ['http://127.0.0.1:3017'] }));
app.use(express.static(resolve('dist'), { index: false }));
const template = () => readFileSync(resolve('dist/index.html'), 'utf8').replace('<body>', '<body><div style="background:#fff2d6;color:#6e531b;padding:8px 20px;font:11px sans-serif;text-align:center">DEMOSTRACIÓN LOCAL · Datos ficticios · Los cambios de esta prueba no afectan la web pública</div>');
app.get('/{*path}', async (request, response) => {
  if (request.path === '/admin') {
    const session = newSession(fixture.state.account!.password_hash);
    await fixture.store.addSession(session);
    response.cookie('varcun_admin_dev', session.token, { httpOnly: true, sameSite: 'strict', path: '/' });
  }
  response.type('html').send(renderPageHtml(template(), request.path, fixture.state.content.data));
});
app.listen(3017, '127.0.0.1', () => console.log('Disposable Varcun admin preview: http://127.0.0.1:3017/admin'));
