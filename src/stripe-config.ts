export interface StripeProduct {
  id: string;
  priceId: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  mode: 'payment' | 'subscription';
}

export const STRIPE_PRODUCTS: StripeProduct[] = [
  {
    id: 'prod_TCLbIeDpOo3br8',
    priceId: 'price_1SFwu7HwKhNjrBLQjQ6ySF4a',
    name: 'eBook Generator',
    description: 'Generate professional eBooks with AI assistance',
    price: 4900, // Price in cents (49 EUR)
    currency: 'eur',
    mode: 'payment'
  }
];

export const getProductById = (id: string): StripeProduct | undefined => {
  return STRIPE_PRODUCTS.find(product => product.id === id);
};

export const getProductByPriceId = (priceId: string): StripeProduct | undefined => {
  return STRIPE_PRODUCTS.find(product => product.priceId === priceId);
};