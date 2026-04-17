import mongoose from "mongoose";

const orderItemSchema = new mongoose.Schema(
  {
    productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
    title: { type: String, required: true },
    price: { type: Number, required: true },
    quantity: { type: Number, required: true, min: 1 },
    size: { type: String, default: "" }
  },
  { _id: false }
);

const shippingSchema = new mongoose.Schema(
  {
    carrier: { type: String, default: "" },
    trackingNumber: { type: String, default: "" },
    memo: { type: String, default: "" },
    updatedAt: { type: Date, default: null }
  },
  { _id: false }
);

const shippingAddressSchema = new mongoose.Schema(
  {
    label: { type: String, default: "" },
    recipientName: { type: String, default: "" },
    phone: { type: String, default: "" },
    address1: { type: String, default: "" },
    address2: { type: String, default: "" },
    city: { type: String, default: "" },
    stateRegion: { type: String, default: "" },
    zip: { type: String, default: "" }
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    items: { type: [orderItemSchema], default: [] },
    total: { type: Number, required: true, min: 0 },
    payAmountKrw: { type: Number, default: null },
    portoneMerchantUid: { type: String, default: "" },
    portoneImpUid: { type: String, default: "" },
    /** Checkout에서 선택한 배송 — 재결제 시 금액 일치용 (기존 주문은 기본 standard) */
    shippingMethod: { type: String, enum: ["standard", "express"], default: "standard" },
    shippingAddressId: { type: mongoose.Schema.Types.ObjectId, ref: "Address", default: null },
    shippingAddress: { type: shippingAddressSchema, default: null },
    status: {
      type: String,
      enum: ["created", "paid", "fulfilment", "shipped", "delivered", "cancelled", "refunded"],
      default: "created"
    },
    shipping: { type: shippingSchema, default: () => ({}) }
  },
  { timestamps: true }
);

orderSchema.index({ userId: 1, createdAt: -1 });
orderSchema.index({ status: 1, createdAt: -1 });

export const Order = mongoose.models.Order || mongoose.model("Order", orderSchema);

