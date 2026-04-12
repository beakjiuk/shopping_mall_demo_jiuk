"use client"

import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import Button from './ui/Button'
import { useProductsCatalog } from '../lib/useProductsCatalog'
import { pickHomeFeaturedProducts } from '../lib/homeAppleCatalog'
import ProductCard from './ProductCard'

export default function ProductGrid() {
  const { data: items = [], error, isLoading } = useProductsCatalog()

  const homeItems = useMemo(() => pickHomeFeaturedProducts(items), [items])

  return (
    <section className="pt-3 pb-16 lg:pt-4 lg:pb-24 max-md:pt-2 max-md:pb-10">
      <div className="container mx-auto px-4">
        <div className="mb-6 flex flex-row flex-wrap items-start justify-between gap-x-3 gap-y-2 max-md:mb-4 lg:mb-10 lg:flex-nowrap lg:items-end lg:gap-6">
          <div className="min-w-0 flex-1">
            <h2 className="text-3xl lg:text-4xl font-bold tracking-tight text-balance max-md:text-2xl">
              Featured
            </h2>
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

        {error ? (
          <p className="text-sm text-muted-foreground max-w-xl">
            상품 목록을 불러오지 못했습니다. 브라우저 개발자 도구 → Network에서{' '}
            <code className="text-xs text-foreground/80">/api/products</code> 요청의 URL·상태(404,
            CORS, 실패)를 확인하세요. Vercel의{' '}
            <code className="text-xs text-foreground/80">VITE_API_ORIGIN</code>이 Heroku 대시보드의
            Open app으로 열리는 주소와 정확히 같은지(앱 이름 철자 포함) 다시 확인해 주세요.
          </p>
        ) : null}
        {!isLoading && !error && homeItems.length === 0 ? (
          <p className="text-sm text-muted-foreground max-w-xl">
            표시할 상품이 없습니다. Heroku에서 Mongo가 붙었다면 DB가 비었을 수 있습니다.{' '}
            <code className="text-xs text-foreground/80">heroku run npm run seed --app &lt;앱이름&gt;</code>{' '}
            로 시드를 넣어 보세요.
          </p>
        ) : null}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 max-md:gap-3">
          {homeItems.map((p) => (
            <ProductCard key={p._id} product={p} />
          ))}
        </div>
      </div>
    </section>
  )
}

