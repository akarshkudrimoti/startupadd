'use client'

import React, { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'

interface Ingredient {
  id: string;
  name: string;
  costPerUnit: number;
  unit: string;
  packageSize?: number;
  packageCost?: number;
}

interface Recipe {
  menuItemId: string;
  ingredientId: string;
  quantity: number;
}

interface MenuItemWithIngredients {
  id: string;
  name: string;
  currentPrice: number;
  ingredients: {
    ingredient: Ingredient;
    quantity: number;
  }[];
  calculatedCost?: number;
}

export function IngredientCostCalculator({ onCostCalculated }: { onCostCalculated: (itemId: string, cost: number) => void }) {
  const { user } = useAuth()
  const [ingredients, setIngredients] = useState<Ingredient[]>([])
  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [menuItems, setMenuItems] = useState<MenuItemWithIngredients[]>([])
  const [newIngredient, setNewIngredient] = useState<Ingredient>({ id: '', name: '', costPerUnit: 0, unit: 'g' })
  const [showIngredientModal, setShowIngredientModal] = useState(false)
  const [showAssociationModal, setShowAssociationModal] = useState(false)
  const [selectedMenuItem, setSelectedMenuItem] = useState<string>('')
  const [selectedMenuIngredient, setSelectedMenuIngredient] = useState<string>('')
  const [ingredientQuantity, setIngredientQuantity] = useState<number>(0)
  const [message, setMessage] = useState<string>('')
  const [messageType, setMessageType] = useState<'success' | 'error' | 'info'>('info')
  const [bulkMode, setBulkMode] = useState<boolean>(false)
  const [showCostBreakdown, setShowCostBreakdown] = useState<string | null>(null)
  const [showClearDataModal, setShowClearDataModal] = useState(false)
  
  // Load data from localStorage
  useEffect(() => {
    if (user) {
      // Load ingredients
      const savedIngredients = localStorage.getItem(`ingredients_${user.username}`)
      if (savedIngredients) {
        try {
          setIngredients(JSON.parse(savedIngredients))
        } catch (e) {
          console.error('Error loading saved ingredients:', e)
        }
      }
      
      // Load recipes
      const savedRecipes = localStorage.getItem(`recipes_${user.username}`)
      if (savedRecipes) {
        try {
          setRecipes(JSON.parse(savedRecipes))
        } catch (e) {
          console.error('Error loading saved recipes:', e)
        }
      }
      
      // Load menu items
      const savedMenuItems = localStorage.getItem(`menuItems_${user.username}`)
      if (savedMenuItems) {
        try {
          const parsedMenuItems = JSON.parse(savedMenuItems)
          setMenuItems(parsedMenuItems.map((item: any) => ({
            ...item,
            ingredients: [] // Will be populated below
          })))
        } catch (e) {
          console.error('Error loading saved menu items:', e)
        }
      }
    }
  }, [user])
  
  // Calculate costs whenever ingredients or recipes change
  useEffect(() => {
    if (ingredients.length > 0 && recipes.length > 0 && menuItems.length > 0) {
      const updatedMenuItems = menuItems.map(menuItem => {
        // Find all recipes for this menu item
        const itemRecipes = recipes.filter(recipe => recipe.menuItemId === menuItem.id)
        
        // Map recipes to ingredients with quantities
        const itemIngredients = itemRecipes.map(recipe => {
          const ingredient = ingredients.find(ing => ing.id === recipe.ingredientId)
          return {
            ingredient: ingredient!,
            quantity: recipe.quantity
          }
        }).filter(item => item.ingredient) // Filter out any undefined ingredients
        
        // Calculate total cost
        const totalCost = itemIngredients.reduce((sum, { ingredient, quantity }) => {
          return sum + (ingredient.costPerUnit * quantity)
        }, 0)
        
        // Update the menu item with ingredients and calculated cost
        return {
          ...menuItem,
          ingredients: itemIngredients,
          calculatedCost: totalCost
        }
      })
      
      setMenuItems(updatedMenuItems)
      
      // Notify parent component of all calculated costs
      updatedMenuItems.forEach(item => {
        if (item.calculatedCost !== undefined) {
          onCostCalculated(item.id, item.calculatedCost)
        }
      })
      
      // Save updated menu items to localStorage
      if (user) {
        localStorage.setItem(`menuItems_${user.username}`, JSON.stringify(updatedMenuItems))
      }
    }
  }, [ingredients, recipes, user, onCostCalculated])
  
  const handleAddIngredient = () => {
    if (!newIngredient.name.trim()) {
      setMessage('Ingredient name is required')
      setMessageType('error')
      return
    }
    
    if (newIngredient.costPerUnit <= 0) {
      setMessage('Cost must be greater than zero')
      setMessageType('error')
      return
    }
    
    // Generate a unique ID
    const id = `ingredient_${Date.now()}`
    
    // Calculate cost per unit if package size and cost are provided
    let costPerUnit = newIngredient.costPerUnit
    if (newIngredient.packageSize && newIngredient.packageCost) {
      costPerUnit = newIngredient.packageCost / newIngredient.packageSize
    }
    
    // Add the new ingredient
    const ingredientToAdd = { 
      ...newIngredient, 
      id,
      costPerUnit
    }
    
    setIngredients(prev => [...prev, ingredientToAdd])
    
    // Save to localStorage
    if (user) {
      localStorage.setItem(`ingredients_${user.username}`, JSON.stringify([...ingredients, ingredientToAdd]))
    }
    
    // Reset form and close modal
    setNewIngredient({ id: '', name: '', costPerUnit: 0, unit: 'g' })
    setShowIngredientModal(false)
    
    // Show success message
    setMessage('Ingredient added successfully')
    setMessageType('success')
    
    // Clear message after 3 seconds
    setTimeout(() => setMessage(''), 3000)
  }
  
  const handleDeleteIngredient = (id: string) => {
    // Check if ingredient is used in any recipes
    const isUsed = recipes.some(recipe => recipe.ingredientId === id)
    
    if (isUsed) {
      setMessage('Cannot delete ingredient that is used in recipes')
      setMessageType('error')
      return
    }
    
    setIngredients(prev => prev.filter(ingredient => ingredient.id !== id))
    
    // Save to localStorage
    if (user) {
      localStorage.setItem(`ingredients_${user.username}`, JSON.stringify(ingredients.filter(ingredient => ingredient.id !== id)))
    }
    
    // Show success message
    setMessage('Ingredient deleted successfully')
    setMessageType('success')
    
    // Clear message after 3 seconds
    setTimeout(() => setMessage(''), 3000)
  }
  
  const handleAddIngredientToMenuItem = () => {
    if (!selectedMenuItem) {
      setMessage('Please select a menu item')
      setMessageType('error')
      return
    }
    
    if (!selectedMenuIngredient) {
      setMessage('Please select an ingredient')
      setMessageType('error')
      return
    }
    
    if (ingredientQuantity <= 0) {
      setMessage('Quantity must be greater than zero')
      setMessageType('error')
      return
    }
    
    // Check if this ingredient is already added to this menu item
    const existingRecipe = recipes.find(
      recipe => recipe.menuItemId === selectedMenuItem && recipe.ingredientId === selectedMenuIngredient
    )
    
    if (existingRecipe) {
      // Update existing recipe
      const updatedRecipes = recipes.map(recipe => 
        recipe.menuItemId === selectedMenuItem && recipe.ingredientId === selectedMenuIngredient
          ? { ...recipe, quantity: ingredientQuantity }
          : recipe
      )
      
      setRecipes(updatedRecipes)
      
      // Save to localStorage
      if (user) {
        localStorage.setItem(`recipes_${user.username}`, JSON.stringify(updatedRecipes))
      }
      
      setMessage('Ingredient quantity updated')
      setMessageType('success')
    } else {
      // Create new recipe
      const newRecipe: Recipe = {
        menuItemId: selectedMenuItem,
        ingredientId: selectedMenuIngredient,
        quantity: ingredientQuantity
      }
      
      setRecipes(prev => [...prev, newRecipe])
      
      // Save to localStorage
      if (user) {
        localStorage.setItem(`recipes_${user.username}`, JSON.stringify([...recipes, newRecipe]))
      }
      
      setMessage('Ingredient added to menu item')
      setMessageType('success')
    }
    
    // Reset form and close modal
    setSelectedMenuItem('')
    setSelectedMenuIngredient('')
    setIngredientQuantity(0)
    setShowAssociationModal(false)
    
    // Clear message after 3 seconds
    setTimeout(() => setMessage(''), 3000)
  }
  
  const handleRemoveIngredientFromMenuItem = (menuItemId: string, ingredientId: string) => {
    // Remove recipe
    const updatedRecipes = recipes.filter(
      recipe => !(recipe.menuItemId === menuItemId && recipe.ingredientId === ingredientId)
    )
    
    setRecipes(updatedRecipes)
    
    // Save to localStorage
    if (user) {
      localStorage.setItem(`recipes_${user.username}`, JSON.stringify(updatedRecipes))
    }
    
    setMessage('Ingredient removed from menu item')
    setMessageType('success')
    
    // Clear message after 3 seconds
    setTimeout(() => setMessage(''), 3000)
  }
  
  const toggleCostBreakdown = (itemId: string) => {
    if (showCostBreakdown === itemId) {
      setShowCostBreakdown(null)
    } else {
      setShowCostBreakdown(itemId)
    }
  }
  
  const handleClearAllData = () => {
    if (user) {
      // Clear all data from localStorage
      localStorage.removeItem(`ingredients_${user.username}`)
      localStorage.removeItem(`recipes_${user.username}`)
      localStorage.removeItem(`menuItems_${user.username}`)
      localStorage.removeItem(`inventoryItems_${user.username}`)
      localStorage.removeItem(`salesData_${user.username}`)
      localStorage.removeItem(`categoryStats_${user.username}`)
      localStorage.removeItem(`forecastData_${user.username}`)
      
      // Reset all state
      setIngredients([])
      setRecipes([])
      setMenuItems([])
      
      // Close modal
      setShowClearDataModal(false)
      
      // Show success message
      setMessage('All data has been cleared successfully')
      setMessageType('success')
      
      // Clear message after 3 seconds
      setTimeout(() => setMessage(''), 3000)
    }
  }
  
  return (
    <div className="mt-8 bg-white p-6 rounded-lg border border-gray-200">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold mb-4">Ingredient Cost Calculator</h2>
        <div className="flex space-x-2">
          <button
            onClick={() => setShowIngredientModal(true)}
            className="px-3 py-1 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700"
          >
            Add Ingredient
          </button>
          <button
            onClick={() => setShowAssociationModal(true)}
            className="px-3 py-1 bg-green-600 text-white text-sm rounded-md hover:bg-green-700"
            disabled={ingredients.length === 0 || menuItems.length === 0}
          >
            Add to Menu Item
          </button>
          <button
            onClick={() => setShowClearDataModal(true)}
            className="px-3 py-1 bg-red-600 text-white text-sm rounded-md hover:bg-red-700"
          >
            Clear All Data
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
      
      {/* Ingredients Table */}
      <div className="mb-6">
        <h3 className="text-lg font-medium mb-2">Ingredients</h3>
        
        {ingredients.length === 0 ? (
          <div className="bg-gray-50 p-4 text-center rounded-md">
            <p className="text-gray-500">No ingredients added yet. Add your first ingredient to get started.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th scope="col" className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Cost Per Unit
                  </th>
                  <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Unit
                  </th>
                  <th scope="col" className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {ingredients.map(ingredient => (
                  <tr key={ingredient.id}>
                    <td className="px-3 py-2 whitespace-nowrap text-sm font-medium text-gray-900">
                      {ingredient.name}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500 text-right">
                      ${ingredient.costPerUnit.toFixed(2)}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">
                      per {ingredient.unit}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handleDeleteIngredient(ingredient.id)}
                        className="text-red-600 hover:text-red-900 ml-2"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      
      {/* Menu Items with Costs */}
      <div>
        <h3 className="text-lg font-medium mb-2">Menu Item Costs</h3>
        
        {menuItems.length === 0 ? (
          <div className="bg-gray-50 p-4 text-center rounded-md">
            <p className="text-gray-500">No menu items found. Add menu items in the Menu Optimizer section.</p>
          </div>
        ) : (
          <div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Menu Item
                    </th>
                    <th scope="col" className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Current Price
                    </th>
                    <th scope="col" className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Calculated Cost
                    </th>
                    <th scope="col" className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Profit Margin
                    </th>
                    <th scope="col" className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {menuItems.map(item => {
                    const cost = item.calculatedCost || 0;
                    const margin = item.currentPrice > 0 ? ((item.currentPrice - cost) / item.currentPrice) * 100 : 0;
                    
                    return (
                      <tr key={item.id} className={margin < 30 ? 'bg-red-50' : margin > 70 ? 'bg-green-50' : ''}>
                        <td className="px-3 py-2 whitespace-nowrap text-sm font-medium text-gray-900">
                          {item.name}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500 text-right">
                          ${item.currentPrice.toFixed(2)}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500 text-right">
                          ${cost.toFixed(2)}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500 text-right">
                          <span className={
                            margin < 30 ? 'text-red-600' : 
                            margin > 70 ? 'text-green-600' : 
                            'text-yellow-600'
                          }>
                            {margin.toFixed(1)}%
                          </span>
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-right text-sm font-medium">
                          <button
                            onClick={() => toggleCostBreakdown(item.id)}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            {showCostBreakdown === item.id ? 'Hide Details' : 'Show Details'}
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
            
            {/* Cost Breakdown for Selected Item */}
            {showCostBreakdown && (
              <div className="mt-4 p-4 bg-blue-50 rounded-md">
                <h4 className="text-md font-medium text-blue-800 mb-2">
                  Cost Breakdown for {menuItems.find(item => item.id === showCostBreakdown)?.name}
                </h4>
                
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-blue-200">
                    <thead className="bg-blue-100">
                      <tr>
                        <th className="px-3 py-2 text-left text-xs font-medium text-blue-800 uppercase tracking-wider">
                          Ingredient
                        </th>
                        <th className="px-3 py-2 text-right text-xs font-medium text-blue-800 uppercase tracking-wider">
                          Quantity
                        </th>
                        <th className="px-3 py-2 text-right text-xs font-medium text-blue-800 uppercase tracking-wider">
                          Cost Per Unit
                        </th>
                        <th className="px-3 py-2 text-right text-xs font-medium text-blue-800 uppercase tracking-wider">
                          Total Cost
                        </th>
                        <th className="px-3 py-2 text-right text-xs font-medium text-blue-800 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-blue-100">
                      {menuItems.find(item => item.id === showCostBreakdown)?.ingredients.map(({ ingredient, quantity }) => (
                        <tr key={ingredient.id}>
                          <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-700">
                            {ingredient.name}
                          </td>
                          <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500 text-right">
                            {quantity} {ingredient.unit}
                          </td>
                          <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500 text-right">
                            ${ingredient.costPerUnit.toFixed(2)}
                          </td>
                          <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500 text-right">
                            ${(ingredient.costPerUnit * quantity).toFixed(2)}
                          </td>
                          <td className="px-3 py-2 whitespace-nowrap text-right text-sm font-medium">
                            <button
                              onClick={() => handleRemoveIngredientFromMenuItem(showCostBreakdown, ingredient.id)}
                              className="text-red-600 hover:text-red-900"
                            >
                              Remove
                            </button>
                          </td>
                        </tr>
                      ))}
                      <tr className="bg-blue-50">
                        <td colSpan={3} className="px-3 py-2 text-right text-sm font-medium text-blue-800">Total Cost:</td>
                        <td className="px-3 py-2 text-right text-sm font-medium text-blue-800">
                          ${menuItems.find(item => item.id === showCostBreakdown)?.calculatedCost?.toFixed(2) || '0.00'}
                        </td>
                        <td></td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
      
      {/* Add Ingredient Modal */}
      {showIngredientModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Add New Ingredient</h3>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Ingredient Name
              </label>
              <input
                type="text"
                value={newIngredient.name}
                onChange={(e) => setNewIngredient({...newIngredient, name: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                placeholder="e.g. Chicken Breast"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Cost Per Unit
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-gray-500">$</span>
                  </div>
                  <input
                    type="number"
                    value={newIngredient.costPerUnit || ''}
                    onChange={(e) => setNewIngredient({...newIngredient, costPerUnit: Number(e.target.value)})}
                    className="w-full pl-7 px-3 py-2 border border-gray-300 rounded-md"
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Unit
                </label>
                <select
                  value={newIngredient.unit}
                  onChange={(e) => setNewIngredient({...newIngredient, unit: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="g">Gram (g)</option>
                  <option value="kg">Kilogram (kg)</option>
                  <option value="oz">Ounce (oz)</option>
                  <option value="lb">Pound (lb)</option>
                  <option value="ml">Milliliter (ml)</option>
                  <option value="l">Liter (l)</option>
                  <option value="unit">Unit/Piece</option>
                </select>
              </div>
            </div>
            
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setShowIngredientModal(false)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md"
              >
                Cancel
              </button>
              <button
                onClick={handleAddIngredient}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Add Ingredient
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Add Ingredient to Menu Item Modal */}
      {showAssociationModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Add Ingredient to Menu Item</h3>
            
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
            
            <div className="mb-4">
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
      
      {/* Clear All Data Confirmation Modal */}
      {showClearDataModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-medium text-red-600 mb-4">⚠️ Clear All Data</h3>
            
            <p className="mb-4 text-gray-700">
              Are you sure you want to clear all your data? This will delete all menu items, ingredients, recipes, inventory, and sales data. This action cannot be undone.
            </p>
            
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setShowClearDataModal(false)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md"
              >
                Cancel
              </button>
              <button
                onClick={handleClearAllData}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
              >
                Yes, Clear All Data
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 