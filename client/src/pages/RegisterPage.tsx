import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../components/ToastHost'
import { safeRedirectPath } from '../lib/safeRedirect'
import AuthLayout from '../components/AuthLayout'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'

export default function RegisterPage() {
  const nav = useNavigate()
  const [params] = useSearchParams()
  const redirect = params.get('redirect')
  const { register } = useAuth()
  const { toast } = useToast()
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [password, setPassword] = useState('')
  const [acceptTerms, setAcceptTerms] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loginHref = redirect ? `/login?redirect=${encodeURIComponent(redirect)}` : '/login'

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!acceptTerms) {
      setError('서비스 이용약관에 동의해야 가입할 수 있습니다.')
      return
    }
    setBusy(true)
    setError(null)
    try {
      const u = await register(email, name, password, true)
      toast({ title: `${u.name}님, 환영합니다!`, description: '회원가입이 완료되었습니다.' })
      nav(safeRedirectPath(redirect))
    } catch (e2) {
      const raw = String(e2)
      setError(raw === 'TERMS_REQUIRED' ? '서비스 이용약관에 동의해야 가입할 수 있습니다.' : raw)
    } finally {
      setBusy(false)
    }
  }

  return (
    <AuthLayout
      variant="register"
      title="Join LUXE"
      subtitle="A single account for checkout, order history, and members-only drops."
    >
      <form onSubmit={submit} className="space-y-5">
        {error ? (
          <p className="text-sm text-destructive bg-destructive/10 border border-destructive/30 rounded-xl px-4 py-3">{error}</p>
        ) : null}

        <div>
          <label htmlFor="reg-name" className="block text-sm font-medium mb-2">
            Full name
          </label>
          <Input
            id="reg-name"
            autoComplete="name"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Alex Kim"
            className="h-11 bg-card"
          />
        </div>

        <div>
          <label htmlFor="reg-email" className="block text-sm font-medium mb-2">
            Email
          </label>
          <Input
            id="reg-email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="h-11 bg-card"
          />
        </div>

        <div>
          <label htmlFor="reg-password" className="block text-sm font-medium mb-2">
            Password
          </label>
          <Input
            id="reg-password"
            type="password"
            autoComplete="new-password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="At least 6 characters"
            className="h-11 bg-card"
          />
          <p className="mt-2 text-xs text-muted-foreground">Stored as a bcrypt hash on our servers — never as plain text.</p>
        </div>

        <div className="flex gap-3 rounded-xl border border-border bg-card/50 px-4 py-3">
          <input
            id="reg-terms"
            type="checkbox"
            checked={acceptTerms}
            onChange={(e) => setAcceptTerms(e.target.checked)}
            className="mt-1 h-4 w-4 shrink-0 rounded border-border text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
          <label htmlFor="reg-terms" className="text-sm text-muted-foreground leading-relaxed cursor-pointer">
            <Link to="/terms" target="_blank" rel="noopener noreferrer" className="text-foreground font-medium underline-offset-4 hover:underline">
              서비스 이용약관
            </Link>
            에 동의합니다. (필수)
          </label>
        </div>

        <Button type="submit" className="w-full h-11 text-base" disabled={busy}>
          {busy ? 'Creating account…' : 'Create account'}
        </Button>

        <p className="text-center text-sm text-muted-foreground pt-2">
          Already have an account?{' '}
          <Link to={loginHref} className="text-accent font-medium hover:underline">
            Sign in
          </Link>
        </p>
      </form>
    </AuthLayout>
  )
}
