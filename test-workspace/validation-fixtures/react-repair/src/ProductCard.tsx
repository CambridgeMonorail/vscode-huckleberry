import type { JSX } from 'react';
import { formatPrice, type Product } from './catalog.js';

export interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps): JSX.Element {
  return (
    <article aria-label={product.name}>
      <h2>{product.name}</h2>
      <p>{formatPrice(product.pricePence)}</p>
    </article>
  );
}
