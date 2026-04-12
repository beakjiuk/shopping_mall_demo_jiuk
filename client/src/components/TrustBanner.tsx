import { Clock, RotateCcw, Shield, Truck } from 'lucide-react'

const features = [
  { icon: Truck, title: 'Free Express Delivery', description: 'On orders over $100' },
  { icon: Shield, title: 'Secure Payment', description: '100% protected transactions' },
  { icon: RotateCcw, title: 'Easy Returns', description: '30-day return policy' },
  { icon: Clock, title: '24/7 Support', description: 'Dedicated customer service' },
]

export default function TrustBanner() {
  return (
    <section className="border-y border-border bg-card">
      <div className="container mx-auto px-4 pt-8 pb-3 max-md:pt-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8 max-md:gap-4">
          {features.map((feature, index) => (
            <div key={index} className="flex items-center gap-4 min-w-0 max-md:items-start max-md:gap-3">
              <div className="flex-shrink-0 w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center max-md:w-10 max-md:h-10">
                <feature.icon className="h-5 w-5 text-accent max-md:h-4 max-md:w-4" />
              </div>
              <div className="min-w-0">
                <h3 className="font-semibold text-sm lg:text-base max-md:text-xs max-md:leading-snug">{feature.title}</h3>
                <p className="text-xs lg:text-sm text-muted-foreground max-md:text-[11px] max-md:leading-snug max-md:mt-0.5">
                  {feature.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

