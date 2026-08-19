import React, { useEffect, useState } from 'react';
import { Crown, AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface UserSubscriptionProps {
  className?: string;
}

export function UserSubscription({ className = '' }: UserSubscriptionProps) {
  const [subscription, setSubscription] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          setLoading(false);
          return;
        }

        // Fetch subscription data
        const { data: subData } = await supabase
          .from('stripe_user_subscriptions')
          .select('*')
          .single();

        if (subData) {
          setSubscription(subData);
        }

        // Fetch recent orders
        const { data: orderData } = await supabase
          .from('stripe_user_orders')
          .select('*')
          .order('order_date', { ascending: false })
          .limit(5);

        if (orderData) {
          setOrders(orderData);
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, []);

  if (loading) {
    return (
      <div className={`animate-pulse ${className}`}>
        <div className="h-4 bg-gray-200 rounded w-32"></div>
      </div>
    );
  }

  // Show active subscription if exists
  if (subscription?.subscription_status === 'active') {
    return (
      <div className={`flex items-center text-sm ${className}`}>
        <Crown className="w-4 h-4 text-yellow-500 mr-2" />
        <span className="text-gray-700 font-medium">
          Active Subscription
        </span>
      </div>
    );
  }

  // Show recent purchase if exists
  const recentPurchase = orders.find(order => order.payment_status === 'paid');
  if (recentPurchase) {
    return (
      <div className={`flex items-center text-sm ${className}`}>
        <Crown className="w-4 h-4 text-green-500 mr-2" />
        <span className="text-gray-700 font-medium">
          eBook Generator Access
        </span>
      </div>
    );
  }

  // Show no active plan
  return (
    <div className={`flex items-center text-sm ${className}`}>
      <AlertCircle className="w-4 h-4 text-gray-400 mr-2" />
      <span className="text-gray-500">
        No active plan
      </span>
    </div>
  );
}