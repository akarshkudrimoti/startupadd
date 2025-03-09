'use client'

import React, { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'

export function ClearDataButton() {
  const { user } = useAuth()
  const [isClearing, setIsClearing] = useState(false)

  const handleClearAllData = () => {
    if (!user || isClearing) return

    const confirmClear = window.confirm(
      'Are you sure you want to clear ALL data? This will delete everything including:\n\n' +
      '• Menu items\n' +
      '• Ingredients\n' +
      '• Recipes\n' +
      '• Orders\n' +
      '• Inventory\n' +
      '• Sales data\n' +
      '• Settings\n\n' +
      'This action cannot be undone!'
    )

    if (confirmClear) {
      setIsClearing(true)
      try {
        // Clear all localStorage data
        localStorage.removeItem(`menuItems_${user.username}`)
        localStorage.removeItem(`ingredients_${user.username}`)
        localStorage.removeItem(`recipes_${user.username}`)
        localStorage.removeItem(`orders_${user.username}`)
        localStorage.removeItem(`inventoryItems_${user.username}`)
        localStorage.removeItem(`salesData_${user.username}`)
        localStorage.removeItem(`categoryStats_${user.username}`)
        localStorage.removeItem(`forecastData_${user.username}`)
        localStorage.removeItem(`settings_${user.username}`)
        localStorage.removeItem(`preferences_${user.username}`)

        // Reload the page to reset all state
        window.location.reload()
      } catch (error) {
        console.error('Error clearing data:', error)
        alert('Error clearing data. Please try again.')
        setIsClearing(false)
      }
    }
  }

  return (
    <button
      onClick={handleClearAllData}
      disabled={isClearing}
      className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
    >
      <svg 
        className="w-4 h-4" 
        fill="none" 
        stroke="currentColor" 
        viewBox="0 0 24 24"
      >
        <path 
          strokeLinecap="round" 
          strokeLinejoin="round" 
          strokeWidth={2} 
          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" 
        />
      </svg>
      <span>{isClearing ? 'Clearing...' : 'Clear All Data'}</span>
    </button>
  )
} 