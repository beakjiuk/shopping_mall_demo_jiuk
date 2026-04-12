"use client"

import { useMemo, useState } from 'react'
import { PRODUCT_IMAGE_FALLBACK } from '../lib/productImages'

type Props = {
  src: string | undefined
  /** Tried in order after `src` fails (e.g. other angles from product.images). */
  candidates?: string[]
  alt: string
  className?: string
  loading?: 'lazy' | 'eager'
}

function uniqueUrls(primary: string | undefined, extra: string[] | undefined): string[] {
  const out: string[] = []
  const seen = new Set<string>()
  const add = (s?: string) => {
    const t = s?.trim()
    if (!t || seen.has(t)) return
    seen.add(t)
    out.push(t)
  }
  add(primary)
  for (const x of extra ?? []) add(x)
  return out
}

function buildChain(src: string | undefined, candidates: string[] | undefined): string[] {
  const urls = uniqueUrls(src, candidates)
  if (!urls.includes(PRODUCT_IMAGE_FALLBACK)) urls.push(PRODUCT_IMAGE_FALLBACK)
  return urls
}

/** Holds fallback index; remount via `key` when `chain` changes so index resets without an effect. */
function SafeProductImageInner({
  chain,
  alt,
  className,
  loading,
}: {
  chain: string[]
  alt: string
  className?: string
  loading: 'lazy' | 'eager'
}) {
  const [index, setIndex] = useState(0)
  const displayUrl = chain[Math.min(index, chain.length - 1)] ?? PRODUCT_IMAGE_FALLBACK

  return (
    <img
      src={displayUrl}
      alt={alt}
      className={className}
      loading={loading}
      onError={() => {
        setIndex((i) => {
          if (i + 1 < chain.length) return i + 1
          return i
        })
      }}
    />
  )
}

export default function SafeProductImage({ src, candidates, alt, className, loading = 'lazy' }: Props) {
  const chain = useMemo(() => buildChain(src, candidates), [src, candidates])
  const chainKey = chain.join('\0')

  return (
    <SafeProductImageInner key={chainKey} chain={chain} alt={alt} className={className} loading={loading} />
  )
}
