/** 어드민 상품 등록 시 선택값 — `ProductsPage` 필터·헤더 네비와 맞출 것 */
export const ADMIN_PRODUCT_CATEGORIES = ['Electronics', 'Fashion', 'Home', 'Accessories', 'Other'] as const

/** Header /products links — must match ProductsPage filter logic */
export const catalogNavItems = [
  { name: 'New Arrivals', href: '/products?section=new' },
  { name: 'Best Sellers', href: '/products?section=bestsellers' },
  { name: 'Apple', href: '/products?brand=Apple' },
  { name: 'Electronics', href: '/products?category=Electronics' },
  { name: 'Fashion', href: '/products?category=Fashion' },
  { name: 'Home & Living', href: '/products?category=Home' },
] as const

export function isCatalogNavActive(href: string, pathname: string, search: string): boolean {
  if (pathname !== '/products') return false
  const target = new URL(href, 'http://local')
  const a = new URLSearchParams(search.startsWith('?') ? search.slice(1) : search)
  const b = new URLSearchParams(target.search)
  if (b.toString() === '') return a.toString() === ''
  for (const [k, v] of b) {
    if (a.get(k) !== v) return false
  }
  return true
}

export function catalogPageHeading(
  section: string | null,
  category: string | null,
  brand: string | null,
  appleSpotlight: boolean,
): string {
  if (appleSpotlight) return 'iPhone & MacBook Air'
  if (brand === 'Apple') return 'Apple'
  if (brand) return brand
  if (section === 'new') return 'New Arrivals'
  if (section === 'bestsellers') return 'Best Sellers'
  if (category === 'Electronics') return 'Electronics'
  if (category === 'Fashion') return 'Fashion'
  if (category === 'Home') return 'Home & Living'
  return 'All Products'
}

export function catalogPageSubtitle(
  section: string | null,
  category: string | null,
  brand: string | null,
  appleSpotlight: boolean,
): string {
  if (appleSpotlight) return 'The two Apple lines we feature on the home page—nothing else mixed in here.'
  if (brand === 'Apple')
    return 'Clean hardware, quiet software, zero clutter—the devices you know, with the LUXE treatment.'
  if (brand) return `Shop ${brand} at LUXE`
  if (section === 'new') return 'The latest drops, curated for you'
  if (section === 'bestsellers') return 'Customer favorites flying off the shelves'
  if (category === 'Electronics') return 'Tech, audio, optics & more'
  if (category === 'Fashion') return 'Apparel & style essentials'
  if (category === 'Home') return 'Kitchen, wellness & everyday living'
  return 'Discover our curated collection of products'
}
