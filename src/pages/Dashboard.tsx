import React from 'react'
import { useAuth } from '../lib/auth'
import { useLanguage } from '../lib/LanguageContext'
import { SubscriptionStatus } from '../components/SubscriptionStatus'
import { Button } from '../components/ui/Button'
import { Link } from 'react-router-dom'

export function Dashboard() {
  const { user, signOut } = useAuth()
  const { t } = useLanguage()

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{t.dashboardTitle}</h1>
              <p className="text-gray-600 mt-2">{t.welcomeBack}, {user?.email}</p>
            </div>
            <Button variant="outline" onClick={signOut}>
              {t.signOut}
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div>
            <SubscriptionStatus />
          </div>

          <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {t.quickActions}
            </h3>
            <div className="space-y-3">
              <Button asChild className="w-full" variant="outline">
                <Link to="/products">{t.browseProducts}</Link>
              </Button>
              <Button asChild className="w-full" variant="outline">
                <Link to="/orders">{t.viewOrderHistory}</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
