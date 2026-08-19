import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { CheckCircle, Download, ArrowRight, Loader2, Mail, Clock, Sparkles } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useLanguage } from '../lib/LanguageContext';

export function Success() {
  const { t } = useLanguage();
  const [searchParams] = useSearchParams();
  const [isLoading, setIsLoading] = useState(true);
  const [orderDetails, setOrderDetails] = useState<any>(null);
  const sessionId = searchParams.get('session_id');

  useEffect(() => {
    const fetchOrderDetails = async () => {
      if (!sessionId) {
        setIsLoading(false);
        return;
      }

      try {
        // Fetch order details from the database
        const { data: orders, error } = await supabase
          .from('orders')
          .select('*')
          .eq('stripe_session_id', sessionId)
          .single();

        if (error) {
          console.error('Error fetching order:', error);
        } else {
          setOrderDetails(orders);

          // Fire conversion tracking events
          if (orders) {
            // Facebook/Meta Pixel
            if (typeof window !== 'undefined' && (window as any).fbq) {
              (window as any).fbq('track', 'Purchase', {
                value: orders.amount / 100,
                currency: orders.currency?.toUpperCase() || 'EUR',
                content_ids: [orders.id],
                content_type: 'product'
              });
            }

            // Google Analytics (GA4)
            if (typeof window !== 'undefined' && (window as any).gtag) {
              (window as any).gtag('event', 'purchase', {
                transaction_id: orders.id,
                value: orders.amount / 100,
                currency: orders.currency?.toUpperCase() || 'EUR',
                items: [{
                  item_id: orders.id,
                  item_name: 'AI eBook Generation',
                  price: orders.amount / 100,
                  quantity: 1
                }]
              });
            }

            // LinkedIn Insight Tag
            if (typeof window !== 'undefined' && (window as any).lintrk) {
              (window as any).lintrk('track', { conversion_id: orders.id });
            }
          }
        }
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrderDetails();
  }, [sessionId]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-fish-blue mx-auto mb-4" />
          <p className="text-gray-600">{t.orderDetailsLoading}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-purple-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Success Animation Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-24 h-24 bg-green-100 rounded-full mb-6 animate-bounce">
            <CheckCircle className="w-16 h-16 text-green-600" />
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-4">
            {t.thankYouTitle}
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            {t.paymentSuccessMessage}
          </p>
        </div>

        {/* Main Content Card */}
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          {/* Order Details Section */}
          {orderDetails && (
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold">{t.orderDetails}</h2>
                <Sparkles className="w-8 h-8" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                  <p className="text-blue-100 text-sm mb-1">{t.orderNumber}</p>
                  <p className="font-bold text-lg">{orderDetails.id.substring(0, 8)}...</p>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                  <p className="text-blue-100 text-sm mb-1">{t.amount}</p>
                  <p className="font-bold text-lg">
                    {new Intl.NumberFormat('nl-BE', {
                      style: 'currency',
                      currency: orderDetails.currency?.toUpperCase() || 'EUR',
                    }).format(orderDetails.amount / 100)}
                  </p>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                  <p className="text-blue-100 text-sm mb-1">{t.status}</p>
                  <p className="font-bold text-lg flex items-center gap-2">
                    <CheckCircle className="w-5 h-5" />
                    {orderDetails.payment_status === 'paid' ? t.paid : orderDetails.payment_status}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* What's Next Section */}
          <div className="p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
              {t.whatHappensNext}
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="text-center">
                <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Sparkles className="w-8 h-8 text-blue-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">{t.step1AiGeneration}</h3>
                <p className="text-sm text-gray-600">
                  {t.step1AiDesc}
                </p>
              </div>

              <div className="text-center">
                <div className="bg-purple-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Clock className="w-8 h-8 text-purple-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">{t.step2Processing}</h3>
                <p className="text-sm text-gray-600">
                  {t.step2ProcessingDesc}
                </p>
              </div>

              <div className="text-center">
                <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Mail className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">{t.step3Delivery}</h3>
                <p className="text-sm text-gray-600">
                  {t.step3DeliveryDesc}
                </p>
              </div>
            </div>

            {/* Info Box */}
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-200 rounded-xl p-6 mb-8">
              <div className="flex items-start gap-4">
                <Mail className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" />
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">
                    {t.confirmationEmailTitle}
                  </h4>
                  <p className="text-sm text-gray-600">
                    {t.confirmationEmailMessage}
                  </p>
                </div>
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="space-y-4">
              {orderDetails && (
                <Link
                  to="/portal"
                  state={{ selectedOrderId: orderDetails.id }}
                  className="flex items-center justify-center gap-2 w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold py-4 px-6 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
                >
                  {t.viewMyOrder}
                  <ArrowRight className="w-5 h-5" />
                </Link>
              )}
              <Link
                to="/"
                className="flex items-center justify-center gap-2 w-full bg-white hover:bg-gray-50 text-gray-700 font-semibold py-4 px-6 rounded-xl border-2 border-gray-200 transition-all duration-200"
              >
                {t.backToHome}
              </Link>
            </div>
          </div>
        </div>

        {/* Additional Info */}
        <div className="text-center mt-8 text-gray-600">
          <p className="text-sm">
            {t.questionsContact}{' '}
            <a href="mailto:support@fishdigital.be" className="text-blue-600 hover:underline font-medium">
              support@fishdigital.be
            </a>
          </p>
        </div>
      </div>

      {/* Conversion Tracking Data Layer */}
      <script
        type="application/json"
        id="conversion-data"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            event: 'purchase',
            transactionId: orderDetails?.id,
            transactionTotal: orderDetails?.amount ? orderDetails.amount / 100 : 0,
            transactionCurrency: orderDetails?.currency?.toUpperCase() || 'EUR',
          })
        }}
      />
    </div>
  );
}