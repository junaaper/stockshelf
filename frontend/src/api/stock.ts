import api from './client'
import { StockMovement } from '../types'

interface MovementFilters {
  product_id?: string
  from_date?: string
  to_date?: string
  type?: string
}

export const logMovement = async (body: { product_id: string; type: string; quantity: number; note?: string }): Promise<StockMovement> => {
  const { data } = await api.post('/stock/movement', body)
  return data
}

export const getMovements = async (filters: MovementFilters = {}): Promise<StockMovement[]> => {
  const params: Record<string, string> = {}
  if (filters.product_id) params.product_id = filters.product_id
  if (filters.from_date) params.from_date = filters.from_date
  if (filters.to_date) params.to_date = filters.to_date
  if (filters.type) params.type = filters.type
  const { data } = await api.get('/stock/movements', { params })
  return data
}
