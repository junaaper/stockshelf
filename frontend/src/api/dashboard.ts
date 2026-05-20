import api from './client'
import { DashboardSummary } from '../types'

export const getDashboardSummary = async (): Promise<DashboardSummary> => {
  const { data } = await api.get('/dashboard/summary')
  return data
}

export const resolveAlert = async (alertId: string): Promise<void> => {
  await api.patch(`/dashboard/alerts/${alertId}/resolve`)
}
