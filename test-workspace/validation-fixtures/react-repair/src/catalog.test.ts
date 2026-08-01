import assert from 'node:assert/strict';
import test from 'node:test';
import { formatPrice, sortProductsByPrice } from './catalog.js';

test('formats integer pence as pounds', () => {
  assert.equal(formatPrice(1299), '£12.99');
});

test('sorts products by ascending price', () => {
  const products = sortProductsByPrice([
    { id: 'lamp', name: 'Desk lamp', pricePence: 3499 },
    { id: 'mug', name: 'Studio mug', pricePence: 1299 },
  ]);

  assert.deepEqual(products.map(product => product.id), ['mug', 'lamp']);
});
