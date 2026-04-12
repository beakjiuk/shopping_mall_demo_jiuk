import { Link } from 'react-router-dom'
import StorefrontLayout from '../components/StorefrontLayout'

export default function TermsPage() {
  return (
    <StorefrontLayout footerContext="browse">
      <div className="mx-auto max-w-3xl px-4 py-12 sm:py-16">
        <p className="text-sm text-muted-foreground mb-2">LUXE 쇼핑몰</p>
        <h1 className="text-3xl font-semibold tracking-tight mb-8">서비스 이용약관</h1>
        <article className="text-sm text-muted-foreground leading-relaxed space-y-6">
          <p>
            본 약관은 데모 목적의 요약 문구입니다. 실제 서비스에서는 법무 검토를 거친 약관·개인정보처리방침을 게시하고 버전·시행일을
            명시하는 것이 좋습니다.
          </p>
          <section className="space-y-2">
            <h2 className="text-base font-semibold text-foreground">제1조 (목적)</h2>
            <p>
              이 약관은 LUXE(이하 &quot;몰&quot;)가 제공하는 온라인 쇼핑 관련 서비스의 이용과 회원의 권리·의무 및 책임사항을 규정함을
              목적으로 합니다.
            </p>
          </section>
          <section className="space-y-2">
            <h2 className="text-base font-semibold text-foreground">제2조 (서비스의 제공)</h2>
            <p>
              몰은 상품 정보 열람, 장바구니, 주문·결제, 회원 정보 관리 등 전자상거래에 부합하는 기능을 제공합니다. 서비스 내용은 운영
              정책에 따라 변경될 수 있습니다.
            </p>
          </section>
          <section className="space-y-2">
            <h2 className="text-base font-semibold text-foreground">제3조 (회원의 의무)</h2>
            <p>
              회원은 관계 법령, 본 약관, 공지 및 안내 사항을 준수해야 하며, 타인의 권리를 침해하거나 서비스 운영을 방해해서는 안 됩니다.
              계정 정보의 관리 책임은 회원에게 있습니다.
            </p>
          </section>
          <section className="space-y-2">
            <h2 className="text-base font-semibold text-foreground">제4조 (면책)</h2>
            <p>
              천재지변, 시스템 점검, 통신 장애 등 불가항력으로 인한 서비스 중단에 대해 몰은 고의 또는 중대한 과실이 없는 한 책임을 지지
              않을 수 있습니다.
            </p>
          </section>
        </article>
        <p className="mt-10 text-sm">
          <Link to="/register" className="text-accent font-medium hover:underline">
            회원가입으로 돌아가기
          </Link>
        </p>
      </div>
    </StorefrontLayout>
  )
}
