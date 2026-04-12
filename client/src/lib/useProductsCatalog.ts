import useSWR from 'swr'
import { resolveApiUrl } from './api'
import type { Product } from './types'

const swrOpts = {
  revalidateOnFocus: false,
  dedupingInterval: 5000,
  errorRetryCount: 2,
  shouldRetryOnError: true,
}

async function getOkJson<T extends { ok?: boolean }>(url: string): Promise<T> {
  const r = await fetch(resolveApiUrl(url))
  if (!r.ok) throw new Error(`HTTP ${r.status}`)
  const j = (await r.json()) as T
  if (!j.ok) throw new Error((j as { error?: string }).error || 'FAILED')
  return j
}

/** Shared across home grid, product list, and product detail (related). Deduplicates in-flight requests. */
export function useProductsCatalog() {
  return useSWR<Product[]>(
    '/api/products',
    async (url) => {
      const j = await getOkJson<{ ok: true; products: Product[] }>(url)
      return j.products
    },
    swrOpts,
  )
}

export function useProductDetail(id: string | undefined) {
  return useSWR<Product>(
    id ? `/api/products/${id}` : null,
    async (url) => {
      const j = await getOkJson<{ ok: true; product: Product }>(url)
      return j.product
    },
    swrOpts,
  )
}
