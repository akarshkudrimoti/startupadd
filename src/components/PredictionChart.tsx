'use client'

import { useState, useEffect } from 'react'
import { Product } from '../types/product'

interface PredictionChartProps {
  products: Product[]
  predictions: Record<number, {
    predicted_weekly_sales: number,
    days_until_empty: number,
    reorder_needed: boolean,
    recommended_order: number
  }>
}

export default function PredictionChart({ products, predictions }: PredictionChartProps) {
  if (products.length === 0) {
    return null
  }

  const lowStockProducts = products.filter(p => 
    p.quantity <= p.minThreshold || 
    (predictions[p.id]?.days_until_empty < 7)
  )

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h2 className="text-xl font-semibold mb-4">Inventory Insights</h2>
      
      {lowStockProducts.length > 0 ? (
        <div className="mb-4">
          <h3 className="text-lg font-medium text-orange-700">Action Needed</h3>
          <ul className="mt-2 space-y-2">
            {lowStockProducts.map(product => (
              <li key={product.id} className="border-l-4 border-orange-500 pl-3 py-1">
                <span className="font-medium">{product.name}:</span> {' '}
                {product.quantity <= product.minThreshold 
                  ? 'Below minimum threshold'
                  : `Will run out in ${predictions[product.id]?.days_until_empty.toFixed(1)} days`
                }
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <p className="text-green-600 font-medium">All inventory levels are healthy!</p>
      )}

      <div className="mt-6">
        <h3 className="text-lg font-medium mb-2">Inventory Distribution</h3>
        <div className="h-40 flex items-end space-x-2">
          {products.map(product => {
            const stockPercentage = Math.min(100, (product.quantity / (product.minThreshold * 3)) * 100)
            const colorClass = 
              product.quantity <= product.minThreshold ? 'bg-red-500' : 
              predictions[product.id]?.days_until_empty < 7 ? 'bg-yellow-500' : 
              'bg-blue-500'
            
            return (
              <div key={product.id} className="flex flex-col items-center flex-1">
                <div className="w-full flex-1 flex flex-col-reverse">
                  <div 
                    className={`w-full ${colorClass} rounded-t`} 
                    style={{ height: `${stockPercentage}%` }}
                  ></div>
                </div>
                <p className="text-xs text-center mt-1 truncate w-full">{product.name}</p>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
} 