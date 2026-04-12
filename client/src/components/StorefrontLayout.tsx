import type { ReactNode } from 'react'
import Footer, { type ShopFooterContext } from './Footer'
import Header from './Header'

type StorefrontLayoutProps = {
  children: ReactNode
  footerContext?: ShopFooterContext
}

export default function StorefrontLayout({ children, footerContext = 'browse' }: StorefrontLayoutProps) {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <Header />
      <main className="flex-1 w-full min-h-0 flex flex-col">{children}</main>
      <Footer variant="shop" context={footerContext} />
    </div>
  )
}

export type { ShopFooterContext }
