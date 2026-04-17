import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import StorefrontLayout from '../components/StorefrontLayout'
import Button from '../components/ui/Button'
import { apiFetch } from '../lib/api'
import type { Order } from '../lib/types'
import { useToast } from '../components/ToastHost'
import useWishlist from '../hooks/useWishlist'

export default function CheckoutPortOneRedirectPage() {
  const nav = useNavigate()
  const [sp] = useSearchParams()
  const { toast } = useToast()
  const [busy, setBusy] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const wishlist = useWishlist()

  useEffect(() => {
    const orderId = sp.get('orderId') || ''
    const paymentId = sp.get('paymentId') || ''
    const code = sp.get('code') || ''
    const message = sp.get('message') || ''
    if (!orderId || !paymentId) {
      setBusy(false)
      setError(code || message || 'MISSING_PARAMS')
      return
    }
    if (code) {
      setBusy(false)
      setError(message || code)
      return
    }

    let cancelled = false
    async function run() {
      try {
        const confirmRes = await apiFetch<{ order: Order }>(`/api/orders/${orderId}/portone/confirm`, {
          method: 'POST',
          auth: true,
          body: { paymentId },
        })
        if (cancelled) return
        if (!confirmRes.ok) throw new Error(confirmRes.error)

        // Remove purchased items from wishlist.
        const purchasedIds = new Set(confirmRes.order.items.map((i) => i.productId))
        if (purchasedIds.size > 0 && wishlist.count > 0) {
          wishlist.set(wishlist.ids.filter((id) => !purchasedIds.has(id)))
        }

        toast({ title: '결제 완료', description: `주문번호 ${orderId}` })
        nav(`/checkout/success?orderId=${encodeURIComponent(orderId)}`, { replace: true })
      } catch (e) {
        if (cancelled) return
        setError(String(e))
      } finally {
        if (!cancelled) setBusy(false)
      }
    }
    run()
    return () => {
      cancelled = true
    }
  }, [nav, sp, toast, wishlist])

  return (
    <StorefrontLayout footerContext="checkout">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-md mx-auto text-center">
          <h1 className="text-2xl font-bold mb-2">{busy ? '결제 확인 중…' : error ? '결제 확인 실패' : '결제 완료'}</h1>
          <p className="text-muted-foreground mb-8">
            {busy ? '포트원 결제 결과를 확인하고 있습니다.' : error ? `오류: ${error}` : '결제가 완료되었습니다.'}
          </p>
          {!busy && error ? (
            <div className="flex gap-3 justify-center">
              <Button variant="outline" onClick={() => nav('/checkout', { replace: true })}>
                Back to Checkout
              </Button>
              <Button variant="secondary" onClick={() => nav('/orders', { replace: true })}>
                Go to Orders
              </Button>
            </div>
          ) : null}
        </div>
      </div>
    </StorefrontLayout>
  )
}

