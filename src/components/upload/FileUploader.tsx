'use client'

import React, { useState, useRef, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'

interface ColumnMapping {
  date?: number;
  itemName?: number;
  salesAmount?: number;
  price?: number;
  cost?: number;
  category?: number;
  quantity?: number;
  revenue?: number;
}

interface MenuItem {
  id: string;
  name: string;
  currentPrice: number;
  cost: number;
  category: string;
  salesVolume?: number;
}

interface IngredientUsage {
  ingredientId: string;
  quantity: number;
}

interface Props {
  onUploadComplete: (data: any[]) => void;
}

// AI-powered category identification
function identifyCategory(itemName: string): string {
  // Convert to lowercase for better matching
  const name = itemName.toLowerCase();
  
  // Define category patterns with keywords
  const categories = [
    { name: 'Appetizers', keywords: ['appetizer', 'starter', 'small plate', 'dip', 'nachos', 'wings', 'fries', 'chips', 'bread'] },
    { name: 'Soups & Salads', keywords: ['soup', 'salad', 'bowl', 'greens', 'caesar', 'garden'] },
    { name: 'Sandwiches', keywords: ['sandwich', 'burger', 'wrap', 'sub', 'panini', 'melt', 'club', 'blt'] },
    { name: 'Pasta', keywords: ['pasta', 'spaghetti', 'fettuccine', 'linguine', 'penne', 'macaroni', 'lasagna', 'ravioli', 'noodle'] },
    { name: 'Pizza', keywords: ['pizza', 'pie', 'calzone', 'flatbread', 'margherita', 'pepperoni'] },
    { name: 'Seafood', keywords: ['fish', 'seafood', 'shrimp', 'salmon', 'tuna', 'crab', 'lobster', 'oyster', 'clam', 'mussel', 'scallop'] },
    { name: 'Meat & Poultry', keywords: ['steak', 'beef', 'chicken', 'pork', 'lamb', 'veal', 'turkey', 'duck', 'ribs', 'chop', 'filet', 'sirloin'] },
    { name: 'Vegetarian', keywords: ['vegetarian', 'vegan', 'plant', 'tofu', 'veggie', 'meatless', 'garden'] },
    { name: 'Sides', keywords: ['side', 'fries', 'rice', 'potato', 'vegetable', 'beans', 'corn', 'slaw'] },
    { name: 'Desserts', keywords: ['dessert', 'cake', 'pie', 'ice cream', 'cookie', 'brownie', 'sweet', 'chocolate', 'pastry', 'cheesecake'] },
    { name: 'Beverages', keywords: ['drink', 'beverage', 'coffee', 'tea', 'soda', 'juice', 'water', 'smoothie', 'shake', 'cocktail', 'beer', 'wine'] },
  ];
  
  // Check for matches
  for (const category of categories) {
    for (const keyword of category.keywords) {
      if (name.includes(keyword)) {
        return category.name;
      }
    }
  }
  
  // Default category if no match found
  return 'Other';
}

export function FileUploader({ onUploadComplete }: Props) {
  const { user } = useAuth()
  const [file, setFile] = useState<File | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [menuItems, setMenuItems] = useState<MenuItem[]>([])
  const [categoryStats, setCategoryStats] = useState<any[]>([])
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [headers, setHeaders] = useState<string[]>([])
  const [previewData, setPreviewData] = useState<string[][]>([])
  
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  // Auto-detect column mapping based on common header names
  const autoDetectColumns = (headers: string[]): ColumnMapping => {
    const mapping: ColumnMapping = {};
    
    headers.forEach((header, index) => {
      const lowerHeader = header.toLowerCase();
      
      // Item name detection
      if (lowerHeader.includes('item') || lowerHeader.includes('product') || 
          lowerHeader.includes('dish') || lowerHeader.includes('name') || 
          lowerHeader.includes('menu')) {
        mapping.itemName = index;
      }
      
      // Date detection
      else if (lowerHeader.includes('date') || lowerHeader.includes('day') || 
               lowerHeader.includes('time') || lowerHeader.includes('period')) {
        mapping.date = index;
      }
      
      // Price detection
      else if (lowerHeader.includes('price') || lowerHeader.includes('rate') || 
               lowerHeader === 'amount' || lowerHeader.includes('charge')) {
        mapping.price = index;
      }
      
      // Cost detection
      else if (lowerHeader.includes('cost') || lowerHeader.includes('expense') || 
               lowerHeader.includes('cogs')) {
        mapping.cost = index;
      }
      
      // Category detection
      else if (lowerHeader.includes('category') || lowerHeader.includes('type') || 
               lowerHeader.includes('group') || lowerHeader.includes('section')) {
        mapping.category = index;
      }
      
      // Quantity/Sales detection
      else if (lowerHeader.includes('quantity') || lowerHeader.includes('qty') || 
               lowerHeader.includes('count') || lowerHeader.includes('units') || 
               lowerHeader.includes('sales') || lowerHeader.includes('sold')) {
        mapping.salesAmount = index;
      }
      
      // Revenue detection
      else if (lowerHeader.includes('revenue') || lowerHeader.includes('sales') || 
               lowerHeader.includes('income') || lowerHeader.includes('total')) {
        mapping.revenue = index;
      }
    });
    
    return mapping;
  };
  
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(true)
  }
  
  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(false)
  }
  
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(false)
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const droppedFile = e.dataTransfer.files[0]
      handleFile(droppedFile)
    }
  }
  
  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFile = e.target.files[0]
      handleFile(selectedFile)
    }
  }
  
  const handleFile = (file: File) => {
    // Reset states
    setError(null)
    setSuccess(null)
    
    // Check file type
    if (!file.name.toLowerCase().endsWith('.csv')) {
      setError('Please upload a CSV file')
      return
    }
    
    setFile(file)
    
    // Read file for preview and column mapping
    const reader = new FileReader()
    
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string
        parseCSVAndProcess(content)
      } catch (err) {
        setError('Error reading file: ' + (err instanceof Error ? err.message : String(err)))
      }
    }
    
    reader.onerror = () => {
      setError('Error reading file')
    }
    
    reader.readAsText(file)
  }
  
  const parseCSVAndProcess = (content: string) => {
    setIsAnalyzing(true)
    
    try {
      // Split by newlines and handle different line endings
      const lines = content.split(/\r\n|\n|\r/).filter(line => line.trim() !== '')
      
      if (lines.length < 2) {
        setError('CSV file must contain at least a header row and one data row')
        setIsAnalyzing(false)
        return
      }
      
      // Detect delimiter by checking first row
      const firstRow = lines[0]
      let delimiter = ','
      
      // Check for common delimiters
      const delimiters = [',', ';', '\t', '|']
      for (const d of delimiters) {
        if (firstRow.split(d).length > 1) {
          delimiter = d
          break
        }
      }
      
      // Parse headers
      const headerRow = parseCSVRow(lines[0], delimiter)
      setHeaders(headerRow)
      
      // Parse preview data (up to 5 rows)
      const previewRows = lines.slice(1, Math.min(6, lines.length)).map(line => 
        parseCSVRow(line, delimiter)
      )
      setPreviewData(previewRows)
      
      // Auto-detect column mapping
      const mapping = autoDetectColumns(headerRow)
      
      // Process the data with the detected mapping
      processCSVData(lines, delimiter, mapping)
    } catch (err) {
      setError('Error parsing CSV: ' + (err instanceof Error ? err.message : String(err)))
      setIsAnalyzing(false)
    }
  }
  
  const parseCSVRow = (row: string, delimiter: string): string[] => {
    const result: string[] = []
    let inQuotes = false
    let currentValue = ''
    
    for (let i = 0; i < row.length; i++) {
      const char = row[i]
      
      if (char === '"') {
        inQuotes = !inQuotes
      } else if (char === delimiter && !inQuotes) {
        result.push(currentValue.trim())
        currentValue = ''
      } else {
        currentValue += char
      }
    }
    
    // Add the last value
    result.push(currentValue.trim())
    
    return result
  }
  
  const processCSVData = (lines: string[], delimiter: string, mapping: ColumnMapping) => {
    // Ensure we have at least the item name column
    if (mapping.itemName === undefined) {
      setError('Could not detect item name column. Please try a different CSV format.')
      setIsAnalyzing(false)
      return
    }
    
    try {
      const headerRow = parseCSVRow(lines[0], delimiter)
      const processedData: any[] = []
      const uniqueItems = new Map<string, MenuItem>()
      const categoryCounts: Record<string, number> = {}
      
      // Process each data row
      for (let i = 1; i < lines.length; i++) {
        const row = parseCSVRow(lines[i], delimiter)
        
        // Skip rows that don't have enough columns
        if (row.length <= mapping.itemName) continue
        
        const itemName = row[mapping.itemName].trim()
        if (!itemName) continue
        
        // Extract date if available
        let date = new Date().toISOString().split('T')[0] // Default to today
        if (mapping.date !== undefined && row[mapping.date]) {
          const dateStr = row[mapping.date].trim()
          // Try to parse the date
          try {
            const parsedDate = new Date(dateStr)
            if (!isNaN(parsedDate.getTime())) {
              date = parsedDate.toISOString().split('T')[0]
            }
          } catch (e) {
            // If date parsing fails, keep the default
          }
        }
        
        // Extract sales amount/quantity
        let salesAmount = 1
        if (mapping.salesAmount !== undefined && row[mapping.salesAmount]) {
          const salesStr = row[mapping.salesAmount].replace(/[^0-9.-]/g, '')
          salesAmount = parseFloat(salesStr) || 1
        }
        
        // Extract price
        let price = 0
        if (mapping.price !== undefined && row[mapping.price]) {
          const priceStr = row[mapping.price].replace(/[^0-9.-]/g, '')
          price = parseFloat(priceStr) || 0
        } else if (mapping.revenue !== undefined && mapping.salesAmount !== undefined) {
          // Calculate price from revenue and quantity if available
          const revenueStr = row[mapping.revenue].replace(/[^0-9.-]/g, '')
          const revenue = parseFloat(revenueStr) || 0
          price = salesAmount > 0 ? revenue / salesAmount : 0
        }
        
        // Extract cost
        let cost = 0
        if (mapping.cost !== undefined && row[mapping.cost]) {
          const costStr = row[mapping.cost].replace(/[^0-9.-]/g, '')
          cost = parseFloat(costStr) || 0
        } else {
          // Default cost to 40% of price if not provided
          cost = price * 0.4
        }
        
        // Extract or identify category
        let category = 'Other'
        if (mapping.category !== undefined && row[mapping.category]) {
          category = row[mapping.category].trim()
        } else {
          // Use AI to identify category
          category = identifyCategory(itemName)
        }
        
        // Track category counts
        categoryCounts[category] = (categoryCounts[category] || 0) + salesAmount
        
        // Create data item
        const dataItem = {
          date,
          itemName,
          salesAmount,
          price,
          cost,
          category
        }
        
        processedData.push(dataItem)
        
        // Update or create menu item
        if (!uniqueItems.has(itemName)) {
          uniqueItems.set(itemName, {
            id: `item_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            name: itemName,
            currentPrice: price,
            cost: cost,
            category: category,
            salesVolume: salesAmount
          })
        } else {
          const existingItem = uniqueItems.get(itemName)!
          existingItem.salesVolume = (existingItem.salesVolume || 0) + salesAmount
          // Only update price and cost if they're not zero
          if (price > 0) existingItem.currentPrice = price
          if (cost > 0) existingItem.cost = cost
        }
      }
      
      // Convert unique items to array
      const menuItemsArray = Array.from(uniqueItems.values())
      
      // Save menu items to localStorage for the menu optimizer
      if (user && menuItemsArray.length > 0) {
        // Get existing menu items
        const existingItemsStr = localStorage.getItem(`menuItems_${user.username}`)
        let existingItems: MenuItem[] = []
        
        if (existingItemsStr) {
          try {
            existingItems = JSON.parse(existingItemsStr)
          } catch (e) {
            console.error('Error parsing existing menu items:', e)
          }
        }
        
        // Merge with existing items, updating prices and costs where available
        const mergedItems = [...existingItems]
        
        menuItemsArray.forEach(newItem => {
          const existingIndex = mergedItems.findIndex(item => 
            item.name.toLowerCase() === newItem.name.toLowerCase()
          )
          
          if (existingIndex >= 0) {
            // Update existing item
            if (newItem.currentPrice > 0) mergedItems[existingIndex].currentPrice = newItem.currentPrice
            if (newItem.cost > 0) mergedItems[existingIndex].cost = newItem.cost
            if (newItem.category) mergedItems[existingIndex].category = newItem.category
            mergedItems[existingIndex].salesVolume = (mergedItems[existingIndex].salesVolume || 0) + (newItem.salesVolume || 0)
          } else {
            // Add new item
            mergedItems.push(newItem)
          }
        })
        
        // Save merged items
        localStorage.setItem(`menuItems_${user.username}`, JSON.stringify(mergedItems))
      }
      
      // Convert category counts to array for display
      const categoryStatsArray = Object.entries(categoryCounts)
        .map(([category, count]) => ({ category, count }))
        .sort((a, b) => b.count - a.count)
      
      setMenuItems(menuItemsArray)
      setCategoryStats(categoryStatsArray)
      setSuccess(`Successfully processed ${processedData.length} records from ${uniqueItems.size} menu items`)
      onUploadComplete(processedData)
      
    } catch (err) {
      setError('Error processing CSV: ' + (err instanceof Error ? err.message : String(err)))
    } finally {
      setIsAnalyzing(false)
    }
  }
  
  return (
    <div className="w-full">
      <div 
        className={`border-2 border-dashed rounded-lg p-6 text-center ${
          isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-blue-400'
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <input 
          type="file" 
          ref={fileInputRef} 
          onChange={handleFileInput} 
          className="hidden" 
          accept=".csv"
        />
        
        <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
        </svg>
        
        <p className="mt-2 text-sm text-gray-600">
          {file ? file.name : 'Drag and drop your CSV file here, or click to select'}
        </p>
        <p className="mt-1 text-xs text-gray-500">
          Supports sales data, menu items, or inventory data
        </p>
      </div>
      
      {error && (
        <div className="mt-4 p-3 bg-red-50 text-red-700 rounded-md text-sm">
          <strong>Error:</strong> {error}
        </div>
      )}
      
      {success && (
        <div className="mt-4 p-3 bg-green-50 text-green-700 rounded-md text-sm">
          <strong>Success!</strong> {success}
        </div>
      )}
      
      {isAnalyzing && (
        <div className="mt-4 p-4 bg-blue-50 rounded-md">
          <div className="flex items-center">
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-blue-500" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span className="text-blue-700">Analyzing your data with AI...</span>
          </div>
        </div>
      )}
      
      {/* Preview of detected data */}
      {headers.length > 0 && previewData.length > 0 && !isAnalyzing && (
        <div className="mt-6 p-4 border border-gray-200 rounded-md">
          <h3 className="text-md font-medium mb-3">Data Preview</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {headers.map((header, index) => (
                    <th 
                      key={index} 
                      className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {previewData.map((row, rowIndex) => (
                  <tr key={rowIndex}>
                    {row.map((cell, cellIndex) => (
                      <td 
                        key={cellIndex} 
                        className="px-3 py-2 whitespace-nowrap text-sm text-gray-500"
                      >
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      
      {/* Category Stats Preview */}
      {categoryStats.length > 0 && (
        <div className="mt-6 p-4 border border-purple-200 bg-purple-50 rounded-md">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-medium text-purple-800">AI-Identified Categories</h4>
          </div>
          
          <p className="text-xs text-purple-700 mb-2">
            Our AI has automatically categorized your menu items:
          </p>
          
          <div className="max-h-40 overflow-y-auto">
            <table className="min-w-full divide-y divide-purple-200 text-xs">
              <thead className="bg-purple-100">
                <tr>
                  <th className="px-2 py-1 text-left text-xs font-medium text-purple-800 uppercase tracking-wider">Category</th>
                  <th className="px-2 py-1 text-right text-xs font-medium text-purple-800 uppercase tracking-wider">Items</th>
                  <th className="px-2 py-1 text-right text-xs font-medium text-purple-800 uppercase tracking-wider">Sales Volume</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-purple-100">
                {categoryStats.map((stat, index) => (
                  <tr key={index}>
                    <td className="px-2 py-1 whitespace-nowrap">{stat.category}</td>
                    <td className="px-2 py-1 whitespace-nowrap text-right">
                      {menuItems.filter(item => item.category === stat.category).length}
                    </td>
                    <td className="px-2 py-1 whitespace-nowrap text-right">
                      {stat.count.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          <div className="mt-4 text-xs text-purple-700">
            <p className="font-medium">Menu items have been automatically imported to the Menu Optimizer!</p>
            <p>You can now use the Menu Optimizer to generate price recommendations based on this data.</p>
          </div>
        </div>
      )}
    </div>
  )
} 