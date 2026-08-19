import React, { useEffect, useState } from 'react'
import { getUserSubscription } from '../lib/stripe'
import { getProductByPriceId } from '../stripe-config'
import { Alert } from './ui/Alert'

interface Subscription {
  subscription_status: string
  price_id: string | null
  current_period_end: number | null
  cancel_at_period_end: boolean
}

export function SubscriptionStatus() {
  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchSubscription() {
      try {
        const data = await getUserSubscription()
        setSubscription(data)
      } catch (error) {
        console.error('Error fetching subscription:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchSubscription()
  }, [])

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
        <div className="h-3 bg-gray-200 rounded w-1/2"></div>
      </div>
    )
  }

  if (!subscription || !subscription.price_id) {
    return (
      <Alert type="info">
        No active subscription found.
      </Alert>
    )
  }

  const product = getProductByPriceId(subscription.price_id)
  const isActive = subscription.subscription_status === 'active'
  const endDate = subscription.current_period_end 
    ? new Date(subscription.current_period_end * 1000).toLocaleDateString()
    : null

  return (
    <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Subscription Status
      </h3>
      
      <div className="space-y-3">
        <div>
          <span className="text-sm font-medium text-gray-500">Plan:</span>
          <p className="text-gray-900">{product?.name || 'Unknown Plan'}</p>
        </div>
        
        <div>
          <span className="text-sm font-medium text-gray-500">Status:</span>
          <p className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ml-2 ${
            isActive 
              ? 'bg-green-100 text-green-800' 
              : 'bg-yellow-100 text-yellow-800'
          }`}>
            {subscription.subscription_status.replace('_', ' ').toUpperCase()}
          </p>
        </div>
        
        {endDate && (
          <div>
            <span className="text-sm font-medium text-gray-500">
              {subscription.cancel_at_period_end ? 'Ends on:' : 'Renews on:'}
            </span>
            <p className="text-gray-900">{endDate}</p>
          </div>
        )}
        
        {subscription.cancel_at_period_end && (
          <Alert type="warning">
            Your subscription will end on {endDate}. You can resubscribe anytime.
          </Alert>
        )}
      </div>
    </div>
  )
}