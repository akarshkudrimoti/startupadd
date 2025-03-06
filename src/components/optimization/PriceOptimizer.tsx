'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import axios from 'axios'

interface MenuItem {
  id: string;
  name: string;
  cost: number;
  currentPrice: number;
  salesVolume: number;
  profitMargin?: number;
  suggestedPrice?: number;
  suggestedMargin?: number;
}

interface OptimizationSettings {
  targetMargin: number;
  highVolumeBonus: number;
  lowVolumeDiscount: number;
  maxPriceIncrease: number;
  minPriceDecrease: number;
}

export function PriceOptimizer() {
  const { user } = useAuth()
  const [menuItems, setMenuItems] = useState<MenuItem[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [file, setFile] = useState<File | null>(null)
  const [optimized, setOptimized] = useState(false)
  const [summaryData, setSummaryData] = useState<any>(null)
  
  // Optimization settings
  const [settings, setSettings] = useState<OptimizationSettings>({
    targetMargin: 65, // Default target profit margin (%)
    highVolumeBonus: 10, // Additional margin for high-volume items (%)
    lowVolumeDiscount: 5, // Reduced margin for low-volume items (%)
    maxPriceIncrease: 15, // Maximum price increase allowed (%)
    minPriceDecrease: 5, // Minimum price decrease allowed (%)
  })
  
  // File input ref
  const fileInputRef = React.useRef<HTMLInputElement>(null)
  
  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      setFile(selectedFile)
      processFile(selectedFile)
    }
  }
  
  // Handle drag over
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
  }
  
  // Handle file drop
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    
    const droppedFile = e.dataTransfer.files?.[0]
    if (droppedFile) {
      setFile(droppedFile)
      processFile(droppedFile)
    }
  }
  
  // Process the CSV file - simplified to just handle Food, Cost, and Date
  const processFile = (file: File) => {
    setLoading(true)
    setError(null)
    setOptimized(false)
    
    const formData = new FormData()
    formData.append('file', file)
    
    axios.post('http://localhost:8000/api/upload-csv', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
    .then(response => {
      if (response.data.success) {
        setMenuItems(response.data.data)
        setLoading(false)
      } else {
        setError(response.data.error || 'Unknown error processing file')
        setLoading(false)
      }
    })
    .catch(err => {
      console.error('Error uploading CSV:', err)
      setError(err.response?.data?.detail || 'Error uploading the CSV file')
      setLoading(false)
    })
  }
  
  // Optimize prices
  const optimizePrices = () => {
    setLoading(true)
    
    const formData = new FormData()
    formData.append('menu_items', JSON.stringify(menuItems))
    formData.append('settings', JSON.stringify(settings))
    
    axios.post('http://localhost:8000/api/optimize', formData)
    .then(response => {
      if (response.data.success) {
        setMenuItems(response.data.data)
        setSummaryData(response.data.summary)
        setOptimized(true)
        setLoading(false)
      } else {
        setError(response.data.error || 'Unknown error optimizing prices')
        setLoading(false)
      }
    })
    .catch(err => {
      console.error('Error optimizing prices:', err)
      setError(err.response?.data?.detail || 'Error optimizing prices')
      setLoading(false)
    })
  }
  
  // Handle settings change
  const handleSettingChange = (key: keyof OptimizationSettings, value: any) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }))
    
    // Re-optimize if already optimized
    if (optimized) {
      setTimeout(optimizePrices, 0)
    }
  }
  
  // Calculate summary statistics
  const calculatedSummary = useMemo(() => {
    if (menuItems.length === 0) return null
    
    const currentRevenue = menuItems.reduce((sum, item) => sum + (item.currentPrice * item.salesVolume), 0)
    const currentCost = menuItems.reduce((sum, item) => sum + (item.cost * item.salesVolume), 0)
    const currentProfit = currentRevenue - currentCost
    const currentMargin = (currentProfit / currentRevenue) * 100
    
    let suggestedRevenue = 0
    let suggestedProfit = 0
    
    if (optimized) {
      suggestedRevenue = menuItems.reduce((sum, item) => sum + ((item.suggestedPrice || item.currentPrice) * item.salesVolume), 0)
      suggestedProfit = suggestedRevenue - currentCost
    }
    
    return {
      currentRevenue,
      currentCost,
      currentProfit,
      currentMargin,
      suggestedRevenue,
      suggestedProfit,
      suggestedMargin: (suggestedProfit / suggestedRevenue) * 100,
      profitIncrease: suggestedProfit - currentProfit,
      profitIncreasePercentage: ((suggestedProfit - currentProfit) / currentProfit) * 100
    }
  }, [menuItems, optimized])
  
  // Sort items by sales volume (descending)
  const sortedItems = useMemo(() => {
    return [...menuItems].sort((a, b) => b.salesVolume - a.salesVolume)
  }, [menuItems])
  
  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Menu Price Optimizer</h2>
        
        {/* File Upload */}
        {menuItems.length === 0 && (
          <div 
            className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:bg-gray-50"
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <input 
              type="file" 
              ref={fileInputRef}
              className="hidden" 
              accept=".csv" 
              onChange={handleFileChange}
            />
            
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            
            <p className="mt-2 text-sm text-gray-600">
              Drag and drop your menu CSV file, or click to browse
            </p>
            <p className="mt-1 text-xs text-gray-500">
              CSV should include columns for food name, cost, and date
            </p>
          </div>
        )}
        
        {loading && (
          <div className="text-center py-4">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-2 text-sm text-gray-600">Processing your menu data...</p>
          </div>
        )}
        
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative mt-4" role="alert">
            <strong className="font-bold">Error: </strong>
            <span className="block sm:inline">{error}</span>
          </div>
        )}
        
        {/* Optimization Settings */}
        {menuItems.length > 0 && !loading && (
          <div className="mt-6">
            <h3 className="text-lg font-medium text-gray-800 mb-3">Optimization Settings</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Target Profit Margin (%)
                </label>
                <input
                  type="number"
                  min="0"
                  max="90"
                  value={settings.targetMargin}
                  onChange={(e) => handleSettingChange('targetMargin', parseFloat(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  High-Volume Bonus (%)
                </label>
                <input
                  type="number"
                  min="0"
                  max="30"
                  value={settings.highVolumeBonus}
                  onChange={(e) => handleSettingChange('highVolumeBonus', parseFloat(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Low-Volume Discount (%)
                </label>
                <input
                  type="number"
                  min="0"
                  max="30"
                  value={settings.lowVolumeDiscount}
                  onChange={(e) => handleSettingChange('lowVolumeDiscount', parseFloat(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Max Price Increase (%)
                </label>
                <input
                  type="number"
                  min="0"
                  max="50"
                  value={settings.maxPriceIncrease}
                  onChange={(e) => handleSettingChange('maxPriceIncrease', parseFloat(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Min Price Decrease (%)
                </label>
                <input
                  type="number"
                  min="0"
                  max="50"
                  value={settings.minPriceDecrease}
                  onChange={(e) => handleSettingChange('minPriceDecrease', parseFloat(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
            </div>
            
            <div className="flex justify-center">
              <button
                onClick={optimizePrices}
                className="px-4 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {optimized ? 'Re-Optimize Prices' : 'Optimize Prices'}
              </button>
            </div>
          </div>
        )}
        
        {/* Results Summary */}
        {optimized && summaryData && (
          <div className="mt-8 bg-blue-50 p-4 rounded-lg border border-blue-200">
            <h3 className="text-lg font-medium text-blue-800 mb-3">Optimization Summary</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white p-3 rounded shadow">
                <p className="text-sm text-gray-500">Current Profit</p>
                <p className="text-xl font-bold">${summaryData.currentProfit.toFixed(2)}</p>
                <p className="text-xs text-gray-500">Margin: {summaryData.currentMargin.toFixed(1)}%</p>
              </div>
              
              <div className="bg-white p-3 rounded shadow">
                <p className="text-sm text-gray-500">Optimized Profit</p>
                <p className="text-xl font-bold">${summaryData.suggestedProfit.toFixed(2)}</p>
                <p className="text-xs text-gray-500">Margin: {summaryData.suggestedMargin.toFixed(1)}%</p>
              </div>
              
              <div className="bg-white p-3 rounded shadow">
                <p className="text-sm text-gray-500">Profit Increase</p>
                <p className="text-xl font-bold text-green-600">+${summaryData.profitIncrease.toFixed(2)}</p>
                <p className="text-xs text-gray-500">+{summaryData.profitIncreasePercentage.toFixed(1)}%</p>
              </div>
              
              <div className="bg-white p-3 rounded shadow">
                <p className="text-sm text-gray-500">Items Optimized</p>
                <p className="text-xl font-bold">{menuItems.length}</p>
                <p className="text-xs text-gray-500">Based on sales volume</p>
              </div>
            </div>
          </div>
        )}
        
        {/* Optimized Menu Items */}
        {menuItems.length > 0 && (
          <div className="mt-8">
            <h3 className="text-lg font-medium text-gray-800 mb-3">
              {optimized ? 'Optimized Menu Prices' : 'Current Menu Items'}
            </h3>
            
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Item Name
                    </th>
                    <th scope="col" className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Cost
                    </th>
                    <th scope="col" className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Current Price
                    </th>
                    <th scope="col" className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Current Margin
                    </th>
                    <th scope="col" className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Sales Volume
                    </th>
                    {optimized && (
                      <>
                        <th scope="col" className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider bg-blue-50">
                          Suggested Price
                        </th>
                        <th scope="col" className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider bg-blue-50">
                          Suggested Margin
                        </th>
                        <th scope="col" className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider bg-blue-50">
                          Change
                        </th>
                      </>
                    )}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {sortedItems.map((item: MenuItem) => {
                    const priceChange = item.suggestedPrice 
                      ? ((item.suggestedPrice - item.currentPrice) / item.currentPrice) * 100
                      : 0
                    
                    const priceChangeClass = priceChange > 0 
                      ? 'text-green-600' 
                      : priceChange < 0 
                        ? 'text-red-600' 
                        : 'text-gray-500'
                    
                    return (
                      <tr key={item.id}>
                        <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">
                          {item.name}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500 text-right">
                          ${item.cost.toFixed(2)}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500 text-right">
                          ${item.currentPrice.toFixed(2)}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500 text-right">
                          {item.profitMargin?.toFixed(1)}%
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500 text-right">
                          {item.salesVolume}
                        </td>
                        {optimized && (
                          <>
                            <td className="px-3 py-2 whitespace-nowrap text-sm font-medium text-blue-600 text-right bg-blue-50">
                              ${item.suggestedPrice?.toFixed(2)}
                            </td>
                            <td className="px-3 py-2 whitespace-nowrap text-sm text-blue-600 text-right bg-blue-50">
                              {item.suggestedMargin?.toFixed(1)}%
                            </td>
                            <td className={`px-3 py-2 whitespace-nowrap text-sm font-medium text-right bg-blue-50 ${priceChangeClass}`}>
                              {priceChange > 0 ? '+' : ''}{priceChange.toFixed(1)}%
                            </td>
                          </>
                        )}
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  )
} 