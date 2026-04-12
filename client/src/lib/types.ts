export type User = { id: string; email: string; name: string; role: 'user' | 'admin' };

export type AdminUser = {
  _id: string;
  email: string;
  name: string;
  role: 'user' | 'admin';
  disabled: boolean;
  createdAt: string;
};

export type Product = {
  _id: string;
  title: string;
  description: string;
  price: number;
  imageUrl: string;
  stock: number;
  /** ISO date from API; used for newest-first catalog ordering */
  createdAt?: string;
  brand?: string;
  category?: string;
  rating?: number;
  reviews?: number;
  originalPrice?: number | null;
  isNew?: boolean;
  isBestSeller?: boolean;
  /** When true, home Featured section lists this product first (up to 8 slots total). */
  featuredHome?: boolean;
  fastDelivery?: boolean;
  images?: string[];
  features?: string[];
  colors?: string[];
  sizes?: string[];
};

export type CartItem = { productId: string; quantity: number; size?: string; product: Product | null };

export type OrderItem = { productId: string; title: string; price: number; quantity: number; size?: string };
export type Order = {
  _id: string;
  items: OrderItem[];
  total: number;
  payAmountKrw?: number | null;
  portoneMerchantUid?: string;
  portoneImpUid?: string;
  shippingMethod?: 'standard' | 'express';
  status: 'created' | 'paid' | 'fulfilment' | 'shipped' | 'delivered' | 'cancelled' | 'refunded';
  shipping?: {
    carrier?: string;
    trackingNumber?: string;
    memo?: string;
    updatedAt?: string | null;
  };
  createdAt: string;
};

export type InquiryMessage = { role: 'user' | 'admin'; body: string; createdAt: string };
export type Inquiry = {
  _id: string;
  userId: string;
  subject: string;
  status: 'open' | 'answered' | 'closed';
  messages: InquiryMessage[];
  createdAt: string;
  updatedAt: string;
};

