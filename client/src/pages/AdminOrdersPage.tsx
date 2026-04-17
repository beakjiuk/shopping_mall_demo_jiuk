import { useCallback, useEffect, useMemo, useState } from 'react'
import { ClipboardList, RefreshCw, ShieldAlert, Truck } from 'lucide-react'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import { apiFetch } from '../lib/api'
import type { Order } from '../lib/types'

type AdminOrdersResp = { orders: Order[]; page: number; limit: number; total: number }
type OrderStatus = Order['status']

/** Admin list: paid 이후 배송 흐름만 (미결제·취소·환불 제외) */
type ListFilter = 'pipeline' | 'paid' | 'fulfilment' | 'shipped' | 'delivered'

const listFilters: { value: ListFilter; label: string }[] = [
  { value: 'pipeline', label: 'All · paid → delivered' },
  { value: 'paid', label: 'Paid' },
  { value: 'fulfilment', label: 'Preparing' },
  { value: 'shipped', label: 'Shipped' },
  { value: 'delivered', label: 'Delivered' },
]

const editableStatuses: { value: OrderStatus; label: string }[] = [
  { value: 'paid', label: 'Paid' },
  { value: 'fulfilment', label: 'Preparing' },
  { value: 'shipped', label: 'Shipped' },
  { value: 'delivered', label: 'Delivered' },
]

function orderRef(id: string) {
  return `ORD-${id.slice(-8).toUpperCase()}`
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [selected, setSelected] = useState<Order | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [status, setStatus] = useState<ListFilter>('pipeline')

  const [shipCarrier, setShipCarrier] = useState('')
  const [shipTracking, setShipTracking] = useState('')
  const [shipMemo, setShipMemo] = useState('')
  const [newStatus, setNewStatus] = useState<OrderStatus>('paid')
  const [cancelNote, setCancelNote] = useState('')

  const query = useMemo(() => {
    const params = new URLSearchParams()
    params.set('page', '1')
    params.set('limit', '50')
    params.set('status', status)
    return params.toString()
  }, [status])

  const load = useCallback(async () => {
    setLoading(true)
    const res = await apiFetch<AdminOrdersResp>(`/api/admin/orders?${query}`, { auth: true })
    if (!res.ok) {
      setError(res.error)
      setOrders([])
    } else {
      setError(null)
      setOrders(res.orders)
    }
    setLoading(false)
  }, [query])

  useEffect(() => {
    void load()
  }, [load])

  useEffect(() => {
    if (!selected) return
    setNewStatus(selected.status)
    setShipCarrier(selected.shipping?.carrier || '')
    setShipTracking(selected.shipping?.trackingNumber || '')
    setShipMemo(selected.shipping?.memo || '')
    setCancelNote('')
  }, [selected])

  async function patchSelected() {
    if (!selected) return
    setBusy(true)
    try {
      const res = await apiFetch<{ order: Order }>(`/api/admin/orders/${selected._id}`, {
        method: 'PATCH',
        auth: true,
        body: {
          status: newStatus,
          shipping: { carrier: shipCarrier, trackingNumber: shipTracking, memo: shipMemo },
        },
      })
      if (!res.ok) throw new Error(res.error)
      setSelected(res.order)
      setOrders((prev) => prev.map((o) => (o._id === res.order._id ? res.order : o)))
    } catch (e) {
      alert(String(e))
    } finally {
      setBusy(false)
    }
  }

  async function decideCancel(action: 'approve' | 'reject') {
    if (!selected) return
    setBusy(true)
    try {
      const res = await apiFetch<{ order: Order }>(`/api/admin/orders/${selected._id}`, {
        method: 'PATCH',
        auth: true,
        body: { cancelDecision: { action, note: cancelNote.trim() } },
      })
      if (!res.ok) throw new Error(res.error)
      setSelected(res.order)
      setOrders((prev) => prev.map((o) => (o._id === res.order._id ? res.order : o)))
    } catch (e) {
      alert(String(e))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-border bg-card p-5 md:p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold">Orders</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Shows <strong className="text-foreground/90">paid</strong> and shipping orders only. Unpaid drafts and
              cancelled rows stay in the database but are hidden here. Customer messages are under{' '}
              <strong className="text-foreground/90">Inquiries</strong>.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as ListFilter)}
              className="h-10 rounded-xl border border-border bg-background px-3 text-sm"
            >
              {listFilters.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
            <Button variant="outline" onClick={load} disabled={loading}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>

        {error ? (
          <div className="mt-4 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3">
            <p className="text-sm text-destructive font-medium">Error</p>
            <p className="text-sm text-muted-foreground">{error}</p>
          </div>
        ) : null}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_420px] gap-6">
        <div className="rounded-xl border border-border bg-card p-5 md:p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <ClipboardList className="h-4 w-4 text-muted-foreground" />
            <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Order list</h3>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-16 rounded-xl border border-border bg-background animate-pulse" />
              ))}
            </div>
          ) : orders.length === 0 ? (
            <p className="text-sm text-muted-foreground">No orders in this view.</p>
          ) : (
            <div className="space-y-3">
              {orders.map((o) => (
                <button
                  key={o._id}
                  type="button"
                  onClick={() => setSelected(o)}
                  className={[
                    'w-full text-left rounded-xl border px-4 py-3 transition-colors',
                    selected?._id === o._id
                      ? 'border-accent/40 bg-secondary/40'
                      : 'border-border/70 bg-background hover:bg-secondary/30',
                  ].join(' ')}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-mono text-xs text-muted-foreground">{orderRef(o._id)}</p>
                      <p className="mt-1 text-sm font-semibold line-clamp-1">
                        {o.items.slice(0, 2).map((i) => i.title).join(' · ')}
                        {o.items.length > 2 ? ` +${o.items.length - 2} more` : ''}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {new Date(o.createdAt).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}
                      </p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="text-sm font-semibold tabular-nums">${o.total.toFixed(2)}</p>
                      <p className="mt-1 text-xs text-muted-foreground">{o.status}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-xl border border-border bg-card p-5 md:p-6 shadow-sm h-fit">
          <div className="flex items-center gap-2 mb-4">
            <Truck className="h-4 w-4 text-muted-foreground" />
            <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Shipping & status</h3>
          </div>

          {!selected ? (
            <p className="text-sm text-muted-foreground">Select an order to edit shipping fields.</p>
          ) : (
            <div className="space-y-4">
              <div className="rounded-lg border border-border/70 bg-background px-4 py-3">
                <p className="text-xs text-muted-foreground font-mono">{orderRef(selected._id)}</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Items: <span className="text-foreground/80 tabular-nums">{selected.items.length}</span> · Total:{' '}
                  <span className="text-foreground/80 tabular-nums">${selected.total.toFixed(2)}</span>
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Status</label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value as OrderStatus)}
                  className="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm"
                >
                  {editableStatuses.map((s) => (
                    <option key={s.value} value={s.value}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Carrier</label>
                <Input value={shipCarrier} onChange={(e) => setShipCarrier(e.target.value)} className="h-11 bg-background" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Tracking number</label>
                <Input
                  value={shipTracking}
                  onChange={(e) => setShipTracking(e.target.value)}
                  className="h-11 bg-background"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Memo</label>
                <textarea
                  value={shipMemo}
                  onChange={(e) => setShipMemo(e.target.value)}
                  rows={3}
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/40"
                />
              </div>

              <Button onClick={patchSelected} disabled={busy} className="w-full h-11">
                {busy ? 'Saving…' : 'Save changes'}
              </Button>

              {selected.cancelRequest?.status === 'requested' ? (
                <div className="rounded-xl border border-amber-500/25 bg-amber-500/5 p-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <ShieldAlert className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                    <p className="text-sm font-semibold text-amber-700 dark:text-amber-300">Cancellation requested</p>
                  </div>
                  {selected.cancelRequest.reason ? (
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">Reason: {selected.cancelRequest.reason}</p>
                  ) : (
                    <p className="text-sm text-muted-foreground">Reason: (not provided)</p>
                  )}
                  <div>
                    <label className="block text-sm font-medium mb-2">Decision note (optional)</label>
                    <Input value={cancelNote} onChange={(e) => setCancelNote(e.target.value)} className="h-11 bg-background" />
                  </div>
                  <div className="flex gap-2">
                    <Button type="button" variant="outline" className="flex-1 h-11" disabled={busy} onClick={() => void decideCancel('reject')}>
                      Reject
                    </Button>
                    <Button type="button" className="flex-1 h-11" disabled={busy} onClick={() => void decideCancel('approve')}>
                      Approve cancellation
                    </Button>
                  </div>
                </div>
              ) : null}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
