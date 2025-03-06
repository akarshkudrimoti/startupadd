'use client'

import React, { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'

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

interface MenuItemWithIngredients {
  id: string;
  name: string;
  currentPrice: number;
  ingredients: {
    ingredient: Ingredient;
    quantity: number;
  }[];
}

export function IngredientCostCalculator({ onCostCalculated }: { onCostCalculated: (itemId: string, cost: number) => void }) {
  const { user } = useAuth()
  const [ingredients, setIngredients] = useState<Ingredient[]>([])
  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [menuItems, setMenuItems] = useState<MenuItemWithIngredients[]>([])
  const [newIngredient, setNewIngredient] = useState<Omit<Ingredient, 'id'>>({ name: '', costPerUnit: 0, unit: 'g' })
  const [selectedMenuItem, setSelectedMenuItem] = useState<string>('')
  const [selectedIngredient, setSelectedIngredient] = useState<string>('')
  const [ingredientQuantity, setIngredientQuantity] = useState<number>(0)
  const [showIngredientModal, setShowIngredientModal] = useState(false)
  
  // Load data from localStorage
  useEffect(() => {
    if (user) {
      const savedIngredients = localStorage.getItem(`ingredients_${user.username}`)
      const savedRecipes = localStorage.getItem(`recipes_${user.username}`)
      const savedMenuItems = localStorage.getItem(`menuItems_${user.username}`)
      
      if (savedIngredients) {
        try {
          setIngredients(JSON.parse(savedIngredients))
        } catch (e) {
          console.error('Error loading ingredients:', e)
        }
      }
      
      if (savedRecipes) {
        try {
          setRecipes(JSON.parse(savedRecipes))
        } catch (e) {
          console.error('Error loading recipes:', e)
        }
      }
      
      if (savedMenuItems) {
        try {
          const parsedItems = JSON.parse(savedMenuItems)
          setMenuItems(parsedItems.map((item: any) => ({
            ...item,
            ingredients: []
          })))
        } catch (e) {
          console.error('Error loading menu items:', e)
        }
      }
    }
  }, [user])
  
  // Save data to localStorage when updated
  useEffect(() => {
    if (user) {
      localStorage.setItem(`ingredients_${user.username}`, JSON.stringify(ingredients))
      localStorage.setItem(`recipes_${user.username}`, JSON.stringify(recipes))
    }
  }, [ingredients, recipes, user])
  
  // Calculate costs whenever recipes or ingredients change
  useEffect(() => {
    if (menuItems.length > 0 && ingredients.length > 0) {
      // Process menu items with their ingredients
      const processedItems = menuItems.map(item => {
        const itemRecipes = recipes.filter(r => r.menuItemId === item.id)
        const itemIngredients = itemRecipes.map(recipe => {
          const ingredient = ingredients.find(i => i.id === recipe.ingredientId)
          return {
            ingredient: ingredient!,
            quantity: recipe.quantity
          }
        }).filter(i => i.ingredient) // Filter out any undefined ingredients
        
        return {
          ...item,
          ingredients: itemIngredients
        }
      })
      
      setMenuItems(processedItems)
      
      // Calculate and report costs
      processedItems.forEach(item => {
        const totalCost = calculateTotalCost(item)
        onCostCalculated(item.id, totalCost)
      })
    }
  }, [recipes, ingredients, menuItems.length])
  
  const calculateTotalCost = (menuItem: MenuItemWithIngredients): number => {
    if (!menuItem.ingredients || menuItem.ingredients.length === 0) {
      return 0
    }
    
    return menuItem.ingredients.reduce((total, { ingredient, quantity }) => {
      return total + (ingredient.costPerUnit * quantity)
    }, 0)
  }
  
  const handleAddIngredient = () => {
    if (!newIngredient.name.trim() || newIngredient.costPerUnit <= 0) {
      return
    }
    
    const newId = `ing_${Date.now()}`
    const ingredient: Ingredient = {
      id: newId,
      name: newIngredient.name,
      costPerUnit: newIngredient.costPerUnit,
      unit: newIngredient.unit
    }
    
    setIngredients([...ingredients, ingredient])
    setNewIngredient({ name: '', costPerUnit: 0, unit: 'g' })
    setShowIngredientModal(false)
  }
  
  const handleAddIngredientToRecipe = () => {
    if (!selectedMenuItem || !selectedIngredient || ingredientQuantity <= 0) {
      return
    }
    
    const newRecipe: Recipe = {
      menuItemId: selectedMenuItem,
      ingredientId: selectedIngredient,
      quantity: ingredientQuantity
    }
    
    // Remove any existing recipe for this menu item and ingredient
    const filteredRecipes = recipes.filter(
      r => !(r.menuItemId === selectedMenuItem && r.ingredientId === selectedIngredient)
    )
    
    setRecipes([...filteredRecipes, newRecipe])
    setSelectedIngredient('')
    setIngredientQuantity(0)
  }
  
  const handleRemoveIngredientFromRecipe = (menuItemId: string, ingredientId: string) => {
    const updatedRecipes = recipes.filter(
      r => !(r.menuItemId === menuItemId && r.ingredientId === ingredientId)
    )
    setRecipes(updatedRecipes)
  }
  
  return (
    <div className="mt-6 border-t border-gray-200 pt-6">
      <h4 className="text-md font-medium mb-4">Ingredient Cost Calculator</h4>
      <p className="text-sm text-gray-600 mb-4">
        Add ingredients and their costs to automatically calculate the cost of each menu item.
      </p>
      
      <div className="flex justify-between mb-4">
        <button
          onClick={() => setShowIngredientModal(true)}
          className="px-3 py-2 bg-green-600 hover:bg-green-700 text-white text-sm rounded"
        >
          Add New Ingredient
        </button>
      </div>
      
      {/* Ingredients Table */}
      {ingredients.length > 0 && (
        <div className="mb-6">
          <h5 className="text-sm font-medium mb-2">Your Ingredients</h5>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cost</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Unit</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {ingredients.map((ingredient) => (
                  <tr key={ingredient.id}>
                    <td className="px-3 py-2 whitespace-nowrap text-sm">{ingredient.name}</td>
                    <td className="px-3 py-2 whitespace-nowrap text-sm">${ingredient.costPerUnit.toFixed(2)}</td>
                    <td className="px-3 py-2 whitespace-nowrap text-sm">per {ingredient.unit}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      
      {/* Recipe Builder */}
      {menuItems.length > 0 && ingredients.length > 0 && (
        <div className="mb-6">
          <h5 className="text-sm font-medium mb-2">Add Ingredients to Menu Items</h5>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Menu Item
              </label>
              <select
                value={selectedMenuItem}
                onChange={(e) => setSelectedMenuItem(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              >
                <option value="">-- Select Item --</option>
                {menuItems.map((item) => (
                  <option key={item.id} value={item.id}>{item.name}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Ingredient
              </label>
              <select
                value={selectedIngredient}
                onChange={(e) => setSelectedIngredient(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                disabled={!selectedMenuItem}
              >
                <option value="">-- Select Ingredient --</option>
                {ingredients.map((ingredient) => (
                  <option key={ingredient.id} value={ingredient.id}>{ingredient.name}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Quantity
              </label>
              <div className="flex">
                <input
                  type="number"
                  value={ingredientQuantity || ''}
                  onChange={(e) => setIngredientQuantity(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-l-md text-sm"
                  placeholder="Amount"
                  min="0"
                  step="0.01"
                  disabled={!selectedMenuItem || !selectedIngredient}
                />
                <button
                  onClick={handleAddIngredientToRecipe}
                  disabled={!selectedMenuItem || !selectedIngredient || ingredientQuantity <= 0}
                  className={`px-3 py-2 bg-blue-600 text-white rounded-r-md ${(!selectedMenuItem || !selectedIngredient || ingredientQuantity <= 0) ? 'opacity-50 cursor-not-allowed' : 'hover:bg-blue-700'}`}
                >
                  Add
                </button>
              </div>
            </div>
          </div>
          
          {/* Recipe List */}
          <div className="mt-4">
            <h5 className="text-sm font-medium mb-2">Menu Item Ingredients</h5>
            
            {menuItems.map((item) => (
              <div key={item.id} className="mb-4 border border-gray-200 rounded-md p-3">
                <div className="flex justify-between items-center mb-2">
                  <h6 className="font-medium">{item.name}</h6>
                  <div className="text-sm">
                    Cost: <span className="font-medium">${calculateTotalCost(item).toFixed(2)}</span>
                  </div>
                </div>
                
                {item.ingredients.length > 0 ? (
                  <ul className="text-sm">
                    {item.ingredients.map(({ ingredient, quantity }) => (
                      <li key={ingredient.id} className="flex justify-between items-center py-1 border-t border-gray-100">
                        <div>
                          {ingredient.name} ({quantity} {ingredient.unit})
                        </div>
                        <div className="flex items-center">
                          <span className="text-gray-600 mr-2">
                            ${(ingredient.costPerUnit * quantity).toFixed(2)}
                          </span>
                          <button
                            onClick={() => handleRemoveIngredientFromRecipe(item.id, ingredient.id)}
                            className="text-red-600 hover:text-red-800"
                          >
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-gray-500 italic">No ingredients added yet</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Add Ingredient Modal */}
      {showIngredientModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-medium mb-4">Add New Ingredient</h3>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Ingredient Name
              </label>
              <input
                type="text"
                value={newIngredient.name}
                onChange={(e) => setNewIngredient({...newIngredient, name: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                placeholder="e.g. Flour, Chicken, etc."
              />
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Cost Per Unit
              </label>
              <input
                type="number"
                value={newIngredient.costPerUnit || ''}
                onChange={(e) => setNewIngredient({...newIngredient, costPerUnit: Number(e.target.value)})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                placeholder="e.g. 0.05"
                min="0"
                step="0.01"
              />
            </div>
            
            <div className="mb-6">
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
    </div>
  )
} 