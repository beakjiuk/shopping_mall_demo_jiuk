import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, MapPin, Star, Trash2 } from 'lucide-react'
import StorefrontLayout from '../components/StorefrontLayout'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import { apiFetch } from '../lib/api'
import type { Address } from '../lib/types'
import { useToast } from '../components/ToastHost'
import { useAuth } from '../context/AuthContext'

export default function AddressBookPage() {
  const { user } = useAuth()
  const { toast } = useToast()

  const [addresses, setAddresses] = useState<Address[]>([])
  const [loading, setLoading] = useState(false)
  const [busyId, setBusyId] = useState<string>('')

  const [label, setLabel] = useState('')
  const [recipientName, setRecipientName] = useState('')
  const [phone, setPhone] = useState('')
  const [address1, setAddress1] = useState('')
  const [address2, setAddress2] = useState('')
  const [city, setCity] = useState('')
  const [stateRegion, setStateRegion] = useState('')
  const [zip, setZip] = useState('')

  const canSave = useMemo(() => {
    return (
      recipientName.trim() &&
      phone.trim() &&
      address1.trim() &&
      city.trim() &&
      stateRegion.trim() &&
      zip.trim()
    )
  }, [recipientName, phone, address1, city, stateRegion, zip])

  const load = useCallback(async () => {
    if (!user) return
    setLoading(true)
    try {
      const res = await apiFetch<{ addresses: Address[] }>('/api/addresses', { auth: true })
      if (!res.ok) {
        toast({ title: 'Could not load addresses', description: res.error })
        return
      }
      setAddresses(res.addresses)
    } finally {
      setLoading(false)
    }
  }, [toast, user])

  useEffect(() => {
    if (!user) return
    setRecipientName(user.name || '')
  }, [user])

  useEffect(() => {
    void load()
  }, [load])

  async function createAddress() {
    if (!canSave) return
    const res = await apiFetch<{ address: Address }>('/api/addresses', {
      method: 'POST',
      auth: true,
      body: {
        label: label.trim(),
        recipientName: recipientName.trim(),
        phone: phone.trim(),
        address1: address1.trim(),
        address2: address2.trim(),
        city: city.trim(),
        stateRegion: stateRegion.trim(),
        zip: zip.trim(),
      },
    })
    if (!res.ok) {
      toast({ title: 'Could not save address', description: res.error })
      return
    }
    toast({ title: 'Saved', description: '배송지가 저장되었습니다.' })
    setLabel('')
    setRecipientName(user?.name || '')
    setPhone('')
    setAddress1('')
    setAddress2('')
    setCity('')
    setStateRegion('')
    setZip('')
    await load()
  }

  async function setDefault(id: string) {
    setBusyId(id)
    try {
      const res = await apiFetch<{ address: Address }>(`/api/addresses/${encodeURIComponent(id)}/default`, { method: 'POST', auth: true })
      if (!res.ok) {
        toast({ title: 'Could not update', description: res.error })
        return
      }
      await load()
    } finally {
      setBusyId('')
    }
  }

  async function remove(id: string) {
    setBusyId(id)
    try {
      const res = await apiFetch<{ deleted: true }>(`/api/addresses/${encodeURIComponent(id)}`, { method: 'DELETE', auth: true })
      if (!res.ok) {
        toast({ title: 'Could not delete', description: res.error })
        return
      }
      await load()
    } finally {
      setBusyId('')
    }
  }

  return (
    <StorefrontLayout footerContext="account">
      <div className="container mx-auto px-4 py-8">
        <Link to="/account" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-6">
          <ArrowLeft className="h-4 w-4" />
          Back to Account
        </Link>

        <div className="flex items-start justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold">Address book</h1>
            <p className="text-sm text-muted-foreground mt-1">결제 시 선택할 배송지를 저장/관리합니다.</p>
          </div>
          <Link to="/checkout">
            <Button variant="secondary">Go to checkout</Button>
          </Link>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          <div className="rounded-xl border border-border bg-card p-6 space-y-4">
            <div className="flex items-center gap-2 text-accent">
              <MapPin className="h-4 w-4" />
              <h2 className="text-sm font-medium uppercase tracking-wide">Add new address</h2>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Label (optional)</label>
              <Input value={label} onChange={(e) => setLabel(e.target.value)} className="h-11 bg-background" placeholder="Home" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Recipient</label>
              <Input value={recipientName} onChange={(e) => setRecipientName(e.target.value)} className="h-11 bg-background" required />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Phone</label>
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} className="h-11 bg-background" inputMode="tel" required />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Address line 1</label>
              <Input value={address1} onChange={(e) => setAddress1(e.target.value)} className="h-11 bg-background" required />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Address line 2 (optional)</label>
              <Input value={address2} onChange={(e) => setAddress2(e.target.value)} className="h-11 bg-background" />
            </div>
            <div className="grid grid-cols-3 max-md:grid-cols-1 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">City</label>
                <Input value={city} onChange={(e) => setCity(e.target.value)} className="h-11 bg-background" required />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">State</label>
                <Input value={stateRegion} onChange={(e) => setStateRegion(e.target.value)} className="h-11 bg-background" required />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">ZIP</label>
                <Input value={zip} onChange={(e) => setZip(e.target.value)} className="h-11 bg-background" required />
              </div>
            </div>

            <Button type="button" className="w-full h-11" disabled={!canSave || loading} onClick={() => void createAddress()}>
              Save address
            </Button>
          </div>

          <div className="space-y-4">
            <h2 className="text-sm font-medium uppercase tracking-wide text-muted-foreground">Saved addresses</h2>
            {loading ? (
              <div className="text-sm text-muted-foreground">Loading…</div>
            ) : addresses.length === 0 ? (
              <div className="rounded-xl border border-border bg-secondary/30 p-6 text-sm text-muted-foreground">
                아직 저장된 배송지가 없습니다.
              </div>
            ) : (
              <div className="space-y-3">
                {addresses.map((a) => (
                  <div key={a._id} className="rounded-xl border border-border bg-card p-4">
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
                      <div className="flex items-center gap-2 shrink-0">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          disabled={busyId === a._id}
                          onClick={() => void setDefault(a._id)}
                          className="gap-2"
                        >
                          <Star className="h-4 w-4" />
                          Default
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          disabled={busyId === a._id}
                          onClick={() => void remove(a._id)}
                          className="gap-2 text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                          Delete
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </StorefrontLayout>
  )
}

