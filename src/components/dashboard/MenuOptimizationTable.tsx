'use client'

import React, { useState, useEffect } from 'react'

interface MenuItem {
  id: string;
  name: string;
  category: string;
  currentPrice: number;
  foodCost: number;
  popularity: number;
  recommendedPrice: number;
  profitMargin: number;
  status: 'good' | 'adjust' | 'warning';
}

interface MenuOptimizationTableProps {
  data: any;
}

export function MenuOptimizationTable({ data }: MenuOptimizationTableProps) {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  
  useEffect(() => {
    if (!data || !data.data || data.data.length === 0) {
      setLoading(false)
      return
    }
    
    // Process the data to create menu items with AI recommendations
    const processData = () => {
      const processedItems = data.data.map((item: any, index: number) => {
        const currentPrice = Number(item.current_price) || 0
        const foodCost = Number(item.food_cost) || 0
        const quantitySold = Number(item.quantity_sold) || 0
        
        // Calculate profit margin
        const profitMargin = (currentPrice - foodCost) / currentPrice
        
        // Calculate popularity (1-10 scale based on quantity sold)
        const maxQuantity = Math.max(...data.data.map((i: any) => Number(i.quantity_sold) || 0))
        const popularity = Math.ceil((quantitySold / maxQuantity) * 10) || 1
        
        // AI recommendation logic
        // 1. If profit margin is too low, increase price
        // 2. If profit margin is good but popularity is low, consider lowering price
        // 3. If profit margin is good and popularity is high, keep price
        
        let recommendedPrice = currentPrice
        let status: 'good' | 'adjust' | 'warning' = 'good'
        
        if (profitMargin < 0.3) {
          // Low profit margin - increase price
          recommendedPrice = Math.round((foodCost / 0.7) * 100) / 100
          status = profitMargin < 0.15 ? 'warning' : 'adjust'
        } else if (profitMargin > 0.6 && popularity < 5) {
          // High profit margin but low popularity - consider lowering price
          recommendedPrice = Math.round((currentPrice * 0.9) * 100) / 100
          status = 'adjust'
        } else if (profitMargin >= 0.3 && profitMargin <= 0.6) {
          // Good profit margin
          status = 'good'
        }
        
        return {
          id: (index + 1).toString(),
          name: item.item_name,
          category: item.category,
          currentPrice,
          foodCost,
          popularity,
          recommendedPrice,
          profitMargin,
          status
        }
      })
      
      setMenuItems(processedItems)
      setLoading(false)
    }
    
    processData()
  }, [data])
  
  const filteredItems = menuItems.filter((item: MenuItem) => {
    if (filter === 'all') return true
    return item.status === filter
  })
  
  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-10 bg-gray-200 rounded mb-6"></div>
        <div className="h-80 bg-gray-200 rounded"></div>
      </div>
    )
  }
  
  return (
    <div>
      <div className="mb-6 flex flex-wrap gap-2">
        <button
          onClick={() => setFilter('all')}
          className={`px-3 py-2 text-sm font-medium rounded ${
            filter === 'all' 
              ? 'bg-blue-600 text-white' 
              : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
          }`}
        >
          All Items
        </button>
        <button
          onClick={() => setFilter('good')}
          className={`px-3 py-2 text-sm font-medium rounded ${
            filter === 'good' 
              ? 'bg-blue-600 text-white' 
              : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
          }`}
        >
          Good Pricing
        </button>
        <button
          onClick={() => setFilter('adjust')}
          className={`px-3 py-2 text-sm font-medium rounded ${
            filter === 'adjust' 
              ? 'bg-blue-600 text-white' 
              : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
          }`}
        >
          Needs Adjustment
        </button>
        <button
          onClick={() => setFilter('warning')}
          className={`px-3 py-2 text-sm font-medium rounded ${
            filter === 'warning' 
              ? 'bg-blue-600 text-white' 
              : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
          }`}
        >
          Losing Money
        </button>
      </div>
      
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Item
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Category
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Current Price
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Food Cost
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Profit Margin
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Popularity
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Recommended Price
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredItems.length > 0 ? (
              filteredItems.map((item: MenuItem) => (
                <tr key={item.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{item.name}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">{item.category}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">${item.currentPrice.toFixed(2)}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">${item.foodCost.toFixed(2)}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{(item.profitMargin * 100).toFixed(0)}%</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-full bg-gray-200 rounded-full h-2.5">
                        <div 
                          className="bg-blue-600 h-2.5 rounded-full" 
                          style={{ width: `${item.popularity * 10}%` }}
                        ></div>
                      </div>
                      <span className="ml-2 text-sm text-gray-500">{item.popularity}/10</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className={`text-sm font-medium ${
                      item.recommendedPrice > item.currentPrice 
                        ? 'text-red-600' 
                        : item.recommendedPrice < item.currentPrice 
                          ? 'text-green-600' 
                          : 'text-gray-900'
                    }`}>
                      ${item.recommendedPrice.toFixed(2)}
                      {item.recommendedPrice !== item.currentPrice && (
                        <span className="ml-1">
                          {item.recommendedPrice > item.currentPrice ? '↑' : '↓'}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      item.status === 'good' 
                        ? 'bg-green-100 text-green-800' 
                        : item.status === 'adjust' 
                          ? 'bg-yellow-100 text-yellow-800' 
                          : 'bg-red-100 text-red-800'
                    }`}>
                      {item.status === 'good' 
                        ? '🟢 Good' 
                        : item.status === 'adjust' 
                          ? '🟡 Adjust' 
                          : '🔴 Warning'}
                    </span>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={8} className="px-6 py-4 text-center text-sm text-gray-500">
                  No menu items to display. Please upload your menu data.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
} 