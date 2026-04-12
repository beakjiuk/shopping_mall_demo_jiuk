import { Link } from 'react-router-dom'

export type FooterVariant = 'shop' | 'admin'

/** Where the shop footer is shown — drives PortOne line + short contextual note */
export type ShopFooterContext = 'browse' | 'cart' | 'checkout' | 'orders' | 'account' | 'wishlist' | 'inquiries'

const SHOP_FOOTER: Record<
  ShopFooterContext,
  {
    showPortOne: boolean
    hint: string
  }
> = {
  browse: {
    showPortOne: false,
    hint: '포트폴리오·데모용 스토어입니다. 표시 가격·재고는 예시일 수 있습니다.',
  },
  cart: {
    showPortOne: true,
    hint: '체크아웃 전 장바구니·배송 정보를 한 번 더 확인해 주세요.',
  },
  checkout: {
    showPortOne: true,
    hint: '결제 단계에서 PortOne·카드사·간편결제 화면이 열릴 수 있습니다.',
  },
  orders: {
    showPortOne: true,
    hint: '배송·취소 문의는 1:1 문의 메뉴를 이용해 주세요.',
  },
  account: {
    showPortOne: false,
    hint: '이메일은 로그인 ID이며 여기서는 변경되지 않습니다.',
  },
  wishlist: {
    showPortOne: false,
    hint: '찜한 상품은 로그인 계정에 연동됩니다.',
  },
  inquiries: {
    showPortOne: false,
    hint: '문의는 확인 후 순차 답변합니다. 주문번호를 적어 주시면 처리가 빨라집니다.',
  },
}

type FooterProps = {
  variant?: FooterVariant
  context?: ShopFooterContext
}

export default function Footer({ variant = 'shop', context = 'browse' }: FooterProps) {
  const year = new Date().getFullYear()

  if (variant === 'admin') {
    return (
      <footer className="mt-auto bg-card border-t border-border max-md:pb-[max(1rem,env(safe-area-inset-bottom,0px))]">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-muted-foreground">
            <p className="text-center sm:text-left">
              &copy; {year}{' '}
              <span className="font-semibold text-foreground">LUXE</span>
              <span className="text-muted-foreground/80"> · 관리자</span>
            </p>
            <Link
              to="/"
              className="text-xs text-center sm:text-right font-medium text-foreground/90 hover:text-accent transition-colors"
            >
              고객 스토어로
            </Link>
          </div>
        </div>
      </footer>
    )
  }

  const { showPortOne, hint } = SHOP_FOOTER[context]

  return (
    <footer className="mt-auto bg-card border-t border-border max-md:pb-[max(0.75rem,env(safe-area-inset-bottom,0px))]">
      <div className="container mx-auto px-4 py-6 md:py-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between lg:gap-8">
          <div className="text-sm text-muted-foreground text-center lg:text-left shrink-0">
            <p>
              &copy; {year}{' '}
              <Link to="/" className="font-semibold text-foreground hover:text-accent transition-colors">
                LUXE
              </Link>
              <span className="text-muted-foreground">. All rights reserved.</span>
            </p>
          </div>
          <div className="flex-1 min-w-0 space-y-2 text-xs text-muted-foreground text-center lg:text-right max-w-2xl lg:max-w-xl lg:ml-auto">
            {showPortOne ? (
              <p className="text-foreground/90">
                결제는 <span className="font-medium">PortOne</span>을 통해 안전하게 처리됩니다.
              </p>
            ) : null}
            <p>{hint}</p>
          </div>
        </div>
      </div>
    </footer>
  )
}
