import api from './client'
import { Product, PaginatedProducts } from '../types'

interface ProductFilters {
  search?: string
  category_id?: string
  low_stock?: boolean
  page?: number
  page_size?: number
}

export const getProducts = async (filters: ProductFilters = {}): Promise<PaginatedProducts> => {
  const params: Record<string, string | number | boolean> = {}
  if (filters.search) params.search = filters.search
  if (filters.category_id) params.category_id = filters.category_id
  if (filters.low_stock !== undefined) params.low_stock = filters.low_stock
  if (filters.page) params.page = filters.page
  if (filters.page_size) params.page_size = filters.page_size
  const { data } = await api.get('/products/', { params })
  return data
}

export const createProduct = async (body: Omit<Product, 'id' | 'created_at' | 'category_name'>): Promise<Product> => {
  const { data } = await api.post('/products/', body)
  return data
}

export const updateProduct = async (id: string, body: Partial<Omit<Product, 'id' | 'created_at' | 'category_name'>>): Promise<Product> => {
  const { data } = await api.put(`/products/${id}`, body)
  return data
}

export const deleteProduct = async (id: string): Promise<void> => {
  await api.delete(`/products/${id}`)
}
