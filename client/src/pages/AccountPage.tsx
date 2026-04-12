import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { MessageCircle, Package, User as UserIcon } from 'lucide-react'
import StorefrontLayout from '../components/StorefrontLayout'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../components/ToastHost'

export default function AccountPage() {
  const { user, updateProfile, logout } = useAuth()
  const { toast } = useToast()
  const [name, setName] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (user?.name) setName(user.name)
  }, [user?.name])

  async function save(e: React.FormEvent) {
    e.preventDefault()
    if (!user) return
    setBusy(true)
    try {
      await updateProfile({ name: name.trim() })
      toast({ title: 'Saved', description: 'Your display name was updated.' })
    } catch (err) {
      toast({ title: 'Could not save', description: String(err) })
    } finally {
      setBusy(false)
    }
  }

  if (!user) return null

  return (
    <StorefrontLayout footerContext="account">
      <div className="flex-1 flex flex-col">
        <div className="border-b border-border bg-gradient-to-b from-secondary/40 to-background">
          <div className="container mx-auto px-4 py-10 md:py-14">
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight">Account settings</h1>
            <p className="text-muted-foreground mt-2 max-w-xl">
              Your name appears in the welcome message and order-related copy. Email is your sign-in ID and cannot be
              changed here.
            </p>
          </div>
        </div>

        <div className="container mx-auto px-4 py-10 max-w-xl">
          <div className="flex flex-wrap gap-3 mb-8">
            <Link
              to="/orders"
              className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2 text-sm font-medium hover:border-accent/40 transition-colors"
            >
              <Package className="h-4 w-4" />
              Orders
            </Link>
            <Link
              to="/inquiries"
              className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2 text-sm font-medium hover:border-accent/40 transition-colors"
            >
              <MessageCircle className="h-4 w-4" />
              Inquiries
            </Link>
            <button
              type="button"
              onClick={() => {
                logout()
                toast({ title: 'Signed out' })
              }}
              className="inline-flex items-center gap-2 rounded-xl border border-border px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors"
            >
              Log out
            </button>
          </div>

          <form onSubmit={save} className="rounded-xl border border-border bg-card p-6 md:p-8 space-y-6 shadow-sm">
            <div className="flex items-center gap-3 text-accent">
              <div className="w-10 h-10 rounded-full bg-accent/15 flex items-center justify-center">
                <UserIcon className="h-5 w-5" />
              </div>
              <span className="text-sm font-medium uppercase tracking-wide">Profile</span>
            </div>

            <div>
              <label htmlFor="acct-name" className="block text-sm font-medium mb-2">
                Name
              </label>
              <Input
                id="acct-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="h-11 bg-background"
                autoComplete="name"
                required
                minLength={1}
                maxLength={100}
              />
            </div>

            <div>
              <label htmlFor="acct-email" className="block text-sm font-medium mb-2">
                Email
              </label>
              <Input id="acct-email" type="email" value={user.email} disabled className="h-11 bg-secondary/50 opacity-90" />
              <p className="text-xs text-muted-foreground mt-2">Used for sign-in only.</p>
            </div>

            <Button type="submit" className="w-full h-11" disabled={busy || !name.trim()}>
              {busy ? 'Saving…' : 'Save changes'}
            </Button>
          </form>
        </div>
      </div>
    </StorefrontLayout>
  )
}
