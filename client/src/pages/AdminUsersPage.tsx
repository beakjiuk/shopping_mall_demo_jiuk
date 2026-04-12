import { useCallback, useEffect, useMemo, useState } from 'react'
import { Shield, UserCog } from 'lucide-react'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import { apiFetch } from '../lib/api'
import type { AdminUser } from '../lib/types'

type AdminUsersResp = { users: AdminUser[]; page: number; limit: number; total: number }

function userRef(id: string) {
  return `USR-${id.slice(-8).toUpperCase()}`
}

export default function AdminUsersPage() {
  const [q, setQ] = useState('')
  const [query, setQuery] = useState('')
  const [items, setItems] = useState<AdminUser[]>([])
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const url = useMemo(() => {
    const p = new URLSearchParams()
    p.set('page', '1')
    p.set('limit', '50')
    if (query.trim()) p.set('q', query.trim())
    return `/api/admin/users?${p.toString()}`
  }, [query])

  const load = useCallback(async () => {
    setLoading(true)
    const res = await apiFetch<AdminUsersResp>(url, { auth: true })
    if (!res.ok) {
      setError(res.error)
      setItems([])
    } else {
      setError(null)
      setItems(res.users)
    }
    setLoading(false)
  }, [url])

  useEffect(() => {
    void load()
  }, [load])

  async function patchUser(id: string, patch: Partial<Pick<AdminUser, 'role' | 'disabled'>>) {
    setBusyId(id)
    try {
      const res = await apiFetch<{ user: AdminUser }>(`/api/admin/users/${id}`, {
        method: 'PATCH',
        auth: true,
        body: patch,
      })
      if (!res.ok) throw new Error(res.error)
      setItems((prev) => prev.map((u) => (u._id === res.user._id ? res.user : u)))
    } catch (e) {
      alert(String(e))
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-border bg-card p-5 md:p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold">Users</h2>
            <p className="text-sm text-muted-foreground mt-1">Manage user roles and disable accounts.</p>
          </div>
          <form
            onSubmit={(e) => {
              e.preventDefault()
              setQuery(q)
            }}
            className="flex gap-2"
          >
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search name or email…"
              className="h-10 bg-background w-64"
            />
            <Button type="submit" variant="outline">
              Search
            </Button>
          </form>
        </div>

        {error ? (
          <div className="mt-4 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3">
            <p className="text-sm text-destructive font-medium">Error</p>
            <p className="text-sm text-muted-foreground">{error}</p>
          </div>
        ) : null}
      </div>

      <div className="rounded-xl border border-border bg-card p-5 md:p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <UserCog className="h-4 w-4 text-muted-foreground" />
          <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">User list</h3>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-16 rounded-xl border border-border bg-background animate-pulse" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <p className="text-sm text-muted-foreground">No users found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-muted-foreground border-b border-border">
                  <th className="py-2 pr-4 font-medium">User</th>
                  <th className="py-2 pr-4 font-medium">Role</th>
                  <th className="py-2 pr-4 font-medium">Status</th>
                  <th className="py-2 pr-4 font-medium">Created</th>
                  <th className="py-2 pr-4 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.map((u) => {
                  const busy = busyId === u._id
                  return (
                    <tr key={u._id} className="border-b border-border/60 last:border-b-0">
                      <td className="py-3 pr-4">
                        <p className="font-medium text-foreground/90 line-clamp-1">{u.name}</p>
                        <p className="text-xs text-muted-foreground">{u.email}</p>
                        <p className="text-[11px] text-muted-foreground font-mono">{userRef(u._id)}</p>
                      </td>
                      <td className="py-3 pr-4">
                        <span className="inline-flex items-center gap-2">
                          {u.role === 'admin' ? <Shield className="h-4 w-4 text-accent" /> : null}
                          <span className="font-medium">{u.role}</span>
                        </span>
                      </td>
                      <td className="py-3 pr-4">
                        <span
                          className={[
                            'inline-flex rounded-full border px-2.5 py-0.5 text-xs font-medium',
                            u.disabled
                              ? 'bg-destructive/10 text-destructive border-destructive/25'
                              : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/25',
                          ].join(' ')}
                        >
                          {u.disabled ? 'disabled' : 'active'}
                        </span>
                      </td>
                      <td className="py-3 pr-4 text-muted-foreground">
                        {new Date(u.createdAt).toLocaleDateString(undefined, { dateStyle: 'medium' })}
                      </td>
                      <td className="py-3 pr-4">
                        <div className="flex justify-end gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={busy}
                            onClick={() => patchUser(u._id, { role: u.role === 'admin' ? 'user' : 'admin' })}
                          >
                            Toggle role
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={busy}
                            onClick={() => patchUser(u._id, { disabled: !u.disabled })}
                          >
                            {u.disabled ? 'Enable' : 'Disable'}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

