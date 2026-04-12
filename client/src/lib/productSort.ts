import type { Product } from './types'

/** Newest first; tie-breaker `_id` for stable ordering when timestamps match. */
export function sortProductsNewestFirst(products: Product[]): Product[] {
  function timeMs(p: Product): number {
    if (!p.createdAt) return 0
    const t = new Date(p.createdAt).getTime()
    return Number.isFinite(t) ? t : 0
  }
  return [...products].sort((a, b) => {
    const ta = timeMs(a)
    const tb = timeMs(b)
    if (tb !== ta) return tb - ta
    return String(b._id).localeCompare(String(a._id))
  })
}
