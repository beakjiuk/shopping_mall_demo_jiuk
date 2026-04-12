import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'

export type ToastOptions = {
  title: string
  description?: string
  /** Set to navigate on toast click (e.g. `/cart`) */
  navigateTo?: string
}

type Toast = ToastOptions & { id: string }

type ToastApi = { toast: (t: ToastOptions) => void }

const Ctx = createContext<ToastApi | null>(null)

function clickHintForPath(path: string) {
  if (path === '/wishlist') return 'Click to view wishlist →'
  if (path === '/cart') return 'Click to view cart →'
  return 'Click to open →'
}

function ToastViewport({ toasts, dismiss }: { toasts: Toast[]; dismiss: (id: string) => void }) {
  const navigate = useNavigate()

  return (
    <div
      className="fixed z-[110] flex flex-col gap-2 w-[min(360px,calc(100vw-1.5rem-env(safe-area-inset-left)-env(safe-area-inset-right)))] px-1"
      style={{
        bottom: 'max(1rem, env(safe-area-inset-bottom, 0px))',
        right: 'max(1rem, env(safe-area-inset-right, 0px))',
      }}
    >
      {toasts.map((t) => {
        const interactive = Boolean(t.navigateTo)
        const go = () => {
          if (t.navigateTo) {
            navigate(t.navigateTo)
            dismiss(t.id)
          }
        }
        return (
          <div
            key={t.id}
            role={interactive ? 'button' : undefined}
            tabIndex={interactive ? 0 : undefined}
            onClick={interactive ? go : undefined}
            onKeyDown={
              interactive
                ? (e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      go()
                    }
                  }
                : undefined
            }
            style={interactive ? { WebkitTapHighlightColor: 'transparent' } : undefined}
            className={[
              'bg-card border border-border rounded-xl p-4 shadow-xl animate-in fade-in slide-in-from-bottom-2',
              interactive
                ? 'cursor-pointer text-left select-none active:bg-card focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/35 focus-visible:ring-offset-2 focus-visible:ring-offset-background'
                : '',
            ].join(' ')}
          >
            <div className="font-semibold">{t.title}</div>
            {t.description ? <div className="text-sm text-muted-foreground mt-1">{t.description}</div> : null}
            {interactive && t.navigateTo ? (
              <div className="text-xs text-accent font-medium mt-2">{clickHintForPath(t.navigateTo)}</div>
            ) : null}
          </div>
        )
      })}
    </div>
  )
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((x) => x.id !== id))
  }, [])

  const toast = useCallback((t: ToastOptions) => {
    const id = `${Date.now()}_${Math.random().toString(16).slice(2)}`
    const item: Toast = { id, title: t.title, description: t.description, navigateTo: t.navigateTo }
    setToasts((prev) => [...prev, item])
    window.setTimeout(() => {
      dismiss(id)
    }, 2600)
  }, [dismiss])

  const value = useMemo(() => ({ toast }), [toast])

  return (
    <Ctx.Provider value={value}>
      {children}
      <ToastViewport toasts={toasts} dismiss={dismiss} />
    </Ctx.Provider>
  )
}

/** Co-located with ToastProvider for a single import surface. */
// eslint-disable-next-line react-refresh/only-export-components
export function useToast() {
  const v = useContext(Ctx)
  if (!v) throw new Error('ToastProvider missing')
  return v
}
