export interface Product {
  id: number
  name: string
  quantity: number
  price: number
  minThreshold: number
  lastUpdated: string
}

export interface Prediction {
  predicted_weekly_sales: number
  days_until_empty: number
  reorder_needed: boolean
  recommended_order: number
} 