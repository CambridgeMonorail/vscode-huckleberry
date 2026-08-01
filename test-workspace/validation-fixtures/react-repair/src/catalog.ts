export interface Product {
  id: string;
  name: string;
  pricePence: number;
}

export function formatPrice(pricePence: number): string {
  return `£${(pricePence / 100).toFixed(2)}`;
}

export function sortProductsByPrice(products: Product[]): Product[] {
  return [...products].sort((a, b) => a.pricePence - b.pricePence);
}
