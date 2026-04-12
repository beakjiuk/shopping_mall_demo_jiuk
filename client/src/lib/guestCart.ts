import { apiFetch } from './api'

const KEY = 'luxe_guest_cart'

export type GuestCartLine = { productId: string; quantity: number; size?: string }

function lineKey(l: Pick<GuestCartLine, 'productId' | 'size'>) {
  return `${l.productId}::${(l.size || '').trim()}`
}

function parse(): GuestCartLine[] {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return []
    const j = JSON.parse(raw) as unknown
    if (!Array.isArray(j)) return []
    return j.filter(
      (x): x is GuestCartLine =>
        Boolean(x) &&
        typeof (x as GuestCartLine).productId === 'string' &&
        typeof (x as GuestCartLine).quantity === 'number' &&
        (x as GuestCartLine).quantity > 0,
    )
  } catch {
    return []
  }
}

function persist(lines: GuestCartLine[]) {
  if (lines.length === 0) localStorage.removeItem(KEY)
  else localStorage.setItem(KEY, JSON.stringify(lines))
  window.dispatchEvent(new CustomEvent('guest-cart-change'))
}

export function getGuestCartLines(): GuestCartLine[] {
  return parse()
}

export function guestCartTotalQuantity(): number {
  return parse().reduce((acc, l) => acc + l.quantity, 0)
}

export function addToGuestCart(productId: string, quantity: number, size = '') {
  const sizeNorm = size.trim()
  const lines = parse()
  const idx = lines.findIndex((l) => lineKey(l) === lineKey({ productId, size: sizeNorm }))
  if (idx >= 0) lines[idx].quantity += quantity
  else lines.push({ productId, quantity, size: sizeNorm || undefined })
  persist(lines)
}

export function setGuestCartQuantity(productId: string, quantity: number, size = '') {
  const sizeNorm = size.trim()
  const lines = parse()
  const idx = lines.findIndex((l) => lineKey(l) === lineKey({ productId, size: sizeNorm }))
  if (quantity < 1) {
    if (idx >= 0) lines.splice(idx, 1)
  } else if (idx >= 0) {
    lines[idx].quantity = quantity
  } else {
    lines.push({ productId, quantity, size: sizeNorm || undefined })
  }
  persist(lines)
}

export function removeGuestCartItem(productId: string, size = '') {
  const sizeNorm = size.trim()
  persist(parse().filter((l) => lineKey(l) !== lineKey({ productId, size: sizeNorm })))
}

export function clearGuestCart() {
  localStorage.removeItem(KEY)
  window.dispatchEvent(new CustomEvent('guest-cart-change'))
}

/** Push guest lines to the server cart (caller must have JWT set). Removes lines that synced; keeps failed lines in guest storage. */
export async function mergeGuestCartToServer(): Promise<void> {
  const lines = parse()
  if (lines.length === 0) return
  const remaining: GuestCartLine[] = []
  for (const { productId, quantity, size } of lines) {
    const res = await apiFetch<Record<string, never>>('/api/cart/items', {
      method: 'POST',
      auth: true,
      body: { productId, quantity, size: size || '' },
    })
    if (!res.ok) {
      console.warn('mergeGuestCartToServer failed for', productId, res.error)
      remaining.push({ productId, quantity, size })
    }
  }
  persist(remaining)
}
