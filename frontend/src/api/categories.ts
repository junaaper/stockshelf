import api from './client'
import { Category } from '../types'

export const getCategories = async (): Promise<Category[]> => {
  const { data } = await api.get('/categories/')
  return data
}

export const createCategory = async (body: { name: string; description?: string }): Promise<Category> => {
  const { data } = await api.post('/categories/', body)
  return data
}

export const deleteCategory = async (id: string): Promise<void> => {
  await api.delete(`/categories/${id}`)
}
