import { useCallback, useEffect, useState } from 'react'
import { Trash2, Pencil, X, Plus } from 'lucide-react'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import { apiFetch } from '../lib/api'
import type { Product } from '../lib/types'
import { ADMIN_PRODUCT_CATEGORIES } from '../lib/catalogNav'

function parseSizesCsv(raw: string): string[] {
  const seen = new Set<string>()
  const out: string[] = []
  for (const part of raw.split(/[,，]/)) {
    const s = part.trim()
    if (!s || seen.has(s)) continue
    seen.add(s)
    if (s.length > 32) continue
    out.push(s)
  }
  return out.slice(0, 32)
}

function rowId() {
  return typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : `r-${Date.now()}-${Math.random().toString(36).slice(2)}`
}

type VariantRow = { id: string; color: string; imageUrl: string }

function newVariantRow(): VariantRow {
  return { id: rowId(), color: '', imageUrl: '' }
}

function productToVariantRows(p: Product): VariantRow[] {
  const imgs =
    p.images && p.images.length > 0 ? [...p.images] : p.imageUrl ? [p.imageUrl] : []
  const cols = p.colors && p.colors.length > 0 ? [...p.colors] : []
  const n = Math.max(imgs.length, cols.length, 1)
  const rows: VariantRow[] = []
  for (let i = 0; i < n; i++) {
    rows.push({
      id: rowId(),
      color: cols[i] ?? '',
      imageUrl: imgs[i] ?? '',
    })
  }
  return rows
}

type PackOk = { images: string[]; colors: string[] }

function packVariantRows(rows: VariantRow[]): PackOk | { error: string } {
  const withImg = rows.filter((r) => r.imageUrl.trim())
  if (withImg.length === 0) return { error: '이미지 URL을 최소 1개 입력해 주세요.' }
  const images = withImg.map((r) => r.imageUrl.trim())
  if (images.length > 1) {
    if (withImg.some((r) => !r.color.trim())) {
      return {
        error: '이미지가 여러 개일 때는 각 줄에 색상 이름을 입력해 주세요. (썸네일과 같은 순서)',
      }
    }
    return { images, colors: withImg.map((r) => r.color.trim()) }
  }
  const c0 = withImg[0].color.trim()
  return { images, colors: c0 ? [c0] : [] }
}

function categoryToPreset(cat: string | undefined): {
  preset: (typeof ADMIN_PRODUCT_CATEGORIES)[number]
  custom: string
} {
  const c = cat || ''
  if ((ADMIN_PRODUCT_CATEGORIES as readonly string[]).includes(c)) {
    return { preset: c as (typeof ADMIN_PRODUCT_CATEGORIES)[number], custom: '' }
  }
  return { preset: 'Other', custom: c }
}

function VariantRowsEditor({
  rows,
  onChange,
  disabled,
}: {
  rows: VariantRow[]
  onChange: (next: VariantRow[]) => void
  disabled?: boolean
}) {
  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground leading-relaxed">
        한 줄에 색상(표시 이름)과 이미지 URL을 같이 맞춥니다. 색상 여러 개면 줄을 추가하고, 쇼핑몰에서도 같은 순서로 연결됩니다.{' '}
        <span className="text-muted-foreground/90">
          짧은 https:// 주소뿐 아니라 <code className="text-[0.7rem]">data:image/…;base64,…</code> 붙여넣기도 됩니다.
        </span>
      </p>
      <div className="space-y-3">
        {rows.map((row, idx) => (
          <div
            key={row.id}
            className="grid grid-cols-1 sm:grid-cols-[minmax(0,9rem)_minmax(0,1fr)_auto] gap-2 items-start rounded-xl border border-border/60 bg-background/50 p-3"
          >
            <div>
              <label className="text-xs font-medium text-muted-foreground sr-only sm:not-sr-only sm:block sm:mb-1">
                색상
              </label>
              <Input
                disabled={disabled}
                placeholder="색상"
                value={row.color}
                onChange={(e) => {
                  const next = [...rows]
                  next[idx] = { ...row, color: e.target.value }
                  onChange(next)
                }}
                className="h-10 sm:h-11 bg-background text-sm"
              />
            </div>
            <div className="min-w-0">
              <label className="text-xs font-medium text-muted-foreground sr-only sm:not-sr-only sm:block sm:mb-1">
                이미지 URL
              </label>
              <Input
                disabled={disabled}
                placeholder="https://…"
                value={row.imageUrl}
                onChange={(e) => {
                  const next = [...rows]
                  next[idx] = { ...row, imageUrl: e.target.value }
                  onChange(next)
                }}
                className="h-10 sm:h-11 bg-background text-sm"
              />
            </div>
            <div className="flex sm:pt-6 justify-end sm:justify-start">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={disabled}
                className="h-10 shrink-0"
                onClick={() => {
                  if (rows.length <= 1) {
                    onChange([{ ...row, id: row.id, color: '', imageUrl: '' }])
                    return
                  }
                  onChange(rows.filter((r) => r.id !== row.id))
                }}
              >
                제거
              </Button>
            </div>
          </div>
        ))}
      </div>
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={disabled}
        className="h-10"
        onClick={() => onChange([...rows, newVariantRow()])}
      >
        <Plus className="h-4 w-4 mr-2" />
        이미지·색상 줄 추가
      </Button>
    </div>
  )
}

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [createVariantRows, setCreateVariantRows] = useState<VariantRow[]>(() => [newVariantRow()])
  const [price, setPrice] = useState('0')
  const [stock, setStock] = useState('0')
  const [category, setCategory] = useState<(typeof ADMIN_PRODUCT_CATEGORIES)[number]>('Electronics')
  const [categoryCustom, setCategoryCustom] = useState('')
  const [brand, setBrand] = useState('')
  const [isNew, setIsNew] = useState(false)
  const [isBestSeller, setIsBestSeller] = useState(false)
  const [createFastDelivery, setCreateFastDelivery] = useState(false)
  const [createFeaturesText, setCreateFeaturesText] = useState('')
  const [sizesCsv, setSizesCsv] = useState('')

  const [editing, setEditing] = useState<Product | null>(null)
  const [eTitle, setETitle] = useState('')
  const [eDescription, setEDescription] = useState('')
  const [eVariantRows, setEVariantRows] = useState<VariantRow[]>([])
  const [ePrice, setEPrice] = useState('0')
  const [eStock, setEStock] = useState('0')
  const [eCategory, setECategory] = useState<(typeof ADMIN_PRODUCT_CATEGORIES)[number]>('Electronics')
  const [eCategoryCustom, setECategoryCustom] = useState('')
  const [eBrand, setEBrand] = useState('')
  const [eIsNew, setEIsNew] = useState(false)
  const [eIsBestSeller, setEIsBestSeller] = useState(false)
  const [eFastDelivery, setEFastDelivery] = useState(false)
  const [eSizesCsv, setESizesCsv] = useState('')
  const [eFeaturesText, setEFeaturesText] = useState('')
  const [eOriginalPrice, setEOriginalPrice] = useState('')
  const [eRating, setERating] = useState('')
  const [eReviews, setEReviews] = useState('')

  function resolvedCategory() {
    if (category === 'Other') {
      const c = categoryCustom.trim()
      return c || 'Other'
    }
    return category
  }

  function resolvedEditCategory() {
    if (eCategory === 'Other') {
      const c = eCategoryCustom.trim()
      return c || 'Other'
    }
    return eCategory
  }

  const load = useCallback(async () => {
    const res = await apiFetch<{ products: Product[] }>('/api/admin/products', { auth: true })
    if (!res.ok) {
      setError(res.error)
      return
    }
    setError(null)
    setProducts(res.products)
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  useEffect(() => {
    if (!editing) return
    setETitle(editing.title)
    setEDescription(editing.description || '')
    setEVariantRows(productToVariantRows(editing))
    const { preset, custom } = categoryToPreset(editing.category)
    setECategory(preset)
    setECategoryCustom(custom)
    setEPrice(String(editing.price))
    setEStock(String(editing.stock))
    setEBrand(editing.brand || '')
    setEIsNew(!!editing.isNew)
    setEIsBestSeller(!!editing.isBestSeller)
    setEFastDelivery(!!editing.fastDelivery)
    setESizesCsv((editing.sizes || []).join(', '))
    setEFeaturesText((editing.features || []).join('\n'))
    setEOriginalPrice(editing.originalPrice != null ? String(editing.originalPrice) : '')
    setERating(String(editing.rating ?? 4.6))
    setEReviews(String(editing.reviews ?? 120))
  }, [editing])

  useEffect(() => {
    if (editing) {
      const prev = document.body.style.overflow
      document.body.style.overflow = 'hidden'
      return () => {
        document.body.style.overflow = prev
      }
    }
  }, [editing])

  async function create() {
    const packed = packVariantRows(createVariantRows)
    if ('error' in packed) {
      alert(packed.error)
      return
    }
    const features = createFeaturesText
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean)

    setBusy(true)
    try {
      const res = await apiFetch<{ product: Product }>('/api/admin/products', {
        method: 'POST',
        auth: true,
        body: {
          title: title.trim(),
          description,
          price: Number(price),
          stock: Number(stock),
          imageUrl: packed.images[0] || '',
          images: packed.images,
          colors: packed.colors,
          features,
          category: resolvedCategory(),
          brand: brand.trim(),
          isNew,
          isBestSeller,
          fastDelivery: createFastDelivery,
          sizes: resolvedCategory() === 'Fashion' ? parseSizesCsv(sizesCsv) : [],
        },
      })
      if (!res.ok) throw new Error(res.error)
      setTitle('')
      setDescription('')
      setCreateVariantRows([newVariantRow()])
      setPrice('0')
      setStock('0')
      setCategory('Electronics')
      setCategoryCustom('')
      setBrand('')
      setIsNew(false)
      setIsBestSeller(false)
      setCreateFastDelivery(false)
      setCreateFeaturesText('')
      setSizesCsv('')
      await load()
    } catch (e) {
      alert(String(e))
    } finally {
      setBusy(false)
    }
  }

  async function saveEdit() {
    if (!editing) return
    const packed = packVariantRows(eVariantRows)
    if ('error' in packed) {
      alert(packed.error)
      return
    }
    const features = eFeaturesText
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean)

    const opRaw = eOriginalPrice.trim()
    let originalPrice: number | null = null
    if (opRaw !== '') {
      const n = Number(opRaw)
      if (!Number.isFinite(n) || n < 0) {
        alert('정가(original price)가 올바르지 않습니다.')
        return
      }
      originalPrice = n
    }

    setBusy(true)
    try {
      const res = await apiFetch<{ product: Product }>(`/api/admin/products/${editing._id}`, {
        method: 'PUT',
        auth: true,
        body: {
          title: eTitle.trim(),
          description: eDescription,
          price: Number(ePrice),
          stock: Number(eStock),
          imageUrl: packed.images[0] || '',
          images: packed.images,
          colors: packed.colors,
          features,
          category: resolvedEditCategory(),
          brand: eBrand.trim(),
          isNew: eIsNew,
          isBestSeller: eIsBestSeller,
          fastDelivery: eFastDelivery,
          sizes: resolvedEditCategory() === 'Fashion' ? parseSizesCsv(eSizesCsv) : [],
          originalPrice,
          rating: Math.min(5, Math.max(0, Number(eRating) || 0)),
          reviews: Math.max(0, Math.floor(Number(eReviews) || 0)),
        },
      })
      if (!res.ok) throw new Error(res.error)
      setEditing(null)
      await load()
    } catch (e) {
      alert(String(e))
    } finally {
      setBusy(false)
    }
  }

  async function remove(id: string) {
    setBusy(true)
    try {
      const res = await apiFetch<Record<string, never>>(`/api/admin/products/${id}`, { method: 'DELETE', auth: true })
      if (!res.ok) throw new Error(res.error)
      await load()
    } catch (e) {
      alert(String(e))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-border bg-card p-5 md:p-6 shadow-sm">
        <h2 className="text-lg font-semibold">Products</h2>
        <p className="text-sm text-muted-foreground mt-1">Create, edit, and remove products. Stock and price are visible to customers.</p>

        {error ? (
          <div className="mt-4 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3">
            <p className="text-sm text-destructive font-medium">Error</p>
            <p className="text-sm text-muted-foreground">{error}</p>
          </div>
        ) : null}
      </div>

      <div className="rounded-xl border border-border bg-card p-5 md:p-6 shadow-sm">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-4">Create product</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium mb-2">Title</label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} className="h-11 bg-background" />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium mb-2">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/40"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium mb-2">Images & colors</label>
            <VariantRowsEditor rows={createVariantRows} onChange={setCreateVariantRows} disabled={busy} />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium mb-2">Features (optional, one line each)</label>
            <textarea
              value={createFeaturesText}
              onChange={(e) => setCreateFeaturesText(e.target.value)}
              rows={3}
              placeholder={'예: Free shipping\n2-year warranty'}
              className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/40"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Price</label>
            <Input value={price} onChange={(e) => setPrice(e.target.value)} className="h-11 bg-background" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Stock</label>
            <Input value={stock} onChange={(e) => setStock(e.target.value)} className="h-11 bg-background" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as (typeof ADMIN_PRODUCT_CATEGORIES)[number])}
              className="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm"
            >
              {ADMIN_PRODUCT_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
            <p className="text-xs text-muted-foreground mt-2">
              헤더 메뉴(Electronics / Fashion / Home)와 같은 값이면 해당 분류 페이지에 노출됩니다.
            </p>
          </div>
          {category === 'Other' ? (
            <div>
              <label className="block text-sm font-medium mb-2">Custom category</label>
              <Input
                value={categoryCustom}
                onChange={(e) => setCategoryCustom(e.target.value)}
                className="h-11 bg-background"
                placeholder="예: Sports"
              />
            </div>
          ) : null}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium mb-2">Brand</label>
            <Input
              value={brand}
              onChange={(e) => setBrand(e.target.value)}
              className="h-11 bg-background"
              placeholder="예: Apple, ESSENCE …"
            />
          </div>
          {category === 'Fashion' ? (
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-2">Sizes (의류)</label>
              <Input
                value={sizesCsv}
                onChange={(e) => setSizesCsv(e.target.value)}
                className="h-11 bg-background"
                placeholder="예: XS, S, M, L, XL 또는 90, 95, 100"
              />
              <p className="text-xs text-muted-foreground mt-2">
                쉼표로 구분해 입력하면 상품 페이지에서 사이즈를 고를 수 있습니다. Fashion 카테고리일 때만 적용됩니다.
              </p>
            </div>
          ) : null}
          <div className="md:col-span-2 flex flex-wrap gap-6">
            <label className="inline-flex items-center gap-2 text-sm cursor-pointer">
              <input type="checkbox" checked={isNew} onChange={(e) => setIsNew(e.target.checked)} className="rounded border-border" />
              New arrivals 컬렉션에 표시
            </label>
            <label className="inline-flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={isBestSeller}
                onChange={(e) => setIsBestSeller(e.target.checked)}
                className="rounded border-border"
              />
              Best sellers 컬렉션에 표시
            </label>
            <label className="inline-flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={createFastDelivery}
                onChange={(e) => setCreateFastDelivery(e.target.checked)}
                className="rounded border-border"
              />
              Express 배지 표시
            </label>
          </div>
        </div>

        <div className="mt-4">
          <Button disabled={busy || !title.trim()} onClick={create} className="h-11">
            {busy ? 'Creating…' : 'Create product'}
          </Button>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-5 md:p-6 shadow-sm">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-4">Existing products</h3>
        {products.length === 0 ? (
          <p className="text-sm text-muted-foreground">No products found.</p>
        ) : (
          <div className="space-y-3">
            {products.map((p) => (
              <div key={p._id} className="rounded-xl border border-border/70 bg-background p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="h-12 w-12 rounded-lg bg-secondary overflow-hidden border border-border/60 shrink-0">
                      {p.imageUrl ? (
                        <img src={p.imageUrl} alt="" className="h-full w-full object-cover" loading="lazy" />
                      ) : null}
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold line-clamp-2 sm:line-clamp-1">{p.title}</p>
                      <p className="text-sm text-muted-foreground mt-1 tabular-nums">
                        ${p.price.toFixed(2)} · stock {p.stock}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1 break-words">
                        {[p.category || '—', p.brand || '—'].join(' · ')}
                        {p.sizes?.length ? ` · sizes: ${p.sizes.join('/')}` : ''}
                        {(p.images?.length || 0) > 1 ? ` 갤러리 ${p.images?.length}장` : ''}
                        {p.colors?.length ? ` · 색상 ${p.colors.join('/')}` : ''}
                        {p.isNew ? ' · New' : ''}
                        {p.isBestSeller ? ' · Best' : ''}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-col-reverse sm:flex-row gap-2 w-full sm:w-auto sm:shrink-0 sm:justify-end">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={busy}
                      onClick={() => setEditing(p)}
                      className="w-full sm:w-auto h-10 justify-center"
                    >
                      <Pencil className="h-4 w-4 mr-2 shrink-0" />
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={busy}
                      onClick={() => remove(p._id)}
                      className="w-full sm:w-auto h-10 justify-center"
                    >
                      <Trash2 className="h-4 w-4 mr-2 shrink-0" />
                      Delete
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {editing ? (
        <div
          className="fixed inset-0 z-50 flex flex-col md:items-center md:justify-center md:p-4 bg-black/65 backdrop-blur-[2px]"
          role="dialog"
          aria-modal="true"
          aria-labelledby="admin-edit-product-title"
        >
          <div className="mt-auto md:mt-0 flex flex-col w-full max-w-3xl max-h-[min(100dvh,900px)] md:max-h-[92vh] rounded-t-2xl md:rounded-2xl border border-border bg-card shadow-xl overflow-hidden">
            <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-border shrink-0 md:px-5">
              <h4 id="admin-edit-product-title" className="text-base font-semibold truncate pr-2">
                Edit product
              </h4>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-10 w-10 p-0 shrink-0"
                disabled={busy}
                onClick={() => setEditing(null)}
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            <div className="overflow-y-auto flex-1 px-4 py-4 md:px-5 md:py-5 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-2">Title</label>
                  <Input value={eTitle} onChange={(e) => setETitle(e.target.value)} className="h-11 bg-background" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-2">Description</label>
                  <textarea
                    value={eDescription}
                    onChange={(e) => setEDescription(e.target.value)}
                    rows={3}
                    className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/40"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-2">Images & colors</label>
                  <VariantRowsEditor rows={eVariantRows} onChange={setEVariantRows} disabled={busy} />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-2">Features (one line each)</label>
                  <textarea
                    value={eFeaturesText}
                    onChange={(e) => setEFeaturesText(e.target.value)}
                    rows={3}
                    className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/40"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Price</label>
                  <Input value={ePrice} onChange={(e) => setEPrice(e.target.value)} className="h-11 bg-background" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Stock</label>
                  <Input value={eStock} onChange={(e) => setEStock(e.target.value)} className="h-11 bg-background" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Original price (optional)</label>
                  <Input
                    value={eOriginalPrice}
                    onChange={(e) => setEOriginalPrice(e.target.value)}
                    className="h-11 bg-background"
                    placeholder="비우면 정가 없음"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Rating / Reviews</label>
                  <div className="flex gap-2">
                    <Input
                      value={eRating}
                      onChange={(e) => setERating(e.target.value)}
                      className="h-11 bg-background"
                      placeholder="0–5"
                    />
                    <Input
                      value={eReviews}
                      onChange={(e) => setEReviews(e.target.value)}
                      className="h-11 bg-background"
                      placeholder="reviews"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Category</label>
                  <select
                    value={eCategory}
                    onChange={(e) => setECategory(e.target.value as (typeof ADMIN_PRODUCT_CATEGORIES)[number])}
                    className="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm"
                  >
                    {ADMIN_PRODUCT_CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
                {eCategory === 'Other' ? (
                  <div>
                    <label className="block text-sm font-medium mb-2">Custom category</label>
                    <Input
                      value={eCategoryCustom}
                      onChange={(e) => setECategoryCustom(e.target.value)}
                      className="h-11 bg-background"
                    />
                  </div>
                ) : null}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-2">Brand</label>
                  <Input value={eBrand} onChange={(e) => setEBrand(e.target.value)} className="h-11 bg-background" />
                </div>
                {eCategory === 'Fashion' ? (
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium mb-2">Sizes</label>
                    <Input value={eSizesCsv} onChange={(e) => setESizesCsv(e.target.value)} className="h-11 bg-background" />
                  </div>
                ) : null}
                <div className="md:col-span-2 flex flex-wrap gap-6">
                  <label className="inline-flex items-center gap-2 text-sm cursor-pointer">
                    <input type="checkbox" checked={eIsNew} onChange={(e) => setEIsNew(e.target.checked)} className="rounded border-border" />
                    New
                  </label>
                  <label className="inline-flex items-center gap-2 text-sm cursor-pointer">
                    <input
                      type="checkbox"
                      checked={eIsBestSeller}
                      onChange={(e) => setEIsBestSeller(e.target.checked)}
                      className="rounded border-border"
                    />
                    Best seller
                  </label>
                  <label className="inline-flex items-center gap-2 text-sm cursor-pointer">
                    <input
                      type="checkbox"
                      checked={eFastDelivery}
                      onChange={(e) => setEFastDelivery(e.target.checked)}
                      className="rounded border-border"
                    />
                    Express
                  </label>
                </div>
              </div>
            </div>

            <div className="flex flex-col-reverse sm:flex-row gap-2 sm:justify-end px-4 py-3 md:px-5 border-t border-border bg-card shrink-0">
              <Button type="button" variant="outline" className="h-11 w-full sm:w-auto" disabled={busy} onClick={() => setEditing(null)}>
                Cancel
              </Button>
              <Button type="button" className="h-11 w-full sm:w-auto" disabled={busy || !eTitle.trim()} onClick={saveEdit}>
                {busy ? 'Saving…' : 'Save changes'}
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
