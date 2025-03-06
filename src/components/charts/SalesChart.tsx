'use client'

import React, { useMemo, useState } from 'react'

interface Props {
  data: any[]
}

// Custom pie chart component that doesn't rely on external libraries
function SimplePieChart({ data, labels, colors }: { data: number[], labels: string[], colors: string[] }) {
  const total = data.reduce((sum, value) => sum + value, 0)
  
  // Calculate the cumulative angles for each segment
  let currentAngle = 0
  const segments = data.map((value, index) => {
    const startAngle = currentAngle
    const angle = (value / total) * 360
    currentAngle += angle
    
    return {
      value,
      label: labels[index],
      color: colors[index],
      startAngle,
      angle
    }
  })
  
  return (
    <div className="relative w-full h-full flex items-center justify-center">
      <svg viewBox="0 0 100 100" className="w-64 h-64">
        {segments.map((segment, index) => {
          // Convert angles to radians
          const startAngleRad = (segment.startAngle - 90) * (Math.PI / 180)
          const endAngleRad = (segment.startAngle + segment.angle - 90) * (Math.PI / 180)
          
          // Calculate the end points of the arc
          const x1 = 50 + 50 * Math.cos(startAngleRad)
          const y1 = 50 + 50 * Math.sin(startAngleRad)
          const x2 = 50 + 50 * Math.cos(endAngleRad)
          const y2 = 50 + 50 * Math.sin(endAngleRad)
          
          // Determine if the arc should be drawn as a large arc
          const largeArcFlag = segment.angle > 180 ? 1 : 0
          
          // Create the SVG path for the arc
          const path = [
            `M 50 50`,
            `L ${x1} ${y1}`,
            `A 50 50 0 ${largeArcFlag} 1 ${x2} ${y2}`,
            `Z`
          ].join(' ')
          
          return (
            <path
              key={index}
              d={path}
              fill={segment.color}
              stroke="#fff"
              strokeWidth="0.5"
            />
          )
        })}
      </svg>
      
      <div className="absolute right-0 top-0 bottom-0 w-32 overflow-y-auto flex flex-col justify-center">
        {segments.map((segment, index) => (
          <div key={index} className="flex items-center mb-2 text-xs">
            <div 
              className="w-3 h-3 mr-2 flex-shrink-0" 
              style={{ backgroundColor: segment.color }}
            ></div>
            <div className="truncate max-w-[100px]" title={segment.label}>
              {segment.label}
            </div>
            <div className="ml-1 text-gray-500">
              {Math.round((segment.value / total) * 100)}%
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export function SalesChart({ data }: Props) {
  const [chartType, setChartType] = useState<'items' | 'dates'>('items')
  
  // Memoize the chart data to prevent unnecessary recalculations
  const chartData = useMemo(() => {
    if (!data || data.length === 0) return null
    
    if (chartType === 'items') {
      // Group by item name
      const itemSales: Record<string, number> = {}
      
      // Use a more efficient approach for large datasets
      for (let i = 0; i < data.length; i++) {
        const item = data[i]
        const itemName = item.itemName
        
        if (!itemSales[itemName]) {
          itemSales[itemName] = 0
        }
        
        itemSales[itemName] += Number(item.salesAmount)
      }
      
      // Sort items by sales amount (descending)
      const sortedItems = Object.entries(itemSales)
        .sort((a, b) => b[1] - a[1])
      
      // Limit to top 10 items for better visualization
      const topItems = sortedItems.slice(0, 10)
      const otherItems = sortedItems.slice(10)
      
      let labels = topItems.map(([name]) => name)
      let values = topItems.map(([, amount]) => amount)
      
      // Add "Other" category if there are more than 10 items
      if (otherItems.length > 0) {
        const otherTotal = otherItems.reduce((sum, [, amount]) => sum + amount, 0)
        labels.push('Other')
        values.push(otherTotal)
      }
      
      return {
        labels,
        values,
        colors: [
          '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF',
          '#FF9F40', '#8AC249', '#EA5F89', '#00D8B6', '#FFB7B2',
          '#808080' // Gray for "Other"
        ]
      }
    } else {
      // Group by date (month)
      const dateSales: Record<string, number> = {}
      
      for (let i = 0; i < data.length; i++) {
        const item = data[i]
        try {
          const date = new Date(item.date)
          if (isNaN(date.getTime())) continue // Skip invalid dates
          
          const monthYear = `${date.toLocaleString('default', { month: 'short' })} ${date.getFullYear()}`
          
          if (!dateSales[monthYear]) {
            dateSales[monthYear] = 0
          }
          
          dateSales[monthYear] += Number(item.salesAmount)
        } catch (e) {
          console.error('Error processing date:', item.date, e)
          continue
        }
      }
      
      // Sort dates chronologically
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
      
      const sortedDates = Object.entries(dateSales)
        .sort((a, b) => {
          const [monthA, yearA] = a[0].split(' ')
          const [monthB, yearB] = b[0].split(' ')
          
          const yearDiff = parseInt(yearA) - parseInt(yearB)
          if (yearDiff !== 0) return yearDiff
          
          return months.indexOf(monthA) - months.indexOf(monthB)
        })
      
      return {
        labels: sortedDates.map(([date]) => date),
        values: sortedDates.map(([, amount]) => amount),
        colors: [
          '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF',
          '#FF9F40', '#8AC249', '#EA5F89', '#00D8B6', '#FFB7B2'
        ]
      }
    }
  }, [data, chartType])
  
  if (!chartData) {
    return (
      <div className="flex items-center justify-center h-[400px] text-gray-500">
        <p>No data available</p>
      </div>
    )
  }
  
  return (
    <div>
      <div className="flex justify-end mb-4">
        <div className="inline-flex rounded-md shadow-sm" role="group">
          <button
            type="button"
            className={`px-4 py-2 text-sm font-medium rounded-l-lg ${
              chartType === 'items'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
            onClick={() => setChartType('items')}
          >
            By Item
          </button>
          <button
            type="button"
            className={`px-4 py-2 text-sm font-medium rounded-r-lg ${
              chartType === 'dates'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
            onClick={() => setChartType('dates')}
          >
            By Date
          </button>
        </div>
      </div>
      
      <div className="h-[400px] flex items-center justify-center">
        <SimplePieChart 
          data={chartData.values} 
          labels={chartData.labels}
          colors={chartData.colors.slice(0, chartData.labels.length)}
        />
      </div>
      
      {/* Data summary table */}
      <div className="mt-4 overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {chartType === 'items' ? 'Item' : 'Period'}
              </th>
              <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Sales
              </th>
              <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Percentage
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {chartData.labels.map((label: string, index: number) => {
              const value = chartData.values[index]
              const total = chartData.values.reduce((sum: number, val: number) => sum + val, 0)
              const percentage = ((value / total) * 100).toFixed(1)
              
              return (
                <tr key={index}>
                  <td className="px-3 py-2 whitespace-nowrap">
                    <div className="flex items-center">
                      <div 
                        className="w-3 h-3 mr-2" 
                        style={{ backgroundColor: chartData.colors[index] }}
                      ></div>
                      {label}
                    </div>
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-right">
                    {value.toLocaleString()}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-right">
                    {percentage}%
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
} 