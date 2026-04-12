import { useCallback, useEffect, useMemo, useState } from 'react'

const KEY = 'wishlist_product_ids'

function readIds(): string[] {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return []
    return parsed.filter((x): x is string => typeof x === 'string')
  } catch {
    return []
  }
}

function writeIds(ids: string[]) {
  localStorage.setItem(KEY, JSON.stringify(ids))
  window.dispatchEvent(new Event('wishlist:changed'))
}

export default function useWishlist() {
  const [ids, setIds] = useState<string[]>([])

  useEffect(() => {
    const sync = () => setIds(readIds())
    sync()
    window.addEventListener('storage', sync)
    window.addEventListener('wishlist:changed', sync)
    return () => {
      window.removeEventListener('storage', sync)
      window.removeEventListener('wishlist:changed', sync)
    }
  }, [])

  const set = useCallback((next: string[]) => {
    writeIds(next)
    setIds(next)
  }, [])

  const toggle = useCallback((id: string) => {
    setIds((prev) => {
      const next = prev.includes(id) ? prev.filter((x) => x !== id) : [id, ...prev]
      writeIds(next)
      return next
    })
  }, [])

  const clear = useCallback(() => {
    writeIds([])
    setIds([])
  }, [])

  const api = useMemo(() => {
    const idSet = new Set(ids)
    return {
      ids,
      count: ids.length,
      has(id: string) {
        return idSet.has(id)
      },
      toggle,
      clear,
      set,
    }
  }, [ids, set, toggle, clear])

  return api
}

