import React from 'react';
import { STRIPE_PRODUCTS } from '../stripe-config';
import { ProductCard } from '../components/ProductCard';
import { Footer } from '../components/Footer';
import { Navigation } from '../components/Navigation';
import { useLanguage } from '../lib/LanguageContext';

export function Pricing() {
  const { t } = useLanguage();

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <div className="py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            {t.pricingTitle}
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            {t.pricingSubtitle}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {STRIPE_PRODUCTS.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
            />
          ))}
        </div>

        <div className="mt-16 text-center">
          <div className="bg-white rounded-lg shadow-lg p-8 max-w-2xl mx-auto">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              {t.pricingWhyChoose}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">{t.pricingAiContent}</h3>
                <p className="text-gray-600 text-sm">
                  {t.pricingAiContentDesc}
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">{t.pricingProfDesign}</h3>
                <p className="text-gray-600 text-sm">
                  {t.pricingProfDesignDesc}
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">{t.pricingMultiFormat}</h3>
                <p className="text-gray-600 text-sm">
                  {t.pricingMultiFormatDesc}
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">{t.pricingInstantAccess}</h3>
                <p className="text-gray-600 text-sm">
                  {t.pricingInstantAccessDesc}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
      </div>
      <Footer />
    </div>
  );
}