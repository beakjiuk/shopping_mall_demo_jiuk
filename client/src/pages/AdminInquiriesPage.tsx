import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { MessageCircle, RefreshCw, SendHorizonal } from 'lucide-react'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import { apiFetch } from '../lib/api'
import type { Inquiry } from '../lib/types'

type AdminInquiriesResp = { inquiries: Inquiry[]; page: number; limit: number; total: number }

const statuses = [
  { value: 'all', label: 'All' },
  { value: 'open', label: 'Open' },
  { value: 'answered', label: 'Answered' },
  { value: 'closed', label: 'Closed' },
] as const

type InquiryStatusFilter = (typeof statuses)[number]['value']

function isInquiryStatusFilter(v: string): v is InquiryStatusFilter {
  return statuses.some((s) => s.value === v)
}

function ticketRef(id: string) {
  return `TCK-${id.slice(-8).toUpperCase()}`
}

function orderRef(orderNumber?: string) {
  const v = (orderNumber || '').trim()
  return v ? v : ''
}

export default function AdminInquiriesPage() {
  const [items, setItems] = useState<Inquiry[]>([])
  const [selected, setSelected] = useState<Inquiry | null>(null)
  const [filter, setFilter] = useState<InquiryStatusFilter>('all')
  const [reply, setReply] = useState('')
  const [busy, setBusy] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const selectedRef = useRef(selected)
  selectedRef.current = selected

  const query = useMemo(() => {
    const p = new URLSearchParams()
    p.set('page', '1')
    p.set('limit', '50')
    if (filter !== 'all') p.set('status', filter)
    return p.toString()
  }, [filter])

  const load = useCallback(async () => {
    setLoading(true)
    const res = await apiFetch<AdminInquiriesResp>(`/api/admin/inquiries?${query}`, { auth: true })
    if (!res.ok) {
      setError(res.error)
      setItems([])
    } else {
      setError(null)
      setItems(res.inquiries)
      const sel = selectedRef.current
      if (sel) {
        const updated = res.inquiries.find((i) => i._id === sel._id)
        if (updated) setSelected(updated)
      }
    }
    setLoading(false)
  }, [query])

  useEffect(() => {
    void load()
  }, [load])

  async function openTicket(id: string) {
    const res = await apiFetch<{ inquiry: Inquiry }>(`/api/admin/inquiries/${id}`, { auth: true })
    if (!res.ok) {
      alert(res.error)
      return
    }
    setSelected(res.inquiry)
  }

  async function sendReply() {
    if (!selected || !reply.trim()) return
    setBusy(true)
    try {
      const res = await apiFetch<{ inquiry: Inquiry }>(`/api/admin/inquiries/${selected._id}/reply`, {
        method: 'POST',
        auth: true,
        body: { body: reply.trim() },
      })
      if (!res.ok) throw new Error(res.error)
      setReply('')
      setSelected(res.inquiry)
      setItems((prev) => prev.map((i) => (i._id === res.inquiry._id ? res.inquiry : i)))
    } catch (e) {
      alert(String(e))
    } finally {
      setBusy(false)
    }
  }

  async function setStatus(status: Inquiry['status']) {
    if (!selected) return
    setBusy(true)
    try {
      const res = await apiFetch<{ inquiry: Inquiry }>(`/api/admin/inquiries/${selected._id}`, {
        method: 'PATCH',
        auth: true,
        body: { status },
      })
      if (!res.ok) throw new Error(res.error)
      setSelected(res.inquiry)
      setItems((prev) => prev.map((i) => (i._id === res.inquiry._id ? res.inquiry : i)))
    } catch (e) {
      alert(String(e))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-border bg-card p-5 md:p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold">Inquiries</h2>
            <p className="text-sm text-muted-foreground mt-1">Respond to customer 1:1 inquiries.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={filter}
              onChange={(e) => {
                const v = e.target.value
                if (isInquiryStatusFilter(v)) setFilter(v)
              }}
              className="h-10 rounded-xl border border-border bg-background px-3 text-sm"
            >
              {statuses.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
            <Button variant="outline" onClick={load} disabled={loading}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>

        {error ? (
          <div className="mt-4 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3">
            <p className="text-sm text-destructive font-medium">Error</p>
            <p className="text-sm text-muted-foreground">{error}</p>
          </div>
        ) : null}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_520px] gap-6">
        <div className="rounded-xl border border-border bg-card p-5 md:p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <MessageCircle className="h-4 w-4 text-muted-foreground" />
            <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Ticket list</h3>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-16 rounded-xl border border-border bg-background animate-pulse" />
              ))}
            </div>
          ) : items.length === 0 ? (
            <p className="text-sm text-muted-foreground">No inquiries.</p>
          ) : (
            <div className="space-y-3">
              {items.map((t) => (
                <button
                  key={t._id}
                  onClick={() => openTicket(t._id)}
                  className={[
                    'w-full text-left rounded-xl border px-4 py-3 transition-colors',
                    selected?._id === t._id
                      ? 'border-accent/40 bg-secondary/40'
                      : 'border-border/70 bg-background hover:bg-secondary/30',
                  ].join(' ')}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-mono text-xs text-muted-foreground">{ticketRef(t._id)}</p>
                      <p className="mt-1 text-sm font-semibold line-clamp-1">{t.subject}</p>
                        {orderRef(t.orderNumber) ? (
                          <p className="mt-1 text-xs font-mono text-muted-foreground">Order: {orderRef(t.orderNumber)}</p>
                        ) : null}
                      <p className="mt-1 text-xs text-muted-foreground">
                        {new Date(t.createdAt).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}
                      </p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="text-xs text-muted-foreground">status</p>
                      <p className="text-sm font-semibold">{t.status}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-xl border border-border bg-card p-5 md:p-6 shadow-sm h-fit">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-4">Conversation</h3>
          {!selected ? (
            <p className="text-sm text-muted-foreground">Select a ticket to reply.</p>
          ) : (
            <div className="space-y-4">
              <div className="rounded-lg border border-border/70 bg-background px-4 py-3">
                <p className="text-xs text-muted-foreground font-mono">{ticketRef(selected._id)}</p>
                <p className="text-sm font-semibold mt-1">{selected.subject}</p>
                <p className="text-xs text-muted-foreground mt-1">User: {selected.userId.slice(-8).toUpperCase()}</p>
                {orderRef(selected.orderNumber) ? (
                  <p className="text-xs text-muted-foreground mt-1">
                    Order: <span className="font-mono text-foreground/90">{orderRef(selected.orderNumber)}</span>
                  </p>
                ) : null}
                <div className="flex flex-wrap gap-2 mt-3">
                  <Button variant="outline" size="sm" disabled={busy} onClick={() => setStatus('open')}>
                    Mark open
                  </Button>
                  <Button variant="outline" size="sm" disabled={busy} onClick={() => setStatus('answered')}>
                    Mark answered
                  </Button>
                  <Button variant="outline" size="sm" disabled={busy} onClick={() => setStatus('closed')}>
                    Close
                  </Button>
                </div>
              </div>

              <div className="rounded-xl border border-border/70 bg-background p-4 max-h-[420px] overflow-auto space-y-3">
                {selected.messages.map((m, idx) => {
                  const mine = m.role === 'admin'
                  return (
                    <div key={idx} className={['flex', mine ? 'justify-end' : 'justify-start'].join(' ')}>
                      <div
                        className={[
                          'max-w-[85%] rounded-2xl px-4 py-2 text-sm border',
                          mine ? 'bg-secondary border-border' : 'bg-card border-border/70',
                        ].join(' ')}
                      >
                        <p className="whitespace-pre-wrap">{m.body}</p>
                        <p className="mt-1 text-[11px] text-muted-foreground">
                          {m.role} ·{' '}
                          {new Date(m.createdAt).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium">Reply</label>
                <Input
                  value={reply}
                  onChange={(e) => setReply(e.target.value)}
                  className="h-11 bg-background"
                  placeholder="Write a reply…"
                />
                <Button onClick={sendReply} disabled={busy || !reply.trim()} className="w-full h-11">
                  <SendHorizonal className="h-4 w-4 mr-2" />
                  Send reply
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

