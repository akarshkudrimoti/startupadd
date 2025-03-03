'use client'

import { useState } from 'react'
import { Product } from '../types/product'

interface ProductFormProps {
  onAddProduct: (product: Omit<Product, 'id' | 'lastUpdated'>) => Promise<void>
}

export default function ProductForm({ onAddProduct }: ProductFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    quantity: 0,
    price: 0,
    minThreshold: 0
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await onAddProduct(formData)
    setFormData({
      name: '',
      quantity: 0,
      price: 0,
      minThreshold: 0
    })
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h2 className="text-xl font-semibold mb-4">Add New Product</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block mb-1">Product Name</label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({...formData, name: e.target.value})}
            className="w-full p-2 border rounded"
            required
          />
        </div>
        <div>
          <label className="block mb-1">Quantity</label>
          <input
            type="number"
            value={formData.quantity}
            onChange={(e) => setFormData({...formData, quantity: parseInt(e.target.value)})}
            className="w-full p-2 border rounded"
            required
          />
        </div>
        <div>
          <label className="block mb-1">Price</label>
          <input
            type="number"
            step="0.01"
            value={formData.price}
            onChange={(e) => setFormData({...formData, price: parseFloat(e.target.value)})}
            className="w-full p-2 border rounded"
            required
          />
        </div>
        <div>
          <label className="block mb-1">Minimum Threshold</label>
          <input
            type="number"
            value={formData.minThreshold}
            onChange={(e) => setFormData({...formData, minThreshold: parseInt(e.target.value)})}
            className="w-full p-2 border rounded"
            required
          />
        </div>
        <button 
          type="submit"
          className="w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600"
        >
          Add Product
        </button>
      </form>
    </div>
  )
} 