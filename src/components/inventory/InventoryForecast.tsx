'use client'

import React, { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'

// Import Chart.js types
// import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, ChartOptions } from 'chart.js'
// import { Line } from 'react-chartjs-2'

// Register Chart.js components
// ChartJS.register(
//   CategoryScale,
//   LinearScale,
//   PointElement,
//   LineElement,
//   Title,
//   Tooltip,
//   Legend
// )

interface MenuItem {
  id: string;
  name: string;
  ingredients: IngredientUsage[];
}

interface IngredientUsage {
  ingredientId: string;
  quantity: number;
}

interface Ingredient {
  id: string;
  name: string;
  currentStock: number;
  unit: string;
}

interface ForecastDay {
  date: string;
  quantity: number;
}

interface IngredientForecast {
  ingredientId: string;
  ingredientName: string;
  forecast: ForecastDay[];
  totalForecast: number;
}

interface StockAlert {
  ingredientId: string;
  ingredientName: string;
  currentStock: number;
  forecastUsage: number;
  daysUntilEmpty: number;
  deficit: number;
  status: 'critical' | 'warning';
}

// Simple chart fallback component
function SimpleForecastChart({ forecast }: { forecast: ForecastDay[] }) {
  const maxValue = Math.max(...forecast.map(day => day.quantity)) * 1.1;
  
  return (
    <div className="w-full h-full flex items-end space-x-1">
      {forecast.map((day, index) => {
        const height = (day.quantity / maxValue) * 100;
        const date = new Date(day.date);
        const formattedDate = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        
        return (
          <div key={index} className="flex-1 flex flex-col items-center">
            <div 
              className="w-full bg-blue-500 rounded-t"
              style={{ height: `${height}%` }}
            ></div>
            <div className="text-xs mt-1 text-gray-600 truncate w-full text-center">
              {formattedDate}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function InventoryForecast() {
  const { user } = useAuth()
  const [ingredients, setIngredients] = useState<Ingredient[]>([])
  const [menuItems, setMenuItems] = useState<MenuItem[]>([])
  const [forecasts, setForecasts] = useState<IngredientForecast[]>([])
  const [alerts, setAlerts] = useState<StockAlert[]>([])
  const [newIngredient, setNewIngredient] = useState<Omit<Ingredient, 'id'>>({ 
    name: '', 
    currentStock: 0, 
    unit: 'g' 
  })
  const [isLoading, setIsLoading] = useState(false)
  const [selectedIngredient, setSelectedIngredient] = useState<string>('')
  const [forecastDays, setForecastDays] = useState(7)
  const [showAssociationModal, setShowAssociationModal] = useState(false)
  const [selectedMenuItem, setSelectedMenuItem] = useState<string>('')
  const [selectedMenuIngredient, setSelectedMenuIngredient] = useState<string>('')
  const [ingredientQuantity, setIngredientQuantity] = useState<number>(0)
  
  // Load data from localStorage
  useEffect(() => {
    if (user) {
      // Load ingredients
      const savedIngredients = localStorage.getItem(`ingredients_${user.username}`)
      if (savedIngredients) {
        try {
          setIngredients(JSON.parse(savedIngredients))
        } catch (e) {
          console.error('Error loading ingredients:', e)
        }
      }
      
      // Load menu items
      const savedMenuItems = localStorage.getItem(`menuItems_${user.username}`)
      if (savedMenuItems) {
        try {
          const parsedItems = JSON.parse(savedMenuItems)
          // Ensure each menu item has an ingredients array
          const itemsWithIngredients = parsedItems.map((item: any) => ({
            ...item,
            ingredients: item.ingredients || []
          }))
          setMenuItems(itemsWithIngredients)
        } catch (e) {
          console.error('Error loading menu items:', e)
        }
      }
      
      // Load forecasts if they exist
      const savedForecasts = localStorage.getItem(`forecasts_${user.username}`)
      if (savedForecasts) {
        try {
          setForecasts(JSON.parse(savedForecasts))
        } catch (e) {
          console.error('Error loading forecasts:', e)
        }
      }
    }
  }, [user])
  
  // Save ingredients to localStorage when updated
  useEffect(() => {
    if (user && ingredients.length > 0) {
      localStorage.setItem(`ingredients_${user.username}`, JSON.stringify(ingredients))
    }
  }, [ingredients, user])
  
  // Save menu items to localStorage when updated
  useEffect(() => {
    if (user && menuItems.length > 0) {
      localStorage.setItem(`menuItems_${user.username}`, JSON.stringify(menuItems))
    }
  }, [menuItems, user])
  
  // Generate alerts whenever forecasts or ingredients change
  useEffect(() => {
    if (forecasts.length > 0 && ingredients.length > 0) {
      const currentStock: Record<string, number> = {}
      ingredients.forEach(ing => {
        currentStock[ing.id] = ing.currentStock
      })
      
      const newAlerts: StockAlert[] = []
      
      forecasts.forEach(forecast => {
        const ingredient = ingredients.find(ing => ing.id === forecast.ingredientId)
        if (!ingredient) return
        
        const totalForecast = forecast.totalForecast
        
        if (totalForecast > ingredient.currentStock) {
          // Calculate days until empty
          let daysUntilEmpty = 0
          let runningTotal = 0
          
          for (const day of forecast.forecast) {
            runningTotal += day.quantity
            if (runningTotal > ingredient.currentStock) {
              break
            }
            daysUntilEmpty++
          }
          
          newAlerts.push({
            ingredientId: ingredient.id,
            ingredientName: ingredient.name,
            currentStock: ingredient.currentStock,
            forecastUsage: totalForecast,
            daysUntilEmpty,
            deficit: totalForecast - ingredient.currentStock,
            status: daysUntilEmpty <= 2 ? 'critical' : 'warning'
          })
        }
      })
      
      // Sort by days until empty
      newAlerts.sort((a, b) => a.daysUntilEmpty - b.daysUntilEmpty)
      setAlerts(newAlerts)
    } else {
      setAlerts([])
    }
  }, [forecasts, ingredients])
  
  const handleAddIngredient = () => {
    if (!newIngredient.name.trim() || newIngredient.currentStock < 0) {
      return
    }
    
    const newId = `ing_${Date.now()}`
    const ingredient: Ingredient = {
      id: newId,
      name: newIngredient.name,
      currentStock: newIngredient.currentStock,
      unit: newIngredient.unit
    }
    
    setIngredients([...ingredients, ingredient])
    setNewIngredient({ name: '', currentStock: 0, unit: 'g' })
  }
  
  const handleRemoveIngredient = (id: string) => {
    setIngredients(ingredients.filter(ing => ing.id !== id))
  }
  
  const handleUpdateStock = (id: string, stock: number) => {
    setIngredients(ingredients.map(ing => 
      ing.id === id ? { ...ing, currentStock: stock } : ing
    ))
  }
  
  // Add a new function to handle ingredient-menu item associations
  const handleAddIngredientToMenuItem = () => {
    if (!selectedMenuItem || !selectedMenuIngredient || ingredientQuantity <= 0) {
      return
    }
    
    const updatedMenuItems = menuItems.map(item => {
      if (item.id === selectedMenuItem) {
        // Check if this ingredient is already associated
        const existingIndex = item.ingredients.findIndex(
          ing => ing.ingredientId === selectedMenuIngredient
        )
        
        if (existingIndex >= 0) {
          // Update existing association
          const updatedIngredients = [...item.ingredients]
          updatedIngredients[existingIndex] = {
            ...updatedIngredients[existingIndex],
            quantity: ingredientQuantity
          }
          return { ...item, ingredients: updatedIngredients }
        } else {
          // Add new association
          return {
            ...item,
            ingredients: [
              ...item.ingredients,
              { ingredientId: selectedMenuIngredient, quantity: ingredientQuantity }
            ]
          }
        }
      }
      return item
    })
    
    setMenuItems(updatedMenuItems)
    setSelectedMenuItem('')
    setSelectedMenuIngredient('')
    setIngredientQuantity(0)
    setShowAssociationModal(false)
  }
  
  // Add a function to remove an ingredient from a menu item
  const handleRemoveIngredientFromMenuItem = (menuItemId: string, ingredientId: string) => {
    const updatedMenuItems = menuItems.map(item => {
      if (item.id === menuItemId) {
        return {
          ...item,
          ingredients: item.ingredients.filter(ing => ing.ingredientId !== ingredientId)
        }
      }
      return item
    })
    
    setMenuItems(updatedMenuItems)
  }
  
  // Modify the generateForecast function to use menu item associations
  const generateForecast = async () => {
    setIsLoading(true)
    
    try {
      // Get sales data from localStorage
      const salesData = user ? localStorage.getItem(`restaurantSalesData_${user.username}`) : null
      if (!salesData) {
        throw new Error('No sales data available')
      }
      
      const parsedSalesData = JSON.parse(salesData)
      
      // Create a mapping of menu items to their ingredients
      const menuItemIngredients: Record<string, IngredientUsage[]> = {}
      menuItems.forEach(item => {
        menuItemIngredients[item.name] = item.ingredients
      })
      
      // Calculate ingredient usage based on sales data and menu item associations
      const ingredientUsage: Record<string, number[]> = {}
      
      // Initialize usage arrays for each ingredient
      ingredients.forEach(ing => {
        ingredientUsage[ing.id] = Array(forecastDays).fill(0)
      })
      
      // Group sales by item and date
      const salesByItem: Record<string, Record<string, number>> = {}
      
      parsedSalesData.forEach((sale: any) => {
        const itemName = sale.itemName
        const date = new Date(sale.date).toISOString().split('T')[0]
        
        if (!salesByItem[itemName]) {
          salesByItem[itemName] = {}
        }
        
        if (!salesByItem[itemName][date]) {
          salesByItem[itemName][date] = 0
        }
        
        salesByItem[itemName][date] += 1
      })
      
      // Calculate average daily sales for each item
      const avgDailySales: Record<string, number> = {}
      
      Object.entries(salesByItem).forEach(([itemName, dateSales]) => {
        const totalSales = Object.values(dateSales).reduce((sum, count) => sum + count, 0)
        const uniqueDays = Object.keys(dateSales).length
        avgDailySales[itemName] = totalSales / uniqueDays
      })
      
      // Project ingredient usage based on average sales and menu item associations
      Object.entries(avgDailySales).forEach(([itemName, avgSales]) => {
        const itemIngredients = menuItemIngredients[itemName] || []
        
        itemIngredients.forEach(usage => {
          const dailyUsage = usage.quantity * avgSales
          
          // Add to each day's forecast
          for (let i = 0; i < forecastDays; i++) {
            ingredientUsage[usage.ingredientId][i] += dailyUsage
          }
        })
      })
      
      // Create forecast objects
      const newForecasts: IngredientForecast[] = []
      
      Object.entries(ingredientUsage).forEach(([ingredientId, usageArray]) => {
        const ingredient = ingredients.find(ing => ing.id === ingredientId)
        if (!ingredient) return
        
        const today = new Date()
        const forecast: ForecastDay[] = usageArray.map((quantity, index) => {
          const date = new Date(today)
          date.setDate(date.getDate() + index)
          return {
            date: date.toISOString().split('T')[0],
            quantity
          }
        })
        
        newForecasts.push({
          ingredientId,
          ingredientName: ingredient.name,
          forecast,
          totalForecast: usageArray.reduce((sum, qty) => sum + qty, 0)
        })
      })
      
      setForecasts(newForecasts)
      
      // Save forecasts to localStorage
      if (user) {
        localStorage.setItem(`forecasts_${user.username}`, JSON.stringify(newForecasts))
      }
    } catch (error) {
      console.error('Error generating forecast:', error)
    } finally {
      setIsLoading(false)
    }
  }
  
  const getChartData = (forecast: IngredientForecast) => {
    return {
      labels: forecast.forecast.map(day => day.date),
      datasets: [
        {
          label: 'Forecasted Usage',
          data: forecast.forecast.map(day => day.quantity),
          borderColor: 'rgb(59, 130, 246)',
          backgroundColor: 'rgba(59, 130, 246, 0.5)',
          tension: 0.3
        }
      ]
    }
  }
  
  // Define the chart options
  // const chartOptions: ChartOptions = {
  //   responsive: true,
  //   plugins: {
  //     legend: {
  //       display: false
  //     },
  //     tooltip: {
  //       callbacks: {
  //         label: function(context: any) {
  //           return `Usage: ${context.parsed.y} units`
  //         }
  //       }
  //     }
  //   }
  // }
  
  return (
    <div>
      <h3 className="text-lg font-medium mb-4">Smart Inventory Forecasting</h3>
      
      {/* Alerts Section */}
      {alerts.length > 0 && (
        <div className="mb-6">
          <h4 className="text-md font-medium mb-2">Stock Alerts</h4>
          
          <div className="space-y-2">
            {alerts.map((alert) => (
              <div 
                key={alert.ingredientId}
                className={`border rounded-md p-3 ${
                  alert.status === 'critical' 
                    ? 'border-red-200 bg-red-50' 
                    : 'border-yellow-200 bg-yellow-50'
                }`}
              >
                <div className="flex justify-between items-center">
                  <div>
                    <h5 className="font-medium">
                      {alert.ingredientName}
                      <span className={`ml-2 text-xs px-2 py-0.5 rounded-full ${
                        alert.status === 'critical' 
                          ? 'bg-red-100 text-red-800' 
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {alert.status === 'critical' ? 'Critical' : 'Warning'}
                      </span>
                    </h5>
                    <p className="text-sm">
                      {alert.daysUntilEmpty === 0 
                        ? 'Will run out today!' 
                        : `Will run out in ${alert.daysUntilEmpty} day${alert.daysUntilEmpty !== 1 ? 's' : ''}`}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500">Current: {alert.currentStock}</p>
                    <p className="text-xs text-gray-500">Needed: {alert.forecastUsage}</p>
                    <p className={`text-xs font-medium ${
                      alert.status === 'critical' ? 'text-red-600' : 'text-yellow-600'
                    }`}>
                      Deficit: {alert.deficit.toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Ingredients Management */}
      <div className="mb-6">
        <h4 className="text-md font-medium mb-2">Inventory Management</h4>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
          <div className="md:col-span-2">
            <input
              type="text"
              value={newIngredient.name}
              onChange={(e) => setNewIngredient({...newIngredient, name: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              placeholder="Ingredient name"
            />
          </div>
          <div>
            <input
              type="number"
              value={newIngredient.currentStock || ''}
              onChange={(e) => setNewIngredient({...newIngredient, currentStock: Number(e.target.value)})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              placeholder="Current stock"
              min="0"
              step="0.01"
            />
          </div>
          <div className="flex">
            <select
              value={newIngredient.unit}
              onChange={(e) => setNewIngredient({...newIngredient, unit: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-l-md text-sm"
            >
              <option value="g">Gram (g)</option>
              <option value="kg">Kilogram (kg)</option>
              <option value="oz">Ounce (oz)</option>
              <option value="lb">Pound (lb)</option>
              <option value="ml">Milliliter (ml)</option>
              <option value="l">Liter (l)</option>
              <option value="unit">Unit/Piece</option>
            </select>
            <button
              onClick={handleAddIngredient}
              className="px-3 py-2 bg-blue-600 text-white rounded-r-md hover:bg-blue-700"
            >
              Add
            </button>
          </div>
        </div>
        
        {ingredients.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ingredient</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Current Stock</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Unit</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {ingredients.map((ingredient) => (
                  <tr key={ingredient.id}>
                    <td className="px-3 py-2 whitespace-nowrap text-sm">{ingredient.name}</td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      <input
                        type="number"
                        value={ingredient.currentStock}
                        onChange={(e) => handleUpdateStock(ingredient.id, Number(e.target.value))}
                        className="w-24 px-2 py-1 border border-gray-300 rounded-md text-sm"
                        min="0"
                        step="0.01"
                      />
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-sm">{ingredient.unit}</td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      <button
                        onClick={() => handleRemoveIngredient(ingredient.id)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-4 text-gray-500">
            No ingredients added yet. Add ingredients to start forecasting.
          </div>
        )}
      </div>
      
      {/* Forecast Controls */}
      <div className="mb-6">
        <h4 className="text-md font-medium mb-2">Generate Forecast</h4>
        
        <div className="flex items-center mb-4">
          <label className="block text-sm font-medium text-gray-700 mr-4">
            Forecast Period:
          </label>
          <select
            value={forecastDays}
            onChange={(e) => setForecastDays(Number(e.target.value))}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm"
          >
            <option value={3}>3 Days</option>
            <option value={7}>7 Days</option>
            <option value={14}>14 Days</option>
            <option value={30}>30 Days</option>
          </select>
        </div>
        
        <button
          onClick={generateForecast}
          disabled={isLoading || ingredients.length === 0}
          className={`w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded ${(isLoading || ingredients.length === 0) ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          {isLoading ? (
            <span className="flex items-center justify-center">
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Generating Forecast
            </span>
          ) : 'Generate Forecast'}
        </button>
      </div>
      
      {/* Forecast Results */}
      {forecasts.length > 0 && (
        <div>
          <h4 className="text-md font-medium mb-2">Forecast Results</h4>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Select Ingredient:
            </label>
            <select
              value={selectedIngredient}
              onChange={(e) => setSelectedIngredient(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
            >
              <option value="">All Ingredients</option>
              {forecasts.map((forecast) => (
                <option key={forecast.ingredientId} value={forecast.ingredientId}>
                  {forecast.ingredientName} (Total: {forecast.totalForecast})
                </option>
              ))}
            </select>
          </div>
          
          {selectedIngredient ? (
            // Show detailed chart for selected ingredient
            <div>
              {(() => {
                const forecast = forecasts.find(f => f.ingredientId === selectedIngredient)
                if (!forecast) return null
                
                return (
                  <div className="border border-gray-200 rounded-lg p-4">
                    <h5 className="font-medium mb-2">{forecast.ingredientName}</h5>
                    <div className="h-64">
                      <SimpleForecastChart forecast={forecast.forecast} />
                    </div>
                    <div className="mt-4">
                      <h6 className="text-sm font-medium mb-1">Daily Forecast</h6>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                        {forecast.forecast.map((day, index) => (
                          <div key={index} className="border border-gray-100 rounded p-2 text-sm">
                            <div className="font-medium">{new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</div>
                            <div>{day.quantity.toFixed(2)} units</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )
              })()}
            </div>
          ) : (
            // Show summary of all ingredients
            <div className="space-y-4">
              {forecasts.map((forecast) => (
                <div key={forecast.ingredientId} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <h5 className="font-medium">{forecast.ingredientName}</h5>
                    <div className="text-sm font-medium">
                      Total: <span className="text-blue-600">{forecast.totalForecast}</span>
                    </div>
                  </div>
                  <div className="h-40">
                    <SimpleForecastChart forecast={forecast.forecast} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
      
      {/* Menu Item Associations Section */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <h4 className="text-md font-medium">Menu Item Ingredients</h4>
          <button
            onClick={() => setShowAssociationModal(true)}
            className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
          >
            Add Association
          </button>
        </div>
        
        {menuItems.length === 0 ? (
          <div className="text-center py-4 text-gray-500">
            No menu items available. Add menu items in the Menu Optimizer section.
          </div>
        ) : (
          <div className="space-y-4">
            {menuItems.map(item => (
              <div key={item.id} className="border border-gray-200 rounded-md p-3">
                <h5 className="font-medium mb-2">{item.name}</h5>
                
                {item.ingredients.length === 0 ? (
                  <p className="text-sm text-gray-500">No ingredients associated with this item.</p>
                ) : (
                  <div className="space-y-2">
                    {item.ingredients.map(usage => {
                      const ingredient = ingredients.find(ing => ing.id === usage.ingredientId)
                      if (!ingredient) return null
                      
                      return (
                        <div key={usage.ingredientId} className="flex justify-between items-center text-sm">
                          <div>
                            {ingredient.name}: <span className="font-medium">{usage.quantity} {ingredient.unit}</span>
                          </div>
                          <button
                            onClick={() => handleRemoveIngredientFromMenuItem(item.id, usage.ingredientId)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
      
      {/* Association Modal */}
      {showAssociationModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-medium mb-4">Associate Ingredient with Menu Item</h3>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Menu Item
              </label>
              <select
                value={selectedMenuItem}
                onChange={(e) => setSelectedMenuItem(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="">Select a menu item</option>
                {menuItems.map(item => (
                  <option key={item.id} value={item.id}>{item.name}</option>
                ))}
              </select>
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Ingredient
              </label>
              <select
                value={selectedMenuIngredient}
                onChange={(e) => setSelectedMenuIngredient(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="">Select an ingredient</option>
                {ingredients.map(ingredient => (
                  <option key={ingredient.id} value={ingredient.id}>{ingredient.name}</option>
                ))}
              </select>
            </div>
            
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Quantity
              </label>
              <input
                type="number"
                value={ingredientQuantity || ''}
                onChange={(e) => setIngredientQuantity(Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                placeholder="e.g. 250"
                min="0"
                step="0.01"
              />
            </div>
            
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setShowAssociationModal(false)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md"
              >
                Cancel
              </button>
              <button
                onClick={handleAddIngredientToMenuItem}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                disabled={!selectedMenuItem || !selectedMenuIngredient || ingredientQuantity <= 0}
              >
                Add Association
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 