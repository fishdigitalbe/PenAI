import React from 'react'
import { AlertCircle, CheckCircle, Info, X } from 'lucide-react'

interface AlertProps {
  type?: 'success' | 'error' | 'info' | 'warning'
  title?: string
  children: React.ReactNode
  onClose?: () => void
}

export function Alert({ type = 'info', title, children, onClose }: AlertProps) {
  const icons = {
    success: CheckCircle,
    error: AlertCircle,
    info: Info,
    warning: AlertCircle,
  }

  const colors = {
    success: 'bg-green-50 border-green-200 text-green-800',
    error: 'bg-red-50 border-red-200 text-red-800',
    info: 'bg-blue-50 border-blue-200 text-blue-800',
    warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
  }

  const iconColors = {
    success: 'text-green-400',
    error: 'text-red-400',
    info: 'text-blue-400',
    warning: 'text-yellow-400',
  }

  const Icon = icons[type]

  return (
    <div className={`rounded-md border p-4 ${colors[type]}`}>
      <div className="flex">
        <div className="flex-shrink-0">
          <Icon className={`h-5 w-5 ${iconColors[type]}`} />
        </div>
        <div className="ml-3 flex-1">
          {title && (
            <h3 className="text-sm font-medium mb-1">{title}</h3>
          )}
          <div className="text-sm">{children}</div>
        </div>
        {onClose && (
          <div className="ml-auto pl-3">
            <div className="-mx-1.5 -my-1.5">
              <button
                type="button"
                onClick={onClose}
                className={`inline-flex rounded-md p-1.5 focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                  type === 'success' ? 'text-green-500 hover:bg-green-100 focus:ring-green-600' :
                  type === 'error' ? 'text-red-500 hover:bg-red-100 focus:ring-red-600' :
                  type === 'warning' ? 'text-yellow-500 hover:bg-yellow-100 focus:ring-yellow-600' :
                  'text-blue-500 hover:bg-blue-100 focus:ring-blue-600'
                }`}
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}