'use client'

import React, { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'

// Enhanced AI-powered cuisine and food category identification
function identifyFoodCategory(itemName: string): string {
  // Convert to lowercase for better matching
  const name = itemName.toLowerCase();
  
  // Define comprehensive cuisine and food categories with keywords
  const categories = [
    // Western/American
    { name: 'Burgers & Sandwiches', keywords: ['burger', 'sandwich', 'sub', 'wrap', 'melt', 'club', 'blt', 'grilled cheese', 'hoagie', 'panini'] },
    { name: 'Pizza', keywords: ['pizza', 'pie', 'calzone', 'flatbread', 'margherita', 'pepperoni', 'neapolitan'] },
    { name: 'American Comfort Food', keywords: ['mac and cheese', 'meatloaf', 'pot pie', 'fried chicken', 'bbq', 'barbecue', 'ribs', 'hot dog', 'cornbread', 'biscuit'] },
    
    // Italian
    { name: 'Italian Pasta', keywords: ['pasta', 'spaghetti', 'fettuccine', 'linguine', 'penne', 'macaroni', 'lasagna', 'ravioli', 'gnocchi', 'carbonara', 'bolognese', 'alfredo'] },
    { name: 'Italian Appetizers', keywords: ['bruschetta', 'antipasto', 'arancini', 'calamari', 'caprese'] },
    { name: 'Italian Entrees', keywords: ['risotto', 'osso buco', 'cacciatore', 'marsala', 'parmigiana', 'piccata', 'saltimbocca'] },
    
    // Mexican
    { name: 'Mexican', keywords: ['taco', 'burrito', 'enchilada', 'quesadilla', 'fajita', 'nacho', 'guacamole', 'salsa', 'tortilla', 'chimichanga', 'chile', 'mole', 'carnitas', 'tamale', 'tostada'] },
    
    // Asian - Chinese
    { name: 'Chinese', keywords: ['dim sum', 'dumpling', 'wonton', 'spring roll', 'egg roll', 'fried rice', 'chow mein', 'lo mein', 'kung pao', 'general tso', 'sweet and sour', 'szechuan', 'peking duck', 'mongolian'] },
    
    // Asian - Japanese
    { name: 'Japanese Sushi', keywords: ['sushi', 'sashimi', 'maki', 'nigiri', 'temaki', 'california roll', 'spicy tuna', 'dragon roll', 'rainbow roll'] },
    { name: 'Japanese', keywords: ['ramen', 'udon', 'soba', 'tempura', 'teriyaki', 'katsu', 'donburi', 'gyoza', 'yakitori', 'miso', 'bento', 'shabu', 'sukiyaki', 'okonomiyaki'] },
    
    // Asian - Thai
    { name: 'Thai', keywords: ['pad thai', 'curry', 'tom yum', 'tom kha', 'satay', 'papaya salad', 'larb', 'massaman', 'panang', 'green curry', 'red curry', 'yellow curry', 'basil', 'coconut'] },
    
    // Asian - Indian
    { name: 'Indian', keywords: ['curry', 'tikka masala', 'tandoori', 'naan', 'samosa', 'biryani', 'vindaloo', 'korma', 'saag', 'dal', 'chana masala', 'paneer', 'dosa', 'roti', 'chapati', 'raita', 'pakora'] },
    
    // Asian - Vietnamese
    { name: 'Vietnamese', keywords: ['pho', 'banh mi', 'spring roll', 'vermicelli', 'bun', 'vietnamese coffee'] },
    
    // Asian - Korean
    { name: 'Korean', keywords: ['bibimbap', 'bulgogi', 'kimchi', 'korean bbq', 'galbi', 'japchae', 'tteokbokki', 'gochujang', 'banchan', 'kimbap'] },
    
    // Mediterranean/Middle Eastern
    { name: 'Mediterranean', keywords: ['hummus', 'falafel', 'pita', 'gyro', 'shawarma', 'kebab', 'dolma', 'tabbouleh', 'baba ganoush', 'tzatziki', 'couscous', 'tagine', 'moussaka', 'souvlaki'] },
    { name: 'Greek', keywords: ['gyro', 'souvlaki', 'moussaka', 'spanakopita', 'tzatziki', 'feta', 'greek salad', 'baklava', 'dolmades'] },
    { name: 'Middle Eastern', keywords: ['hummus', 'falafel', 'shawarma', 'kebab', 'tabbouleh', 'baba ganoush', 'pita', 'halal'] },
    
    // Latin American
    { name: 'Latin American', keywords: ['empanada', 'arepa', 'ceviche', 'pupusa', 'churrasco', 'chimichurri', 'plantain', 'mofongo', 'ropa vieja'] },
    
    // Seafood
    { name: 'Seafood', keywords: ['fish', 'seafood', 'shrimp', 'salmon', 'tuna', 'crab', 'lobster', 'oyster', 'clam', 'mussel', 'scallop', 'calamari', 'cod', 'halibut', 'tilapia', 'mahi mahi'] },
    
    // Breakfast
    { name: 'Breakfast', keywords: ['breakfast', 'egg', 'omelette', 'pancake', 'waffle', 'bacon', 'sausage', 'toast', 'bagel', 'muffin', 'croissant', 'french toast', 'hash brown', 'cereal', 'oatmeal'] },
    
    // Appetizers
    { name: 'Appetizers', keywords: ['appetizer', 'starter', 'small plate', 'dip', 'nachos', 'wings', 'fries', 'chips', 'bread', 'finger food', 'tapas', 'mezze'] },
    
    // Soups & Salads
    { name: 'Soups & Salads', keywords: ['soup', 'salad', 'bowl', 'greens', 'caesar', 'garden', 'cobb', 'chowder', 'bisque', 'gazpacho', 'minestrone', 'broth'] },
    
    // Vegetarian/Vegan
    { name: 'Vegetarian/Vegan', keywords: ['vegetarian', 'vegan', 'plant', 'tofu', 'veggie', 'meatless', 'garden', 'beyond meat', 'impossible', 'tempeh', 'seitan'] },
    
    // Desserts
    { name: 'Desserts', keywords: ['dessert', 'cake', 'pie', 'ice cream', 'cookie', 'brownie', 'pudding', 'sweet', 'chocolate', 'cheesecake', 'pastry', 'tiramisu', 'gelato', 'sorbet', 'mousse', 'tart', 'cobbler', 'crème brûlée'] },
    
    // Beverages
    { name: 'Beverages', keywords: ['drink', 'beverage', 'coffee', 'tea', 'soda', 'juice', 'water', 'milk', 'smoothie', 'shake', 'cocktail', 'beer', 'wine', 'latte', 'espresso', 'cappuccino', 'mocha', 'frappe'] },
    
    // Sides
    { name: 'Sides', keywords: ['side', 'fries', 'rice', 'potato', 'vegetable', 'beans', 'corn', 'slaw', 'mashed', 'roasted', 'steamed', 'grilled'] },
  ];
  
  // Score each category based on keyword matches
  const scores = categories.map(category => {
    let score = 0;
    for (const keyword of category.keywords) {
      if (name.includes(keyword)) {
        // Add points based on how much of the item name the keyword covers
        score += (keyword.length / name.length) * 10;
        
        // Bonus points for exact matches or matches at the beginning
        if (name === keyword) score += 5;
        if (name.startsWith(keyword + ' ')) score += 3;
      }
    }
    return { category: category.name, score };
  });
  
  // Sort by score (descending)
  scores.sort((a, b) => b.score - a.score);
  
  // Return the highest scoring category, or "Other" if no good matches
  return scores[0].score > 0.2 ? scores[0].category : "Other";
}

// Custom pie chart component
function PieChart({ data, labels, colors }: { data: number[], labels: string[], colors: string[] }) {
  // ... existing PieChart component code ...
}

// Bar chart component
function BarChart({ data, labels, colors }: { data: number[], labels: string[], colors: string[] }) {
  // ... existing BarChart component code ...
}

// Line chart component
function LineChart({ data, labels, color = '#4F46E5' }: { data: number[], labels: string[], color?: string }) {
  // ... existing LineChart component code ...
}

// Main component
export function DataVisualizer() {
  const { user } = useAuth()
  const [data, setData] = useState<any[]>([])
  const [headers, setHeaders] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [visualizationType, setVisualizationType] = useState<'category' | 'time'>('category')
  const [categoryField, setCategoryField] = useState<string>('')
  const [valueField, setValueField] = useState<string>('')
  const [timeField, setTimeField] = useState<string>('')
  const [timeGrouping, setTimeGrouping] = useState<'day' | 'week' | 'month'>('day')
  const [aiSuggestions, setAiSuggestions] = useState<any>(null)

  // Process the CSV file
  const processFile = (file: File) => {
    setLoading(true)
    setError(null)
    
    const reader = new FileReader()
    
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string
        const lines = content.split('\n').filter(line => line.trim() !== '')
        
        if (lines.length < 2) {
          setError('File is empty or has no data rows')
          setLoading(false)
          return
        }
        
        const headerLine = lines[0]
        const parsedHeaders = headerLine.split(',').map(header => header.trim())
        setHeaders(parsedHeaders)
        
        // Parse data rows
        const parsedData = []
        
        for (let i = 1; i < lines.length; i++) {
          const line = lines[i].trim()
          if (!line) continue
          
          const values = line.split(',').map(value => value.trim())
          
          if (values.length !== parsedHeaders.length) {
            console.warn(`Line ${i + 1} has ${values.length} values, expected ${parsedHeaders.length}`)
            continue
          }
          
          const rowData: Record<string, any> = {}
          
          for (let j = 0; j < parsedHeaders.length; j++) {
            const header = parsedHeaders[j]
            const value = values[j]
            
            // Try to parse numbers
            if (!isNaN(Number(value))) {
              rowData[header] = Number(value)
            } else {
              rowData[header] = value
            }
          }
          
          parsedData.push(rowData)
        }
        
        setData(parsedData)
        
        // Generate AI suggestions
        generateAiSuggestions(parsedData, parsedHeaders)
        
        setLoading(false)
      } catch (err) {
        console.error('Error processing CSV:', err)
        setError('Error processing the CSV file. Please check the format and try again.')
        setLoading(false)
      }
    }
    
    reader.onerror = () => {
      setError('Error reading the file')
      setLoading(false)
    }
    
    reader.readAsText(file)
  }

  // Generate AI suggestions for visualization
  const generateAiSuggestions = (data: any[], headers: string[]) => {
    // Identify column types
    const categoryColumns: string[] = []
    const valueColumns: string[] = []
    const dateColumns: string[] = []
    
    headers.forEach(header => {
      if (data.length > 0) {
        const sample = data[0][header]
        
        if (typeof sample === 'number') {
          valueColumns.push(header)
        } else if (typeof sample === 'string') {
          // Check if it's a date
          if (/\d{1,4}[-/]\d{1,2}[-/]\d{1,4}/.test(sample) || 
              /\w+ \d{1,2},? \d{4}/.test(sample)) {
            dateColumns.push(header)
          } else {
            categoryColumns.push(header)
          }
        }
      }
    })
    
    // Determine best visualization type
    let recommendedVisualization: 'category' | 'time' = 'category'
    let recommendedFields: any = {}
    
    if (dateColumns.length > 0 && valueColumns.length > 0) {
      recommendedVisualization = 'time'
      recommendedFields = {
        timeField: dateColumns[0],
        valueField: valueColumns[0]
      }
    } else if (categoryColumns.length > 0 && valueColumns.length > 0) {
      recommendedVisualization = 'category'
      recommendedFields = {
        categoryField: categoryColumns[0],
        valueField: valueColumns[0]
      }
    }
    
    // Generate insights
    const insights: string[] = []
    
    insights.push(`Found ${data.length} data points`)
    insights.push(`Identified ${categoryColumns.length} category columns, ${valueColumns.length} value columns, and ${dateColumns.length} date columns`)
    
    // Add more insights based on data patterns
    if (valueColumns.length > 0) {
      const valueColumn = valueColumns[0]
      const sum = data.reduce((acc, row) => acc + (row[valueColumn] || 0), 0)
      const avg = sum / data.length
      
      insights.push(`Average ${valueColumn}: ${avg.toFixed(2)}`)
      
      // Find highest and lowest values
      if (data.length > 0) {
        const sortedByValue = [...data].sort((a, b) => b[valueColumn] - a[valueColumn])
        const highest = sortedByValue[0]
        const lowest = sortedByValue[sortedByValue.length - 1]
        
        if (categoryColumns.length > 0) {
          const categoryColumn = categoryColumns[0]
          insights.push(`Highest ${valueColumn}: ${highest[categoryColumn]} (${highest[valueColumn]})`)
          insights.push(`Lowest ${valueColumn}: ${lowest[categoryColumn]} (${lowest[valueColumn]})`)
        }
      }
    }
    
    // Set AI suggestions
    setAiSuggestions({
      recommendedVisualization,
      recommendedFields,
      insights
    })
    
    // Auto-select recommended fields
    if (recommendedVisualization === 'category') {
      if (categoryColumns.length > 0) setCategoryField(categoryColumns[0])
      if (valueColumns.length > 0) setValueField(valueColumns[0])
    } else {
      if (dateColumns.length > 0) setTimeField(dateColumns[0])
      if (valueColumns.length > 0) setValueField(valueColumns[0])
    }
    
    // Set visualization type based on recommendation
    setVisualizationType(recommendedVisualization)
  }

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-gray-800">Data Visualizer</h2>
      <p className="text-gray-600">Upload a CSV file to visualize your data</p>
      
      {/* File upload */}
      <div className="mt-4">
        <label className="block text-sm font-medium text-gray-700">Upload CSV File</label>
        <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
          <div className="space-y-1 text-center">
            <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true">
              <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <div className="flex text-sm text-gray-600">
              <label htmlFor="file-upload" className="relative cursor-pointer bg-white rounded-md font-medium text-indigo-600 hover:text-indigo-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-indigo-500">
                <span>Upload a file</span>
                <input id="file-upload" name="file-upload" type="file" className="sr-only" accept=".csv" onChange={(e) => e.target.files && processFile(e.target.files[0])} />
              </label>
              <p className="pl-1">or drag and drop</p>
            </div>
            <p className="text-xs text-gray-500">CSV up to 10MB</p>
          </div>
        </div>
      </div>
      
      {loading && (
        <div className="flex justify-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-500"></div>
        </div>
      )}
      
      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}
      
      {data.length > 0 && !loading && (
        <div className="mt-6">
          <h3 className="text-lg font-medium text-gray-900">Visualization Options</h3>
          
          <div className="mt-4 grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
            <div className="sm:col-span-3">
              <label htmlFor="visualization-type" className="block text-sm font-medium text-gray-700">
                Visualization Type
              </label>
              <select
                id="visualization-type"
                name="visualization-type"
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                value={visualizationType}
                onChange={(e) => setVisualizationType(e.target.value as any)}
              >
                <option value="category">Category Breakdown</option>
                <option value="time">Time Series</option>
              </select>
            </div>
            
            {visualizationType === 'category' ? (
              <>
                <div className="sm:col-span-3">
                  <label htmlFor="category-field" className="block text-sm font-medium text-gray-700">
                    Category Field
                  </label>
                  <select
                    id="category-field"
                    name="category-field"
                    className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                    value={categoryField}
                    onChange={(e) => setCategoryField(e.target.value)}
                  >
                    <option value="">Select a field</option>
                    {headers.map((header) => (
                      <option key={header} value={header}>{header}</option>
                    ))}
                  </select>
                </div>
                
                <div className="sm:col-span-3">
                  <label htmlFor="value-field" className="block text-sm font-medium text-gray-700">
                    Value Field
                  </label>
                  <select
                    id="value-field"
                    name="value-field"
                    className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                    value={valueField}
                    onChange={(e) => setValueField(e.target.value)}
                  >
                    <option value="">Select a field</option>
                    {headers.map((header) => (
                      <option key={header} value={header}>{header}</option>
                    ))}
                  </select>
                </div>
              </>
            ) : (
              <>
                <div className="sm:col-span-3">
                  <label htmlFor="time-field" className="block text-sm font-medium text-gray-700">
                    Time Field
                  </label>
                  <select
                    id="time-field"
                    name="time-field"
                    className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                    value={timeField}
                    onChange={(e) => setTimeField(e.target.value)}
                  >
                    <option value="">Select a field</option>
                    {headers.map((header) => (
                      <option key={header} value={header}>{header}</option>
                    ))}
                  </select>
                </div>
                
                <div className="sm:col-span-3">
                  <label htmlFor="value-field" className="block text-sm font-medium text-gray-700">
                    Value Field
                  </label>
                  <select
                    id="value-field"
                    name="value-field"
                    className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                    value={valueField}
                    onChange={(e) => setValueField(e.target.value)}
                  >
                    <option value="">Select a field</option>
                    {headers.map((header) => (
                      <option key={header} value={header}>{header}</option>
                    ))}
                  </select>
                </div>
                
                <div className="sm:col-span-3">
                  <label htmlFor="time-grouping" className="block text-sm font-medium text-gray-700">
                    Time Grouping
                  </label>
                  <select
                    id="time-grouping"
                    name="time-grouping"
                    className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                    value={timeGrouping}
                    onChange={(e) => setTimeGrouping(e.target.value as any)}
                  >
                    <option value="day">Daily</option>
                    <option value="week">Weekly</option>
                    <option value="month">Monthly</option>
                  </select>
                </div>
              </>
            )}
          </div>
          
          {/* Visualization display */}
          <div className="mt-8 border-t border-gray-200 pt-6">
            <h3 className="text-lg font-medium text-gray-800 mb-4">
              {visualizationType === 'category' && 'Category Breakdown'}
              {visualizationType === 'time' && 'Time Series Analysis'}
            </h3>
            
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-gray-500 text-center">Visualization will appear here</p>
            </div>
          </div>
          
          {/* AI Insights */}
          {aiSuggestions && (
            <div className="mt-8 border-t border-gray-200 pt-6">
              <h3 className="text-lg font-medium text-gray-800 mb-4">AI Insights</h3>
              
              <div className="bg-blue-50 p-4 rounded-lg">
                <ul className="list-disc pl-5 space-y-2">
                  {aiSuggestions.insights.map((insight: string, index: number) => (
                    <li key={index} className="text-gray-700">{insight}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
} 