"use client"

import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import Button from './ui/Button'
import { useProductsCatalog } from '../lib/useProductsCatalog'
import { pickHomeFeaturedProducts } from '../lib/homeAppleCatalog'
import ProductCard from './ProductCard'

export default function ProductGrid() {
  const { data: items = [] } = useProductsCatalog()

  const homeItems = useMemo(() => pickHomeFeaturedProducts(items), [items])

  return (
    <section className="pt-2 pb-16 lg:pt-3 lg:pb-24 max-md:pb-12">
      <div className="container mx-auto px-4">
        <div className="mb-6 flex flex-row flex-wrap items-start justify-between gap-x-3 gap-y-2 max-md:mb-4 lg:mb-10 lg:flex-nowrap lg:items-end lg:gap-6">
          <div className="min-w-0 flex-1">
            <h2 className="text-3xl lg:text-4xl font-bold tracking-tight mb-2 text-balance max-md:text-2xl">
              Featured
            </h2>
            <p className="text-muted-foreground text-lg max-md:text-base">
              Eight curated picks from the catalog.
            </p>
          </div>
          <Link to="/products" className="shrink-0 max-lg:pt-0.5">
            <Button
              size="sm"
              className="group bg-transparent text-foreground hover:bg-secondary max-md:h-9 max-md:px-3 max-md:text-xs whitespace-nowrap lg:px-4 lg:text-sm"
            >
              <span className="hidden lg:inline">View all products</span>
              <span className="inline lg:hidden">View all</span>
              <ArrowRight className="ml-1.5 h-3.5 w-3.5 shrink-0 group-hover:translate-x-1 transition-transform lg:ml-2 lg:h-4 lg:w-4" />
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 max-md:gap-3">
          {homeItems.map((p) => (
            <ProductCard key={p._id} product={p} />
          ))}
        </div>
      </div>
    </section>
  )
}

