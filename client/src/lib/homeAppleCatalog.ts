import type { Product } from './types'
import { sortProductsNewestFirst } from './productSort'

export function isAppleBrand(p: Product): boolean {
  return (p.brand || '').toLowerCase() === 'apple'
}

/** Apple catalog items that are iPhone or MacBook Air (for /products?appleSpotlight=1). */
export function isAppleSpotlightProduct(p: Product): boolean {
  if (!isAppleBrand(p)) return false
  const t = p.title.toLowerCase()
  return t.includes('iphone') || t.includes('macbook air')
}

/**
 * Home grid: at most one iPhone and one MacBook Air (first match each in API order),
 * never iPad / Watch / AirPods / etc.
 */
export function pickHomeAppleProducts(catalog: Product[]): Product[] {
  const apple = catalog.filter(isAppleBrand)
  const iphone = apple.find((p) => p.title.toLowerCase().includes('iphone'))
  const macAir = apple.find((p) => p.title.toLowerCase().includes('macbook air'))
  const out: Product[] = []
  if (iphone) out.push(iphone)
  if (macAir) out.push(macAir)
  return out
}

/** Curated picks when the grid is not filled by `featuredHome` pins. */
function pickHomeFeaturedCurated(catalog: Product[]): Product[] {
  const homeApple = pickHomeAppleProducts(catalog)
  const allowedAppleIds = new Set(homeApple.map((p) => p._id))
  const filtered = catalog.filter((p) => !isAppleBrand(p) || allowedAppleIds.has(p._id))
  const nonApple = filtered.filter((p) => !isAppleBrand(p))
  const order = new Map(catalog.map((p, i) => [p._id, i]))
  nonApple.sort((a, b) => (order.get(a._id) ?? 0) - (order.get(b._id) ?? 0))
  const nonSlots = Math.max(0, 8 - homeApple.length)
  return [...nonApple.slice(0, nonSlots), ...homeApple].slice(0, 8)
}

/**
 * Home “Featured” grid: up to 8 items.
 * Products with `featuredHome` are listed first (newest among pins), then the usual Apple + catalog curation.
 */
export function pickHomeFeaturedProducts(catalog: Product[]): Product[] {
  const pinned = sortProductsNewestFirst(catalog.filter((p) => p.featuredHome)).slice(0, 8)
  const pinnedIds = new Set(pinned.map((p) => p._id))
  if (pinned.length >= 8) return pinned
  const remainder = catalog.filter((p) => !pinnedIds.has(p._id))
  const filler = pickHomeFeaturedCurated(remainder)
  const out: Product[] = [...pinned]
  const seen = pinnedIds
  for (const p of filler) {
    if (out.length >= 8) break
    if (seen.has(p._id)) continue
    out.push(p)
    seen.add(p._id)
  }
  return out
}
