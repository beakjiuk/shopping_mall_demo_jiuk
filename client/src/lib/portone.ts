import PortOne from '@portone/browser-sdk/v2';
import { PaymentCurrency } from '@portone/browser-sdk/v2';
import { PaymentPayMethod } from '@portone/browser-sdk/v2';
import type { Customer } from '@portone/browser-sdk/v2';
import type { PaymentRequest } from '@portone/browser-sdk/v2';
import type { PaymentResponse } from '@portone/browser-sdk/v2';

/** Vite는 `import.meta.env.VITE_*` 를 문자열로 정적으로 치환한다. 동적 키 접근은 빈 값이 된다. */
export function getPortOneStoreId(): string {
  const v = import.meta.env.VITE_PORTONE_STORE_ID;
  const s = typeof v === 'string' ? v.trim() : '';
  if (!s) throw new Error('VITE_PORTONE_STORE_ID_MISSING');
  return s;
}

export function getPortOneChannelKey(): string {
  const v = import.meta.env.VITE_PORTONE_CHANNEL_KEY;
  const s = typeof v === 'string' ? v.trim() : '';
  if (!s) throw new Error('VITE_PORTONE_CHANNEL_KEY_MISSING');
  return s;
}

export async function requestPortOneCardPayment(input: {
  storeId: string;
  channelKey: string;
  paymentId: string;
  orderName: string;
  totalAmountKrw: number;
  customer?: Customer;
  redirectUrl?: string;
}): Promise<PaymentResponse | undefined> {
  const req = {
    storeId: input.storeId,
    channelKey: input.channelKey,
    paymentId: input.paymentId,
    orderName: input.orderName,
    totalAmount: input.totalAmountKrw,
    currency: PaymentCurrency.KRW,
    payMethod: PaymentPayMethod.CARD,
    customer: input.customer,
    redirectUrl: input.redirectUrl,
  } satisfies PaymentRequest;

  return await PortOne.requestPayment(req);
}
