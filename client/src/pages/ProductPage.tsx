import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  Check,
  Heart,
  Minus,
  Plus,
  Share2,
  ShoppingBag,
  Star,
  Truck,
  Shield,
  RotateCcw,
  Zap,
} from 'lucide-react'
import StorefrontLayout from '../components/StorefrontLayout'
import Button from '../components/ui/Button'
import { apiFetch } from '../lib/api'
import { useProductDetail, useProductsCatalog } from '../lib/useProductsCatalog'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../components/ToastHost'
import { addToGuestCart } from '../lib/guestCart'
import useWishlist from '../hooks/useWishlist'
import ProductCard from '../components/ProductCard'
import SafeProductImage from '../components/SafeProductImage'
import { PRODUCT_IMAGE_FALLBACK } from '../lib/productImages'

export default function ProductPage() {
  const { id } = useParams()
  const { user } = useAuth()
  const { toast } = useToast()
  const wishlist = useWishlist()
  const { data: product, error: loadErr, isLoading } = useProductDetail(id)
  const { data: catalog = [] } = useProductsCatalog()
  const error = loadErr ? String(loadErr.message) : null
  const [adding, setAdding] = useState(false)
  const [selectedImage, setSelectedImage] = useState(0)
  const [quantity, setQuantity] = useState(1)
  const [selectedColor, setSelectedColor] = useState('')
  const [selectedSize, setSelectedSize] = useState('')

  useEffect(() => {
    if (!product) return
    setSelectedImage(0)
    setQuantity(1)
    setSelectedColor(product.colors?.[0] ?? '')
    setSelectedSize(product.sizes?.[0] ?? '')
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only when product id changes, not every SWR refresh
  }, [product?._id])

  const related = useMemo(() => {
    if (!product) return []
    const others = catalog.filter((p) => p._id !== product._id)
    const sameCat = others.filter((p) => product.category && p.category === product.category)
    const rest = others.filter((p) => !sameCat.some((s) => s._id === p._id))
    return [...sameCat, ...rest].slice(0, 4)
  }, [product, catalog])

  const images = useMemo(() => {
    const list = (product?.images?.length ? product.images : product?.imageUrl ? [product.imageUrl] : []) as string[]
    return list.length ? list : [PRODUCT_IMAGE_FALLBACK]
  }, [product])

  /** Colors and gallery images are in the same order (index 0 = first color, etc.). */
  const selectGalleryIndex = (index: number) => {
    const max = Math.max(0, images.length - 1)
    const i = Math.min(Math.max(0, index), max)
    setSelectedImage(i)
    const c = product?.colors?.[i]
    if (c !== undefined) setSelectedColor(c)
  }

  const selectColor = (color: string, colorIndex: number) => {
    setSelectedColor(color)
    const max = Math.max(0, images.length - 1)
    setSelectedImage(Math.min(colorIndex, max))
  }

  const discount = useMemo(() => {
    if (!product?.originalPrice) return 0
    if (product.originalPrice <= product.price) return 0
    return Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
  }, [product])

  const copyShareLink = useCallback(async () => {
    const url = window.location.href
    try {
      await navigator.clipboard.writeText(url)
      toast({ title: 'Link copied', description: 'Current page URL is in your clipboard.' })
    } catch {
      try {
        const ta = document.createElement('textarea')
        ta.value = url
        ta.setAttribute('readonly', '')
        ta.style.position = 'fixed'
        ta.style.left = '-9999px'
        document.body.appendChild(ta)
        ta.select()
        document.execCommand('copy')
        document.body.removeChild(ta)
        toast({ title: 'Link copied', description: 'Current page URL is in your clipboard.' })
      } catch {
        toast({ title: 'Could not copy', description: url })
      }
    }
  }, [toast])

  async function addToCart() {
    if (!product) return
    const sizeNorm = (selectedSize || '').trim()
    if (product.sizes?.length && !sizeNorm) {
      toast({ title: 'Select a size', description: 'Please choose a size before adding to cart.' })
      return
    }
    if (!user) {
      addToGuestCart(product._id, quantity, sizeNorm)
      toast({
        title: 'Added to cart',
        description: sizeNorm ? `${product.title} · ${sizeNorm} × ${quantity}` : `${product.title} × ${quantity}`,
        navigateTo: '/cart',
      })
      return
    }
    setAdding(true)
    try {
      const res = await apiFetch<Record<string, never>>('/api/cart/items', {
        method: 'POST',
        auth: true,
        body: { productId: product._id, quantity, size: sizeNorm },
      })
      if (!res.ok) throw new Error(res.error)
      toast({
        title: 'Added to cart',
        description: sizeNorm ? `${product.title} · ${sizeNorm} × ${quantity}` : `${product.title} × ${quantity}`,
        navigateTo: '/cart',
      })
    } catch (e) {
      toast({ title: 'Failed to add', description: String(e) })
    } finally {
      setAdding(false)
    }
  }

  return (
    <StorefrontLayout footerContext="browse">
      <div className="container mx-auto px-4 py-8 max-md:py-3">
        <nav
          className="flex items-center gap-2 text-sm text-muted-foreground mb-8 max-md:text-[11px] max-md:mb-3 max-md:overflow-x-auto max-md:whitespace-nowrap max-md:pb-1 max-md:-mx-1 max-md:px-1 max-md:[scrollbar-width:none] max-md:[&::-webkit-scrollbar]:hidden"
          aria-label="Breadcrumb"
        >
          <Link to="/" className="shrink-0 hover:text-foreground transition-colors">
            Home
          </Link>
          <span>/</span>
          <Link to="/products" className="shrink-0 hover:text-foreground transition-colors">
            Products
          </Link>
          <span>/</span>
          <span className="text-foreground truncate min-w-0 max-md:max-w-[45vw]">
            {product?.title ?? '…'}
          </span>
        </nav>

        <Link
          to="/products"
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-8 max-md:mb-3 max-md:min-h-8 max-md:text-xs"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Products
        </Link>

        {error ? <p className="text-sm text-muted-foreground">Error: {error}</p> : null}
        {!error && !product && isLoading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : null}
        {product ? (
          <>
            <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 max-md:gap-4">
              <div className="space-y-4 max-md:space-y-2">
                <div className="relative aspect-square max-md:aspect-auto max-md:h-[min(72vw,280px)] max-md:w-full bg-card rounded-2xl overflow-hidden border border-border">
                  <SafeProductImage
                    src={images[selectedImage]}
                    candidates={images.filter((_, i) => i !== selectedImage)}
                    alt={product.title}
                    className="h-full w-full object-cover"
                    loading="eager"
                  />

                  <div className="absolute top-4 left-4 flex flex-col gap-2 max-md:top-2 max-md:left-2 max-md:gap-1">
                    {product.isNew ? (
                      <span className="bg-accent text-accent-foreground px-3 py-1 rounded-full text-xs font-semibold max-md:px-2 max-md:py-0.5 max-md:text-[10px]">
                        New
                      </span>
                    ) : null}
                    {product.isBestSeller ? (
                      <span className="bg-secondary text-foreground px-3 py-1 rounded-full text-xs font-semibold max-md:px-2 max-md:py-0.5 max-md:text-[10px]">
                        Best Seller
                      </span>
                    ) : null}
                    {discount > 0 ? (
                      <span className="bg-destructive text-destructive-foreground px-3 py-1 rounded-full text-xs font-semibold max-md:px-2 max-md:py-0.5 max-md:text-[10px]">
                        -{discount}%
                      </span>
                    ) : null}
                  </div>

                  {product.fastDelivery ? (
                    <div className="absolute top-4 right-4 max-md:top-2 max-md:right-2">
                      <div className="flex items-center gap-1 bg-accent text-accent-foreground px-3 py-1.5 rounded-full text-sm font-semibold max-md:px-2 max-md:py-1 max-md:text-[10px]">
                        <Zap className="h-4 w-4 max-md:h-3 max-md:w-3" />
                        Express
                      </div>
                    </div>
                  ) : null}
                </div>

                {images.length > 1 ? (
                  <div className="flex gap-3 flex-wrap max-md:flex-nowrap max-md:overflow-x-auto max-md:gap-1.5 max-md:pb-1 max-md:-mx-1 max-md:px-1 max-md:snap-x max-md:snap-mandatory max-md:[scrollbar-width:thin]">
                    {images.map((img, index) => (
                      <button
                        key={`${index}-${img}`}
                        type="button"
                        onClick={() => selectGalleryIndex(index)}
                        className={`relative w-20 h-20 max-md:w-14 max-md:h-14 shrink-0 max-md:snap-start rounded-lg overflow-hidden border-2 transition-all ${
                          selectedImage === index ? 'border-accent' : 'border-border hover:border-accent/50'
                        }`}
                        aria-label={`Select image ${index + 1}`}
                      >
                        <SafeProductImage
                          src={img}
                          candidates={images.filter((u) => u !== img)}
                          alt=""
                          className="h-full w-full object-cover"
                        />
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>

              <div className="space-y-6 max-md:space-y-3">
                <div>
                  {product.brand ? (
                    <p className="text-sm text-muted-foreground uppercase tracking-wider mb-2 max-md:text-xs max-md:mb-1">
                      {product.brand}
                    </p>
                  ) : null}
                  <h1 className="text-3xl lg:text-4xl font-bold tracking-tight mb-4 text-balance max-md:text-xl max-md:mb-2 max-md:leading-tight">
                    {product.title}
                  </h1>

                  <div className="flex items-center gap-3 mb-4 max-md:flex-wrap max-md:gap-x-2 max-md:gap-y-1 max-md:mb-2">
                    <div className="flex items-center gap-0.5 max-md:gap-0">
                      {[...Array(5)].map((_, i) => {
                        const filled = (product.rating ?? 4.6) >= i + 1
                        return (
                          <Star
                            key={i}
                            className={`h-5 w-5 max-md:h-3.5 max-md:w-3.5 ${filled ? 'fill-accent text-accent' : 'text-muted-foreground'}`}
                          />
                        )
                      })}
                    </div>
                    <span className="text-sm font-medium max-md:text-xs">{(product.rating ?? 4.6).toFixed(1)}</span>
                    <span className="text-sm text-muted-foreground max-md:text-[11px]">
                      ({(product.reviews ?? 120).toLocaleString()} reviews)
                    </span>
                  </div>

                  <div className="flex items-baseline gap-3 mb-6 max-md:flex-wrap max-md:mb-3 max-md:gap-2">
                    <span className="text-4xl font-bold tabular-nums max-md:text-2xl">${product.price.toFixed(2)}</span>
                    {product.originalPrice ? (
                      <>
                        <span className="text-xl text-muted-foreground line-through">${product.originalPrice.toFixed(2)}</span>
                        <span className="bg-destructive text-destructive-foreground px-3 py-1 rounded-full text-xs font-semibold">
                          Save ${(product.originalPrice - product.price).toFixed(2)}
                        </span>
                      </>
                    ) : null}
                  </div>

                  <p className="text-muted-foreground leading-relaxed max-md:text-sm max-md:leading-snug max-md:line-clamp-4">
                    {product.description}
                  </p>
                </div>

                {product.colors?.length ? (
                  <div>
                    <label className="block text-sm font-medium mb-3 max-md:mb-2 max-md:text-xs">
                      Color: <span className="text-muted-foreground">{selectedColor}</span>
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {product.colors.map((color, colorIndex) => {
                        const label = color.trim()
                        if (!label) return null
                        return (
                          <button
                            key={`${colorIndex}-${label}`}
                            type="button"
                            onClick={() => selectColor(label, colorIndex)}
                            className={`px-4 py-2 max-md:min-h-9 max-md:px-3 max-md:py-1.5 max-md:text-xs rounded-lg border text-sm font-medium transition-all ${
                              selectedColor === label ? 'border-accent bg-accent/10 text-accent' : 'border-border hover:border-accent/50'
                            }`}
                          >
                            {label}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                ) : null}

                {product.sizes?.length ? (
                  <div>
                    <label className="block text-sm font-medium mb-3 max-md:mb-2 max-md:text-xs">
                      Size: <span className="text-muted-foreground">{selectedSize}</span>
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {product.sizes.map((size) => (
                        <button
                          key={size}
                          type="button"
                          onClick={() => setSelectedSize(size)}
                          className={`w-12 h-12 max-md:min-h-9 max-md:min-w-9 max-md:px-1.5 max-md:text-xs rounded-lg border text-sm font-medium transition-all ${
                            selectedSize === size ? 'border-accent bg-accent/10 text-accent' : 'border-border hover:border-accent/50'
                          }`}
                        >
                          {size}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : null}

                <div>
                  <label className="block text-sm font-medium mb-3 max-md:mb-2 max-md:text-xs">Quantity</label>
                  <div className="flex items-center gap-4 max-md:gap-2">
                    <div className="flex items-center border border-border rounded-lg">
                      <button
                        type="button"
                        onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                        className="p-3 max-md:inline-flex max-md:h-9 max-md:w-9 max-md:p-0 max-md:items-center max-md:justify-center hover:bg-secondary transition-colors"
                        disabled={quantity <= 1}
                        aria-label="Decrease quantity"
                      >
                        <Minus className="h-4 w-4" />
                      </button>
                      <span className="w-12 text-center font-medium tabular-nums max-md:w-9 max-md:text-sm">{quantity}</span>
                      <button
                        type="button"
                        onClick={() => setQuantity((q) => q + 1)}
                        className="p-3 max-md:inline-flex max-md:h-9 max-md:w-9 max-md:p-0 max-md:items-center max-md:justify-center hover:bg-secondary transition-colors"
                        aria-label="Increase quantity"
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>
                    <span className="text-sm text-muted-foreground max-md:text-[11px] max-md:leading-tight">
                      {product.stock} items available
                    </span>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 max-md:gap-2">
                  <Button className="flex-1 gap-2 max-md:min-h-10 max-md:text-sm" disabled={adding} onClick={addToCart}>
                    <ShoppingBag className="h-5 w-5 max-md:h-4 max-md:w-4" />
                    {adding ? 'Adding…' : 'Add to Cart'}
                  </Button>
                  <Button
                    variant="outline"
                    className="gap-2 max-md:min-h-10 max-md:text-sm"
                    onClick={() => {
                      if (!product) return
                      const was = wishlist.has(product._id)
                      wishlist.toggle(product._id)
                      toast({
                        title: was ? 'Removed from wishlist' : 'Added to wishlist',
                        description: product.title,
                        navigateTo: '/wishlist',
                      })
                    }}
                  >
                    <Heart
                      className={`h-5 w-5 max-md:h-4 max-md:w-4 ${product && wishlist.has(product._id) ? 'fill-destructive text-destructive' : ''}`}
                    />
                    Wishlist
                  </Button>
                  <Button
                    type="button"
                    className="gap-2 bg-transparent text-foreground hover:bg-secondary border border-border max-md:min-h-10 max-md:bg-white max-md:text-black max-md:border-white max-md:hover:bg-zinc-100 max-md:hover:text-black"
                    aria-label="Copy link to share"
                    onClick={() => void copyShareLink()}
                  >
                    <Share2 className="h-5 w-5 max-md:h-4 max-md:w-4" />
                  </Button>
                </div>

                <div className="grid grid-cols-3 gap-4 pt-6 border-t border-border max-md:gap-2 max-md:pt-4">
                  <div className="text-center">
                    <Truck className="h-6 w-6 mx-auto mb-2 text-accent max-md:h-5 max-md:w-5 max-md:mb-1" />
                    <p className="text-xs font-medium max-md:text-[10px]">Free Shipping</p>
                    <p className="text-xs text-muted-foreground max-md:text-[10px]">Over $100</p>
                  </div>
                  <div className="text-center">
                    <Shield className="h-6 w-6 mx-auto mb-2 text-accent max-md:h-5 max-md:w-5 max-md:mb-1" />
                    <p className="text-xs font-medium max-md:text-[10px]">Secure Payment</p>
                    <p className="text-xs text-muted-foreground max-md:text-[10px]">100% Protected</p>
                  </div>
                  <div className="text-center">
                    <RotateCcw className="h-6 w-6 mx-auto mb-2 text-accent max-md:h-5 max-md:w-5 max-md:mb-1" />
                    <p className="text-xs font-medium max-md:text-[10px]">Easy Returns</p>
                    <p className="text-xs text-muted-foreground max-md:text-[10px]">30-day policy</p>
                  </div>
                </div>

                {product.features?.length ? (
                  <div className="pt-6 border-t border-border max-md:pt-4">
                    <h3 className="text-lg font-semibold mb-3 max-md:text-base max-md:mb-2">Features</h3>
                    <ul className="space-y-3">
                      {product.features.map((f) => (
                        <li key={f} className="flex items-start gap-3">
                          <Check className="h-5 w-5 text-accent mt-0.5 shrink-0" />
                          <span className="text-muted-foreground">{f}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </div>
            </div>

            {related.length ? (
              <section className="mt-16 max-md:mt-8">
                <h2 className="text-2xl font-bold mb-8 max-md:text-lg max-md:mb-4">You May Also Like</h2>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 max-md:gap-3">
                  {related.map((p) => (
                    <ProductCard key={p._id} product={p} />
                  ))}
                </div>
              </section>
            ) : null}
          </>
        ) : null}
      </div>
    </StorefrontLayout>
  )
}

