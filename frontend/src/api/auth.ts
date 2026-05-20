import api from './client'
import { AuthState } from '../types'
export const login = async (email: string, password: string): Promise<AuthState> => {
  const { data } = await api.post('/auth/login', { email, password })
  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    user: data.user
  }
}
export const refreshToken = async (token: string): Promise<string> => {
  const { data } = await api.post('/auth/refresh', { refresh_token: token })
  return data.access_token
}
