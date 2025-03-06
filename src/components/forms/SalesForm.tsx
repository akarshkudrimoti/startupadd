'use client'

import React, { useState } from 'react'

interface SalesFormProps {
  onSubmit: (data: any) => void;
}

export function SalesForm({ onSubmit }: SalesFormProps) {
  const [itemName, setItemName] = useState('')
  const [salesAmount, setSalesAmount] = useState('')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    
    if (!itemName.trim()) {
      setError('Item name is required')
      return
    }
    
    if (!salesAmount.trim() || isNaN(Number(salesAmount))) {
      setError('Valid sales amount is required')
      return
    }
    
    if (!date) {
      setError('Date is required')
      return
    }
    
    onSubmit({
      itemName,
      salesAmount: Number(salesAmount),
      date
    })
    
    // Reset form
    setItemName('')
    setSalesAmount('')
    setDate(new Date().toISOString().split('T')[0])
    setError(null)
  }

  return (
    <form onSubmit={handleSubmit}>
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-md">
          <p className="text-sm font-medium">{error}</p>
        </div>
      )}
      
      <div className="mb-4">
        <label htmlFor="itemName" className="block text-sm font-medium text-gray-700 mb-1">
          <span className="text-red-500">*</span> Item Name:
        </label>
        <input
          type="text"
          id="itemName"
          value={itemName}
          onChange={(e) => setItemName(e.target.value)}
          className="input-field"
          placeholder="e.g. Burger, Pizza, etc."
        />
      </div>
      
      <div className="mb-4">
        <label htmlFor="salesAmount" className="block text-sm font-medium text-gray-700 mb-1">
          <span className="text-red-500">*</span> Sales Amount:
        </label>
        <input
          type="number"
          id="salesAmount"
          value={salesAmount}
          onChange={(e) => setSalesAmount(e.target.value)}
          className="input-field"
          placeholder="e.g. 125.50"
          min="0"
          step="0.01"
        />
      </div>
      
      <div className="mb-4">
        <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-1">
          <span className="text-red-500">*</span> Date:
        </label>
        <div className="relative">
          <input
            type="date"
            id="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="input-field pr-10"
          />
          <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
            <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        </div>
      </div>
      
      <button
        type="submit"
        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded"
      >
        Add Sales Data
      </button>
    </form>
  )
} 