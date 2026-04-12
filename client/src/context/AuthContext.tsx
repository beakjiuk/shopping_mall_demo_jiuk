import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { apiFetch, setToken } from '../lib/api'
import { mergeGuestCartToServer } from '../lib/guestCart'
import type { User } from '../lib/types'

type AuthState = {
  user: User | null
  loading: boolean
  login: (email: string, password: string) => Promise<User>
  register: (email: string, name: string, password: string, acceptTerms: boolean) => Promise<User>
  updateProfile: (updates: { name: string }) => Promise<void>
  logout: () => void
}

const Ctx = createContext<AuthState | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      try {
        const me = await apiFetch<{ user: User }>('/api/auth/me', { auth: true })
        if (cancelled) return
        if (me.ok) setUser(me.user)
        else setUser(null)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [])

  const login = useCallback(async (email: string, password: string) => {
    const res = await apiFetch<{ token: string; user: User }>('/api/auth/login', {
      method: 'POST',
      body: { email, password },
    })
    if (!res.ok) throw new Error(res.error)
    setToken(res.token)
    setUser(res.user)
    await mergeGuestCartToServer()
    return res.user
  }, [])

  const register = useCallback(async (email: string, name: string, password: string, acceptTerms: boolean) => {
    const res = await apiFetch<{ token: string; user: User }>('/api/auth/register', {
      method: 'POST',
      body: { email, name, password, acceptTerms },
    })
    if (!res.ok) throw new Error(res.error)
    setToken(res.token)
    setUser(res.user)
    await mergeGuestCartToServer()
    return res.user
  }, [])

  const updateProfile = useCallback(async (updates: { name: string }) => {
    const res = await apiFetch<{ user: User }>('/api/auth/me', {
      method: 'PATCH',
      auth: true,
      body: { name: updates.name },
    })
    if (!res.ok) throw new Error(res.error)
    setUser(res.user)
  }, [])

  const logout = useCallback(() => {
    setToken(null)
    setUser(null)
  }, [])

  const value = useMemo<AuthState>(
    () => ({
      user,
      loading,
      login,
      register,
      updateProfile,
      logout,
    }),
    [user, loading, login, register, updateProfile, logout],
  )

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

/** Co-located with AuthProvider for a single import surface. */
// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const v = useContext(Ctx)
  if (!v) throw new Error('AuthProvider missing')
  return v
}

