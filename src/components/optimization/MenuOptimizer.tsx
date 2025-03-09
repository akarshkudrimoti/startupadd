'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { IngredientCostCalculator } from './IngredientCostCalculator'

interface MenuItem {
  id: string;
  name: string;
  currentPrice: number;
  cost?: number;
  competitorPrice?: number;
  category?: string;
  popularity?: number;
}

interface Ingredient {
  id: string;
  name: string;
  costPerUnit: number;
  unit: string;
}

interface Recipe {
  menuItemId: string;
  ingredientId: string;
  quantity: number;
}

interface PriceRecommendation {
  itemId: string;
  itemName: string;
  currentPrice: number;
  recommendedPrice: number;
  confidence: 'low' | 'medium' | 'high';
  reasoning: string;
  potentialProfit: number;
  profitIncrease: number;
  profitIncreasePercentage: number;
}

interface InventorySummary {
  itemName: string;
  currentStock: number;
  projectedUsage: number;
  reorderPoint: number;
  costPerUnit: number;
  totalCost: number;
  status: 'low' | 'good' | 'excess';
  usedInMenuItems?: string[];
}

interface Order {
  id: string;
  date: Date;
  items: {
    menuItemId: string;
    quantity: number;
  }[];
}

export function MenuOptimizer() {
  const { user } = useAuth()
  const [menuItems, setMenuItems] = useState<MenuItem[]>([])
  const [newItem, setNewItem] = useState<MenuItem>({ id: '', name: '', currentPrice: 0 })
  const [recommendations, setRecommendations] = useState<PriceRecommendation[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [showAdvancedSettings, setShowAdvancedSettings] = useState(false)
  const [showImportModal, setShowImportModal] = useState(false)
  const [ingredients, setIngredients] = useState<Ingredient[]>([])
  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [messageType, setMessageType] = useState<'success' | 'error' | 'info'>('info')
  const [inventorySummary, setInventorySummary] = useState<InventorySummary[]>([])
  const [orders, setOrders] = useState<Order[]>([])
  
  // Optimization settings
  const [settings, setSettings] = useState({
    targetMargin: 65, // Default target profit margin (%)
    highVolumeBonus: 5, // Additional margin for high-volume items (%)
    lowVolumeDiscount: 10, // Reduced margin for low-volume items (%)
    maxPriceIncrease: 15, // Maximum price increase allowed (%)
    minPriceDecrease: 5, // Minimum price decrease allowed (%)
    competitorPriceWeight: 30, // Weight given to competitor prices (%)
    roundingPrecision: 0.25, // Round prices to nearest $0.25
    minimumMargin: 30, // Minimum acceptable margin (%)
  })
  
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
    
    // Generate a unique ID
    const id = `item_${Date.now()}`
    
    // Add the new item to the list
    setMenuItems(prev => [...prev, { ...newItem, id }])
    
    // Reset the form
    setNewItem({ id: '', name: '', currentPrice: 0 })
    setMessage('')
  }
  
  const handleDeleteItem = (id: string) => {
    setMenuItems(prev => prev.filter(item => item.id !== id))
  }
  
  const handleCostCalculated = (itemId: string, cost: number) => {
    setMenuItems(prev => 
      prev.map(item => 
        item.id === itemId ? { ...item, cost } : item
      )
    )
  }
  
  // Advanced AI-powered price optimization algorithm
  const generateRecommendations = () => {
    setIsLoading(true)
    setMessage('')
    
    setTimeout(() => {
      try {
        // Only process items that have costs calculated
        const itemsWithCosts = menuItems.filter(item => item.cost !== undefined)
        
        if (itemsWithCosts.length === 0) {
          setMessage('Please calculate costs for menu items first')
          setMessageType('error')
          setIsLoading(false)
          return
        }

        const categorizedItems = itemsWithCosts.map(item => {
          const popularity = item.popularity || 1
          return {
            ...item,
            popularity,
            popularityCategory: popularity < 0.7 ? 'low' : popularity > 1.3 ? 'high' : 'medium'
          }
        })

        const newRecommendations: PriceRecommendation[] = categorizedItems.map(item => {
          // We can safely use item.cost here as we filtered for items with costs
          const currentMargin = ((item.currentPrice - item.cost!) / item.currentPrice) * 100
          
          let adjustedTargetMargin = settings.targetMargin
          if (item.popularityCategory === 'high') {
            adjustedTargetMargin += settings.highVolumeBonus
          } else if (item.popularityCategory === 'low') {
            adjustedTargetMargin -= settings.lowVolumeDiscount
          }
          
          adjustedTargetMargin = Math.max(adjustedTargetMargin, settings.minimumMargin)
          
          // Safe to use item.cost as it's guaranteed to exist
          let recommendedPrice = item.cost! / (1 - (adjustedTargetMargin / 100))
          
          if (item.competitorPrice) {
            const competitorWeight = settings.competitorPriceWeight / 100
            recommendedPrice = (recommendedPrice * (1 - competitorWeight)) + 
                              (item.competitorPrice * competitorWeight)
          }
          
          const maxPrice = item.currentPrice * (1 + (settings.maxPriceIncrease / 100))
          const minPrice = item.currentPrice * (1 - (settings.minPriceDecrease / 100))
          
          recommendedPrice = Math.min(recommendedPrice, maxPrice)
          recommendedPrice = Math.max(recommendedPrice, minPrice)
          recommendedPrice = Math.round(recommendedPrice / settings.roundingPrecision) * 
                            settings.roundingPrecision
          
          // Safe to use item.cost as it's guaranteed to exist
          const currentProfit = (item.currentPrice - item.cost!) * (item.popularity || 1)
          const potentialProfit = (recommendedPrice - item.cost!) * (item.popularity || 1)
          const profitIncrease = potentialProfit - currentProfit
          const profitIncreasePercentage = (profitIncrease / currentProfit) * 100

          // Determine confidence level
          let confidence: 'low' | 'medium' | 'high' = 'medium'
          if (item.popularity && item.competitorPrice) {
            confidence = 'high'
          } else if (!item.popularity && !item.competitorPrice) {
            confidence = 'low'
          }
          
          // Generate reasoning
          let reasoning = ''
          if (recommendedPrice > item.currentPrice) {
            reasoning = `Increased price to achieve target margin of ${adjustedTargetMargin.toFixed(1)}%.`
            if (item.popularityCategory === 'high') {
              reasoning += ' This item is popular, so customers are likely willing to pay more.'
            }
          } else if (recommendedPrice < item.currentPrice) {
            reasoning = `Decreased price to be more competitive.`
            if (item.popularityCategory === 'low') {
              reasoning += ' Lower price may increase sales volume for this underperforming item.'
            }
          } else {
            reasoning = 'Current price is optimal based on your settings.'
          }
          
          if (item.competitorPrice) {
            reasoning += ` Competitor price ($${item.competitorPrice.toFixed(2)}) was factored in.`
          }
          
          return {
            itemId: item.id,
            itemName: item.name,
            currentPrice: item.currentPrice,
            recommendedPrice,
            confidence,
            reasoning,
            potentialProfit,
            profitIncrease,
            profitIncreasePercentage
          }
        })

        setRecommendations(newRecommendations)
        setIsLoading(false)
      } catch (error) {
        console.error('Error generating recommendations:', error)
        setMessage('Error generating recommendations. Please try again.')
        setIsLoading(false)
      }
    }, 1500)
  }
  
  // Helper function for confidence level styling
  const getConfidenceColor = (confidence: 'low' | 'medium' | 'high') => {
    switch (confidence) {
      case 'high': return 'bg-green-100 text-green-800'
      case 'medium': return 'bg-blue-100 text-blue-800'
      case 'low': return 'bg-yellow-100 text-yellow-800'
    }
  }
  
  // Calculate total potential profit increase
  const totalProfitIncrease = useMemo(() => {
    return recommendations.reduce((sum, rec) => sum + rec.profitIncrease, 0)
  }, [recommendations])
  
  // Function to calculate costs from ingredients
  const calculateCostsFromIngredients = () => {
    if (!user || ingredients.length === 0 || recipes.length === 0) {
      setMessage('No ingredients or recipes found. Please add ingredients and recipes first.')
      setMessageType('error')
      return
    }

    const updatedMenuItems = menuItems.map(menuItem => {
      // Find all recipes for this menu item
      const itemRecipes = recipes.filter(recipe => recipe.menuItemId === menuItem.id)
      
      // Calculate total cost from ingredients
      const totalCost = itemRecipes.reduce((sum, recipe) => {
        const ingredient = ingredients.find(ing => ing.id === recipe.ingredientId)
        if (ingredient) {
          return sum + (ingredient.costPerUnit * recipe.quantity)
        }
        return sum
      }, 0)

      return {
        ...menuItem,
        cost: Number(totalCost.toFixed(2))
      }
    })

    setMenuItems(updatedMenuItems)
    setMessage('Menu item costs have been updated based on ingredient costs')
    setMessageType('success')

    // Save to localStorage
    if (user) {
      localStorage.setItem(`menuItems_${user.username}`, JSON.stringify(updatedMenuItems))
    }
  }
  
  // Calculate inventory summary
  const calculateInventorySummary = () => {
    if (!menuItems.length || !ingredients.length || !recipes.length) {
      setMessage('Please add menu items, ingredients, and recipes first')
      setMessageType('error')
      return
    }

    // First, calculate ingredient usage based on menu items
    const ingredientUsage = menuItems.reduce((usage, menuItem) => {
      // Get all recipes for this menu item
      const itemRecipes = recipes.filter(recipe => recipe.menuItemId === menuItem.id)
      
      // Calculate ingredient quantities
      itemRecipes.forEach(recipe => {
        if (!usage[recipe.ingredientId]) {
          usage[recipe.ingredientId] = {
            quantity: 0,
            menuItems: []
          }
        }
        usage[recipe.ingredientId].quantity += recipe.quantity
        usage[recipe.ingredientId].menuItems.push(menuItem.name)
      })
      
      return usage
    }, {} as Record<string, { quantity: number, menuItems: string[] }>)

    const summary = ingredients.map(ingredient => {
      // Get usage data for this ingredient
      const usage = ingredientUsage[ingredient.id] || { quantity: 0, menuItems: [] }
      
      // Calculate projected weekly usage based on menu items
      const projectedUsage = usage.quantity * 7 // Weekly projection

      // Calculate reorder point (2 weeks supply)
      const reorderPoint = projectedUsage * 2

      // Get current stock from localStorage or default to 0
      const currentStock = parseFloat(localStorage.getItem(`stock_${ingredient.id}`) || '0')

      // Calculate total cost
      const totalCost = currentStock * ingredient.costPerUnit

      // Determine status
      let status: 'low' | 'good' | 'excess' = 'good'
      if (currentStock < reorderPoint) {
        status = 'low'
      } else if (currentStock > reorderPoint * 2) {
        status = 'excess'
      }

      return {
        itemName: ingredient.name,
        currentStock,
        projectedUsage,
        reorderPoint,
        costPerUnit: ingredient.costPerUnit,
        totalCost,
        status,
        usedInMenuItems: usage.menuItems // Add this to show which menu items use this ingredient
      }
    })

    setInventorySummary(summary)
  }
  
  // Function to calculate sales volume from orders
  const calculateSalesVolume = (menuItemId: string): number => {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    return orders.reduce((total, order) => {
      if (new Date(order.date) >= thirtyDaysAgo) {
        const orderItem = order.items.find(item => item.menuItemId === menuItemId);
        return total + (orderItem?.quantity || 0);
      }
      return total;
    }, 0);
  }
  
  // Update the parseCSVMenuItems function to not set default costs
  const parseCSVMenuItems = async (file: File): Promise<MenuItem[]> => {
    const text = await file.text()
    const lines = text.split('\n')
    const items: MenuItem[] = []
    
    // Detect delimiter
    const firstLine = lines[0]
    let delimiter = ','
    if (firstLine.includes(';')) delimiter = ';'
    else if (firstLine.includes('\t')) delimiter = '\t'
    
    // Parse header row
    const headers = firstLine.toLowerCase().split(delimiter).map(h => h.trim())
    
    // Required column detection
    const nameIndex = headers.findIndex(h => h.includes('name') || h.includes('item'))
    const priceIndex = headers.findIndex(h => h.includes('price') || h.includes('rate'))
    const categoryIndex = headers.findIndex(h => h.includes('category') || h.includes('type'))
    
    if (nameIndex === -1 || priceIndex === -1) {
      throw new Error('CSV must include columns for item name and price')
    }
    
    // Parse data rows
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim()
      if (!line) continue
      
      const values = line.split(delimiter).map(v => v.trim())
      
      // Get values
      const name = values[nameIndex]
      const priceStr = values[priceIndex].replace(/[$£€,]/g, '').trim()
      const price = parseFloat(priceStr)
      const category = categoryIndex !== -1 ? values[categoryIndex] : undefined
      
      if (!name || isNaN(price)) continue
      
      // Create menu item without default cost
      const item: MenuItem = {
        id: `item_${Date.now()}_${i}`,
        name,
        currentPrice: price,
        category,
        popularity: 1, // Default popularity
      }
      
      items.push(item)
    }
    
    return items
  }
  
  // Update handleCSVUpload to remove visualization data generation
  const handleCSVUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    
    try {
      setIsLoading(true)
      setMessage('Processing menu items...')
      setMessageType('info')
      
      const importedItems = await parseCSVMenuItems(file)
      
      if (importedItems.length === 0) {
        throw new Error('No valid menu items found in CSV')
      }
      
      // Save data
      if (user) {
        localStorage.setItem(`menuItems_${user.username}`, JSON.stringify(importedItems))
      }
      
      // Update state
      setMenuItems(importedItems)
      setMessage(`Successfully imported ${importedItems.length} menu items`)
      setMessageType('success')
      
    } catch (error) {
      console.error('Error importing CSV:', error)
      setMessage(error instanceof Error ? error.message : 'Error importing CSV file')
      setMessageType('error')
    } finally {
      setIsLoading(false)
      event.target.value = ''
    }
  }
  
  // Add this function inside MenuOptimizer component
  const handleClearMenuData = () => {
    if (window.confirm('Are you sure you want to clear all menu data? This will delete all menu items and their associated data.')) {
      try {
        // Clear menu-related data from localStorage
        if (user) {
          localStorage.removeItem(`menuItems_${user.username}`)
        }
        
        // Reset states
        setMenuItems([])
        setRecommendations([])
        setMessage('All menu data has been cleared successfully')
        setMessageType('success')
      } catch (error) {
        console.error('Error clearing menu data:', error)
        setMessage('Error clearing menu data')
        setMessageType('error')
      }
    }
  }
  
  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Menu Items</h2>
          <div className="flex space-x-2">
            <label className="px-3 py-1 bg-purple-600 text-white text-sm rounded-md hover:bg-purple-700 cursor-pointer">
              <input
                type="file"
                accept=".csv"
                onChange={handleCSVUpload}
                className="hidden"
              />
              Import Menu CSV
            </label>
            <button
              onClick={calculateCostsFromIngredients}
              className="px-3 py-1 bg-green-600 text-white text-sm rounded-md hover:bg-green-700"
              disabled={ingredients.length === 0 || recipes.length === 0}
            >
              Auto-Calculate Costs
            </button>
            <button
              onClick={handleClearMenuData}
              className="px-3 py-1 bg-red-600 text-white text-sm rounded-md hover:bg-red-700 flex items-center space-x-1"
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
              <span>Clear Menu Data</span>
            </button>
          </div>
        </div>

        {message && (
          <div className={`mb-4 p-3 rounded-md ${
            messageType === 'success' ? 'bg-green-50 text-green-700' :
            messageType === 'error' ? 'bg-red-50 text-red-700' :
            'bg-blue-50 text-blue-700'
          }`}>
            {message}
          </div>
        )}

        {/* Add manual cost input in the menu item form */}
        <div className="mb-4 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Item Name
            </label>
            <input
              type="text"
              value={newItem.name}
              onChange={(e) => setNewItem({...newItem, name: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              placeholder="e.g. Chicken Parmesan"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Current Price ($)
            </label>
            <input
              type="number"
              value={newItem.currentPrice || ''}
              onChange={(e) => setNewItem({...newItem, currentPrice: Number(e.target.value)})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              placeholder="0.00"
              min="0"
              step="0.01"
            />
          </div>

          <div className="flex items-end">
            <button
              onClick={handleAddItem}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded"
            >
              Add Menu Item
            </button>
          </div>
        </div>

        {/* Display Imported Menu Items */}
        {menuItems.length > 0 && (
          <div className="mt-6">
            <h3 className="text-lg font-medium mb-4">Menu Items</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Price ($)</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Cost ($)</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">30-Day Sales</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {menuItems.map((item) => (
                    <tr key={item.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right">${item.currentPrice.toFixed(2)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                        {item.cost 
                          ? `$${item.cost.toFixed(2)}`
                          : <span className="text-gray-500 italic">Calculating...</span>
                        }
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.category || '-'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                        {calculateSalesVolume(item.id)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                        <button
                          onClick={() => handleDeleteItem(item.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Inventory Summary Section */}
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Inventory Summary</h2>
          <button
            onClick={calculateInventorySummary}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Update Summary
          </button>
        </div>

        {inventorySummary.length > 0 && (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Item</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Current Stock</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Weekly Usage</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Cost/Unit</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Total Cost</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Used In Menu Items</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Status</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {inventorySummary.map((item, index) => (
                  <tr key={index}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.itemName}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right">{item.currentStock.toFixed(2)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right">{item.projectedUsage.toFixed(2)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right">${item.costPerUnit.toFixed(2)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right">${item.totalCost.toFixed(2)}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {item.usedInMenuItems?.length > 0 
                        ? item.usedInMenuItems.join(', ')
                        : <span className="text-gray-500 italic">Not used in any menu items</span>
                      }
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        item.status === 'low' ? 'bg-red-100 text-red-800' :
                        item.status === 'excess' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {item.status.toUpperCase()}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-gray-50">
                <tr>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Total</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right"></td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right"></td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right"></td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium">
                    ${inventorySummary.reduce((sum, item) => sum + item.totalCost, 0).toFixed(2)}
                  </td>
                  <td></td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>
    </div>
  )
} 