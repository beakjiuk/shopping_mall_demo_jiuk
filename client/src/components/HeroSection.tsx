"use client"

import { useEffect, useState } from 'react'
import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react'
import Button from './ui/Button'
import { Link } from 'react-router-dom'

const H = (photo: string) =>
  `https://images.unsplash.com/${photo}?auto=format&fit=crop&w=1920&q=85`

const slides = [
  {
    title: 'iPhone & MacBook Air',
    subtitle: 'Apple at LUXE',
    description: 'Only our iPhone and MacBook Air picks on the home page—thin, light, and built to pair.',
    cta: 'Shop this pair',
    to: '/products?appleSpotlight=1',
    image: H('photo-1592750475338-74b7b21085ab'),
    fallbacks: [H('photo-1517336714731-489689fd1ca8'), H('photo-1496181133206-80ce9b88a853')],
  },
  {
    title: 'Spring Collection',
    subtitle: '2026',
    description: 'Discover the latest trends in premium fashion and accessories',
    cta: 'Shop Now',
    to: '/products',
    image: H('photo-1441986300917-64674bd600d8'),
  },
  {
    title: 'Tech Innovation',
    subtitle: 'New Arrivals',
    description: 'Experience cutting-edge technology with unmatched design',
    cta: 'Explore',
    to: '/products?section=new',
    image: H('photo-1468495244123-6c6c332eeece'),
  },
  {
    title: 'Home Essentials',
    subtitle: 'Curated Selection',
    description: 'Transform your space with premium home products',
    cta: 'Browse Collection',
    to: '/products?category=Home',
    image: H('photo-1618221195710-dd6b41faaea6'),
  },
]

function HeroBackground({ src, fallbacks }: { src: string; fallbacks?: string[] }) {
  const chain = [src, ...(fallbacks ?? [])]
  const [i, setI] = useState(0)
  const url = chain[Math.min(i, chain.length - 1)] ?? src

  return (
    <>
      <img
        src={url}
        alt=""
        className="absolute inset-0 z-0 h-full w-full object-cover pointer-events-none"
        loading={i === 0 ? 'eager' : 'lazy'}
        decoding="async"
        onError={() => setI((k) => (k + 1 < chain.length ? k + 1 : k))}
      />
      <div
        className="absolute inset-0 z-[1] bg-gradient-to-r from-background via-background/85 to-background/25 pointer-events-none"
        aria-hidden
      />
      <div className="absolute inset-0 z-[1] bg-black/35 pointer-events-none" aria-hidden />
    </>
  )
}

export default function HeroSection() {
  const [currentSlide, setCurrentSlide] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => setCurrentSlide((prev) => (prev + 1) % slides.length), 5000)
    return () => clearInterval(timer)
  }, [])

  const nextSlide = () => setCurrentSlide((prev) => (prev + 1) % slides.length)
  const prevSlide = () => setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length)

  return (
    <section className="relative overflow-hidden bg-zinc-950 max-md:h-[min(30svh,220px)] max-md:min-h-[140px] max-md:max-h-[min(34svh,260px)] md:h-[calc(70vh*3/7)] md:min-h-0 lg:h-[calc(85vh*3/7)]">
      {slides.map((slide, index) => (
        <div
          key={index}
          className={`absolute inset-0 transition-opacity duration-1000 ${
            index === currentSlide ? 'z-[5] opacity-100' : 'z-0 opacity-0 pointer-events-none'
          }`}
        >
          <HeroBackground src={slide.image} fallbacks={slide.fallbacks} />

          <div className="relative z-10 h-full container mx-auto px-4 flex items-center max-md:pb-9 md:pb-0">
            <div className="max-w-2xl max-md:py-1 md:py-0">
              <p className="text-accent font-semibold tracking-widest uppercase mb-1 text-xs drop-shadow-sm max-md:text-[10px] max-md:mb-0.5 max-md:tracking-wide">
                {slide.subtitle}
              </p>
              <h1 className="font-bold tracking-tight mb-2 text-balance text-foreground drop-shadow-md max-md:text-lg max-md:leading-tight max-md:mb-1 md:text-3xl lg:text-4xl">
                {slide.title}
              </h1>
              <p className="text-zinc-300 mb-3 max-w-lg drop-shadow max-md:mb-2 max-md:text-[11px] max-md:leading-snug max-md:line-clamp-2 md:text-sm md:line-clamp-2 lg:text-base lg:line-clamp-3">
                {slide.description}
              </p>
              <Link
                to={slide.to ?? '/products'}
                className="relative z-10 inline-block max-md:inline-block max-md:w-auto"
              >
                <Button
                  size="sm"
                  className="group shadow-lg shadow-black/40 max-md:h-8 max-md:min-h-0 max-md:px-3 max-md:text-xs max-md:rounded-md"
                >
                  {slide.cta}
                  <ArrowRight className="ml-1.5 h-3.5 w-3.5 group-hover:translate-x-1 transition-transform max-md:ml-1 max-md:h-3 max-md:w-3" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      ))}

      <div className="absolute bottom-2 left-1/2 z-20 -translate-x-1/2 flex items-center gap-1.5 px-2 max-md:pb-[env(safe-area-inset-bottom,0px)] md:bottom-3 md:gap-2">
        <button
          type="button"
          onClick={prevSlide}
          className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-background/30 hover:bg-background/50 backdrop-blur-md border border-white/10 text-foreground transition-colors active:scale-95 md:h-10 md:w-10 md:p-1.5"
          aria-label="Previous slide"
        >
          <ChevronLeft className="h-4 w-4 md:h-5 md:w-5" />
        </button>
        <div className="flex gap-2">
          {slides.map((_, index) => (
            <button
              key={index}
              type="button"
              onClick={() => setCurrentSlide(index)}
              className={`h-2 rounded-full transition-all ${
                index === currentSlide ? 'w-8 bg-accent' : 'w-2 bg-white/30 hover:bg-white/50'
              }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
        <button
          type="button"
          onClick={nextSlide}
          className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-background/30 hover:bg-background/50 backdrop-blur-md border border-white/10 text-foreground transition-colors active:scale-95 md:h-10 md:w-10 md:p-1.5"
          aria-label="Next slide"
        >
          <ChevronRight className="h-4 w-4 md:h-5 md:w-5" />
        </button>
      </div>
    </section>
  )
}
