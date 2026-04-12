import { useMemo } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import StorefrontLayout from '../components/StorefrontLayout'
import { catalogPageHeading, catalogPageSubtitle } from '../lib/catalogNav'
import { useProductsCatalog } from '../lib/useProductsCatalog'
import { isAppleSpotlightProduct } from '../lib/homeAppleCatalog'
import type { Product } from '../lib/types'
import ProductCard from '../components/ProductCard'

function filterByCatalogParams(
  products: Product[],
  section: string | null,
  category: string | null,
  brand: string | null,
  appleSpotlight: boolean,
): Product[] {
  if (appleSpotlight) return products.filter(isAppleSpotlightProduct)
  let list = products
  if (section === 'new') list = list.filter((p) => p.isNew)
  else if (section === 'bestsellers') list = list.filter((p) => p.isBestSeller)
  if (category) list = list.filter((p) => p.category === category)
  if (brand) {
    const b = brand.trim().toLowerCase()
    list = list.filter((p) => (p.brand || '').trim().toLowerCase() === b)
  }
  return list
}

export default function ProductsPage() {
  const [searchParams] = useSearchParams()
  const section = searchParams.get('section')
  const category = searchParams.get('category')
  const brand = searchParams.get('brand')
  const q = searchParams.get('q')
  const appleSpotlight =
    searchParams.get('appleSpotlight') === '1' || searchParams.get('appleSpotlight') === 'true'
  const { data: items = [], error: swrErr } = useProductsCatalog()
  const error = swrErr ? String(swrErr.message) : null

  const filtered = useMemo(
    () => {
      let list = filterByCatalogParams(items, section, category, brand, appleSpotlight)
      const term = (q || '').trim().toLowerCase()
      if (term) {
        list = list.filter((p) => {
          const hay = `${p.title} ${p.description} ${p.brand || ''} ${p.category || ''}`.toLowerCase()
          return hay.includes(term)
        })
      }
      return list
    },
    [items, section, category, brand, appleSpotlight, q],
  )
  const heading = catalogPageHeading(section, category, brand, appleSpotlight)
  const subtitle = catalogPageSubtitle(section, category, brand, appleSpotlight)

  return (
    <StorefrontLayout footerContext="browse">
      <div className="container mx-auto px-4 py-8 max-md:py-6">
        <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-8">
          <Link to="/" className="hover:text-foreground transition-colors">
            Home
          </Link>
          <span>/</span>
          <span className="text-foreground">{heading}</span>
        </nav>

        <div className="mb-8 max-md:mb-6">
          <h1 className="text-3xl lg:text-4xl font-bold tracking-tight mb-2 text-balance max-md:text-2xl">{heading}</h1>
          <p className="text-muted-foreground max-md:text-sm">{subtitle}</p>
        </div>

        {error ? <p className="text-sm text-muted-foreground">Error: {error}</p> : null}

        {!error && filtered.length === 0 ? (
          <div className="py-8 space-y-2 text-sm text-muted-foreground">
            <p>{q ? `No results for “${q}”.` : 'No products in this category yet. Try another collection.'}</p>
            {brand?.toLowerCase() === 'apple' ? (
              <p className="text-xs max-w-lg">
                Apple demo items ship with this repo (Unsplash images, not copied from apple.com). In the{' '}
                <code className="text-foreground/80">server</code> folder run{' '}
                <code className="text-foreground/80">npm run seed:apple</code> — or full{' '}
                <code className="text-foreground/80">npm run seed</code> — then refresh. Ensure the API is running (
                <code className="text-foreground/80">localhost:5000</code>).
              </p>
            ) : null}
          </div>
        ) : null}

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 max-md:gap-3">
          {filtered.map((p) => (
            <ProductCard key={p._id} product={p} />
          ))}
        </div>
      </div>
    </StorefrontLayout>
  )
}

