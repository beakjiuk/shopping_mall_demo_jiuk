import { useEffect, useState } from 'react'
import { apiFetch } from '../lib/api'
import { guestCartTotalQuantity } from '../lib/guestCart'
import { useAuth } from '../context/AuthContext'

export default function useCartCount() {
  const { user, loading } = useAuth()
  const [count, setCount] = useState<number>(0)

  useEffect(() => {
    let cancelled = false
    if (loading) return

    async function run() {
      if (user) {
        const res = await apiFetch<{ cart: { items: Array<{ quantity: number }> } }>('/api/cart', { auth: true })
        if (cancelled) return
        if (!res.ok) return
        const n = res.cart.items.reduce((acc, it) => acc + (it.quantity || 0), 0)
        setCount(n)
      } else {
        setCount(guestCartTotalQuantity())
      }
    }

    run()
    const timer = user ? setInterval(run, 4000) : null
    const onGuest = () => {
      if (!user) setCount(guestCartTotalQuantity())
    }
    window.addEventListener('guest-cart-change', onGuest)
    return () => {
      cancelled = true
      if (timer) clearInterval(timer)
      window.removeEventListener('guest-cart-change', onGuest)
    }
  }, [user, loading])

  return count
}

