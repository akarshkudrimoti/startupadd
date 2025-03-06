'use client'

import React, { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { IngredientCostCalculator } from './IngredientCostCalculator'

interface MenuItem {
  id: string;
  name: string;
  currentPrice: number;
  cost: number;
  competitorPrice?: number;
}

interface PriceRecommendation {
  itemName: string;
  currentPrice: number;
  recommendedPrice: number;
  confidence: 'low' | 'medium' | 'high';
  reasoning: string;
}

export function MenuOptimizer() {
  const { user } = useAuth()
  const [menuItems, setMenuItems] = useState<MenuItem[]>([])
  const [newItem, setNewItem] = useState<MenuItem>({ id: '', name: '', currentPrice: 0, cost: 0 })
  const [recommendations, setRecommendations] = useState<PriceRecommendation[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [targetMargin, setTargetMargin] = useState(30)
  const [message, setMessage] = useState('')
  
  // Load saved menu items from localStorage
  useEffect(() => {
    if (user) {
      const savedItems = localStorage.getItem(`menuItems_${user.username}`)
      if (savedItems) {
        try {
          setMenuItems(JSON.parse(savedItems))
        } catch (e) {
          console.error('Error loading saved menu items:', e)
        }
      }
    }
  }, [user])
  
  // Save menu items to localStorage when updated
  useEffect(() => {
    if (user && menuItems.length > 0) {
      localStorage.setItem(`menuItems_${user.username}`, JSON.stringify(menuItems))
    }
  }, [menuItems, user])
  
  const handleAddItem = () => {
    if (!newItem.name.trim()) {
      setMessage('Item name is required')
      return
    }
    
    if (newItem.currentPrice < 0) {
      setMessage('Price must be a positive value')
      return
    }
    
    const newId = `item_${Date.now()}`
    setMenuItems([...menuItems, { ...newItem, id: newId }])
    setNewItem({ id: '', name: '', currentPrice: 0, cost: 0 })
    setMessage('')
  }
  
  const handleRemoveItem = (index: number) => {
    const updatedItems = [...menuItems]
    updatedItems.splice(index, 1)
    setMenuItems(updatedItems)
  }
  
  const handleUpdateItem = (index: number, field: keyof MenuItem, value: string | number) => {
    const updatedItems = [...menuItems]
    
    if (field === 'currentPrice' || field === 'cost' || field === 'competitorPrice') {
      updatedItems[index][field] = Number(value)
    } else {
      updatedItems[index][field as 'name'] = value as string
    }
    
    setMenuItems(updatedItems)
  }
  
  const generateRecommendations = async () => {
    if (menuItems.length === 0) {
      setMessage('Add menu items to get price recommendations')
      return
    }
    
    setIsLoading(true)
    setMessage('')
    
    try {
      // In a real app, this would call your backend API
      // For this demo, we'll simulate the AI model response
      
      // Get sales data from localStorage
      const salesData = user ? 
        JSON.parse(localStorage.getItem(`restaurantSalesData_${user.username}`) || '[]') : 
        []
      
      if (salesData.length < 10) {
        // Not enough data for ML model, use simple cost-plus pricing
        const simpleRecommendations = menuItems.map(item => ({
          itemName: item.name,
          currentPrice: item.currentPrice,
          recommendedPrice: Math.round((item.cost / (1 - (targetMargin / 100))) * 100) / 100,
          confidence: 'low' as const,
          reasoning: 'Based on cost-plus pricing (insufficient sales data)'
        }))
        
        setTimeout(() => {
          setRecommendations(simpleRecommendations)
          setIsLoading(false)
        }, 1500)
        
        return
      }
      
      // Simulate more sophisticated pricing based on sales data
      const mockRecommendations = menuItems.map(item => {
        // Find sales for this item
        const itemSales = salesData.filter((sale: any) => 
          sale.itemName.toLowerCase() === item.name.toLowerCase()
        )
        
        let recommendedPrice = item.currentPrice
        let confidence: 'low' | 'medium' | 'high' = 'low'
        let reasoning = ''
        
        if (itemSales.length > 0) {
          // Calculate average sales
          const totalSales = itemSales.length
          
          // Set confidence based on amount of data
          if (totalSales > 20) {
            confidence = 'high'
          } else if (totalSales > 10) {
            confidence = 'medium'
          }
          
          // Calculate optimal price based on cost and target margin
          const basePrice = item.cost / (1 - (targetMargin / 100))
          
          // Adjust based on "demand" (number of sales)
          const demandFactor = Math.min(1.2, Math.max(0.8, totalSales / 10))
          recommendedPrice = Math.round((basePrice * demandFactor) * 100) / 100
          
          // Generate reasoning
          if (recommendedPrice > item.currentPrice) {
            reasoning = `Price increase recommended based on strong demand (${totalSales} sales) and target profit margin of ${targetMargin}%`
          } else if (recommendedPrice < item.currentPrice) {
            reasoning = `Price decrease recommended to stimulate demand and increase overall revenue`
          } else {
            reasoning = `Current price is optimal based on sales history and target margin`
          }
        } else {
          // No sales data for this item
          recommendedPrice = Math.round((item.cost / (1 - (targetMargin / 100))) * 100) / 100
          reasoning = 'Based on cost-plus pricing (no sales data for this item)'
        }
        
        return {
          itemName: item.name,
          currentPrice: item.currentPrice,
          recommendedPrice,
          confidence,
          reasoning
        }
      })
      
      // Simulate API delay
      setTimeout(() => {
        setRecommendations(mockRecommendations)
        setIsLoading(false)
      }, 1500)
      
    } catch (error) {
      console.error('Error generating recommendations:', error)
      setMessage('Error generating recommendations')
      setIsLoading(false)
    }
  }
  
  const getConfidenceColor = (confidence: string) => {
    switch (confidence) {
      case 'high': return 'text-green-600 bg-green-50 border-green-200'
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200'
      case 'low': return 'text-orange-600 bg-orange-50 border-orange-200'
      default: return 'text-gray-600 bg-gray-50 border-gray-200'
    }
  }
  
  const handleCostCalculated = (itemId: string, cost: number) => {
    const updatedItems = menuItems.map(item => {
      if (item.id === itemId) {
        return { ...item, cost }
      }
      return item
    })
    setMenuItems(updatedItems)
  }
  
  return (
    <div className="card">
      <h3 className="text-lg font-medium mb-4">AI Menu Price Optimizer</h3>
      
      {message && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 text-blue-700 rounded-md">
          <p className="text-sm font-medium">{message}</p>
        </div>
      )}
      
      <div className="mb-6">
        <h4 className="text-md font-medium mb-2">Menu Items</h4>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Item Name</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Current Price ($)</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cost ($)</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Competitor Price ($)</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {menuItems.map((item, index) => (
                <tr key={index}>
                  <td className="px-3 py-2 whitespace-nowrap">
                    <input
                      type="text"
                      value={item.name}
                      onChange={(e) => handleUpdateItem(index, 'name', e.target.value)}
                      className="w-full px-2 py-1 border border-gray-300 rounded-md text-sm"
                    />
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap">
                    <input
                      type="number"
                      value={item.currentPrice}
                      onChange={(e) => handleUpdateItem(index, 'currentPrice', e.target.value)}
                      className="w-full px-2 py-1 border border-gray-300 rounded-md text-sm"
                      min="0"
                      step="0.01"
                    />
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap">
                    <input
                      type="number"
                      value={item.cost}
                      onChange={(e) => handleUpdateItem(index, 'cost', e.target.value)}
                      className="w-full px-2 py-1 border border-gray-300 rounded-md text-sm"
                      min="0"
                      step="0.01"
                    />
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap">
                    <input
                      type="number"
                      value={item.competitorPrice || ''}
                      onChange={(e) => handleUpdateItem(index, 'competitorPrice', e.target.value)}
                      className="w-full px-2 py-1 border border-gray-300 rounded-md text-sm"
                      min="0"
                      step="0.01"
                      placeholder="Optional"
                    />
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap">
                    <button
                      onClick={() => handleRemoveItem(index)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </td>
                </tr>
              ))}
              <tr>
                <td className="px-3 py-2 whitespace-nowrap">
                  <input
                    type="text"
                    value={newItem.name}
                    onChange={(e) => setNewItem({...newItem, name: e.target.value})}
                    className="w-full px-2 py-1 border border-gray-300 rounded-md text-sm"
                    placeholder="New item name"
                  />
                </td>
                <td className="px-3 py-2 whitespace-nowrap">
                  <input
                    type="number"
                    value={newItem.currentPrice || ''}
                    onChange={(e) => setNewItem({...newItem, currentPrice: Number(e.target.value)})}
                    className="w-full px-2 py-1 border border-gray-300 rounded-md text-sm"
                    min="0"
                    step="0.01"
                    placeholder="Current price"
                  />
                </td>
                <td className="px-3 py-2 whitespace-nowrap">
                  <input
                    type="number"
                    value={newItem.cost || ''}
                    onChange={(e) => setNewItem({...newItem, cost: Number(e.target.value)})}
                    className="w-full px-2 py-1 border border-gray-300 rounded-md text-sm"
                    min="0"
                    step="0.01"
                    placeholder="Cost"
                  />
                </td>
                <td className="px-3 py-2 whitespace-nowrap">
                  <input
                    type="number"
                    value={newItem.competitorPrice || ''}
                    onChange={(e) => setNewItem({...newItem, competitorPrice: Number(e.target.value)})}
                    className="w-full px-2 py-1 border border-gray-300 rounded-md text-sm"
                    min="0"
                    step="0.01"
                    placeholder="Optional"
                  />
                </td>
                <td className="px-3 py-2 whitespace-nowrap">
                  <button
                    onClick={handleAddItem}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      
      <div className="mb-6">
        <h4 className="text-md font-medium mb-2">Optimization Settings</h4>
        
        <div className="flex items-center mb-4">
          <label className="block text-sm font-medium text-gray-700 mr-4">
            Target Profit Margin:
          </label>
          <input
            type="range"
            min="10"
            max="70"
            value={targetMargin}
            onChange={(e) => setTargetMargin(Number(e.target.value))}
            className="w-48 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
          />
          <span className="ml-2 text-sm font-medium text-gray-700">{targetMargin}%</span>
        </div>
        
        <button
          onClick={generateRecommendations}
          disabled={isLoading || menuItems.length === 0}
          className={`w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded ${(isLoading || menuItems.length === 0) ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          {isLoading ? (
            <span className="flex items-center justify-center">
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Generating Recommendations...
            </span>
          ) : 'Generate Price Recommendations'}
        </button>
      </div>
      
      {recommendations.length > 0 && (
        <div>
          <h4 className="text-md font-medium mb-2">Price Recommendations</h4>
          
          <div className="space-y-4">
            {recommendations.map((rec, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4">
                <div className="flex justify-between items-start">
                  <h5 className="text-lg font-medium">{rec.itemName}</h5>
                  <span className={`text-xs px-2 py-1 rounded-full ${getConfidenceColor(rec.confidence)} uppercase font-medium`}>
                    {rec.confidence} confidence
                  </span>
                </div>
                
                <div className="mt-2 grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Current Price</p>
                    <p className="text-xl font-bold">${rec.currentPrice.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Recommended Price</p>
                    <p className={`text-xl font-bold ${rec.recommendedPrice > rec.currentPrice ? 'text-green-600' : rec.recommendedPrice < rec.currentPrice ? 'text-red-600' : 'text-gray-800'}`}>
                      ${rec.recommendedPrice.toFixed(2)}
                      {rec.recommendedPrice !== rec.currentPrice && (
                        <span className="text-sm ml-1">
                          ({rec.recommendedPrice > rec.currentPrice ? '+' : ''}
                          {((rec.recommendedPrice - rec.currentPrice) / rec.currentPrice * 100).toFixed(1)}%)
                        </span>
                      )}
                    </p>
                  </div>
                </div>
                
                <p className="mt-2 text-sm text-gray-600">{rec.reasoning}</p>
              </div>
            ))}
          </div>
        </div>
      )}
      
      <IngredientCostCalculator onCostCalculated={handleCostCalculated} />
    </div>
  )
} 