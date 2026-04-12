import HeroSection from '../components/HeroSection'
import StorefrontLayout from '../components/StorefrontLayout'
import TrustBanner from '../components/TrustBanner'
import ProductGrid from '../components/ProductGrid'

export default function HomePage() {
  return (
    <StorefrontLayout footerContext="browse">
      <div>
        <HeroSection />
        <TrustBanner />
        <ProductGrid />
      </div>
    </StorefrontLayout>
  )
}

