import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, Minus, Plus, ShoppingBag, Trash2, Truck } from 'lucide-react'
import StorefrontLayout from '../components/StorefrontLayout'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import { apiFetch } from '../lib/api'
import {
  getGuestCartLines,
  removeGuestCartItem,
  setGuestCartQuantity,
} from '../lib/guestCart'
import type { CartItem } from '../lib/types'
import { useToast } from '../components/ToastHost'
import SafeProductImage from '../components/SafeProductImage'
import { useAuth } from '../context/AuthContext'
import { useProductsCatalog } from '../lib/useProductsCatalog'

function cartLineId(item: { productId: string; size?: string }) {
  return `${item.productId}::${(item.size || '').trim()}`
}

function sizeQuery(size: string | undefined) {
  const q = new URLSearchParams()
  if (size && size.trim()) q.set('size', size.trim())
  return q.toString() ? `?${q.toString()}` : ''
}

export default function CartPage() {
  const nav = useNavigate()
  const { user } = useAuth()
  const [items, setItems] = useState<CartItem[]>([])
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const { toast } = useToast()
  const { data: catalog, error: catErr, isLoading: catLoading } = useProductsCatalog()

  const load = useCallback(async () => {
    if (user) {
      const res = await apiFetch<{ cart: { items: CartItem[] } }>('/api/cart', { auth: true })
      if (!res.ok) {
        setError(res.error)
        return
      }
      setError(null)
      setItems(res.cart.items)
      return
    }
    const lines = getGuestCartLines()
    if (lines.length === 0) {
      setError(null)
      setItems([])
      return
    }
    if (catLoading || catalog === undefined) return
    if (catErr) {
      setError(String(catErr.message))
      return
    }
    const map = new Map(catalog.map((p) => [p._id, p]))
    setError(null)
    setItems(
      lines.map((l) => ({
        productId: l.productId,
        quantity: l.quantity,
        size: l.size?.trim() || undefined,
        product: map.get(l.productId) ?? null,
      })),
    )
  }, [user, catalog, catLoading, catErr])

  useEffect(() => {
    void load()
  }, [load])

  const total = useMemo(() => {
    let t = 0
    for (const i of items) {
      if (i.product) t += i.product.price * i.quantity
    }
    return t
  }, [items])

  /** 데모: 테스트 이벤트 무료 배송 */
  const shipping = 0
  const tax = total * 0.08
  const grandTotal = total + shipping + tax

  async function setQty(productId: string, quantity: number, size?: string) {
    setBusy(true)
    try {
      if (user) {
        const res = await apiFetch<Record<string, never>>(`/api/cart/items/${productId}${sizeQuery(size)}`, {
          method: 'PATCH',
          auth: true,
          body: { quantity },
        })
        if (!res.ok) throw new Error(res.error)
      } else {
        setGuestCartQuantity(productId, quantity, size || '')
      }
      await load()
    } catch (e) {
      toast({ title: 'Failed to update quantity', description: String(e) })
    } finally {
      setBusy(false)
    }
  }

  async function remove(productId: string, size?: string) {
    setBusy(true)
    try {
      if (user) {
        const res = await apiFetch<Record<string, never>>(`/api/cart/items/${productId}${sizeQuery(size)}`, {
          method: 'DELETE',
          auth: true,
        })
        if (!res.ok) throw new Error(res.error)
      } else {
        removeGuestCartItem(productId, size || '')
      }
      await load()
      toast({ title: 'Removed from cart' })
    } catch (e) {
      toast({ title: 'Failed to remove', description: String(e) })
    } finally {
      setBusy(false)
    }
  }

  function checkout() {
    if (!user) {
      nav(`/login?redirect=${encodeURIComponent('/checkout')}`)
      return
    }
    nav('/checkout')
  }

  return (
    <StorefrontLayout footerContext="cart">
      <div className="container mx-auto px-4 py-8 max-md:py-6">
        <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-8">
          <Link to="/" className="hover:text-foreground transition-colors">
            Home
          </Link>
          <span>/</span>
          <span className="text-foreground">Cart</span>
        </nav>

        {error ? <p className="text-sm text-muted-foreground">Error: {error}</p> : null}

        {items.length === 0 ? (
          <div className="max-w-md mx-auto text-center py-16">
            <div className="w-24 h-24 bg-secondary rounded-full flex items-center justify-center mx-auto mb-6">
              <ShoppingBag className="h-12 w-12 text-muted-foreground" />
            </div>
            <h1 className="text-2xl font-bold mb-2">Your cart is empty</h1>
            <p className="text-muted-foreground mb-8">Looks like you haven't added any items to your cart yet.</p>
            <Link to="/products">
              <Button className="gap-2" variant="secondary" size="lg">
                <ShoppingBag className="h-5 w-5" />
                Start Shopping
              </Button>
            </Link>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-8 max-md:flex-wrap max-md:gap-2 max-md:mb-6">
              <h1 className="text-3xl lg:text-4xl font-bold max-md:text-2xl">Shopping Cart</h1>
              <span className="text-muted-foreground max-md:text-sm">
                {items.length} {items.length === 1 ? 'item' : 'items'}
              </span>
            </div>

            <div className="grid lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-4">
                {items.map((item) => (
                  <div key={cartLineId(item)} className="flex gap-4 p-4 bg-card rounded-xl border border-border max-md:gap-3 max-md:p-3">
                    <Link to={`/products/${item.productId}`} className="shrink-0">
                      <div className="relative w-24 h-24 lg:w-32 lg:h-32 max-md:w-[4.5rem] max-md:h-[4.5rem] rounded-lg overflow-hidden bg-secondary">
                        <SafeProductImage
                          src={item.product?.imageUrl}
                          alt={item.product?.title ?? 'Product'}
                          className="h-full w-full object-cover"
                        />
                      </div>
                    </Link>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          {item.product?.brand ? (
                            <p className="text-xs text-muted-foreground uppercase tracking-wider">{item.product.brand}</p>
                          ) : null}
                          <Link to={`/products/${item.productId}`}>
                            <h3 className="font-medium hover:text-accent transition-colors line-clamp-2">
                              {item.product?.title ?? 'Unknown product'}
                            </h3>
                          </Link>
                          {item.size ? (
                            <p className="text-xs text-muted-foreground mt-1">Size: {item.size}</p>
                          ) : null}
                        </div>
                        <button
                          type="button"
                          onClick={() => remove(item.productId, item.size)}
                          className="p-2 max-md:inline-flex max-md:h-10 max-md:w-10 max-md:items-center max-md:justify-center hover:bg-secondary rounded-lg transition-colors text-muted-foreground hover:text-destructive"
                          aria-label="Remove item"
                          disabled={busy}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>

                      <div className="flex items-end justify-between mt-4">
                        <div className="flex items-center border border-border rounded-lg">
                          <button
                            type="button"
                            onClick={() => setQty(item.productId, Math.max(1, item.quantity - 1), item.size)}
                            className="p-2 max-md:inline-flex max-md:h-11 max-md:w-11 max-md:items-center max-md:justify-center hover:bg-secondary transition-colors disabled:opacity-40"
                            disabled={busy || item.quantity <= 1}
                          >
                            <Minus className="h-4 w-4" />
                          </button>
                          <span className="w-10 text-center text-sm font-medium tabular-nums">{item.quantity}</span>
                          <button
                            type="button"
                            onClick={() => setQty(item.productId, item.quantity + 1, item.size)}
                            className="p-2 max-md:inline-flex max-md:h-11 max-md:w-11 max-md:items-center max-md:justify-center hover:bg-secondary transition-colors"
                            disabled={busy}
                          >
                            <Plus className="h-4 w-4" />
                          </button>
                        </div>

                        <div className="text-right">
                          <p className="font-bold">${((item.product?.price ?? 0) * item.quantity).toFixed(2)}</p>
                          {item.product?.originalPrice ? (
                            <p className="text-xs text-muted-foreground line-through">
                              ${((item.product.originalPrice ?? 0) * item.quantity).toFixed(2)}
                            </p>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}

                <div className="flex justify-between items-center pt-4">
                  <Link to="/products" className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-2">
                    <ArrowLeft className="h-4 w-4" />
                    Continue Shopping
                  </Link>
                </div>
              </div>

              <div className="lg:col-span-1">
                <div className="sticky top-32 bg-card rounded-xl border border-border p-6 max-md:relative max-md:top-auto max-md:p-4 max-md:mt-2">
                  <h2 className="text-xl font-bold mb-6 max-md:text-lg max-md:mb-4">Order Summary</h2>

                  <div className="flex gap-2 mb-6 max-md:flex-col max-md:items-stretch">
                    <Input placeholder="Promo code" className="bg-secondary border-0 flex-1 max-md:min-h-11" />
                    <Button variant="secondary" className="shrink-0 max-md:min-h-11 max-md:w-full md:w-auto">
                      Apply
                    </Button>
                  </div>

                  <p className="text-xs text-accent rounded-lg border border-accent/30 bg-accent/5 px-3 py-2 mb-4">
                    테스트 이벤트: 무료 배송 적용 중
                  </p>

                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Subtotal</span>
                      <span className="font-medium">${total.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Shipping</span>
                      <span className="font-medium text-accent">Free</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Tax</span>
                      <span className="font-medium">${tax.toFixed(2)}</span>
                    </div>
                  </div>

                  <div className="my-6 border-t border-border" />

                  <div className="flex justify-between text-lg font-bold mb-6">
                    <span>Total</span>
                    <span>${grandTotal.toFixed(2)}</span>
                  </div>

                  <div className="mb-6 p-4 bg-secondary rounded-lg flex items-center gap-2 text-sm text-muted-foreground">
                    <Truck className="h-4 w-4 shrink-0 text-accent" />
                    <span>이번 테스트 기간에는 배송비 없이 체크아웃됩니다.</span>
                  </div>

                  <Button className="w-full gap-2" variant="secondary" size="lg" disabled={busy} onClick={checkout}>
                    Proceed to Checkout
                  </Button>

                  <div className="flex items-center justify-center gap-4 mt-6 text-xs text-muted-foreground">
                    <span>Secure Checkout</span>
                    <span>|</span>
                    <span>30-Day Returns</span>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </StorefrontLayout>
  )
}

