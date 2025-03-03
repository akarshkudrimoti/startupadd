'use client'

import { useState } from 'react'
import { Product } from '../types/product'

interface InventoryListProps {
  products: Product[]
  onRecordSale: (productId: number, quantity: number) => Promise<void>
  predictions: Record<number, {
    predicted_weekly_sales: number,
    days_until_empty: number,
    reorder_needed: boolean,
    recommended_order: number
  }>
}

export default function InventoryList({ 
  products, 
  onRecordSale,
  predictions
}: InventoryListProps) {
  const [saleQuantity, setSaleQuantity] = useState<Record<number, number>>({})

  const handleSaleQuantityChange = (productId: number, quantity: number) => {
    setSaleQuantity({
      ...saleQuantity,
      [productId]: quantity
    })
  }

  const handleRecordSale = async (productId: number) => {
    const quantity = saleQuantity[productId] || 1
    await onRecordSale(productId, quantity)
    setSaleQuantity({
      ...saleQuantity,
      [productId]: 1
    })
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h2 className="text-xl font-semibold mb-4">Current Inventory</h2>
      <div className="space-y-4">
        {products.map(product => (
          <div 
            key={product.id} 
            className={`border p-4 rounded ${
              product.quantity <= product.minThreshold ? 'border-red-300 bg-red-50' : ''
            }`}
          >
            <div className="flex justify-between">
              <h3 className="font-semibold">{product.name}</h3>
              <span className="text-gray-600">ID: {product.id}</span>
            </div>
            
            <div className="mt-2 grid grid-cols-2 gap-2">
              <p>Quantity: <span className="font-medium">{product.quantity}</span></p>
              <p>Price: <span className="font-medium">${product.price.toFixed(2)}</span></p>
            </div>
            
            {product.quantity <= product.minThreshold && (
              <p className="text-red-500 mt-2 font-medium">Low Stock Alert!</p>
            )}
            
            {predictions[product.id] && (
              <div className="mt-3 p-3 bg-blue-50 rounded">
                <h4 className="font-medium text-blue-800">AI Predictions</h4>
                <p>Weekly Sales: {predictions[product.id].predicted_weekly_sales.toFixed(1)} units</p>
                <p>Stock will last: {predictions[product.id].days_until_empty.toFixed(1)} days</p>
                {predictions[product.id].reorder_needed && (
                  <p className="text-orange-600 font-medium">
                    Recommended order: {predictions[product.id].recommended_order} units
                  </p>
                )}
              </div>
            )}
            
            <div className="mt-4 flex items-center">
              <input
                type="number"
                value={saleQuantity[product.id] || 1}
                min="1"
                max={product.quantity}
                onChange={(e) => handleSaleQuantityChange(product.id, parseInt(e.target.value))}
                className="w-16 p-1 border rounded mr-2"
              />
              <button
                onClick={() => handleRecordSale(product.id)}
                className="bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600"
                disabled={product.quantity <= 0}
              >
                Record Sale
              </button>
            </div>
          </div>
        ))}

        {products.length === 0 && (
          <p className="text-gray-500">No products in inventory. Add your first product!</p>
        )}
      </div>
    </div>
  )
} 