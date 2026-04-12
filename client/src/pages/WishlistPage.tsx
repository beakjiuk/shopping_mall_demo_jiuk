import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Heart } from 'lucide-react'
import StorefrontLayout from '../components/StorefrontLayout'
import Button from '../components/ui/Button'
import ProductCard from '../components/ProductCard'
import { useProductsCatalog } from '../lib/useProductsCatalog'
import useWishlist from '../hooks/useWishlist'

export default function WishlistPage() {
  const wishlist = useWishlist()
  const { data: all = [] } = useProductsCatalog()

  const items = useMemo(() => {
    const set = new Set(wishlist.ids)
    return all.filter((p) => set.has(p._id))
  }, [all, wishlist.ids])

  return (
    <StorefrontLayout footerContext="wishlist">
      <div className="container mx-auto px-4 py-8 max-md:py-6">
        <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-8">
          <Link to="/" className="hover:text-foreground transition-colors">
            Home
          </Link>
          <span>/</span>
          <span className="text-foreground">Wishlist</span>
        </nav>

        <div className="flex items-center justify-between mb-8 max-md:flex-wrap max-md:gap-3 max-md:mb-6">
          <h1 className="text-3xl lg:text-4xl font-bold max-md:text-2xl">Wishlist</h1>
          <Button variant="ghost" onClick={wishlist.clear} disabled={wishlist.count === 0}>
            Clear
          </Button>
        </div>

        {wishlist.count === 0 ? (
          <div className="max-w-md mx-auto text-center py-16">
            <div className="w-24 h-24 bg-secondary rounded-full flex items-center justify-center mx-auto mb-6">
              <Heart className="h-12 w-12 text-muted-foreground" />
            </div>
            <h2 className="text-2xl font-bold mb-2">No items yet</h2>
            <p className="text-muted-foreground mb-8">Save products you like and come back later.</p>
            <Link to="/products">
              <Button variant="secondary" size="lg">
                Browse products
              </Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 max-md:gap-3">
            {items.map((p) => (
              <ProductCard key={p._id} product={p} />
            ))}
          </div>
        )}
      </div>
    </StorefrontLayout>
  )
}

