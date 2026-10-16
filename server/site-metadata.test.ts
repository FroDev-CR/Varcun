import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { test } from 'node:test';
import { catalogProducts } from './catalog-data';
import { escapeHtml, metadataTags, pageMetadata, productFromPath, productHref, renderPageHtml } from './site-metadata';

test('all product links resolve to unique public photos and complete metadata without JavaScript', () => {
  const template = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
  const urls = new Set<string>();
  for (const product of catalogProducts) {
    const path = productHref(product.code);
    const metadata = pageMetadata(path);
    const html = renderPageHtml(template, path);
    assert.equal(productFromPath(path)?.code, product.code);
    assert.equal(metadata.notFound, false);
    assert.equal(metadata.title, `${product.name} · ${product.code} | Varcun`);
    assert.ok(metadata.description.includes(product.description));
    assert.ok(metadata.image.endsWith(`/${product.code.toLowerCase()}-v1.jpg`));
    assert.ok(existsSync(new URL(`../public${new URL(metadata.image).pathname}`, import.meta.url)), product.code);
    assert.ok(html.includes(`<meta property="og:url" content="https://varcun.com${path}"`));
    assert.ok(html.includes(`<meta property="og:image" content="${metadata.image}"`));
    assert.equal((html.match(/property="og:image"/g) ?? []).length, 1);
    assert.equal((html.match(/<title>/g) ?? []).length, 1);
    urls.add(metadata.url);
  }
  assert.equal(urls.size, 110);
});

test('general pages use the logo, canonical origin and valid JPEG dimensions', () => {
  for (const path of ['/', '/catalogo', '/personalizacion', '/nosotros', '/cotizar']) {
    const metadata = pageMetadata(path);
    assert.equal(metadata.notFound, false);
    assert.equal(metadata.image, 'https://varcun.com/images/compartir/varcun-v1.jpg');
    assert.equal(metadata.url, `https://varcun.com${path}`);
    assert.ok(metadataTags(metadata).includes('property="og:image:width" content="800"'));
  }
  assert.ok(existsSync(new URL('../public/images/compartir/varcun-v1.jpg', import.meta.url)));
});

test('invalid and hostile product paths return noindex and cannot inject markup', () => {
  for (const path of ['/productos/no-existe', '/productos/bo-2401/otra', '/productos/%22%3E%3Cscript%3E', '/<script>', '/__proto__', '/constructor']) {
    const metadata = pageMetadata(path);
    const html = metadataTags(metadata);
    assert.equal(metadata.notFound, true);
    assert.ok(html.includes('content="noindex, follow"'));
    assert.ok(!html.includes('<script>'));
  }
  assert.equal(escapeHtml('"<&>\''), '&quot;&lt;&amp;&gt;&#39;');
  assert.equal(productFromPath('/productos/BO-2401/')?.code, 'BO-2401');
  const template = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
  assert.equal((renderPageHtml(template, '/$&').match(/property="og:image"/g) ?? []).length, 1);
});
