'use client'

import React, { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { InventoryForecast } from '@/components/inventory/InventoryForecast'

export default function InventoryPage() {
  const { user, isLoading } = useAuth()
  const router = useRouter()
  
  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login')
    }
  }, [user, isLoading, router])
  
  if (isLoading || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }
  
  return (
    <div className="min-h-screen bg-white">
      <header className="bg-blue-900 text-white">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center">
            <svg className="h-6 w-6 text-white mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <h1 className="text-xl font-semibold">Restaurant Analytics</h1>
          </div>
          
          <nav className="flex space-x-4">
            <a href="/" className="px-3 py-2 text-sm font-medium text-white hover:text-blue-200">Dashboard</a>
            <a href="/inventory" className="px-3 py-2 text-sm font-medium text-white border-b-2 border-white">Inventory</a>
            <button
              onClick={() => router.push('/login')}
              className="px-3 py-2 text-sm font-medium text-white hover:text-red-200"
            >
              Logout
            </button>
          </nav>
        </div>
      </header>
      
      <main className="max-w-7xl mx-auto px-4 py-6">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Inventory Forecasting</h2>
          <p className="text-gray-600">
            Predict ingredient usage and reduce food waste with AI-powered forecasting
          </p>
        </div>
        
        <div className="card">
          <InventoryForecast />
        </div>
      </main>
    </div>
  )
} 