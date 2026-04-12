import { useEffect, useMemo, useState } from 'react'
import { DollarSign, Package, ShoppingCart, TrendingUp } from 'lucide-react'
import { apiFetch } from '../lib/api'

type Kpi = { ordersCount: number; revenue: number; itemsSold: number }
type TopProduct = { _id: string; title: string; quantity: number; revenue: number }

function money(n: number) {
  return n.toLocaleString(undefined, { style: 'currency', currency: 'USD' })
}

export default function AdminDashboardPage() {
  const [kpi, setKpi] = useState<Kpi | null>(null)
  const [top, setTop] = useState<TopProduct[]>([])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    async function run() {
      setLoading(true)
      const res = await apiFetch<{ kpi: Kpi; topProducts: TopProduct[] }>('/api/admin/stats', { auth: true })
      if (cancelled) return
      if (!res.ok) {
        setError(res.error)
        setKpi(null)
        setTop([])
      } else {
        setError(null)
        setKpi(res.kpi)
        setTop(res.topProducts)
      }
      setLoading(false)
    }
    run()
    return () => {
      cancelled = true
    }
  }, [])

  const cards = useMemo(() => {
    const v = kpi || { ordersCount: 0, revenue: 0, itemsSold: 0 }
    return [
      { label: 'Revenue', value: money(v.revenue), icon: DollarSign },
      { label: 'Orders', value: v.ordersCount.toLocaleString(), icon: Package },
      { label: 'Items sold', value: v.itemsSold.toLocaleString(), icon: ShoppingCart },
    ]
  }, [kpi])

  return (
    <div className="space-y-6">
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 rounded-xl border border-border bg-card animate-pulse" />
          ))}
        </div>
      ) : error ? (
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 px-6 py-6">
          <p className="font-semibold text-destructive mb-1">Could not load admin stats</p>
          <p className="text-sm text-muted-foreground">{error}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {cards.map((c) => {
            const Icon = c.icon
            return (
              <div key={c.label} className="rounded-xl border border-border bg-card p-5 md:p-6 shadow-sm">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-muted-foreground">{c.label}</p>
                  <div className="h-10 w-10 rounded-xl bg-secondary flex items-center justify-center">
                    <Icon className="h-5 w-5 text-muted-foreground" />
                  </div>
                </div>
                <p className="mt-3 text-2xl font-bold tabular-nums">{c.value}</p>
              </div>
            )
          })}
        </div>
      )}

      <section className="rounded-xl border border-border bg-card p-5 md:p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Top products</h2>
        </div>

        {loading ? (
          <div className="h-32 rounded-lg bg-secondary/30 animate-pulse" />
        ) : top.length === 0 ? (
          <p className="text-sm text-muted-foreground">No paid orders yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-muted-foreground border-b border-border">
                  <th className="py-2 pr-4 font-medium">Product</th>
                  <th className="py-2 pr-4 font-medium">Qty</th>
                  <th className="py-2 pr-4 font-medium">Revenue</th>
                </tr>
              </thead>
              <tbody>
                {top.map((p) => (
                  <tr key={p._id} className="border-b border-border/60 last:border-b-0">
                    <td className="py-3 pr-4">
                      <p className="font-medium text-foreground/90 line-clamp-1">{p.title}</p>
                      <p className="text-xs text-muted-foreground font-mono">#{p._id.slice(-8).toUpperCase()}</p>
                    </td>
                    <td className="py-3 pr-4 tabular-nums">{p.quantity.toLocaleString()}</td>
                    <td className="py-3 pr-4 tabular-nums">{money(p.revenue)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}

