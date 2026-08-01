import type { JSX } from 'react';
import { ProductCard } from './ProductCard.js';
import { sortProductsByPrice, type Product } from './catalog.js';

const products: Product[] = [
  { id: 'lamp', name: 'Desk lamp', pricePence: 3499 },
  { id: 'mug', name: 'Studio mug', pricePence: 1299 },
];

export function App(): JSX.Element {
  return (
    <main>
      {sortProductsByPrice(products).map(product => (
        <ProductCard key={product.id} product={product} />
      ))}
    </main>
  );
}
