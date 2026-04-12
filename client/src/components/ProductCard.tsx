"use client"

import { memo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Heart, ShoppingBag } from 'lucide-react'
import Button from './ui/Button'
import type { Product } from '../lib/types'
import { apiFetch } from '../lib/api'
import { useAuth } from '../context/AuthContext'
import { addToGuestCart } from '../lib/guestCart'
import { useToast } from './ToastHost'
import useWishlist from '../hooks/useWishlist'
import SafeProductImage from './SafeProductImage'

function ProductCard({ product }: { product: Product }) {
  const nav = useNavigate()
  const [isHovered, setIsHovered] = useState(false)
  const [busy, setBusy] = useState(false)
  const { user } = useAuth()
  const { toast } = useToast()
  const wishlist = useWishlist()

  async function quickAdd(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    const defaultSize = product.sizes?.length ? (product.sizes[0] || '').trim() : ''
    if (product.sizes?.length && !defaultSize) {
      toast({ title: 'Open product', description: 'Choose a size on the product page.' })
      nav(`/products/${product._id}`)
      return
    }
    if (!user) {
      addToGuestCart(product._id, 1, defaultSize)
      toast({
        title: 'Added to cart',
        description: defaultSize ? `${product.title} · ${defaultSize}` : product.title,
        navigateTo: '/cart',
      })
      return
    }
    setBusy(true)
    try {
      const res = await apiFetch<Record<string, never>>('/api/cart/items', {
        method: 'POST',
        auth: true,
        body: { productId: product._id, quantity: 1, size: defaultSize },
      })
      if (!res.ok) throw new Error(res.error)
      toast({
        title: 'Added to cart',
        description: defaultSize ? `${product.title} · ${defaultSize}` : product.title,
        navigateTo: '/cart',
      })
    } catch (err) {
      toast({ title: 'Failed to add', description: String(err) })
    } finally {
      setBusy(false)
    }
  }

  return (
    <div
      className="group relative bg-card rounded-xl overflow-hidden border border-border hover:border-accent/50 transition-all duration-300"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Do not nest <button> inside <a>/<Link> — breaks clicks. Image navigates via div+navigate; actions are separate. */}
      <div
        className="relative aspect-square overflow-hidden bg-secondary cursor-pointer"
        onClick={() => nav(`/products/${product._id}`)}
        role="presentation"
      >
        <SafeProductImage
          src={product.imageUrl}
          candidates={product.images}
          alt={product.title}
          className={`h-full w-full object-cover transition-transform duration-500 ${isHovered ? 'scale-110' : 'scale-100'}`}
        />

        <div
          className={`max-md:hidden absolute inset-x-3 bottom-3 transition-all duration-300 z-20 ${
            isHovered ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          <Button type="button" className="w-full gap-2" disabled={busy} onClick={quickAdd}>
            <ShoppingBag className="h-4 w-4 shrink-0" />
            {busy ? 'Adding…' : 'Add to Cart'}
          </Button>
        </div>

        <button
          type="button"
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            const was = wishlist.has(product._id)
            wishlist.toggle(product._id)
            toast({
              title: was ? 'Removed from wishlist' : 'Added to wishlist',
              description: product.title,
              navigateTo: '/wishlist',
            })
          }}
          className="absolute top-3 right-3 p-2 rounded-full bg-background/80 backdrop-blur-sm hover:bg-background transition-colors z-20 touch-manipulation max-md:top-1.5 max-md:right-2 max-md:inline-flex max-md:h-8 max-md:w-8 max-md:items-center max-md:justify-center max-md:p-0"
          aria-label="Toggle wishlist"
        >
          <Heart
            className={`h-5 w-5 max-md:h-3.5 max-md:w-3.5 transition-colors ${
              wishlist.has(product._id) ? 'fill-destructive text-destructive' : 'text-foreground'
            }`}
          />
        </button>
      </div>

      <Link to={`/products/${product._id}`} className="block p-4 max-md:p-3">
        <h3 className="font-medium text-sm lg:text-base line-clamp-2 mb-2 max-md:text-xs max-md:mb-1.5 group-hover:text-accent transition-colors">
          {product.title}
        </h3>
        <p className="text-sm text-muted-foreground line-clamp-2 max-md:text-xs">{product.description}</p>
        <div className="flex items-center justify-between mt-3">
          <span className="font-bold text-lg">${product.price.toFixed(2)}</span>
          <span className="text-xs text-muted-foreground">stock {product.stock}</span>
        </div>
      </Link>
    </div>
  )
}

export default memo(ProductCard)
