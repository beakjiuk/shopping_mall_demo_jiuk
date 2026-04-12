"use client"

import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Crown, Heart, Menu, Search, ShoppingBag, User, X } from 'lucide-react'
import Input from './ui/Input'
import { useAuth } from '../context/AuthContext'
import useCartCount from '../hooks/useCartCount'
import useWishlist from '../hooks/useWishlist'
import { catalogNavItems, isCatalogNavActive } from '../lib/catalogNav'
import { apiFetch } from '../lib/api'
import { useMediaQuery } from '../hooks/useMediaQuery'
import type { Product } from '../lib/types'

const ANNOUNCEMENT_DISMISS_KEY = 'ui:announcement:dismissed:v1'

export default function Header() {
  const location = useLocation()
  const nav = useNavigate()
  const { user, loading, logout } = useAuth()
  const cartCount = useCartCount()
  const wishlist = useWishlist()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [bannerDismissed, setBannerDismissed] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [suggestions, setSuggestions] = useState<Product[]>([])
  const [searchBusy, setSearchBusy] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)
  const searchWrapRef = useRef<HTMLDivElement | null>(null)
  const isMd = useMediaQuery('(min-width: 768px)')

  useEffect(() => {
    setIsMenuOpen(false)
  }, [location.pathname, location.search])

  useEffect(() => {
    if (isSearchOpen && !isMd) {
      const prev = document.body.style.overflow
      document.body.style.overflow = 'hidden'
      return () => {
        document.body.style.overflow = prev
      }
    }
  }, [isSearchOpen, isMd])

  useEffect(() => {
    try {
      setBannerDismissed(localStorage.getItem(ANNOUNCEMENT_DISMISS_KEY) === '1')
    } catch {
      setBannerDismissed(false)
    }
  }, [])

  function dismissBanner() {
    setBannerDismissed(true)
    try {
      localStorage.setItem(ANNOUNCEMENT_DISMISS_KEY, '1')
    } catch {
      // ignore write errors (private mode, storage disabled, etc.)
    }
  }

  const trimmed = useMemo(() => searchTerm.trim(), [searchTerm])

  useEffect(() => {
    setActiveIndex(-1)
  }, [trimmed, suggestions.length])

  useEffect(() => {
    if (!isSearchOpen) return
    const q = trimmed
    if (q.length < 2) {
      setSuggestions([])
      setSearchBusy(false)
      return
    }

    const ac = new AbortController()
    setSearchBusy(true)
    const t = window.setTimeout(async () => {
      try {
        const res = await apiFetch<{ products: Product[] }>(
          `/api/products?q=${encodeURIComponent(q)}&limit=8`,
          { signal: ac.signal },
        )
        if (ac.signal.aborted) return
        if (!res.ok) setSuggestions([])
        else setSuggestions(res.products)
      } catch {
        if (!ac.signal.aborted) setSuggestions([])
      } finally {
        if (!ac.signal.aborted) setSearchBusy(false)
      }
    }, 200)

    return () => {
      ac.abort()
      window.clearTimeout(t)
    }
  }, [trimmed, isSearchOpen])

  useEffect(() => {
    if (!isSearchOpen) return
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setIsSearchOpen(false)
        setSuggestions([])
        setActiveIndex(-1)
        return
      }
    }
    function onPointerDown(e: MouseEvent | TouchEvent) {
      if (!isMd) return
      const el = searchWrapRef.current
      if (!el) return
      if (e.target instanceof Node && el.contains(e.target)) return
      setIsSearchOpen(false)
      setSuggestions([])
      setActiveIndex(-1)
    }
    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('mousedown', onPointerDown)
    window.addEventListener('touchstart', onPointerDown)
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('mousedown', onPointerDown)
      window.removeEventListener('touchstart', onPointerDown)
    }
  }, [isSearchOpen, isMd])

  function submitSearch() {
    const q = trimmed
    if (!q) return
    setIsSearchOpen(false)
    setSuggestions([])
    setActiveIndex(-1)
    nav(`/products?q=${encodeURIComponent(q)}`)
  }

  return (
    <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border">
      {!bannerDismissed ? (
        <div className="bg-accent text-accent-foreground py-2 text-sm font-medium relative">
          <div className="container mx-auto px-4 text-center">
            {user && !loading ? (
              <span className="block sm:inline">
                <span className="font-semibold">{user.name}</span>님, 환영합니다!
                <span className="hidden sm:inline"> · </span>
              </span>
            ) : null}
            <span className="block sm:inline">
              <span className="hidden sm:inline">Free Express Shipping on Orders Over $100 | </span>
              <span>New Member 15% Off</span>
            </span>
          </div>

          <button
            type="button"
            onClick={dismissBanner}
            aria-label="Dismiss announcement"
            className="absolute right-3 top-1/2 -translate-y-1/2 inline-flex h-8 w-8 items-center justify-center rounded-lg hover:bg-black/10 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : null}

      <div className="container mx-auto px-4">
        <div className="flex items-center gap-3 h-16 lg:h-20 min-w-0 max-md:gap-1.5 max-md:h-14">
          <div className="flex items-center gap-2 shrink-0 max-md:gap-1">
            <button
              type="button"
              className="lg:hidden inline-flex h-11 w-11 shrink-0 items-center justify-center -ml-1 rounded-lg hover:bg-secondary active:bg-secondary/80"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              aria-label="Toggle menu"
            >
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>

            <Link to="/" className="flex items-center gap-2">
              <span className="text-2xl lg:text-3xl font-bold tracking-tight max-md:text-xl max-md:truncate max-md:max-w-[min(220px,50vw)]">
                LUXE
              </span>
            </Link>
          </div>

          <nav className="hidden lg:flex flex-1 min-w-0 justify-center px-2 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <div className="flex items-center gap-4 xl:gap-8 flex-nowrap">
              {catalogNavItems.map((c) => {
                const active = isCatalogNavActive(c.href, location.pathname, location.search)
                return (
                  <Link
                    key={c.name}
                    to={c.href}
                    className={`text-sm font-medium whitespace-nowrap transition-colors ${
                      active ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {c.name}
                  </Link>
                )
              })}
            </div>
          </nav>

          <div className="flex items-center gap-2 shrink-0 max-md:gap-0.5">
            <button
              type="button"
              className="md:hidden inline-flex h-11 w-11 items-center justify-center rounded-full hover:bg-secondary active:bg-secondary/80"
              onClick={() => setIsSearchOpen(true)}
              aria-label="Search products"
            >
              <Search className="h-5 w-5" />
            </button>

            <div className="hidden md:flex items-center">
              {isSearchOpen ? (
                <div ref={searchWrapRef} className="relative flex items-center gap-2 animate-in slide-in-from-right-5">
                  <form
                    onSubmit={(e) => {
                      e.preventDefault()
                      if (activeIndex >= 0 && activeIndex < suggestions.length) {
                        const p = suggestions[activeIndex]
                        setIsSearchOpen(false)
                        setSuggestions([])
                        setSearchTerm('')
                        setActiveIndex(-1)
                        nav(`/products/${p._id}`)
                        return
                      }
                      submitSearch()
                    }}
                    className="relative"
                  >
                    <Input
                      type="search"
                      placeholder="Search products..."
                      className="w-64 bg-secondary border-0"
                      autoFocus
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'ArrowDown') {
                          e.preventDefault()
                          if (suggestions.length === 0) return
                          setActiveIndex((i) => Math.min(i + 1, suggestions.length - 1))
                        } else if (e.key === 'ArrowUp') {
                          e.preventDefault()
                          if (suggestions.length === 0) return
                          setActiveIndex((i) => Math.max(i - 1, 0))
                        }
                      }}
                    />
                    {suggestions.length > 0 ? (
                      <div className="absolute left-0 right-0 mt-2 rounded-xl border border-border bg-card shadow-lg overflow-hidden">
                        {suggestions.map((p, idx) => (
                          <button
                            key={p._id}
                            type="button"
                            onClick={() => {
                              setIsSearchOpen(false)
                              setSuggestions([])
                              setSearchTerm('')
                              setActiveIndex(-1)
                              nav(`/products/${p._id}`)
                            }}
                            onMouseEnter={() => setActiveIndex(idx)}
                            className={[
                              'w-full text-left px-4 py-3 transition-colors',
                              idx === activeIndex ? 'bg-secondary/60' : 'hover:bg-secondary/50',
                            ].join(' ')}
                          >
                            <p className="text-sm font-medium line-clamp-1">{p.title}</p>
                            <p className="text-xs text-muted-foreground line-clamp-1">
                              {(p.brand ? `${p.brand} · ` : '') + (p.category || '')}
                            </p>
                          </button>
                        ))}
                        <button
                          type="button"
                          onClick={submitSearch}
                          className="w-full text-left px-4 py-3 border-t border-border text-sm text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors"
                        >
                          {searchBusy ? 'Searching…' : `See all results for “${trimmed}”`}
                        </button>
                      </div>
                    ) : searchBusy ? (
                      <div className="absolute left-0 right-0 mt-2 rounded-xl border border-border bg-card shadow-lg px-4 py-3 text-sm text-muted-foreground">
                        Searching…
                      </div>
                    ) : null}
                  </form>
                  <button onClick={() => setIsSearchOpen(false)} aria-label="Close search">
                    <X className="h-5 w-5 text-muted-foreground" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setIsSearchOpen(true)}
                  className="p-2 hover:bg-secondary rounded-full transition-colors"
                  aria-label="Search"
                >
                  <Search className="h-5 w-5" />
                </button>
              )}
            </div>

            {/* Wishlist */}
            <Link
              to="/wishlist"
              className="inline-flex h-11 w-11 md:h-10 md:w-10 items-center justify-center p-0 md:p-2 hover:bg-secondary rounded-full transition-colors active:bg-secondary/80"
              aria-label="Wishlist"
            >
              <Heart className="h-5 w-5" />
              {wishlist.count > 0 ? (
                <span className="sr-only">{wishlist.count} items wishlisted</span>
              ) : null}
            </Link>

            <Link
              to="/cart"
              className="relative inline-flex h-11 w-11 md:h-10 md:w-10 items-center justify-center rounded-full hover:bg-secondary transition-colors active:bg-secondary/80"
              aria-label="Cart"
            >
              <ShoppingBag className="h-5 w-5" />
              {cartCount > 0 ? (
                <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-accent text-accent-foreground text-xs flex items-center justify-center font-semibold">
                  {cartCount}
                </span>
              ) : null}
            </Link>

            {/* Account - moved to the end */}
            <Link
              to={user ? '/account' : '/login'}
              className="inline-flex h-11 w-11 md:h-10 md:w-10 items-center justify-center p-0 md:p-2 hover:bg-secondary rounded-full transition-colors active:bg-secondary/80"
              aria-label={user ? 'Account settings' : 'Sign in'}
            >
              <User className="h-5 w-5" />
            </Link>

            {/* Admin (placed right next to auth action) */}
            {!loading && user?.role === 'admin' ? (
              <Link
                to="/admin"
                className="inline-flex h-11 w-11 md:h-10 md:w-10 items-center justify-center p-0 md:p-2 hover:bg-secondary rounded-full transition-colors active:bg-secondary/80"
                aria-label="Admin dashboard"
                title="Admin"
              >
                <Crown className="h-5 w-5" />
              </Link>
            ) : null}

            {!loading ? (
              user ? (
                <button onClick={logout} className="hidden sm:inline text-sm text-muted-foreground hover:text-foreground px-2">
                  Log out
                </button>
              ) : (
                <Link to="/login" className="hidden sm:inline text-sm text-muted-foreground hover:text-foreground px-2">
                  Sign in
                </Link>
              )
            ) : null}
          </div>
        </div>

        {isMenuOpen ? (
          <nav className="lg:hidden py-3 border-t border-border animate-in slide-in-from-top-5">
            <div className="flex flex-col gap-0.5 pb-[env(safe-area-inset-bottom,0px)]">
              <button
                type="button"
                className="text-left text-base font-medium text-foreground py-3.5 px-1 rounded-lg hover:bg-secondary/60 active:bg-secondary/40"
                onClick={() => {
                  setIsMenuOpen(false)
                  setIsSearchOpen(true)
                }}
              >
                Search products…
              </button>
              {!loading && user ? (
                <Link
                  to="/account"
                  className="text-base font-medium text-foreground py-3.5 px-1 rounded-lg hover:bg-secondary/60"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Account settings
                </Link>
              ) : null}
              {!loading && user?.role === 'admin' ? (
                <Link
                  to="/admin"
                  className="text-base font-medium text-foreground py-3.5 px-1 rounded-lg hover:bg-secondary/60"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Admin dashboard
                </Link>
              ) : null}
              {!loading && user ? (
                <button
                  type="button"
                  className="text-left text-base font-medium text-muted-foreground py-3.5 px-1 rounded-lg hover:bg-secondary/60"
                  onClick={() => {
                    setIsMenuOpen(false)
                    logout()
                  }}
                >
                  Log out
                </button>
              ) : (
                <Link
                  to="/login"
                  className="text-base font-medium text-foreground py-3.5 px-1 rounded-lg hover:bg-secondary/60"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Sign in
                </Link>
              )}
              {catalogNavItems.map((c) => {
                const active = isCatalogNavActive(c.href, location.pathname, location.search)
                return (
                  <Link
                    key={c.name}
                    to={c.href}
                    className={`text-base font-medium py-3.5 px-1 rounded-lg transition-colors ${
                      active ? 'text-foreground bg-secondary/40' : 'text-muted-foreground hover:text-foreground hover:bg-secondary/40'
                    }`}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    {c.name}
                  </Link>
                )
              })}
            </div>
          </nav>
        ) : null}
      </div>

      {isSearchOpen && !isMd ? (
        <div className="fixed inset-0 z-[100] flex flex-col bg-background md:hidden pt-[env(safe-area-inset-top,0px)]">
          <div className="flex items-center gap-2 border-b border-border px-3 py-3 shrink-0">
            <form
              className="relative flex-1 min-w-0"
              onSubmit={(e) => {
                e.preventDefault()
                if (activeIndex >= 0 && activeIndex < suggestions.length) {
                  const p = suggestions[activeIndex]
                  setIsSearchOpen(false)
                  setSuggestions([])
                  setSearchTerm('')
                  setActiveIndex(-1)
                  nav(`/products/${p._id}`)
                  return
                }
                submitSearch()
              }}
            >
              <Input
                type="search"
                placeholder="Search products…"
                className="w-full bg-secondary border-0 h-11 text-base"
                autoFocus
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'ArrowDown') {
                    e.preventDefault()
                    if (suggestions.length === 0) return
                    setActiveIndex((i) => Math.min(i + 1, suggestions.length - 1))
                  } else if (e.key === 'ArrowUp') {
                    e.preventDefault()
                    if (suggestions.length === 0) return
                    setActiveIndex((i) => Math.max(i - 1, 0))
                  }
                }}
              />
            </form>
            <button
              type="button"
              className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-lg hover:bg-secondary"
              aria-label="Close search"
              onClick={() => {
                setIsSearchOpen(false)
                setSuggestions([])
                setActiveIndex(-1)
              }}
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto overscroll-contain px-3 pb-[env(safe-area-inset-bottom,0px)]">
            {suggestions.length > 0 ? (
              <div className="mt-2 rounded-xl border border-border bg-card shadow-lg overflow-hidden divide-y divide-border">
                {suggestions.map((p, idx) => (
                  <button
                    key={p._id}
                    type="button"
                    onClick={() => {
                      setIsSearchOpen(false)
                      setSuggestions([])
                      setSearchTerm('')
                      setActiveIndex(-1)
                      nav(`/products/${p._id}`)
                    }}
                    className={[
                      'w-full text-left px-4 py-3.5 min-h-[3.25rem] transition-colors',
                      idx === activeIndex ? 'bg-secondary/60' : 'hover:bg-secondary/50 active:bg-secondary/40',
                    ].join(' ')}
                  >
                    <p className="text-sm font-medium line-clamp-2">{p.title}</p>
                    <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                      {(p.brand ? `${p.brand} · ` : '') + (p.category || '')}
                    </p>
                  </button>
                ))}
                <button
                  type="button"
                  onClick={submitSearch}
                  className="w-full text-left px-4 py-3.5 text-sm text-muted-foreground hover:text-foreground hover:bg-secondary/50 min-h-[3.25rem]"
                >
                  {searchBusy ? 'Searching…' : `See all results for “${trimmed}”`}
                </button>
              </div>
            ) : searchBusy ? (
              <p className="mt-6 text-center text-sm text-muted-foreground">Searching…</p>
            ) : trimmed.length >= 2 ? (
              <p className="mt-6 text-center text-sm text-muted-foreground">No matches. Try another keyword.</p>
            ) : (
              <p className="mt-6 text-center text-sm text-muted-foreground">Type at least 2 characters.</p>
            )}
          </div>
        </div>
      ) : null}
    </header>
  )
}

