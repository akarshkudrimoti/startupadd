'use client'

import React, { useState, useRef, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'

interface ColumnMapping {
  date: number;
  itemName: number;
  salesAmount: number;
  price?: number;
  cost?: number;
  category?: number;
}

interface MenuItem {
  id: string;
  name: string;
  currentPrice: number;
  cost: number;
  category: string;
  ingredients: IngredientUsage[];
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
    { name: 'Desserts', keywords: ['dessert', 'cake', 'pie', 'ice cream', 'cookie', 'brownie', 'pudding', 'sweet', 'chocolate', 'cheesecake'] },
    { name: 'Beverages', keywords: ['drink', 'beverage', 'coffee', 'tea', 'soda', 'juice', 'water', 'milk', 'smoothie', 'shake', 'cocktail', 'beer', 'wine'] },
    { name: 'Breakfast', keywords: ['breakfast', 'egg', 'omelette', 'pancake', 'waffle', 'bacon', 'sausage', 'toast', 'bagel', 'muffin'] },
    { name: 'Kids Menu', keywords: ['kid', 'child', 'junior', 'small'] }
  ];
  
  // Check for exact category matches first (if the CSV already has categories)
  for (const category of categories) {
    if (name === category.name.toLowerCase()) {
      return category.name;
    }
  }
  
  // Score each category based on keyword matches
  const scores = categories.map(category => {
    let score = 0;
    for (const keyword of category.keywords) {
      if (name.includes(keyword)) {
        // Add points based on how much of the item name the keyword covers
        score += (keyword.length / name.length) * 10;
      }
    }
    return { category: category.name, score };
  });
  
  // Sort by score (descending)
  scores.sort((a, b) => b.score - a.score);
  
  // Return the highest scoring category, or "Other" if no good matches
  return scores[0].score > 0.2 ? scores[0].category : "Other";
}

export function FileUploader({ onUploadComplete }: Props) {
  const { user } = useAuth()
  const [file, setFile] = useState<File | null>(null)
  const [fileName, setFileName] = useState('')
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [columnMapping, setColumnMapping] = useState<ColumnMapping | null>(null)
  const [headers, setHeaders] = useState<string[]>([])
  const [preview, setPreview] = useState<string[][]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [menuItems, setMenuItems] = useState<MenuItem[]>([])
  const [showMenuItemsPreview, setShowMenuItemsPreview] = useState(false)
  const [processedData, setProcessedData] = useState<any[]>([])
  const [categoryStats, setCategoryStats] = useState<{category: string, count: number}[]>([])
  
  // Load existing menu items from localStorage
  useEffect(() => {
    if (user) {
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
    }
  }, [user])
  
  // Process file content
  const processFileContent = (content: string) => {
    const lines = content.split('\n').filter(line => line.trim() !== '')
    
    if (lines.length === 0) {
      setError('File is empty')
      setUploading(false)
      return
    }
    
    // Parse headers
    const headerLine = lines[0]
    const headerCells = headerLine.split(',').map(cell => cell.trim())
    setHeaders(headerCells)
    
    // Try to automatically map columns
    const mapping: Partial<ColumnMapping> = {}
    
    headerCells.forEach((header, index) => {
      const lowerHeader = header.toLowerCase()
      
      if (lowerHeader.includes('date')) {
        mapping.date = index
      } else if (lowerHeader.includes('item') || lowerHeader.includes('product') || lowerHeader.includes('dish')) {
        mapping.itemName = index
      } else if (lowerHeader.includes('sales') || lowerHeader.includes('quantity') || lowerHeader.includes('amount')) {
        mapping.salesAmount = index
      } else if (lowerHeader.includes('price') || lowerHeader.includes('revenue')) {
        mapping.price = index
      } else if (lowerHeader.includes('cost')) {
        mapping.cost = index
      } else if (lowerHeader.includes('category')) {
        mapping.category = index
      }
    })
    
    // Only set the mapping if we have the required fields
    if (mapping.date !== undefined && mapping.itemName !== undefined && mapping.salesAmount !== undefined) {
      setColumnMapping(mapping as ColumnMapping)
    }
    
    // Set preview data (first 5 lines)
    const previewData = lines.slice(1, Math.min(6, lines.length)).map(line => line.split(',').map(cell => cell.trim()))
    setPreview(previewData)
  }
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      setFile(selectedFile)
      setFileName(selectedFile.name)
      setError(null)
      
      // Read the file content
      const reader = new FileReader()
      reader.onload = (event) => {
        const content = event.target?.result as string
        processFileContent(content)
      }
      
      reader.readAsText(selectedFile)
    }
  }
  
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
  }
  
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    
    const droppedFile = e.dataTransfer.files?.[0]
    if (droppedFile) {
      setFile(droppedFile)
      setFileName(droppedFile.name)
      setError(null)
      
      // Read the file content
      const reader = new FileReader()
      reader.onload = (event) => {
        const content = event.target?.result as string
        processFileContent(content)
      }
      
      reader.readAsText(droppedFile)
    }
  }
  
  const handleColumnMappingChange = (field: keyof ColumnMapping, value: number | undefined) => {
    if (!columnMapping) return
    
    setColumnMapping({
      ...columnMapping,
      [field]: value
    })
  }
  
  const handleUpload = async () => {
    if (!file || !columnMapping) {
      setError('Please select a file and map the required columns')
      return
    }
    
    setUploading(true)
    setError(null)
    
    try {
      const reader = new FileReader()
      
      reader.onload = (e) => {
        const content = e.target?.result as string
        const lines = content.split('\n').filter(line => line.trim() !== '')
        
        if (lines.length < 2) {
          setError('File is empty or has no data rows')
          setUploading(false)
          return
        }
        
        // Pre-allocate array size for better performance
        const data = new Array(lines.length - 1)
        const newMenuItems: Record<string, MenuItem> = {}
        const categoryCounter: Record<string, number> = {}
        
        // Use a more efficient loop
        const processChunk = (startIdx: number, endIdx: number) => {
          for (let i = startIdx; i < endIdx; i++) {
            if (i >= lines.length) break;
            
            const line = lines[i].trim()
            if (!line) continue
            
            const cells = line.split(',').map(cell => cell.trim())
            
            // Skip if we don't have enough cells
            if (cells.length <= Math.max(columnMapping.date, columnMapping.itemName, columnMapping.salesAmount)) {
              continue
            }
            
            // Extract data from cells
            const dateStr = cells[columnMapping.date]
            const itemName = cells[columnMapping.itemName]
            const salesAmountStr = cells[columnMapping.salesAmount]
            
            // Skip if any required field is missing
            if (!dateStr || !itemName || !salesAmountStr) {
              continue
            }
            
            // Parse date
            let formattedDate = dateStr
            try {
              const date = new Date(dateStr)
              if (!isNaN(date.getTime())) {
                formattedDate = date.toISOString().split('T')[0]
              }
            } catch (e) {
              // Keep original date string if parsing fails
            }
            
            // Parse sales amount
            const salesAmount = parseFloat(salesAmountStr.replace(/[^0-9.-]+/g, ''))
            if (isNaN(salesAmount)) {
              continue
            }
            
            // Extract optional fields
            let price = 0
            if (columnMapping.price !== undefined) {
              const priceStr = cells[columnMapping.price]
              price = parseFloat(priceStr.replace(/[^0-9.-]+/g, ''))
              if (isNaN(price)) price = 0
            }
            
            let cost = 0
            if (columnMapping.cost !== undefined) {
              const costStr = cells[columnMapping.cost]
              cost = parseFloat(costStr.replace(/[^0-9.-]+/g, ''))
              if (isNaN(cost)) cost = 0
            }
            
            // Extract or identify category
            let category = "Other"
            if (columnMapping.category !== undefined) {
              category = cells[columnMapping.category] || "Other"
            } else {
              // Use AI to identify category if not provided
              category = identifyCategory(itemName)
            }
            
            // Track category counts
            if (!categoryCounter[category]) {
              categoryCounter[category] = 0
            }
            categoryCounter[category] += salesAmount
            
            // Create or update menu item
            const itemId = itemName.toLowerCase().replace(/[^a-z0-9]/g, '_')
            if (!newMenuItems[itemId]) {
              newMenuItems[itemId] = {
                id: itemId,
                name: itemName,
                currentPrice: price,
                cost: cost,
                category: category,
                ingredients: []
              }
            } else if (price > 0) {
              // Update price if available
              newMenuItems[itemId].currentPrice = price
            }
            
            if (cost > 0) {
              // Update cost if available
              newMenuItems[itemId].cost = cost
            }
            
            // Add to data array directly at index
            data[i - 1] = {
              date: formattedDate,
              itemName,
              salesAmount,
              price: price || 0,
              cost: cost || 0,
              category
            }
          }
        }
        
        // Process in chunks for better UI responsiveness
        const chunkSize = 1000;
        const totalChunks = Math.ceil((lines.length - 1) / chunkSize);
        
        let currentChunk = 0;
        
        const processNextChunk = () => {
          const startIdx = 1 + (currentChunk * chunkSize); // Skip header row
          const endIdx = Math.min(startIdx + chunkSize, lines.length);
          
          processChunk(startIdx, endIdx);
          
          currentChunk++;
          if (currentChunk < totalChunks) {
            // Process next chunk on next animation frame
            requestAnimationFrame(processNextChunk);
          } else {
            // All chunks processed, finalize
            // Filter out any undefined entries (from skipped rows)
            const filteredData = data.filter(Boolean);
            
            // Convert category stats to array and sort
            const categoryStatsArray = Object.entries(categoryCounter)
              .map(([category, count]) => ({ category, count }))
              .sort((a, b) => b.count - a.count);
            
            // Merge new menu items with existing ones
            const updatedMenuItems = [...menuItems];
            
            Object.values(newMenuItems).forEach(newItem => {
              const existingIndex = updatedMenuItems.findIndex(item => 
                item.id === newItem.id || item.name.toLowerCase() === newItem.name.toLowerCase()
              );
              
              if (existingIndex >= 0) {
                // Update existing item if new data is better
                const existing = updatedMenuItems[existingIndex];
                
                updatedMenuItems[existingIndex] = {
                  ...existing,
                  currentPrice: newItem.currentPrice > 0 ? newItem.currentPrice : existing.currentPrice,
                  cost: newItem.cost > 0 ? newItem.cost : existing.cost,
                  category: newItem.category !== "Other" ? newItem.category : existing.category
                };
              } else {
                // Add new item
                updatedMenuItems.push(newItem);
              }
            });
            
            // Save updated menu items to localStorage
            if (user) {
              localStorage.setItem(`menuItems_${user.username}`, JSON.stringify(updatedMenuItems));
            }
            
            // Update state and complete
            setProcessedData(filteredData);
            setCategoryStats(categoryStatsArray);
            setMenuItems(updatedMenuItems);
            setShowMenuItemsPreview(true);
            onUploadComplete(filteredData);
            
            // Complete the upload
            setTimeout(() => {
              setUploading(false);
              setFile(null);
              setFileName('');
              setColumnMapping(null);
            }, 1000);
          }
        };
        
        // Start processing
        processNextChunk();
      }
      
      reader.readAsText(file)
    } catch (err) {
      console.error('Error processing file:', err)
      setError('Error processing file. Please check the format and try again.')
      setUploading(false)
    }
  }
  
  return (
    <div className="w-full">
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-md text-sm">
          {error}
        </div>
      )}
      
      {!file && (
        <div 
          className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:bg-gray-50"
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <input 
            type="file" 
            ref={fileInputRef}
            className="hidden" 
            accept=".csv" 
            onChange={handleFileChange}
          />
          
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          
          <p className="mt-1 text-sm text-gray-600">
            Drag and drop a CSV file, or click to select
          </p>
          <p className="mt-1 text-xs text-gray-500">
            File should contain date, item name, and sales amount columns
          </p>
        </div>
      )}
      
      {file && !columnMapping && (
        <div className="text-center p-4 border border-gray-200 rounded-md">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-sm text-gray-600">Analyzing file...</p>
        </div>
      )}
      
      {file && columnMapping && (
        <div className="mt-4">
          <h4 className="text-sm font-medium mb-2">Column Mapping</h4>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Date Column
              </label>
              <select
                value={columnMapping.date}
                onChange={(e) => handleColumnMappingChange('date', parseInt(e.target.value))}
                className="w-full px-2 py-1 text-sm border border-gray-300 rounded-md"
              >
                {headers.map((header, index) => (
                  <option key={index} value={index}>{header}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Item Name Column
              </label>
              <select
                value={columnMapping.itemName}
                onChange={(e) => handleColumnMappingChange('itemName', parseInt(e.target.value))}
                className="w-full px-2 py-1 text-sm border border-gray-300 rounded-md"
              >
                {headers.map((header, index) => (
                  <option key={index} value={index}>{header}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Sales Amount Column
              </label>
              <select
                value={columnMapping.salesAmount}
                onChange={(e) => handleColumnMappingChange('salesAmount', parseInt(e.target.value))}
                className="w-full px-2 py-1 text-sm border border-gray-300 rounded-md"
              >
                {headers.map((header, index) => (
                  <option key={index} value={index}>{header}</option>
                ))}
              </select>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Price Column (Optional)
              </label>
              <select
                value={columnMapping.price !== undefined ? columnMapping.price : ''}
                onChange={(e) => {
                  const value = e.target.value === '' ? undefined : parseInt(e.target.value)
                  handleColumnMappingChange('price', value as number)
                }}
                className="w-full px-2 py-1 text-sm border border-gray-300 rounded-md"
              >
                <option value="">Not Available</option>
                {headers.map((header, index) => (
                  <option key={index} value={index}>{header}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Cost Column (Optional)
              </label>
              <select
                value={columnMapping.cost !== undefined ? columnMapping.cost : ''}
                onChange={(e) => {
                  const value = e.target.value === '' ? undefined : parseInt(e.target.value)
                  handleColumnMappingChange('cost', value as number)
                }}
                className="w-full px-2 py-1 text-sm border border-gray-300 rounded-md"
              >
                <option value="">Not Available</option>
                {headers.map((header, index) => (
                  <option key={index} value={index}>{header}</option>
                ))}
              </select>
            </div>
          </div>
          
          {preview.length > 0 && (
            <div className="mt-4">
              <h4 className="text-xs font-medium mb-2">Preview</h4>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 text-xs">
                  <thead className="bg-gray-50">
                    <tr>
                      {headers.map((header, index) => (
                        <th key={index} className="px-2 py-1 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          {header}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {preview.map((row, rowIndex) => (
                      <tr key={rowIndex}>
                        {row.map((cell, cellIndex) => (
                          <td key={cellIndex} className="px-2 py-1 whitespace-nowrap">
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
          
          <div className="mt-4">
            <button
              onClick={handleUpload}
              disabled={uploading}
              className={`w-full px-4 py-2 bg-blue-600 text-white rounded-md ${uploading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-blue-700'}`}
            >
              {uploading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Processing...
                </span>
              ) : 'Upload and Process'}
            </button>
          </div>
        </div>
      )}
      
      {/* Processed Data Preview */}
      {processedData.length > 0 && (
        <div className="mt-6 p-4 border border-blue-200 bg-blue-50 rounded-md">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-medium text-blue-800">Processed Sales Data</h4>
          </div>
          
          <p className="text-xs text-blue-700 mb-2">
            {processedData.length} sales records have been processed and added to your dashboard.
          </p>
          
          <div className="max-h-40 overflow-y-auto">
            <table className="min-w-full divide-y divide-blue-200 text-xs">
              <thead className="bg-blue-100">
                <tr>
                  <th className="px-2 py-1 text-left text-xs font-medium text-blue-800 uppercase tracking-wider">Date</th>
                  <th className="px-2 py-1 text-left text-xs font-medium text-blue-800 uppercase tracking-wider">Item</th>
                  <th className="px-2 py-1 text-left text-xs font-medium text-blue-800 uppercase tracking-wider">Sales</th>
                  <th className="px-2 py-1 text-left text-xs font-medium text-blue-800 uppercase tracking-wider">Price</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-blue-100">
                {processedData.slice(0, 5).map((item, index) => (
                  <tr key={index}>
                    <td className="px-2 py-1 whitespace-nowrap">{item.date}</td>
                    <td className="px-2 py-1 whitespace-nowrap">{item.itemName}</td>
                    <td className="px-2 py-1 whitespace-nowrap">{item.salesAmount}</td>
                    <td className="px-2 py-1 whitespace-nowrap">
                      {item.price > 0 ? `$${item.price.toFixed(2)}` : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {processedData.length > 5 && (
              <div className="text-center text-xs text-blue-500 mt-1">
                +{processedData.length - 5} more records
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* Menu Items Preview */}
      {showMenuItemsPreview && (
        <div className="mt-6 p-4 border border-green-200 bg-green-50 rounded-md">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-medium text-green-800">Menu Items Created/Updated</h4>
            <button 
              onClick={() => setShowMenuItemsPreview(false)}
              className="text-green-700 hover:text-green-900"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          <p className="text-xs text-green-700 mb-2">
            These menu items are now available for ingredient association in the Inventory section.
          </p>
          
          <div className="max-h-40 overflow-y-auto">
            <table className="min-w-full divide-y divide-green-200 text-xs">
              <thead className="bg-green-100">
                <tr>
                  <th className="px-2 py-1 text-left text-xs font-medium text-green-800 uppercase tracking-wider">Item Name</th>
                  <th className="px-2 py-1 text-left text-xs font-medium text-green-800 uppercase tracking-wider">Price</th>
                  <th className="px-2 py-1 text-left text-xs font-medium text-green-800 uppercase tracking-wider">Cost</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-green-100">
                {menuItems.map((item) => (
                  <tr key={item.id}>
                    <td className="px-2 py-1 whitespace-nowrap">{item.name}</td>
                    <td className="px-2 py-1 whitespace-nowrap">${item.currentPrice.toFixed(2)}</td>
                    <td className="px-2 py-1 whitespace-nowrap">${item.cost.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          <div className="mt-3">
            <a 
              href="/inventory" 
              className="text-xs text-green-700 hover:text-green-900 underline"
            >
              Go to Inventory to associate ingredients →
            </a>
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
        </div>
      )}
    </div>
  )
} 