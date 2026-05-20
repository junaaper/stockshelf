export interface User {
  id: string
  name: string
  role: 'admin' | 'staff'
}

export interface AuthState {
  accessToken: string
  refreshToken: string
  user: User
}

export interface Category {
  id: string
  name: string
  description: string | null
  created_at: string
  product_count: number
}

export interface Product {
  id: string
  name: string
  sku: string
  category_id: string | null
  category_name: string | null
  quantity: number
  low_stock_threshold: number
  unit: string
  created_at: string
}

export interface PaginatedProducts {
  items: Product[]
  total: number
  page: number
  page_size: number
}

export interface StockMovement {
  id: string
  product_id: string
  product_name: string | null
  user_id: string
  user_name: string | null
  type: 'IN' | 'OUT' | 'ADJUSTMENT'
  quantity: number
  note: string | null
  created_at: string
}

export interface Alert {
  id: string
  product_id: string
  product_name: string | null
  product_quantity: number | null
  product_threshold: number | null
  triggered_at: string
  resolved: boolean
  resolved_at: string | null
}

export interface CategoryBreakdown {
  name: string
  product_count: number
  total_quantity: number
}

export interface DashboardSummary {
  total_products: number
  low_stock_count: number
  total_categories: number
  recent_movements: StockMovement[]
  active_alerts: Alert[]
  category_breakdown: CategoryBreakdown[]
}
