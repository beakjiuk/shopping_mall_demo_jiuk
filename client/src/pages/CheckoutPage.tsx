import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { ArrowLeft, Check, CreditCard, Lock, ShoppingBag, Truck } from 'lucide-react'
import StorefrontLayout from '../components/StorefrontLayout'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import { apiFetch } from '../lib/api'
import type { Address, CartItem, Order } from '../lib/types'
import { useToast } from '../components/ToastHost'
import SafeProductImage from '../components/SafeProductImage'
import { getPortOneChannelKey, getPortOneStoreId, requestPortOneCardPayment } from '../lib/portone'
import { useAuth } from '../context/AuthContext'
const steps = ['Shipping', 'Payment', 'Review'] as const

function isLikelyMobileUserAgent(): boolean {
  if (typeof navigator === 'undefined') return false
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
}

export default function CheckoutPage() {
  const nav = useNavigate()
  const [searchParams] = useSearchParams()
  const resumeId = (searchParams.get('resume') || '').trim()
  const { toast } = useToast()
  const { user } = useAuth()
  const [items, setItems] = useState<CartItem[]>([])
  const [resumeOrder, setResumeOrder] = useState<Order | null>(null)
  const [resumeLoading, setResumeLoading] = useState(!!resumeId)
  const [busy, setBusy] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)
  const [shippingMethod, setShippingMethod] = useState<'standard' | 'express'>('standard')

  // Checkout form (used for PortOne buyer fields)
  const [contactEmail, setContactEmail] = useState(user?.email ?? '')
  const [firstName, setFirstName] = useState(() => (user?.name ? user.name.split(' ')[0] : ''))
  const [lastName, setLastName] = useState(() => (user?.name ? user.name.split(' ').slice(1).join(' ') : ''))
  const [addresses, setAddresses] = useState<Address[]>([])
  const [addressesLoading, setAddressesLoading] = useState(false)
  const [selectedAddressId, setSelectedAddressId] = useState<string>('')
  const [showNewAddressForm, setShowNewAddressForm] = useState(false)
  const [newLabel, setNewLabel] = useState('')
  const [newAddress1, setNewAddress1] = useState('')
  const [newAddress2, setNewAddress2] = useState('')
  const [newCity, setNewCity] = useState('')
  const [newStateRegion, setNewStateRegion] = useState('')
  const [newZip, setNewZip] = useState('')
  const [newPhone, setNewPhone] = useState('')

  const subtotal = useMemo(() => {
    if (resumeOrder) return resumeOrder.items.reduce((s, i) => s + i.price * i.quantity, 0)
    let t = 0
    for (const i of items) if (i.product) t += i.product.price * i.quantity
    return t
  }, [resumeOrder, items])

  const lockedShipping: 'standard' | 'express' = resumeOrder
    ? resumeOrder.shippingMethod || 'standard'
    : shippingMethod
  /** 데모/테스트: 이벤트 무료 배송 — 서버 주문 합계와 동일하게 0 */
  const shippingCost = 0
  const tax = subtotal * 0.08
  const total = subtotal + shippingCost + tax
  const displayTotal = resumeOrder ? resumeOrder.total : total

  const load = useCallback(async () => {
    const res = await apiFetch<{ cart: { items: CartItem[] } }>('/api/cart', { auth: true })
    if (!res.ok) return
    setItems(res.cart.items)
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const loadAddresses = useCallback(async () => {
    if (!user) return
    setAddressesLoading(true)
    try {
      const res = await apiFetch<{ addresses: Address[] }>('/api/addresses', { auth: true })
      if (!res.ok) {
        toast({ title: 'Could not load addresses', description: res.error })
        return
      }
      setAddresses(res.addresses)
      const preferred =
        res.addresses.find((a) => a.isDefault) ||
        (resumeOrder?.shippingAddressId ? res.addresses.find((a) => a._id === resumeOrder.shippingAddressId) : null) ||
        res.addresses[0] ||
        null
      setSelectedAddressId((prev) => prev || preferred?._id || '')
      setShowNewAddressForm(res.addresses.length === 0)
    } finally {
      setAddressesLoading(false)
    }
  }, [toast, user, resumeOrder?.shippingAddressId])

  useEffect(() => {
    void loadAddresses()
  }, [loadAddresses])

  const selectedAddress = useMemo(
    () => addresses.find((a) => a._id === selectedAddressId) || null,
    [addresses, selectedAddressId],
  )

  async function saveNewAddress() {
    if (!user) return
    const recipientName = `${firstName} ${lastName}`.trim() || user.name
    const body = {
      label: newLabel.trim(),
      recipientName,
      phone: newPhone.trim(),
      address1: newAddress1.trim(),
      address2: newAddress2.trim(),
      city: newCity.trim(),
      stateRegion: newStateRegion.trim(),
      zip: newZip.trim(),
      isDefault: addresses.length === 0,
    }
    const res = await apiFetch<{ address: Address }>('/api/addresses', { method: 'POST', auth: true, body })
    if (!res.ok) {
      toast({ title: 'Could not save address', description: res.error })
      return
    }
    toast({ title: 'Saved', description: '배송지가 저장되었습니다.' })
    setNewLabel('')
    setNewAddress1('')
    setNewAddress2('')
    setNewCity('')
    setNewStateRegion('')
    setNewZip('')
    setNewPhone('')
    setShowNewAddressForm(false)
    await loadAddresses()
    setSelectedAddressId(res.address._id)
  }

  useEffect(() => {
    if (!resumeId) {
      setResumeOrder(null)
      setResumeLoading(false)
      return
    }
    let cancelled = false
    ;(async () => {
      setResumeLoading(true)
      const res = await apiFetch<{ order: Order }>(`/api/orders/${encodeURIComponent(resumeId)}`, { auth: true })
      if (cancelled) return
      if (!res.ok || res.order.status !== 'created') {
        setResumeOrder(null)
        setResumeLoading(false)
        toast({
          title: 'Cannot resume checkout',
          description: !res.ok ? res.error : 'This order is already paid or closed.',
        })
        nav('/checkout', { replace: true })
        return
      }
      setResumeOrder(res.order)
      setShippingMethod(res.order.shippingMethod || 'standard')
      setResumeLoading(false)
    })()
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only re-fetch when resume id changes
  }, [resumeId])

  async function placeOrder() {
    if (!user) {
      toast({ title: 'Sign in required', description: 'Please log in to complete checkout.' })
      return
    }
    setBusy(true)
    try {
      let order: Order

      if (resumeId && resumeOrder) {
        const latest = await apiFetch<{ order: Order }>(`/api/orders/${encodeURIComponent(resumeOrder._id)}`, {
          auth: true,
        })
        if (!latest.ok) throw new Error(latest.error)
        if (latest.order.status !== 'created') throw new Error('ORDER_NOT_PAYABLE')
        order = latest.order

        // Legacy created orders may not have a shipping address yet.
        if (!order.shippingAddressId) {
          if (!selectedAddressId) throw new Error('SHIPPING_ADDRESS_REQUIRED')
          const attachRes = await apiFetch<{ order: Order }>(`/api/orders/${encodeURIComponent(order._id)}/address`, {
            method: 'POST',
            auth: true,
            body: { addressId: selectedAddressId },
          })
          if (!attachRes.ok) throw new Error(attachRes.error)
          order = attachRes.order
        }
      } else {
        if (!selectedAddressId) throw new Error('SHIPPING_ADDRESS_REQUIRED')
        const createRes = await apiFetch<{ order: Order }>('/api/orders', {
          method: 'POST',
          auth: true,
          body: { shippingMethod, addressId: selectedAddressId },
        })
        if (!createRes.ok) throw new Error(createRes.error)
        order = createRes.order
      }
      const payAmount = order.payAmountKrw
      const paymentId = order.portoneMerchantUid
      if (payAmount == null || !paymentId) {
        throw new Error('ORDER_MISSING_PAYMENT_INFO')
      }

      const buyer_name = `${firstName} ${lastName}`.trim() || user.name
      const buyer_addr1 = (selectedAddress?.address1 || '').trim()
      const buyer_addr2 = [selectedAddress?.address2 || '', selectedAddress?.city || '', selectedAddress?.stateRegion || '']
        .map((s) => String(s).trim())
        .filter(Boolean)
        .join(', ')
      const buyer_postcode = (selectedAddress?.zip || '').trim()
      const buyer_tel = (selectedAddress?.phone || '').trim()

      const storeId = getPortOneStoreId()
      const channelKey = getPortOneChannelKey()

      const redirectUrl = isLikelyMobileUserAgent()
        ? `${window.location.origin}/checkout/portone/redirect?orderId=${encodeURIComponent(order._id)}`
        : undefined

      const customer = {
        email: (contactEmail || user.email).trim(),
        fullName: buyer_name,
        ...(buyer_tel ? { phoneNumber: buyer_tel } : {}),
        ...(buyer_postcode ? { zipcode: buyer_postcode } : {}),
        ...(buyer_addr1
          ? {
              address: {
                addressLine1: buyer_addr1,
                addressLine2: buyer_addr2 || ' ',
                ...(String(selectedAddress?.city || '').trim() ? { city: String(selectedAddress?.city || '').trim() } : {}),
                ...(String(selectedAddress?.stateRegion || '').trim()
                  ? { province: String(selectedAddress?.stateRegion || '').trim() }
                  : {}),
              },
            }
          : {}),
      }

      const pay = await requestPortOneCardPayment({
        storeId,
        channelKey,
        paymentId,
        orderName: 'LUXE 주문',
        totalAmountKrw: payAmount,
        customer,
        redirectUrl,
      })

      // Redirect flows may not resolve a response; the redirect page completes confirmation.
      if (!pay) return

      if (pay.code) {
        toast({
          title: '결제 취소 또는 실패',
          description: pay.message || pay.code,
        })
        return
      }

      const confirmRes = await apiFetch<{ order: Order }>(`/api/orders/${order._id}/portone/confirm`, {
        method: 'POST',
        auth: true,
        body: { paymentId: pay.paymentId },
      })
      if (!confirmRes.ok) {
        throw new Error(confirmRes.error)
      }

      toast({ title: '결제 완료', description: `주문번호 ${order._id}` })
      nav(`/checkout/success?orderId=${encodeURIComponent(order._id)}`)
    } catch (e) {
      const msg = String(e)
      if (msg.includes('SHIPPING_ADDRESS_REQUIRED')) {
        toast({ title: '배송지 필요', description: '결제 전에 배송지를 저장하고 선택해주세요.' })
        setCurrentStep(0)
      } else {
        toast({ title: '주문 처리 실패', description: msg })
      }
    } finally {
      setBusy(false)
    }
  }

  async function onContinue(e: React.FormEvent) {
    e.preventDefault()
    if (currentStep === 0) {
      if (!selectedAddressId) {
        toast({ title: '배송지 필요', description: '결제 전에 배송지를 선택하거나 새로 저장해주세요.' })
        return
      }
    }
    if (currentStep < steps.length - 1) setCurrentStep((s) => s + 1)
    else await placeOrder()
  }

  if (resumeId && resumeLoading) {
    return (
      <StorefrontLayout footerContext="checkout">
        <div className="container mx-auto px-4 py-24 text-center text-muted-foreground">Loading your order…</div>
      </StorefrontLayout>
    )
  }

  if (!resumeOrder && items.length === 0) {
    return (
      <StorefrontLayout footerContext="checkout">
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-md mx-auto text-center">
            <div className="w-24 h-24 bg-secondary rounded-full flex items-center justify-center mx-auto mb-6">
              <ShoppingBag className="h-12 w-12 text-muted-foreground" />
            </div>
            <h1 className="text-2xl font-bold mb-2">Your cart is empty</h1>
            <p className="text-muted-foreground mb-8">Add some items to your cart before checking out.</p>
            <Link to="/products">
              <Button variant="secondary" size="lg" className="gap-2">
                <ShoppingBag className="h-5 w-5" />
                Continue Shopping
              </Button>
            </Link>
          </div>
        </div>
      </StorefrontLayout>
    )
  }

  return (
    <StorefrontLayout footerContext="checkout">
      <div className="container mx-auto px-4 py-8 max-md:py-6">
        <Link
          to={resumeOrder ? '/orders' : '/cart'}
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-8 max-md:mb-6 max-md:min-h-10 max-md:text-sm"
        >
          <ArrowLeft className="h-4 w-4" />
          {resumeOrder ? 'Back to orders' : 'Back to Cart'}
        </Link>

        {resumeOrder ? (
          <p className="text-sm text-violet-600 dark:text-violet-400 mb-6 -mt-4 max-md:-mt-2 max-md:text-xs break-words">
            Completing payment for order <span className="font-mono">ORD-{resumeOrder._id.slice(-8).toUpperCase()}</span>
            . Shipping option is fixed for this order.
          </p>
        ) : null}

        <div className="mb-8 md:mb-12">
          <p className="text-center text-sm font-medium text-foreground md:hidden mb-1">
            Step {currentStep + 1} of {steps.length}
          </p>
          <p className="text-center text-xs text-muted-foreground md:hidden mb-4">{steps[currentStep]}</p>
          <div className="hidden md:flex items-center justify-center gap-4">
            {steps.map((step, index) => (
              <div key={step} className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                      index < currentStep
                        ? 'bg-accent text-accent-foreground'
                        : index === currentStep
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-secondary text-muted-foreground'
                    }`}
                  >
                    {index < currentStep ? <Check className="h-4 w-4" /> : index + 1}
                  </div>
                  <span className={`text-sm font-medium ${index <= currentStep ? 'text-foreground' : 'text-muted-foreground'}`}>
                    {step}
                  </span>
                </div>
                {index < steps.length - 1 ? (
                  <div className={`w-16 h-0.5 ${index < currentStep ? 'bg-accent' : 'bg-border'}`} />
                ) : null}
              </div>
            ))}
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-12">
          <div>
            <form onSubmit={onContinue} className="space-y-8">
              {currentStep === 0 ? (
                <>
                  <div>
                    <h2 className="text-xl font-bold mb-6">Contact Information</h2>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium mb-2">Email</label>
                        <Input
                          value={contactEmail}
                          onChange={(e) => setContactEmail(e.target.value)}
                          placeholder="your@email.com"
                          className="max-md:min-h-11 max-md:text-base"
                          inputMode="email"
                          autoComplete="email"
                          required
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <h2 className="text-xl font-bold mb-6">Shipping Address</h2>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 max-md:grid-cols-1 gap-4">
                        <div>
                          <label className="block text-sm font-medium mb-2">First Name</label>
                          <Input value={firstName} onChange={(e) => setFirstName(e.target.value)} className="max-md:min-h-11 max-md:text-base" required />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-2">Last Name</label>
                          <Input value={lastName} onChange={(e) => setLastName(e.target.value)} className="max-md:min-h-11 max-md:text-base" required />
                        </div>
                      </div>

                      <div className="flex items-center justify-between gap-3">
                        <p className="text-sm text-muted-foreground">
                          결제 전 배송지를 <span className="text-foreground font-medium">저장</span>하고 선택해야 합니다.
                        </p>
                        <Button type="button" variant="outline" size="sm" disabled={addressesLoading} onClick={() => setShowNewAddressForm((v) => !v)}>
                          {showNewAddressForm ? 'Hide' : 'Add new'}
                        </Button>
                      </div>

                      {addressesLoading ? (
                        <div className="text-sm text-muted-foreground">Loading saved addresses…</div>
                      ) : addresses.length > 0 ? (
                        <div className="space-y-3">
                          {addresses.map((a) => {
                            const checked = a._id === selectedAddressId
                            return (
                              <button
                                key={a._id}
                                type="button"
                                onClick={() => setSelectedAddressId(a._id)}
                                className={`w-full text-left rounded-lg border p-4 transition-colors ${
                                  checked ? 'border-accent bg-accent/5' : 'border-border hover:border-accent/40'
                                }`}
                              >
                                <div className="flex items-start justify-between gap-4">
                                  <div className="min-w-0">
                                    <p className="font-medium truncate">
                                      {a.label?.trim() ? a.label : 'Saved address'}{' '}
                                      {a.isDefault ? <span className="text-xs text-accent ml-2">Default</span> : null}
                                    </p>
                                    <p className="text-sm text-muted-foreground mt-1">
                                      {a.recipientName} {a.phone ? `· ${a.phone}` : ''}
                                    </p>
                                    <p className="text-sm text-muted-foreground mt-1">
                                      {a.address1}
                                      {a.address2 ? `, ${a.address2}` : ''} · {a.city}, {a.stateRegion} {a.zip}
                                    </p>
                                  </div>
                                  <span className="mt-1 w-4 h-4 rounded-full border border-border flex items-center justify-center shrink-0">
                                    {checked ? <span className="w-2 h-2 rounded-full bg-accent" /> : null}
                                  </span>
                                </div>
                              </button>
                            )
                          })}
                        </div>
                      ) : (
                        <div className="rounded-lg border border-border bg-secondary/30 p-4 text-sm text-muted-foreground">
                          저장된 배송지가 없습니다. 아래에서 새 배송지를 저장해주세요.
                        </div>
                      )}

                      {showNewAddressForm ? (
                        <div className="rounded-xl border border-border bg-card p-4 space-y-4">
                          <div className="grid grid-cols-2 max-md:grid-cols-1 gap-4">
                            <div>
                              <label className="block text-sm font-medium mb-2">Label (optional)</label>
                              <Input value={newLabel} onChange={(e) => setNewLabel(e.target.value)} className="max-md:min-h-11 max-md:text-base" placeholder="Home" />
                            </div>
                            <div>
                              <label className="block text-sm font-medium mb-2">Phone</label>
                              <Input value={newPhone} onChange={(e) => setNewPhone(e.target.value)} className="max-md:min-h-11 max-md:text-base" inputMode="tel" required />
                            </div>
                          </div>

                          <div>
                            <label className="block text-sm font-medium mb-2">Address line 1</label>
                            <Input value={newAddress1} onChange={(e) => setNewAddress1(e.target.value)} className="max-md:min-h-11 max-md:text-base" required />
                          </div>
                          <div>
                            <label className="block text-sm font-medium mb-2">Address line 2 (optional)</label>
                            <Input value={newAddress2} onChange={(e) => setNewAddress2(e.target.value)} className="max-md:min-h-11 max-md:text-base" />
                          </div>
                          <div className="grid grid-cols-3 max-md:grid-cols-1 gap-4">
                            <div>
                              <label className="block text-sm font-medium mb-2">City</label>
                              <Input value={newCity} onChange={(e) => setNewCity(e.target.value)} className="max-md:min-h-11 max-md:text-base" required />
                            </div>
                            <div>
                              <label className="block text-sm font-medium mb-2">State</label>
                              <Input value={newStateRegion} onChange={(e) => setNewStateRegion(e.target.value)} className="max-md:min-h-11 max-md:text-base" required />
                            </div>
                            <div>
                              <label className="block text-sm font-medium mb-2">ZIP</label>
                              <Input value={newZip} onChange={(e) => setNewZip(e.target.value)} className="max-md:min-h-11 max-md:text-base" required />
                            </div>
                          </div>

                          <Button
                            type="button"
                            className="w-full"
                            variant="secondary"
                            disabled={
                              busy ||
                              !newPhone.trim() ||
                              !newAddress1.trim() ||
                              !newCity.trim() ||
                              !newStateRegion.trim() ||
                              !newZip.trim()
                            }
                            onClick={() => void saveNewAddress()}
                          >
                            Save address
                          </Button>
                        </div>
                      ) : null}
                    </div>
                  </div>

                  <div>
                    <h2 className="text-xl font-bold mb-6">Shipping Method</h2>
                    <p className="text-sm text-accent mb-3 rounded-lg border border-accent/30 bg-accent/5 px-3 py-2">
                      테스트 이벤트: 전 주문 무료 배송 (배송비 $0)
                    </p>
                    {resumeOrder ? (
                      <p className="text-xs text-muted-foreground mb-3">Locked — matches the amount stored on this order.</p>
                    ) : null}
                    <div className="space-y-3">
                      <button
                        type="button"
                        disabled={!!resumeOrder}
                        className={`w-full flex items-center justify-between p-4 rounded-lg border cursor-pointer transition-colors ${
                          lockedShipping === 'standard' ? 'border-accent bg-accent/5' : 'border-border hover:border-accent/50'
                        } ${resumeOrder ? 'opacity-80 cursor-not-allowed' : ''}`}
                        onClick={() => setShippingMethod('standard')}
                      >
                        <div className="flex items-center gap-3">
                          <span className="w-4 h-4 rounded-full border border-border flex items-center justify-center">
                            {lockedShipping === 'standard' ? <span className="w-2 h-2 rounded-full bg-accent" /> : null}
                          </span>
                          <div className="text-left">
                            <div className="font-medium">Standard Shipping</div>
                            <div className="text-sm text-muted-foreground">5-7 business days</div>
                          </div>
                        </div>
                        <span className="font-medium text-accent">Free</span>
                      </button>

                      <button
                        type="button"
                        disabled={!!resumeOrder}
                        className={`w-full flex items-center justify-between p-4 rounded-lg border cursor-pointer transition-colors ${
                          lockedShipping === 'express' ? 'border-accent bg-accent/5' : 'border-border hover:border-accent/50'
                        } ${resumeOrder ? 'opacity-80 cursor-not-allowed' : ''}`}
                        onClick={() => setShippingMethod('express')}
                      >
                        <div className="flex items-center gap-3">
                          <span className="w-4 h-4 rounded-full border border-border flex items-center justify-center">
                            {lockedShipping === 'express' ? <span className="w-2 h-2 rounded-full bg-accent" /> : null}
                          </span>
                          <div className="text-left">
                            <div className="font-medium">Express Shipping</div>
                            <div className="text-sm text-muted-foreground">2-3 business days</div>
                          </div>
                        </div>
                        <span className="font-medium text-accent">Free</span>
                      </button>
                    </div>
                  </div>
                </>
              ) : null}

              {currentStep === 1 ? (
                <div>
                  <h2 className="text-xl font-bold mb-6">Payment</h2>
                  <div className="p-4 rounded-lg border border-accent bg-accent/5 flex items-center gap-3">
                    <CreditCard className="h-5 w-5" />
                    <div>
                      <span className="font-medium">PortOne 결제</span>
                      <p className="text-xs text-muted-foreground mt-1">
                        V2 Browser SDK — storeId/channelKey는 <code className="text-foreground/80">VITE_PORTONE_*</code> 로 설정합니다.
                      </p>
                      <p className="text-sm text-muted-foreground mt-1">
                        마지막 단계에서 &quot;Place Order&quot;를 누르면 포트원 카드 결제창이 열립니다. 금액은 USD 합계를
                        환율로 환산한 KRW(원)로 청구됩니다.
                      </p>
                    </div>
                  </div>
                </div>
              ) : null}

              {currentStep === 2 ? (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-xl font-bold mb-4">Review</h2>
                    <div className="p-4 bg-card rounded-lg border border-border flex items-center gap-3">
                      <Truck className="h-5 w-5 text-accent" />
                      <div>
                        <p className="font-medium">{lockedShipping === 'express' ? 'Express' : 'Standard'} Shipping</p>
                        <p className="text-sm text-muted-foreground">
                          {lockedShipping === 'express' ? '2-3 business days' : '5-7 business days'}
                        </p>
                      </div>
                    </div>
                    <div className="p-4 bg-card rounded-lg border border-border flex items-center gap-3 mt-4">
                      <CreditCard className="h-5 w-5 text-accent" />
                      <div>
                        <p className="font-medium">Card</p>
                        <p className="text-sm text-muted-foreground">Secure checkout</p>
                      </div>
                    </div>
                  </div>
                </div>
              ) : null}

              <div className="flex gap-4 max-md:flex-col-reverse max-md:gap-3 pt-2">
                {currentStep > 0 ? (
                  <Button type="button" variant="outline" className="flex-1 max-md:min-h-12" onClick={() => setCurrentStep((s) => s - 1)}>
                    Back
                  </Button>
                ) : null}
                <Button type="submit" variant="secondary" size="lg" className="flex-1 max-md:min-h-12" disabled={busy}>
                  {busy ? 'Processing…' : currentStep === steps.length - 1 ? (
                    <>
                      <Lock className="h-4 w-4 mr-2" />
                      Place Order
                    </>
                  ) : (
                    'Continue'
                  )}
                </Button>
              </div>
            </form>
          </div>

          <div>
            <div className="sticky top-32 bg-card rounded-xl border border-border p-6 max-md:static max-md:top-auto max-md:p-4">
              <h2 className="text-xl font-bold mb-6 max-md:text-lg max-md:mb-4">Order Summary</h2>
              <div className="space-y-4 max-h-80 max-md:max-h-[min(42vh,18rem)] overflow-y-auto overscroll-contain mb-6 max-md:-mx-1 max-md:px-1">
                {resumeOrder
                  ? resumeOrder.items.map((item) => (
                      <div key={`${item.productId}::${(item.size || '').trim()}`} className="flex gap-4">
                        <div className="relative w-16 h-16 rounded-lg bg-secondary shrink-0 flex items-center justify-center">
                          <ShoppingBag className="h-6 w-6 text-muted-foreground" />
                          <div className="absolute -top-1 -right-1 w-5 h-5 bg-muted-foreground text-background rounded-full flex items-center justify-center text-xs font-medium">
                            {item.quantity}
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium line-clamp-2">{item.title}</p>
                          {item.size ? <p className="text-xs text-muted-foreground mt-0.5">Size: {item.size}</p> : null}
                        </div>
                        <p className="font-medium">${(item.price * item.quantity).toFixed(2)}</p>
                      </div>
                    ))
                  : items.map((item) => (
                      <div key={`${item.productId}::${(item.size || '').trim()}`} className="flex gap-4">
                        <div className="relative w-16 h-16 rounded-lg overflow-hidden bg-secondary shrink-0">
                          <SafeProductImage
                            src={item.product?.imageUrl}
                            alt={item.product?.title ?? 'Product'}
                            className="h-full w-full object-cover"
                          />
                          <div className="absolute -top-1 -right-1 w-5 h-5 bg-muted-foreground text-background rounded-full flex items-center justify-center text-xs font-medium">
                            {item.quantity}
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium line-clamp-1">{item.product?.title ?? 'Unknown product'}</p>
                          {item.product?.brand ? <p className="text-xs text-muted-foreground">{item.product.brand}</p> : null}
                          {item.size ? <p className="text-xs text-muted-foreground mt-0.5">Size: {item.size}</p> : null}
                        </div>
                        <p className="font-medium">${((item.product?.price ?? 0) * item.quantity).toFixed(2)}</p>
                      </div>
                    ))}
              </div>

              <div className="border-t border-border mb-6" />
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="font-medium">${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Shipping</span>
                  <span className="font-medium text-accent">Free</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tax</span>
                  <span className="font-medium">${tax.toFixed(2)}</span>
                </div>
              </div>
              <div className="border-t border-border my-6" />
              <div className="flex justify-between text-lg font-bold">
                <span>Total</span>
                <span>${displayTotal.toFixed(2)}</span>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                결제 시 포트원 청구 금액: 장바구니 합계·세금(8%)·무료배송 기준으로 서버가 환산한 KRW입니다. 테스트 결제는 승인 후 취소·환불 정책에 따라 잠시 승인됐다가 돌아올 수 있습니다.
              </p>
              <div className="flex items-center justify-center gap-2 mt-6 text-xs text-muted-foreground">
                <Lock className="h-3 w-3" />
                <span>Secure 256-bit SSL encryption</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </StorefrontLayout>
  )
}

