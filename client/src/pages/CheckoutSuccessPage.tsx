import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { CheckCircle2, Package, Truck } from 'lucide-react'
import Header from '../components/Header'
import Button from '../components/ui/Button'

export default function CheckoutSuccessPage() {
  const [sp] = useSearchParams()
  const orderId = sp.get('orderId') || ''
  const [fallbackSuffix] = useState(() => Date.now().toString().slice(-8))
  const orderNumber = orderId ? `ORD-${orderId.slice(-8).toUpperCase()}` : `ORD-${fallbackSuffix}`

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-16">
        <div className="max-w-lg mx-auto text-center">
          <div className="w-20 h-20 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="h-10 w-10 text-accent" />
          </div>

          <h1 className="text-3xl font-bold mb-2">Order Confirmed!</h1>
          <p className="text-muted-foreground mb-8">
            Thank you for your purchase. Your order has been received and is being processed.
          </p>

          <div className="bg-card border border-border rounded-xl p-6 mb-8">
            <p className="text-sm text-muted-foreground mb-1">Order Number</p>
            <p className="text-2xl font-bold font-mono">{orderNumber}</p>
          </div>

          <div className="bg-card border border-border rounded-xl p-6 mb-8 text-left">
            <h2 className="font-semibold mb-4">What happens next?</h2>
            <div className="space-y-4">
              <div className="flex gap-4">
                <div className="w-10 h-10 bg-accent/10 rounded-full flex items-center justify-center shrink-0">
                  <CheckCircle2 className="h-5 w-5 text-accent" />
                </div>
                <div>
                  <p className="font-medium">Order Confirmed</p>
                  <p className="text-sm text-muted-foreground">We&apos;ve received your order and will start processing it soon.</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="w-10 h-10 bg-secondary rounded-full flex items-center justify-center shrink-0">
                  <Package className="h-5 w-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="font-medium">Preparing Your Order</p>
                  <p className="text-sm text-muted-foreground">Your items are being carefully packed.</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="w-10 h-10 bg-secondary rounded-full flex items-center justify-center shrink-0">
                  <Truck className="h-5 w-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="font-medium">On the Way</p>
                  <p className="text-sm text-muted-foreground">You&apos;ll receive tracking information once shipped.</p>
                </div>
              </div>
            </div>
          </div>

          <p className="text-sm text-muted-foreground mb-8">
            A confirmation email has been sent to your email address with your order details.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/products">
              <Button variant="outline" size="lg">
                Continue Shopping
              </Button>
            </Link>
            <Link to="/">
              <Button variant="secondary" size="lg">
                Back to Home
              </Button>
            </Link>
          </div>
        </div>
      </main>
    </div>
  )
}

