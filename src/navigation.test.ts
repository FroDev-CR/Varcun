import assert from 'node:assert/strict';
import { test } from 'node:test';
import { resolveSiteLocation } from './navigation';

test('direct page URLs and trailing slashes select the requested view', () => {
  assert.equal(resolveSiteLocation('/').page, 'inicio');
  assert.equal(resolveSiteLocation('/catalogo').page, 'catalogo');
  assert.equal(resolveSiteLocation('/personalizacion/').page, 'personalizacion');
  assert.equal(resolveSiteLocation('/nosotros').page, 'nosotros');
  assert.equal(resolveSiteLocation('/cotizar/').href, '/cotizar');
});

test('shared links from the former landing page reach the matching new page', () => {
  assert.equal(resolveSiteLocation('/', '#catalogo').href, '/catalogo');
  assert.equal(resolveSiteLocation('/', '#servicios').href, '/personalizacion');
  assert.equal(resolveSiteLocation('/', '#nosotros').href, '/nosotros');
  assert.equal(resolveSiteLocation('/', '#contacto').href, '/cotizar');
});

test('links to featured products and the process preserve their destination within the new page', () => {
  assert.deepEqual(resolveSiteLocation('/', '#destacados'), { page: 'catalogo', href: '/catalogo#destacados', hash: '#destacados' });
  assert.deepEqual(resolveSiteLocation('/', '#proceso'), { page: 'personalizacion', href: '/personalizacion#proceso', hash: '#proceso' });
  assert.equal(resolveSiteLocation('/cotizar', '#contacto').href, '/cotizar#contacto');
});

test('the accessibility skip link stays on the current page', () => {
  assert.deepEqual(resolveSiteLocation('/nosotros', '#contenido'), { page: 'nosotros', href: '/nosotros#contenido', hash: '#contenido' });
  assert.equal(resolveSiteLocation('/', '#contenido').page, 'inicio');
});
