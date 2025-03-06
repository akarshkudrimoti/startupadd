'use client'

import React, { useEffect, useState } from 'react'

interface ChartItem {
  name: string;
  profitMargin: number;
  popularity: number;
  category: string;
  color: string;
}

interface ProfitabilityChartProps {
  data: any;
}

export function ProfitabilityChart({ data }: ProfitabilityChartProps) {
  const [chartData, setChartData] = useState<ChartItem[]>([])
  
  useEffect(() => {
    if (!data || !data.data || data.data.length === 0) {
      return
    }
    
    // Process the data for the chart
    const processData = () => {
      const categoryColors: Record<string, string> = {
        appetizer: '#3B82F6', // blue
        entree: '#10B981',    // green
        dessert: '#F59E0B',   // yellow
        beverage: '#EF4444',  // red
        pizza: '#8B5CF6',     // purple
        pasta: '#EC4899',     // pink
        salad: '#14B8A6',     // teal
        sandwich: '#F97316',  // orange
      }
      
      const processedItems = data.data.map((item: any, index: number) => {
        const currentPrice = Number(item.current_price) || 0
        const foodCost = Number(item.food_cost) || 0
        const quantitySold = Number(item.quantity_sold) || 0
        const category = item.category || 'other'
        
        // Calculate profit margin
        const profitMargin = (currentPrice - foodCost) / currentPrice
        
        // Calculate popularity (1-10 scale based on quantity sold)
        const maxQuantity = Math.max(...data.data.map((i: any) => Number(i.quantity_sold) || 0))
        const popularity = Math.ceil((quantitySold / maxQuantity) * 10) || 1
        
        // Assign color based on category or default
        const color = categoryColors[category.toLowerCase()] || '#6B7280' // gray default
        
        return {
          name: item.item_name,
          profitMargin,
          popularity,
          category,
          color
        }
      })
      
      setChartData(processedItems)
    }
    
    processData()
  }, [data])
  
  if (chartData.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center bg-gray-50 rounded">
        <p className="text-gray-500">No data available for chart visualization</p>
      </div>
    )
  }
  
  // Sort by profit margin for better visualization
  const sortedData = [...chartData].sort((a, b) => b.profitMargin - a.profitMargin)
  
  return (
    <div>
      <div className="mb-4">
        <h3 className="text-lg font-medium">Profit Margin by Item</h3>
        <p className="text-sm text-gray-500">Items with higher profit margins are more profitable</p>
      </div>
      
      <div className="space-y-3">
        {sortedData.map((item, index) => (
          <div key={index} className="bg-white p-3 rounded border">
            <div className="flex justify-between items-center mb-1">
              <span className="font-medium">{item.name}</span>
              <span className="text-sm text-gray-500">{item.category}</span>
            </div>
            <div className="flex items-center">
              <div className="w-full bg-gray-200 rounded-full h-2.5 mr-2">
                <div 
                  className="h-2.5 rounded-full" 
                  style={{ 
                    width: `${item.profitMargin * 100}%`,
                    backgroundColor: item.color
                  }}
                ></div>
              </div>
              <span className="text-sm font-medium">{(item.profitMargin * 100).toFixed(0)}%</span>
            </div>
            <div className="flex justify-between items-center mt-1">
              <span className="text-xs text-gray-500">Popularity: {item.popularity}/10</span>
              <span className={`text-xs ${
                item.profitMargin < 0.3 
                  ? 'text-red-600' 
                  : item.profitMargin > 0.6 
                    ? 'text-green-600' 
                    : 'text-yellow-600'
              }`}>
                {item.profitMargin < 0.3 
                  ? 'Low Margin' 
                  : item.profitMargin > 0.6 
                    ? 'High Margin' 
                    : 'Good Margin'}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
} 