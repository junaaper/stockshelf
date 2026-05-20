import { useEffect, useState } from 'react'
import { logMovement, getMovements } from '../api/stock'
import { getProducts } from '../api/products'
import { StockMovement, Product } from '../types'
import MovementBadge from '../components/MovementBadge'
import PageHeader from '../components/PageHeader'

export default function StockPage() {
  const [movements, setMovements] = useState<StockMovement[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)

  // Form state
  const [productId, setProductId] = useState('')
  const [type, setType] = useState<'IN' | 'OUT' | 'ADJUSTMENT'>('IN')
  const [quantity, setQuantity] = useState(1)
  const [note, setNote] = useState('')
  const [formError, setFormError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)

  // Filters
  const [filterProduct, setFilterProduct] = useState('')
  const [filterType, setFilterType] = useState('')
  const [filterFrom, setFilterFrom] = useState('')
  const [filterTo, setFilterTo] = useState('')

  const loadProducts = async () => {
    const data = await getProducts({ page_size: 100 })
    setProducts(data.items)
  }

  const loadMovements = async () => {
    setLoading(true)
    try {
      const data = await getMovements({
        product_id: filterProduct || undefined,
        type: filterType || undefined,
        from_date: filterFrom || undefined,
        to_date: filterTo || undefined,
      })
      setMovements(data)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadProducts() }, [])
  useEffect(() => { loadMovements() }, [filterProduct, filterType, filterFrom, filterTo])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!productId) { setFormError('Select a product'); return }
    setFormError('')
    setSubmitting(true)
    try {
      await logMovement({ product_id: productId, type, quantity, note: note || undefined })
      setSuccess(true)
      setProductId('')
      setQuantity(1)
      setNote('')
      setTimeout(() => setSuccess(false), 3000)
      loadMovements()
    } catch (err: any) {
      setFormError(err.response?.data?.detail || 'Failed to log movement')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex flex-col min-h-full">
      <PageHeader title="Stock Movements" subtitle="Log and review inventory changes" />

      <div className="p-8">
        <div className="grid grid-cols-5 gap-6">
          {/* Log movement form */}
          <div className="col-span-2">
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="text-sm font-semibold text-gray-700 mb-5">Log Movement</h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Product</label>
                  <select
                    value={productId}
                    onChange={(e) => setProductId(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">Select product...</option>
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Type</label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['IN', 'OUT', 'ADJUSTMENT'] as const).map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setType(t)}
                        className={`py-2 text-xs font-semibold rounded-lg border transition-colors ${
                          type === t
                            ? t === 'IN' ? 'bg-green-100 border-green-400 text-green-700'
                              : t === 'OUT' ? 'bg-red-100 border-red-400 text-red-700'
                              : 'bg-yellow-100 border-yellow-400 text-yellow-700'
                            : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                        }`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    {type === 'ADJUSTMENT' ? 'Set Quantity To' : 'Quantity'}
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={quantity}
                    onChange={(e) => setQuantity(+e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Note (optional)</label>
                  <textarea
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                  />
                </div>

                {formError && <p className="text-sm text-red-600">{formError}</p>}
                {success && <p className="text-sm text-green-600">Movement logged successfully!</p>}

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full bg-indigo-600 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors disabled:opacity-60"
                >
                  {submitting ? 'Logging...' : 'Log Movement'}
                </button>
              </form>
            </div>
          </div>

          {/* Movement history */}
          <div className="col-span-3">
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100">
                <h3 className="text-sm font-semibold text-gray-700 mb-3">Movement History</h3>
                <div className="grid grid-cols-2 gap-2">
                  <select
                    value={filterProduct}
                    onChange={(e) => setFilterProduct(e.target.value)}
                    className="px-3 py-1.5 border border-gray-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">All products</option>
                    {products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                  <select
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value)}
                    className="px-3 py-1.5 border border-gray-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">All types</option>
                    <option value="IN">IN</option>
                    <option value="OUT">OUT</option>
                    <option value="ADJUSTMENT">ADJUSTMENT</option>
                  </select>
                  <input type="date" value={filterFrom} onChange={(e) => setFilterFrom(e.target.value)} className="px-3 py-1.5 border border-gray-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                  <input type="date" value={filterTo} onChange={(e) => setFilterTo(e.target.value)} className="px-3 py-1.5 border border-gray-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 bg-gray-50">
                      <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Product</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Type</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Qty</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">By</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr><td colSpan={5} className="px-4 py-6 text-center text-gray-400">Loading...</td></tr>
                    ) : movements.length === 0 ? (
                      <tr><td colSpan={5} className="px-4 py-6 text-center text-gray-400">No movements found</td></tr>
                    ) : (
                      movements.map((m) => (
                        <tr key={m.id} className="border-b border-gray-50 hover:bg-gray-50">
                          <td className="px-4 py-3 text-gray-900 max-w-[150px] truncate">{m.product_name}</td>
                          <td className="px-4 py-3"><MovementBadge type={m.type} /></td>
                          <td className="px-4 py-3 text-gray-700">{m.quantity}</td>
                          <td className="px-4 py-3 text-gray-500">{m.user_name}</td>
                          <td className="px-4 py-3 text-gray-400 text-xs">{new Date(m.created_at).toLocaleString()}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
