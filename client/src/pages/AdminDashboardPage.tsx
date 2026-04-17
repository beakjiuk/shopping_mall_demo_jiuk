import { useEffect, useMemo, useState } from 'react'
import { DollarSign, Package, ShoppingCart, TrendingUp } from 'lucide-react'
import { apiFetch } from '../lib/api'
import SafeProductImage from '../components/SafeProductImage'

type Kpi = { ordersCount: number; revenue: number; itemsSold: number }
type TopProduct = { _id: string; title: string; quantity: number; revenue: number; imageUrl?: string; brand?: string }

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
          <div className="space-y-3">
            {top.map((p, idx) => (
              <div
                key={p._id}
                className="flex items-center justify-between gap-4 rounded-xl border border-border/70 bg-background px-4 py-3"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="h-12 w-12 rounded-xl overflow-hidden border border-border bg-secondary shrink-0">
                    {p.imageUrl ? (
                      <SafeProductImage src={p.imageUrl} alt={p.title} className="h-full w-full object-cover" />
                    ) : (
                      <div className="h-full w-full" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold line-clamp-1">
                      <span className="text-muted-foreground mr-2">#{idx + 1}</span>
                      {p.title}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {(p.brand?.trim() ? `${p.brand.trim()} · ` : '') + `#${p._id.slice(-8).toUpperCase()}`}
                    </p>
                  </div>
                </div>

                <div className="shrink-0 text-right">
                  <p className="text-xs text-muted-foreground">Qty</p>
                  <p className="text-sm font-semibold tabular-nums">{p.quantity.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground mt-1">Revenue</p>
                  <p className="text-sm font-semibold tabular-nums">{money(p.revenue)}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}

