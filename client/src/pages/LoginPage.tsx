import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../components/ToastHost'
import { safeRedirectPath } from '../lib/safeRedirect'
import AuthLayout from '../components/AuthLayout'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'

export default function LoginPage() {
  const nav = useNavigate()
  const [params] = useSearchParams()
  const redirect = params.get('redirect')
  const { login } = useAuth()
  const { toast } = useToast()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const registerHref = redirect ? `/register?redirect=${encodeURIComponent(redirect)}` : '/register'

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError(null)
    try {
      const u = await login(email, password)
      toast({ title: `${u.name}님, 환영합니다!`, description: '즐거운 쇼핑 되세요.' })
      nav(safeRedirectPath(redirect))
    } catch (e2) {
      setError(String(e2))
    } finally {
      setBusy(false)
    }
  }

  return (
    <AuthLayout
      variant="login"
      title="Sign in"
      subtitle="Use your account to checkout, view orders, and save your wishlist."
    >
      <form onSubmit={submit} className="space-y-6">
        {error ? (
          <p className="text-sm text-destructive bg-destructive/10 border border-destructive/30 rounded-xl px-4 py-3">{error}</p>
        ) : null}

        <div>
          <label htmlFor="login-email" className="block text-sm font-medium mb-2">
            Email
          </label>
          <Input
            id="login-email"
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
          <label htmlFor="login-password" className="block text-sm font-medium mb-2">
            Password
          </label>
          <Input
            id="login-password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className="h-11 bg-card"
          />
        </div>

        <Button type="submit" className="w-full h-12 text-base" disabled={busy}>
          {busy ? 'Signing in…' : 'Sign in'}
        </Button>

        <p className="text-center text-sm text-muted-foreground pt-1">
          New to LUXE?{' '}
          <Link to={registerHref} className="text-accent font-medium hover:underline">
            Create an account
          </Link>
        </p>

        <p className="text-xs text-muted-foreground text-center border-t border-border pt-6 mt-2">
          Demo seed: user@example.com / password123
        </p>
      </form>
    </AuthLayout>
  )
}
