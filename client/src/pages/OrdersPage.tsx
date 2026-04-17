import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Copy, CreditCard, Package, ShoppingBag, Sparkles, XCircle } from 'lucide-react'
import StorefrontLayout from '../components/StorefrontLayout'
import Button from '../components/ui/Button'
import { apiFetch } from '../lib/api'
import type { Order } from '../lib/types'
import { useToast } from '../components/ToastHost'
import SafeProductImage from '../components/SafeProductImage'

function statusLabel(status: Order['status']) {
  switch (status) {
    case 'created':
      return 'Awaiting payment'
    case 'paid':
      return 'Paid'
    case 'fulfilment':
      return 'Preparing'
    case 'shipped':
      return 'Shipped'
    case 'delivered':
      return 'Delivered'
    case 'refunded':
      return 'Refunded'
    default:
      return status
  }
}

function statusClass(status: Order['status']) {
  switch (status) {
    case 'created':
      return 'bg-violet-500/10 text-violet-700 dark:text-violet-300 border-violet-500/25'
    case 'paid':
      return 'bg-accent/15 text-accent border-accent/30'
    case 'fulfilment':
      return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/25'
    case 'shipped':
      return 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/25'
    case 'delivered':
      return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/25'
    case 'refunded':
      return 'bg-secondary text-secondary-foreground border-border'
    default:
      return 'bg-secondary text-muted-foreground border-border'
  }
}

export default function OrdersPage() {
  const { toast } = useToast()
  const [orders, setOrders] = useState<Order[]>([])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [cancellingId, setCancellingId] = useState<string | null>(null)
  const [requestingId, setRequestingId] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    const res = await apiFetch<{ orders: Order[] }>('/api/orders', { auth: true })
    if (!res.ok) {
      setError('error' in res ? res.error : 'UNKNOWN_ERROR')
      setOrders([])
    } else {
      setError(null)
      setOrders(res.orders)
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    load()
  }, [load])

  async function cancelOrder(orderId: string) {
    if (!window.confirm('미결제 주문을 삭제할까요? 되돌릴 수 없습니다.')) return
    setCancellingId(orderId)
    try {
      const res = await apiFetch<{ deleted?: boolean }>(`/api/orders/${orderId}/cancel`, { method: 'POST', auth: true })
      if (!res.ok) {
        toast({ title: '삭제할 수 없습니다', description: 'error' in res ? res.error : 'UNKNOWN_ERROR' })
        return
      }
      toast({ title: '주문을 삭제했습니다' })
      await load()
    } finally {
      setCancellingId(null)
    }
  }

  async function requestCancel(orderId: string) {
    const reason = (window.prompt('취소 사유를 입력해 주세요 (선택)', '') || '').trim()
    setRequestingId(orderId)
    try {
      const res = await apiFetch<{ order: Order }>(`/api/orders/${orderId}/cancel-request`, {
        method: 'POST',
        auth: true,
        body: { reason },
      })
      if (!res.ok) {
        toast({ title: '취소 요청 실패', description: 'error' in res ? res.error : 'UNKNOWN_ERROR' })
        return
      }
      toast({ title: '취소 요청 완료', description: '관리자 승인 후 취소가 처리됩니다.' })
      await load()
    } finally {
      setRequestingId(null)
    }
  }

  async function copy(text: string, okTitle: string) {
    try {
      await navigator.clipboard.writeText(text)
      toast({ title: okTitle })
    } catch {
      toast({ title: '복사 실패', description: text })
    }
  }

  return (
    <StorefrontLayout footerContext="orders">
      <div className="flex-1 flex flex-col">
        <div className="border-b border-border bg-gradient-to-b from-secondary/40 to-background">
          <div className="container mx-auto px-4 py-12 md:py-16 max-md:py-8">
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
              <div className="min-w-0">
                <p className="text-sm font-medium text-accent mb-2 flex items-center gap-2">
                  <Sparkles className="h-4 w-4 shrink-0" />
                  Your purchases
                </p>
                <h1 className="text-3xl md:text-4xl font-bold tracking-tight max-md:text-2xl">Orders</h1>
                <p className="text-muted-foreground mt-2 max-w-xl">미결제 초안은 결제하거나 삭제할 수 있습니다. 삭제 시 목록에서 바로 제거됩니다.</p>
              </div>
              <Link
                to="/products"
                className="inline-flex h-10 shrink-0 items-center justify-center rounded-xl border border-border bg-transparent px-4 text-sm font-medium text-foreground transition-colors hover:bg-secondary/50 max-md:min-h-11 max-md:w-full max-md:py-2.5 md:w-auto"
              >
                Continue shopping
                <ArrowRight className="h-4 w-4 ml-2" />
              </Link>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 py-10 md:py-14">
          {loading ? (
            <div className="space-y-4 max-w-3xl">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-28 rounded-xl border border-border bg-card animate-pulse" />
              ))}
            </div>
          ) : error ? (
            <div className="max-w-lg rounded-xl border border-destructive/30 bg-destructive/5 px-6 py-8">
              <p className="font-semibold text-destructive mb-2">Could not load orders</p>
              <p className="text-sm text-muted-foreground">{error}</p>
            </div>
          ) : orders.length === 0 ? (
            <div className="max-w-xl mx-auto text-center py-8 md:py-12">
              <div className="w-20 h-20 rounded-full bg-secondary flex items-center justify-center mx-auto mb-6">
                <Package className="h-9 w-9 text-muted-foreground" />
              </div>
              <h2 className="text-2xl font-semibold mb-2">No orders yet</h2>
              <p className="text-muted-foreground mb-8">
                When you check out, your order history will show up here with status and totals.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link
                  to="/cart"
                  className="inline-flex h-10 items-center justify-center rounded-xl bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:opacity-90"
                >
                  <ShoppingBag className="h-4 w-4 mr-2" />
                  View cart
                </Link>
                <Link
                  to="/products"
                  className="inline-flex h-10 items-center justify-center rounded-xl border border-border bg-transparent px-4 text-sm font-medium text-foreground transition-colors hover:bg-secondary/50"
                >
                  Browse products
                </Link>
              </div>
            </div>
          ) : (
            <div className="max-w-2xl space-y-3">
              {orders.map((o) => {
                const orderRef = `ORD-${o._id.slice(-8).toUpperCase()}`
                const preview = o.items.slice(0, 2).map((i) => i.title).join(' · ')
                const more = o.items.length > 2 ? ` +${o.items.length - 2}` : ''
                const unpaid = o.status === 'created'
                const canRequestCancel =
                  (o.status === 'paid' || o.status === 'fulfilment') && (o.cancelRequest?.status || 'none') === 'none'
                const cancelState = (o.cancelRequest?.status || 'none').trim()
                const tracking = (o.shipping?.trackingNumber || '').trim()
                const carrier = (o.shipping?.carrier || '').trim()
                const thumbs = o.items
                  .map((it) => (it.imageUrl || '').trim())
                  .filter(Boolean)
                  .slice(0, 3)
                return (
                  <article
                    key={o._id}
                    className="rounded-lg border border-border bg-card px-4 py-3 md:px-4 md:py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
                  >
                    <div className="min-w-0 flex-1 flex items-start gap-3">
                      <div className="shrink-0 pt-1">
                        {thumbs.length > 0 ? (
                          <div className="flex -space-x-2">
                            {thumbs.map((src, idx) => (
                              <div
                                key={`${src}::${idx}`}
                                className="h-11 w-11 rounded-xl overflow-hidden border border-border bg-secondary shadow-sm"
                                style={{ zIndex: thumbs.length - idx }}
                              >
                                <SafeProductImage src={src} alt="Order item" className="h-full w-full object-cover" />
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="h-11 w-11 rounded-xl border border-border bg-secondary flex items-center justify-center">
                            <ShoppingBag className="h-5 w-5 text-muted-foreground" />
                          </div>
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                        <span className="font-mono text-xs font-semibold">{orderRef}</span>
                        <span
                          className={`inline-flex rounded-full border px-2 py-0.5 text-[11px] font-medium ${statusClass(o.status)}`}
                        >
                          {statusLabel(o.status)}
                        </span>
                        {cancelState === 'requested' ? (
                          <span className="inline-flex rounded-full border px-2 py-0.5 text-[11px] font-medium bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/25">
                            취소 요청됨
                          </span>
                        ) : cancelState === 'rejected' ? (
                          <span className="inline-flex rounded-full border px-2 py-0.5 text-[11px] font-medium bg-destructive/10 text-destructive border-destructive/25">
                            취소 거절
                          </span>
                        ) : cancelState === 'approved' ? (
                          <span className="inline-flex rounded-full border px-2 py-0.5 text-[11px] font-medium bg-secondary text-secondary-foreground border-border">
                            취소 승인
                          </span>
                        ) : null}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(o.createdAt).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}
                      </p>
                      <p className="text-sm text-foreground/90 mt-1.5 line-clamp-1">
                        {preview}
                        {more}
                      </p>
                      {tracking ? (
                        <div className="mt-2 flex flex-wrap items-center gap-2">
                          <span className="text-xs text-muted-foreground">
                            배송: <span className="text-foreground/80">{carrier || 'Carrier'}</span> ·{' '}
                            <span className="font-mono text-foreground/80">{tracking}</span>
                          </span>
                          <button
                            type="button"
                            className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                            onClick={() => void copy(tracking, '운송장번호 복사됨')}
                            aria-label="Copy tracking number"
                          >
                            <Copy className="h-3.5 w-3.5" />
                            Copy
                          </button>
                        </div>
                      ) : null}
                      </div>
                    </div>
                    <div className="flex flex-col items-stretch sm:items-end gap-2 shrink-0 text-right">
                      <p className="text-base font-bold tabular-nums">${o.total.toFixed(2)}</p>
                      {unpaid ? (
                        <div className="flex flex-wrap items-center justify-end gap-2">
                          <Link
                            to={`/checkout?resume=${encodeURIComponent(o._id)}`}
                            className="inline-flex items-center justify-center font-medium h-8 px-3 text-xs rounded-md bg-secondary text-secondary-foreground hover:opacity-90 gap-1.5"
                          >
                            <CreditCard className="h-3.5 w-3.5" />
                            Pay now
                          </Link>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-8 px-2 text-xs text-muted-foreground hover:text-destructive"
                            disabled={cancellingId === o._id}
                            onClick={() => cancelOrder(o._id)}
                          >
                            <XCircle className="h-3.5 w-3.5 mr-1" />
                            {cancellingId === o._id ? '삭제 중…' : '삭제'}
                          </Button>
                        </div>
                      ) : canRequestCancel ? (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="h-9 px-3 text-xs"
                          disabled={requestingId === o._id}
                          onClick={() => void requestCancel(o._id)}
                        >
                          {requestingId === o._id ? '요청 중…' : '주문 취소 요청'}
                        </Button>
                      ) : null}
                    </div>
                  </article>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </StorefrontLayout>
  )
}
