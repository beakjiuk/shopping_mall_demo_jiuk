import { useCallback, useEffect, useRef, useState } from 'react'
import { MessageCircle, SendHorizonal, X } from 'lucide-react'
import StorefrontLayout from '../components/StorefrontLayout'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import { apiFetch } from '../lib/api'
import type { Inquiry } from '../lib/types'

function ModalShell({
  title,
  children,
  onClose,
}: {
  title: string
  children: React.ReactNode
  onClose: () => void
}) {
  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [])

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center sm:items-center p-0 sm:p-4 bg-black/55 backdrop-blur-sm"
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="inquiry-modal-title"
        className="w-full sm:max-w-lg max-h-[92vh] sm:max-h-[85vh] flex flex-col rounded-t-2xl sm:rounded-2xl border border-border bg-card shadow-2xl animate-in fade-in zoom-in-95 duration-200"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-border shrink-0">
          <h2 id="inquiry-modal-title" className="text-lg font-semibold tracking-tight pr-2">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors touch-manipulation"
            aria-label="닫기"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="flex-1 min-h-0 overflow-y-auto px-5 py-4">{children}</div>
      </div>
    </div>
  )
}

export default function InquiriesPage() {
  const [items, setItems] = useState<Inquiry[]>([])
  const [viewing, setViewing] = useState<Inquiry | null>(null)
  const [composeOpen, setComposeOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')

  const viewingRef = useRef(viewing)
  viewingRef.current = viewing

  const load = useCallback(async () => {
    setLoading(true)
    const res = await apiFetch<{ inquiries: Inquiry[] }>('/api/inquiries', { auth: true })
    if (!res.ok) {
      setError(res.error)
      setItems([])
      setViewing(null)
    } else {
      setError(null)
      setItems(res.inquiries)
      const sel = viewingRef.current
      if (sel) {
        const updated = res.inquiries.find((i) => i._id === sel._id)
        if (updated) setViewing(updated)
      }
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  function openCompose() {
    setViewing(null)
    setSubject('')
    setBody('')
    setComposeOpen(true)
  }

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
      setComposeOpen(false)
      setSubject('')
      setBody('')
      setViewing(res.inquiry)
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
              고객 지원
            </p>
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight">1:1 문의</h1>
            <p className="text-muted-foreground mt-2 max-w-xl">
              주문·상품·계정 관련 문의는 아래에서 새 문의를 남겨 주세요. 답변은 이 페이지에서 확인할 수 있습니다.
            </p>
          </div>
        </div>

        <div className="container mx-auto px-4 py-10 md:py-14 max-w-2xl">
          {error ? (
            <div className="rounded-xl border border-destructive/30 bg-destructive/5 px-6 py-8">
              <p className="font-semibold text-destructive mb-2">문의 목록을 불러오지 못했습니다</p>
              <p className="text-sm text-muted-foreground">{error}</p>
            </div>
          ) : (
            <section className="rounded-xl border border-border bg-card p-5 md:p-6 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">내 문의</h2>
                <Button type="button" onClick={openCompose} className="w-full sm:w-auto shrink-0 h-11">
                  <MessageCircle className="h-4 w-4 mr-2" />
                  1:1 문의 작성
                </Button>
              </div>

              {loading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-16 rounded-xl border border-border bg-background animate-pulse" />
                  ))}
                </div>
              ) : items.length === 0 ? (
                <div className="rounded-xl border border-dashed border-border/80 bg-background/50 px-6 py-10 text-center">
                  <p className="text-sm text-muted-foreground mb-4">아직 등록된 문의가 없습니다.</p>
                  <Button type="button" variant="outline" onClick={openCompose}>
                    첫 문의 남기기
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {items.map((t) => (
                    <button
                      key={t._id}
                      type="button"
                      onClick={() => {
                        setComposeOpen(false)
                        setViewing(t)
                      }}
                      className="w-full text-left rounded-xl border border-border/70 bg-background px-4 py-3 transition-colors hover:bg-secondary/30 hover:border-border"
                    >
                      <p className="text-sm font-semibold line-clamp-1">{t.subject}</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {t.status === 'open' && '접수'}
                        {t.status === 'answered' && '답변 완료'}
                        {t.status === 'closed' && '종료'} ·{' '}
                        {new Date(t.createdAt).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}
                      </p>
                    </button>
                  ))}
                </div>
              )}
            </section>
          )}
        </div>

        {composeOpen ? (
          <ModalShell title="1:1 문의 작성" onClose={() => !busy && setComposeOpen(false)}>
            <form onSubmit={create} className="space-y-4">
              <p className="text-sm text-muted-foreground leading-relaxed">
                내용을 구체적으로 적어 주시면 더 빠르게 도와드릴 수 있어요.
              </p>
              <div>
                <label htmlFor="inq-subject" className="block text-sm font-medium mb-2">
                  제목
                </label>
                <Input
                  id="inq-subject"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="h-11 bg-background"
                  placeholder="예: 배송 문의"
                  autoFocus
                />
              </div>
              <div>
                <label htmlFor="inq-body" className="block text-sm font-medium mb-2">
                  내용
                </label>
                <textarea
                  id="inq-body"
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  rows={6}
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/40 min-h-[140px]"
                  placeholder="문의 내용을 입력해 주세요."
                />
              </div>
              <div className="flex flex-col-reverse sm:flex-row gap-3 pt-2">
                <Button type="button" variant="outline" className="flex-1 h-11" disabled={busy} onClick={() => setComposeOpen(false)}>
                  취소
                </Button>
                <Button type="submit" className="flex-1 h-11" disabled={busy || !subject.trim() || !body.trim()}>
                  <SendHorizonal className="h-4 w-4 mr-2" />
                  {busy ? '전송 중…' : '보내기'}
                </Button>
              </div>
            </form>
          </ModalShell>
        ) : null}

        {viewing ? (
          <ModalShell title={viewing.subject} onClose={() => setViewing(null)}>
            <p className="text-xs text-muted-foreground mb-4">
              {viewing.status === 'open' && '접수됨 — 담당자가 확인 중입니다.'}
              {viewing.status === 'answered' && '답변이 등록되었습니다.'}
              {viewing.status === 'closed' && '문의가 종료되었습니다.'}
            </p>
            <div className="space-y-3">
              {viewing.messages.map((m, idx) => (
                <div
                  key={idx}
                  className={`rounded-xl border px-4 py-3 ${
                    m.role === 'admin'
                      ? 'border-accent/30 bg-accent/5'
                      : 'border-border/70 bg-background'
                  }`}
                >
                  <p className="text-xs font-medium text-muted-foreground mb-1.5">
                    {m.role === 'admin' ? 'LUXE 담당자' : '나'}
                  </p>
                  <p className="text-sm whitespace-pre-wrap leading-relaxed">{m.body}</p>
                  <p className="mt-2 text-[11px] text-muted-foreground">
                    {new Date(m.createdAt).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}
                  </p>
                </div>
              ))}
            </div>
            <div className="mt-6 pt-4 border-t border-border">
              <Button type="button" variant="outline" className="w-full h-11" onClick={() => setViewing(null)}>
                닫기
              </Button>
            </div>
          </ModalShell>
        ) : null}
      </div>
    </StorefrontLayout>
  )
}
