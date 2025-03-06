'use client'

import React, { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { MenuOptimizer } from '@/components/optimization/MenuOptimizer'

export default function OptimizationPage() {
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
      <header className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <svg className="h-8 w-8 text-blue-600 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              <h1 className="text-xl font-bold text-gray-900">Restaurant Analytics</h1>
            </div>
            
            <nav className="flex space-x-4">
              <a href="/" className="px-3 py-2 text-sm font-medium text-gray-700 hover:text-blue-600">Dashboard</a>
              <a href="/optimization" className="px-3 py-2 text-sm font-medium text-blue-600 border-b-2 border-blue-600">Menu Optimization</a>
              <button
                onClick={() => router.push('/login')}
                className="px-3 py-2 text-sm font-medium text-gray-700 hover:text-red-600"
              >
                Logout
              </button>
            </nav>
          </div>
        </div>
      </header>
      
      <main className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Menu Optimization</h2>
          <p className="text-gray-600">Use AI to optimize your menu pricing for maximum profit</p>
        </div>
        
        <MenuOptimizer />
      </main>
    </div>
  )
} 