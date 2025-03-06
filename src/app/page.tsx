'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { FileUploader } from '@/components/upload/FileUploader'
import { SalesForm } from '@/components/forms/SalesForm'
import { SalesChart } from '@/components/charts/SalesChart'
import { MenuOptimizer } from '@/components/optimization/MenuOptimizer'
import { InventoryForecastSummary } from '@/components/inventory/InventoryForecastSummary'
import { useAuth } from '@/contexts/AuthContext'

export default function Home() {
  const [salesData, setSalesData] = useState<any[]>([])
  const { user, logout, isLoading } = useAuth()
  const router = useRouter()
  
  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login')
    }
  }, [user, isLoading, router])
  
  // Load user-specific data from localStorage
  useEffect(() => {
    if (user) {
      const savedData = localStorage.getItem(`restaurantSalesData_${user.username}`)
      if (savedData) {
        try {
          const parsedData = JSON.parse(savedData)
          if (Array.isArray(parsedData)) {
            setSalesData(parsedData)
          }
        } catch (e) {
          console.error('Error loading saved data:', e)
        }
      }
    }
  }, [user])
  
  // Save user-specific data to localStorage
  useEffect(() => {
    if (user && salesData.length > 0) {
      localStorage.setItem(`restaurantSalesData_${user.username}`, JSON.stringify(salesData))
    }
  }, [salesData, user])
  
  const handleAddSalesData = (newData: any) => {
    setSalesData(prev => [...prev, newData])
  }
  
  // Optimized file upload handler with batched updates
  const handleFileUpload = useCallback((data: any[]) => {
    if (!Array.isArray(data) || data.length === 0) return;
    
    // Use a more efficient approach for large datasets
    if (data.length > 1000) {
      // For very large datasets, batch the updates
      const batchSize = 1000;
      let currentBatch = 0;
      
      const processBatch = () => {
        const start = currentBatch * batchSize;
        const end = Math.min(start + batchSize, data.length);
        const batch = data.slice(start, end);
        
        setSalesData(prev => [...prev, ...batch]);
        
        currentBatch++;
        if (currentBatch * batchSize < data.length) {
          // Process next batch on next animation frame
          requestAnimationFrame(processBatch);
        }
      };
      
      processBatch();
    } else {
      // For smaller datasets, update all at once
      setSalesData(prev => [...prev, ...data]);
    }
  }, []);
  
  const handleLogout = () => {
    logout()
    router.push('/login')
  }
  
  const handleClearData = () => {
    if (window.confirm('Are you sure you want to clear all sales data?')) {
      setSalesData([])
      if (user) {
        localStorage.removeItem(`restaurantSalesData_${user.username}`)
      }
    }
  }
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };
  
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
            <a href="/" className="px-3 py-2 text-sm font-medium text-white border-b-2 border-white">Dashboard</a>
            <a href="/inventory" className="px-3 py-2 text-sm font-medium text-white hover:text-blue-200">Inventory</a>
            <button
              onClick={handleLogout}
              className="px-3 py-2 text-sm font-medium text-white hover:text-red-200"
            >
              Logout
            </button>
          </nav>
        </div>
      </header>
      
      <main className="max-w-7xl mx-auto px-4 py-6">
        <div className="mb-6 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Restaurant Analytics Dashboard</h2>
            <p className="text-gray-600">
              Welcome back, {user.displayName}. Here's your restaurant performance overview.
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Account created: {user.createdAt ? formatDate(user.createdAt) : 'N/A'} 
              {user.email && ` • ${user.email}`}
            </p>
          </div>
          
          {salesData.length > 0 && (
            <button
              onClick={handleClearData}
              className="px-4 py-2 bg-red-50 text-red-600 border border-red-200 rounded-md text-sm hover:bg-red-100"
            >
              Clear All Data
            </button>
          )}
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <div className="card">
              <h3 className="text-lg font-medium mb-4">Add Sales Data</h3>
              <SalesForm onSubmit={handleAddSalesData} />
              
              <div className="mt-8 pt-6 border-t border-gray-200">
                <h3 className="text-lg font-medium mb-4">Upload CSV</h3>
                <FileUploader onUploadComplete={handleFileUpload} />
              </div>
            </div>
          </div>
          
          <div className="lg:col-span-2">
            <div className="card h-full">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium">Sales Visualization</h3>
                <div className="flex space-x-2">
                  <button className="p-1 text-gray-500 hover:text-gray-700">
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                    </svg>
                  </button>
                  <button className="p-1 text-gray-500 hover:text-gray-700">
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </button>
                </div>
              </div>
              
              {salesData.length > 0 ? (
                <SalesChart data={salesData} />
              ) : (
                <div className="flex flex-col items-center justify-center h-[400px] text-gray-500">
                  <svg className="h-16 w-16 mb-4 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  <p className="text-center">No sales data available yet.</p>
                  <p className="text-center text-sm">Add sales data or import a CSV file to see visualization.</p>
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Dashboard Features Section */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Menu Optimizer Section */}
          <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
            <div className="mb-4">
              <h3 className="text-lg font-medium">AI-Powered Menu Optimization</h3>
              <p className="text-sm text-gray-600">Optimize your menu pricing for maximum profit based on sales data, costs, and competitor pricing.</p>
            </div>
            
            <MenuOptimizer />
          </div>
          
          {/* Inventory Forecast Section */}
          <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
            <div className="mb-4">
              <h3 className="text-lg font-medium">Smart Inventory Forecasting</h3>
              <p className="text-sm text-gray-600">Predict ingredient usage and reduce food waste with AI-powered forecasting.</p>
            </div>
            
            <InventoryForecastSummary />
            
            <div className="mt-4">
              <a 
                href="/inventory" 
                className="inline-block w-full text-center px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                View Full Inventory Dashboard
              </a>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
} 