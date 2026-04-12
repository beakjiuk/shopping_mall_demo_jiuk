import { useCallback, useEffect, useRef, useState } from 'react'
import { MessageCircle, SendHorizonal } from 'lucide-react'
import StorefrontLayout from '../components/StorefrontLayout'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import { apiFetch } from '../lib/api'
import type { Inquiry } from '../lib/types'

export default function InquiriesPage() {
  const [items, setItems] = useState<Inquiry[]>([])
  const [selected, setSelected] = useState<Inquiry | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')

  const selectedRef = useRef(selected)
  selectedRef.current = selected

  const load = useCallback(async () => {
    setLoading(true)
    const res = await apiFetch<{ inquiries: Inquiry[] }>('/api/inquiries', { auth: true })
    if (!res.ok) {
      setError(res.error)
      setItems([])
      setSelected(null)
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
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  async function create(e: React.FormEvent) {
    e.preventDefault()
    if (!subject.trim() || !body.trim()) return
    setBusy(true)
    try {
      const res = await apiFetch<{ inquiry: Inquiry }>('/api/inquiries', {
        method: 'POST',
        auth: true,
        body: { subject: subject.trim(), body: body.trim() },
      })
      if (!res.ok) throw new Error(res.error)
      setSubject('')
      setBody('')
      setSelected(res.inquiry)
      await load()
    } catch (e2) {
      alert(String(e2))
    } finally {
      setBusy(false)
    }
  }

  return (
    <StorefrontLayout footerContext="inquiries">
      <div className="flex-1 flex flex-col">
        <div className="border-b border-border bg-gradient-to-b from-secondary/40 to-background">
          <div className="container mx-auto px-4 py-12 md:py-16">
            <p className="text-sm font-medium text-accent mb-2 flex items-center gap-2">
              <MessageCircle className="h-4 w-4" />
              Support
            </p>
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight">1:1 Inquiries</h1>
            <p className="text-muted-foreground mt-2 max-w-xl">Ask questions about orders, products, or your account.</p>
          </div>
        </div>

        <div className="container mx-auto px-4 py-10 md:py-14">
          {error ? (
            <div className="max-w-lg rounded-xl border border-destructive/30 bg-destructive/5 px-6 py-8">
              <p className="font-semibold text-destructive mb-2">Could not load inquiries</p>
              <p className="text-sm text-muted-foreground">{error}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_420px] gap-6">
              <section className="rounded-xl border border-border bg-card p-5 md:p-6 shadow-sm">
                <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-4">Your tickets</h2>
                {loading ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="h-16 rounded-xl border border-border bg-background animate-pulse" />
                    ))}
                  </div>
                ) : items.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No inquiries yet. Create one on the right.</p>
                ) : (
                  <div className="space-y-3">
                    {items.map((t) => (
                      <button
                        key={t._id}
                        onClick={() => setSelected(t)}
                        className={[
                          'w-full text-left rounded-xl border px-4 py-3 transition-colors',
                          selected?._id === t._id
                            ? 'border-accent/40 bg-secondary/40'
                            : 'border-border/70 bg-background hover:bg-secondary/30',
                        ].join(' ')}
                      >
                        <p className="text-sm font-semibold line-clamp-1">{t.subject}</p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {t.status} ·{' '}
                          {new Date(t.createdAt).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}
                        </p>
                      </button>
                    ))}
                  </div>
                )}

                {selected ? (
                  <div className="mt-6 rounded-xl border border-border/70 bg-background p-4">
                    <p className="text-sm font-semibold">{selected.subject}</p>
                    <div className="mt-3 space-y-2">
                      {selected.messages.map((m, idx) => (
                        <div key={idx} className="rounded-lg border border-border/60 bg-card px-3 py-2">
                          <p className="text-sm whitespace-pre-wrap">{m.body}</p>
                          <p className="mt-1 text-[11px] text-muted-foreground">
                            {m.role} ·{' '}
                            {new Date(m.createdAt).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}
              </section>

              <aside className="rounded-xl border border-border bg-card p-5 md:p-6 shadow-sm h-fit">
                <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-4">Create inquiry</h2>
                <form onSubmit={create} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Subject</label>
                    <Input value={subject} onChange={(e) => setSubject(e.target.value)} className="h-11 bg-background" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Message</label>
                    <textarea
                      value={body}
                      onChange={(e) => setBody(e.target.value)}
                      rows={5}
                      className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/40"
                    />
                  </div>
                  <Button type="submit" disabled={busy || !subject.trim() || !body.trim()} className="w-full h-11">
                    <SendHorizonal className="h-4 w-4 mr-2" />
                    {busy ? 'Sending…' : 'Submit inquiry'}
                  </Button>
                </form>
              </aside>
            </div>
          )}
        </div>
      </div>
    </StorefrontLayout>
  )
}

