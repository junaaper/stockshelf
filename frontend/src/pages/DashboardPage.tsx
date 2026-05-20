import { useEffect, useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { getDashboardSummary, resolveAlert } from '../api/dashboard'
import { DashboardSummary, User } from '../types'
import MovementBadge from '../components/MovementBadge'
import PageHeader from '../components/PageHeader'

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return 'just now'
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}

export default function DashboardPage() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const userRaw = localStorage.getItem('user')
  const user: User | null = userRaw ? JSON.parse(userRaw) : null
  const isAdmin = user?.role === 'admin'

  const load = async () => {
    try {
      const data = await getDashboardSummary()
      setSummary(data)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const handleResolve = async (alertId: string) => {
    try {
      await resolveAlert(alertId)
      load()
    } catch {}
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-gray-500">Loading dashboard...</div>
      </div>
    )
  }

  const kpis = [
    { label: 'Total Products', value: summary?.total_products ?? 0, color: 'bg-indigo-50 text-indigo-600' },
    { label: 'Low Stock Items', value: summary?.low_stock_count ?? 0, color: 'bg-red-50 text-red-600' },
    { label: 'Total Categories', value: summary?.total_categories ?? 0, color: 'bg-green-50 text-green-600' },
    { label: 'Active Alerts', value: summary?.active_alerts.length ?? 0, color: 'bg-yellow-50 text-yellow-600' },
  ]

  return (
    <div className="flex flex-col min-h-full">
      <PageHeader title="Dashboard" subtitle="Overview of your inventory" />

      <div className="p-8 space-y-8">
        {/* KPI cards */}
        <div className="grid grid-cols-4 gap-4">
          {kpis.map((k) => (
            <div key={k.label} className="bg-white rounded-xl border border-gray-200 p-6">
              <p className="text-sm text-gray-500">{k.label}</p>
              <p className={`text-3xl font-bold mt-2 ${k.color.split(' ')[1]}`}>{k.value}</p>
            </div>
          ))}
        </div>

        {/* Chart + Alerts */}
        <div className="grid grid-cols-2 gap-6">
          {/* Bar chart */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="text-sm font-semibold text-gray-700 mb-4">Quantity by Category</h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={summary?.category_breakdown ?? []} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="total_quantity" fill="#6366f1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Alerts */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="text-sm font-semibold text-gray-700 mb-4">Low Stock Alerts</h3>
            {summary?.active_alerts.length === 0 ? (
              <p className="text-sm text-gray-400 py-8 text-center">No active alerts</p>
            ) : (
              <div className="space-y-3 max-h-56 overflow-y-auto">
                {summary?.active_alerts.map((alert) => (
                  <div key={alert.id} className="flex items-center justify-between py-2.5 border-b border-gray-100 last:border-0">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{alert.product_name}</p>
                      <p className="text-xs text-red-500 mt-0.5">
                        {alert.product_quantity} / {alert.product_threshold} threshold
                      </p>
                    </div>
                    {isAdmin && (
                      <button
                        onClick={() => handleResolve(alert.id)}
                        className="text-xs bg-indigo-600 text-white px-3 py-1.5 rounded-lg hover:bg-indigo-700 transition-colors"
                      >
                        Resolve
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Recent movements */}
        <div className="bg-white rounded-xl border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-100">
            <h3 className="text-sm font-semibold text-gray-700">Recent Movements</h3>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Qty</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">By</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">When</th>
              </tr>
            </thead>
            <tbody>
              {summary?.recent_movements.map((m) => (
                <tr key={m.id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="px-6 py-3 text-gray-900">{m.product_name}</td>
                  <td className="px-6 py-3"><MovementBadge type={m.type} /></td>
                  <td className="px-6 py-3 text-gray-700">{m.quantity}</td>
                  <td className="px-6 py-3 text-gray-500">{m.user_name}</td>
                  <td className="px-6 py-3 text-gray-400">{timeAgo(m.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
