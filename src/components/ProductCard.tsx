import React, { useState } from 'react';
import { Book, Check, Loader2 } from 'lucide-react';
import { StripeProduct } from '../stripe-config';
import { supabase } from '../lib/supabase';

interface ProductCardProps {
  product: StripeProduct;
  onPurchase?: (product: StripeProduct) => void;
}

export function ProductCard({ product, onPurchase }: ProductCardProps) {
  const [isLoading, setIsLoading] = useState(false);

  const formatPrice = (price: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(price / 100);
  };

  const handlePurchase = async () => {
    setIsLoading(true);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        // Redirect to login if not authenticated
        window.location.href = '/login';
        return;
      }

      // Call the checkout edge function
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: {
          priceId: product.priceId,
          mode: product.mode,
          successUrl: `${window.location.origin}/success`,
          cancelUrl: window.location.href,
        },
      });

      if (error) {
        console.error('Checkout error:', error);
        alert('Failed to create checkout session. Please try again.');
        return;
      }

      if (data?.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      console.error('Purchase error:', error);
      alert('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 border border-gray-200 hover:shadow-xl transition-shadow">
      <div className="flex items-center mb-4">
        <Book className="w-8 h-8 text-indigo-600 mr-3" />
        <h3 className="text-xl font-semibold text-gray-900">{product.name}</h3>
      </div>
      
      <p className="text-gray-600 mb-6">{product.description}</p>
      
      <div className="flex items-center justify-between mb-6">
        <div className="text-3xl font-bold text-gray-900">
          {formatPrice(product.price, product.currency)}
        </div>
        <div className="text-sm text-gray-500">
          {product.mode === 'payment' ? 'One-time payment' : 'Monthly subscription'}
        </div>
      </div>

      <div className="space-y-3 mb-6">
        <div className="flex items-center text-sm text-gray-600">
          <Check className="w-4 h-4 text-green-500 mr-2" />
          AI-powered content generation
        </div>
        <div className="flex items-center text-sm text-gray-600">
          <Check className="w-4 h-4 text-green-500 mr-2" />
          Professional formatting
        </div>
        <div className="flex items-center text-sm text-gray-600">
          <Check className="w-4 h-4 text-green-500 mr-2" />
          Professional PDF format
        </div>
        <div className="flex items-center text-sm text-gray-600">
          <Check className="w-4 h-4 text-green-500 mr-2" />
          Instant download
        </div>
      </div>

      <button
        onClick={handlePurchase}
        disabled={isLoading}
        className="w-full bg-indigo-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
      >
        {isLoading ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Processing...
          </>
        ) : (
          'Purchase Now'
        )}
      </button>
    </div>
  );
}