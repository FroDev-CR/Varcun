import test from 'node:test';
import assert from 'node:assert/strict';
import { quoteSchema, quoteRow } from './quote.js';
const valid = { requestId: 'd3abc789-bd25-4d23-a161-b3551a2e7759', name: 'Proyecto de prueba', email: 'PRUEBA@example.com', category: 'botellas', quantity: 100, message: 'Una cotización de prueba para revisar la validación.', products: ['BO-2401'], consent: true };
test('accepts a real catalog category and normalizes the persisted fields', () => {
  const row = quoteRow(quoteSchema.parse(valid));
  assert.equal(row.email, 'prueba@example.com'); assert.equal(row.phone, null); assert.deepEqual(row.product_codes, ['BO-2401']);
});
test('rejects invalid quantities, unsupported product codes and categories', () => {
  for (const patch of [{quantity: 0}, {quantity: 1.5}, {quantity: 1_000_001}, {products: ['FAKE-123']}, {category: 'unknown'}, {products: ['BO-2401','BO-2401']}]) assert.equal(quoteSchema.safeParse({...valid,...patch}).success,false);
});
test('requires consent and prevents unbounded or malformed submissions', () => {
  for (const patch of [{consent:false},{name:'x'},{email:'invalid'},{message:'short'},{message:'x'.repeat(4001)},{extra:'unexpected'},{requestId:'bad-id'}]) assert.equal(quoteSchema.safeParse({...valid,...patch}).success,false);
});
