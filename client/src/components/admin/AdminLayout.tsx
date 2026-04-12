import { Link, Outlet, useLocation } from 'react-router-dom'
import { BarChart3, Boxes, MessageCircle, Package, Users } from 'lucide-react'
import Header from '../Header'
import Footer from '../Footer'

const nav = [
  { to: '/admin', label: 'Dashboard', icon: BarChart3 },
  { to: '/admin/orders', label: 'Orders', icon: Package },
  { to: '/admin/products', label: 'Products', icon: Boxes },
  { to: '/admin/inquiries', label: 'Inquiries', icon: MessageCircle },
  { to: '/admin/users', label: 'Users', icon: Users },
]

function isActive(pathname: string, to: string) {
  if (to === '/admin') return pathname === '/admin'
  return pathname === to || pathname.startsWith(to + '/')
}

export default function AdminLayout() {
  const location = useLocation()

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <Header />
      <main className="flex-1">
        <div className="border-b border-border bg-gradient-to-b from-secondary/40 to-background">
          <div className="container mx-auto px-4 py-10 md:py-14">
            <p className="text-sm font-medium text-accent mb-2">Admin</p>
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight">Management</h1>
            <p className="text-muted-foreground mt-2 max-w-2xl">
              Manage products, orders, shipping status, and 1:1 customer inquiries.
            </p>
          </div>
        </div>

        <div className="container mx-auto px-4 py-8 md:py-10">
          <div className="grid grid-cols-1 lg:grid-cols-[240px_minmax(0,1fr)] gap-6">
            <aside className="rounded-xl border border-border bg-card p-3 h-fit lg:overflow-visible max-lg:overflow-x-auto max-lg:p-2">
              <nav className="flex flex-col gap-1 lg:w-full max-lg:flex-row max-lg:min-w-0 max-lg:pb-1 max-lg:-mx-1 max-lg:px-1">
                {nav.map((n) => {
                  const active = isActive(location.pathname, n.to)
                  const Icon = n.icon
                  return (
                    <Link
                      key={n.to}
                      to={n.to}
                      className={[
                        'flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors lg:w-full max-lg:shrink-0 max-lg:whitespace-nowrap max-lg:py-2.5',
                        active ? 'bg-secondary text-foreground' : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50',
                      ].join(' ')}
                    >
                      <Icon className="h-4 w-4 shrink-0" />
                      {n.label}
                    </Link>
                  )
                })}
              </nav>
            </aside>

            <section className="min-w-0">
              <Outlet />
            </section>
          </div>
        </div>
      </main>
      <Footer variant="admin" />
    </div>
  )
}

