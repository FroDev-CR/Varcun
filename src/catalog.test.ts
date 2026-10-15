import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { categories, products, productsInCategory, searchProducts, featuredProducts, productImageHref } from './catalog';

test('bottles and pens contain every reference from their PDF sections', () => {
  const expected = {
    botellas: ['BO-2602','BO-2601','BO-1803','BO-2303','BO-1705','BO-1702','BO-1504','BO-2405','BO-2403','BO-2402','BO-2304','BO-1708','BO-1707','BO-2401'],
    lapiceros: ['LA-2403','LA-2402','LA-2401','LA-2209','LA-2208','LA-2207','LA-2206','LA-2205','LA-2201','LA-1803','LA-2592','LA-2591','LA-1306','LA-1212'],
  };
  for (const [category, codes] of Object.entries(expected)) {
    assert.deepEqual(productsInCategory(category).map(item => item.code).sort(), codes.sort());
  }
});

test('all thirteen categories have their complete inventory and every product has a real image', () => {
  const expectedCounts: Record<string, number> = { botellas:14, vasos:10, oficina:17, bolsas:8, gorras:7, maletines:16, electronicos:10, eco:14, lapiceros:14, llaveros:8, herramientas:5, sublimacion:4, otros:3 };
  assert.equal(products.length, 110);
  assert.equal(new Set(products.map(item => item.code)).size, 110);
  for (const category of categories) assert.equal(productsInCategory(category.id).length, expectedCounts[category.id], category.name);
  for (const item of products) {
    assert.ok(existsSync(new URL(`../public${productImageHref(item)}`, import.meta.url)), item.code);
    for (const category of item.categories) {
      assert.ok(categories.some(value => value.id === category), category);
      assert.ok(item.pages[category] >= 4 && item.pages[category] <= 81, item.code);
    }
  }
  assert.deepEqual(featuredProducts.map(item => item.code), ['BO-2401','AO-2601','GO-1011','VA-2501']);
});

test('cross-listed products share a single selection code and retain the correct PDF pages', () => {
  const bottle = products.find(item => item.code === 'BO-2405')!;
  assert.ok(productsInCategory('botellas').includes(bottle));
  assert.ok(productsInCategory('sublimacion').includes(bottle));
  assert.equal(bottle.pages.botellas, 24);
  assert.equal(bottle.pages.sublimacion, 69);
  const notebook = products.find(item => item.code === 'AO-2402')!;
  assert.equal(notebook.pages.oficina, 5);
  assert.equal(notebook.pages.eco, 72);
  assert.ok(productsInCategory('bolsas').some(item => item.code === 'BP-2505'));
});

test('category search finds product codes and accented names without leaving the category', () => {
  assert.deepEqual(searchProducts('botellas', 'bo-2602').map(item => item.code), ['BO-2602']);
  assert.deepEqual(searchProducts('lapiceros', 'bambu').map(item => item.code), ['LA-2401']);
  assert.deepEqual(searchProducts('botellas', 'LA-2401'), []);
  assert.deepEqual(searchProducts('botellas', 'no-existe'), []);
  assert.equal(searchProducts('botellas', ' ').length, 14);
});
