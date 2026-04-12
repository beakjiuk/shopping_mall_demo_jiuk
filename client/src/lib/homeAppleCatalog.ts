import type { Product } from './types'

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

/** Home “Featured” grid: up to 8 items, Apple limited to spotlight pair, stable catalog order. */
export function pickHomeFeaturedProducts(catalog: Product[]): Product[] {
  const homeApple = pickHomeAppleProducts(catalog)
  const allowedAppleIds = new Set(homeApple.map((p) => p._id))
  const filtered = catalog.filter((p) => !isAppleBrand(p) || allowedAppleIds.has(p._id))
  const nonApple = filtered.filter((p) => !isAppleBrand(p))
  const order = new Map(catalog.map((p, i) => [p._id, i]))
  nonApple.sort((a, b) => (order.get(a._id) ?? 0) - (order.get(b._id) ?? 0))
  const nonSlots = Math.max(0, 8 - homeApple.length)
  return [...nonApple.slice(0, nonSlots), ...homeApple].slice(0, 8)
}
