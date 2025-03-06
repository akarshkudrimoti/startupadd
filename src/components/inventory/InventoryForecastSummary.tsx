'use client'

import React, { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'

interface InventoryItem {
  name: string;
  currentStock: number;
  forecastedUsage: number;
  daysUntilReorder: number;
  reorderStatus: 'OK' | 'Warning' | 'Critical';
}

export function InventoryForecastSummary() {
  const { user } = useAuth()
  const [items, setItems] = useState<InventoryItem[]>([
    {
      name: 'Chicken Breast',
      currentStock: 45,
      forecastedUsage: 8.2,
      daysUntilReorder: 4,
      reorderStatus: 'Warning'
    },
    {
      name: 'Tomatoes',
      currentStock: 28,
      forecastedUsage: 5.5,
      daysUntilReorder: 3,
      reorderStatus: 'Warning'
    },
    {
      name: 'Flour',
      currentStock: 120,
      forecastedUsage: 7.3,
      daysUntilReorder: 12,
      reorderStatus: 'OK'
    },
    {
      name: 'Lettuce',
      currentStock: 12,
      forecastedUsage: 6.8,
      daysUntilReorder: 1,
      reorderStatus: 'Critical'
    },
    {
      name: 'Cheese',
      currentStock: 35,
      forecastedUsage: 4.2,
      daysUntilReorder: 7,
      reorderStatus: 'OK'
    }
  ])

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-semibold text-gray-800 mb-4">Inventory Forecast Summary</h2>
      
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Item
              </th>
              <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Current Stock
              </th>
              <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Daily Usage
              </th>
              <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Days Until Reorder
              </th>
              <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {items.map((item, index) => (
              <tr key={index}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {item.name}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">
                  {item.currentStock} units
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">
                  {item.forecastedUsage} units
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">
                  {item.daysUntilReorder} days
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-center">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                    ${item.reorderStatus === 'OK' ? 'bg-green-100 text-green-800' : 
                      item.reorderStatus === 'Warning' ? 'bg-yellow-100 text-yellow-800' : 
                      'bg-red-100 text-red-800'}`}>
                    {item.reorderStatus}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
} 