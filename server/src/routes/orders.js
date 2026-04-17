import { Router } from "express";
import mongoose from "mongoose";
import { z } from "zod";
import { requireAuth } from "../middleware/auth.js";
import { Cart } from "../models/Cart.js";
import { Order } from "../models/Order.js";
import { Product } from "../models/Product.js";
import { Address } from "../models/Address.js";
import { getPortOnePayment } from "../utils/portone.js";

const router = Router();

function usdToKrw(usdTotal) {
  const rate = Number(process.env.USD_TO_KRW || 1350);
  return Math.round(Number(usdTotal) * (Number.isFinite(rate) ? rate : 1350));
}

/** 테스트용: 이벤트 무료 배송 — 배송비는 항상 0 (표시/정산 모두 동일) */
function computeCheckoutTotals(subtotal) {
  const shippingCost = 0;
  const tax = subtotal * 0.08;
  const total = subtotal + shippingCost + tax;
  return { shippingCost, tax, total };
}

router.get("/", requireAuth, async (req, res, next) => {
  try {
    const orders = await Order.find({ userId: req.user._id, status: { $ne: "cancelled" } })
      .sort({ createdAt: -1 })
      .limit(200)
      .lean();
    res.json({ ok: true, orders });
  } catch (e) {
    next(e);
  }
});

/** 미결제(created) 주문만 삭제 — 목록에서 바로 사라지도록 문서 제거 */
router.post("/:id/cancel", requireAuth, async (req, res, next) => {
  try {
    const result = await Order.deleteOne({
      _id: req.params.id,
      userId: req.user._id,
      status: "created"
    });
    if (result.deletedCount === 0) {
      const exists = await Order.findOne({ _id: req.params.id, userId: req.user._id }).lean();
      if (!exists) return res.status(404).json({ ok: false, error: "NOT_FOUND" });
      return res.status(400).json({ ok: false, error: "ORDER_NOT_CANCELLABLE" });
    }
    res.json({ ok: true, deleted: true });
  } catch (e) {
    next(e);
  }
});

router.post("/:id/portone/confirm", requireAuth, async (req, res, next) => {
  try {
    const body = z
      .object({
        paymentId: z.string().min(1),
        // backwards-compat (v1): imp_uid was used as the lookup key; v2 still exposes this as transactionId for some cases
        imp_uid: z.string().min(1).optional()
      })
      .parse(req.body);

    const order = await Order.findOne({ _id: req.params.id, userId: req.user._id });
    if (!order) return res.status(404).json({ ok: false, error: "NOT_FOUND" });

    if (order.status === "paid") {
      return res.json({ ok: true, order, alreadyPaid: true });
    }

    if (order.status !== "created") {
      return res.status(400).json({ ok: false, error: "ORDER_NOT_PAYABLE" });
    }

    const payment = await getPortOnePayment(body.paymentId);

    if (String(payment.id || "") !== String(order.portoneMerchantUid || "")) {
      return res.status(400).json({ ok: false, error: "PAYMENT_ID_MISMATCH" });
    }

    const paidTotal = Number(payment?.amount?.total);
    if (!Number.isFinite(paidTotal) || paidTotal !== Number(order.payAmountKrw)) {
      return res.status(400).json({ ok: false, error: "AMOUNT_MISMATCH" });
    }

    if (payment.status !== "PAID") {
      return res.status(400).json({ ok: false, error: `PAYMENT_NOT_PAID:${payment.status}` });
    }

    order.status = "paid";
    order.portoneImpUid = String(payment.transactionId || body.imp_uid || "");
    await order.save();

    const cart = await Cart.findOne({ userId: req.user._id });
    if (cart) {
      cart.items = [];
      await cart.save();
    }

    res.json({ ok: true, order });
  } catch (e) {
    if (String(e?.message) === "PORTONE_V2_SECRET_MISSING") {
      return res.status(503).json({ ok: false, error: "PORTONE_NOT_CONFIGURED" });
    }
    next(e);
  }
});

router.get("/:id", requireAuth, async (req, res, next) => {
  try {
    const order = await Order.findOne({ _id: req.params.id, userId: req.user._id }).lean();
    if (!order) return res.status(404).json({ ok: false, error: "NOT_FOUND" });
    res.json({ ok: true, order });
  } catch (e) {
    next(e);
  }
});

router.post("/", requireAuth, async (req, res, next) => {
  try {
    const body = z
      .object({
        shippingMethod: z.enum(["standard", "express"]).optional().default("standard"),
        addressId: z.string().min(1)
      })
      .parse(req.body || {});

    const cart = await Cart.findOne({ userId: req.user._id });
    if (!cart || cart.items.length === 0) return res.status(400).json({ ok: false, error: "CART_EMPTY" });

    const address = await Address.findOne({ _id: body.addressId, userId: req.user._id }).lean();
    if (!address) return res.status(400).json({ ok: false, error: "SHIPPING_ADDRESS_REQUIRED" });

    const productIds = cart.items.map((i) => i.productId);
    const products = await Product.find({ _id: { $in: productIds } }).lean();
    const productMap = new Map(products.map((p) => [p._id.toString(), p]));

    const items = [];
    let subtotal = 0;

    for (const i of cart.items) {
      const p = productMap.get(i.productId.toString());
      if (!p) continue;
      const sz = (i.size || "").trim();
      items.push({
        productId: p._id,
        title: sz ? `${p.title} (${sz})` : p.title,
        imageUrl: (Array.isArray(p.images) && p.images[0]) ? String(p.images[0] || "").trim() : String(p.imageUrl || "").trim(),
        price: p.price,
        quantity: i.quantity,
        size: sz
      });
      subtotal += p.price * i.quantity;
    }

    if (items.length === 0) return res.status(400).json({ ok: false, error: "CART_INVALID" });

    const { total } = computeCheckoutTotals(subtotal);
    const payAmountKrw = usdToKrw(total);
    // PortOne V2: `paymentId` is chosen by the merchant. Reuse this field to avoid a DB migration.
    const portoneMerchantUid = `luxe_${new mongoose.Types.ObjectId().toString()}`;

    const order = await Order.create({
      userId: req.user._id,
      items,
      total,
      status: "created",
      payAmountKrw,
      portoneMerchantUid,
      shippingMethod: body.shippingMethod,
      shippingAddressId: address._id,
      shippingAddress: {
        label: address.label || "",
        recipientName: address.recipientName || "",
        phone: address.phone || "",
        address1: address.address1 || "",
        address2: address.address2 || "",
        city: address.city || "",
        stateRegion: address.stateRegion || "",
        zip: address.zip || ""
      }
    });

    /** 장바구니는 포트원 결제 검증 성공 후 `POST .../portone/confirm` 에서 비움 */

    res.json({ ok: true, order });
  } catch (e) {
    next(e);
  }
});

/** Resume checkout: set shipping address on an existing created order (legacy orders may be missing it). */
router.post("/:id/address", requireAuth, async (req, res, next) => {
  try {
    const body = z.object({ addressId: z.string().min(1) }).parse(req.body || {});

    const order = await Order.findOne({ _id: req.params.id, userId: req.user._id });
    if (!order) return res.status(404).json({ ok: false, error: "NOT_FOUND" });
    if (order.status !== "created") return res.status(400).json({ ok: false, error: "ORDER_NOT_PAYABLE" });

    const address = await Address.findOne({ _id: body.addressId, userId: req.user._id }).lean();
    if (!address) return res.status(400).json({ ok: false, error: "SHIPPING_ADDRESS_REQUIRED" });

    order.shippingAddressId = address._id;
    order.shippingAddress = {
      label: address.label || "",
      recipientName: address.recipientName || "",
      phone: address.phone || "",
      address1: address.address1 || "",
      address2: address.address2 || "",
      city: address.city || "",
      stateRegion: address.stateRegion || "",
      zip: address.zip || ""
    };
    await order.save();

    res.json({ ok: true, order });
  } catch (e) {
    next(e);
  }
});

export default router;

