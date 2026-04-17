"use client"

import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'

const SIDE_IMAGE =
  'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=1600&q=85'

type Props = {
  title: string
  subtitle?: string
  variant?: 'login' | 'register'
  children: React.ReactNode
}

export default function AuthLayout({ title, subtitle, variant = 'login', children }: Props) {
  const sideCopy =
    variant === 'register'
      ? 'Create your LUXE account. One profile for wishlists, orders, and faster checkout.'
      : 'Welcome back. Sign in to pay securely, track orders, and sync your cart across devices.'

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-background text-foreground">
      <div className="relative lg:w-1/2 xl:w-[52%] min-h-[220px] lg:min-h-screen overflow-hidden border-b border-border lg:border-b-0 lg:border-r border-border">
        <img src={SIDE_IMAGE} alt="" className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-background/30" />
        <div className="absolute inset-0 bg-gradient-to-r from-background/90 via-transparent to-transparent lg:block hidden" />
        <div className="relative z-10 flex h-full min-h-[220px] lg:min-h-screen flex-col justify-end p-8 lg:p-14 xl:p-16">
          <p className="text-accent text-xs font-semibold tracking-[0.2em] uppercase mb-3">LUXE</p>
          <p className="text-xl lg:text-2xl xl:text-3xl font-light text-foreground/95 max-w-lg leading-relaxed text-balance">
            {sideCopy}
          </p>
          <p className="mt-6 text-sm text-muted-foreground max-w-md">
            Secured with JWT sessions. Passwords are hashed with bcrypt — we never store plain text.
          </p>
        </div>
      </div>

      <div className="flex flex-1 flex-col justify-center px-5 py-10 sm:px-10 sm:py-12 lg:px-16 xl:px-20">
        <div className="w-full max-w-md mx-auto">
          <div className="mb-6 sm:mb-8">
            <Link
              to="/products"
              className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors min-h-10"
            >
              <ArrowLeft className="h-4 w-4" />
              Continue shopping
            </Link>
          </div>

          <div className="rounded-2xl border border-border bg-card/70 backdrop-blur-sm px-5 py-6 sm:px-7 sm:py-8 shadow-sm">
            <Link to="/" className="inline-block text-2xl sm:text-3xl font-bold tracking-tight hover:opacity-90 transition-opacity">
              LUXE
            </Link>

            <h1 className="mt-6 text-3xl sm:text-4xl font-semibold tracking-tight leading-tight">{title}</h1>
            {subtitle ? <p className="mt-3 text-muted-foreground leading-relaxed">{subtitle}</p> : null}

            <div className="mt-8 sm:mt-10">{children}</div>
          </div>
        </div>
      </div>
    </div>
  )
}
