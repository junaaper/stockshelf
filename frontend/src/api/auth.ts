import api from './client'
import { AuthState } from '../types'

export const login = async (email: string, password: string): Promise<AuthState> => {
  const { data } = await api.post('/auth/login', { email, password })
  return data
}

export const refreshToken = async (refreshToken: string): Promise<string> => {
  const { data } = await api.post('/auth/refresh', { refresh_token: refreshToken })
  return data.access_token
}
