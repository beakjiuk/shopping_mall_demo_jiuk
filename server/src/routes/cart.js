import { Router } from "express";
import { z } from "zod";
import { requireAuth } from "../middleware/auth.js";
import { Cart } from "../models/Cart.js";
import { Product } from "../models/Product.js";

const router = Router();

async function getOrCreateCart(userId) {
  const existing = await Cart.findOne({ userId });
  if (existing) return existing;
  return await Cart.create({ userId, items: [] });
}

function cartLineIndex(cart, productId, sizeNorm) {
  return cart.items.findIndex(
    (i) => i.productId.toString() === productId && (i.size || "") === sizeNorm
  );
}

router.get("/", requireAuth, async (req, res, next) => {
  try {
    const cart = await getOrCreateCart(req.user._id);
    const productIds = cart.items.map((i) => i.productId);
    const products = await Product.find({ _id: { $in: productIds } }).lean();
    const productMap = new Map(products.map((p) => [p._id.toString(), p]));

    const items = cart.items.map((i) => {
      const p = productMap.get(i.productId.toString());
      return {
        productId: i.productId,
        quantity: i.quantity,
        size: i.size || "",
        product: p || null
      };
    });

    res.json({ ok: true, cart: { id: cart._id.toString(), items } });
  } catch (e) {
    next(e);
  }
});

router.post("/items", requireAuth, async (req, res, next) => {
  try {
    const body = z
      .object({
        productId: z.string().min(1),
        quantity: z.number().int().min(1).max(999),
        size: z.string().max(32).optional().default("")
      })
      .parse(req.body);
    const product = await Product.findById(body.productId).lean();
    if (!product) return res.status(404).json({ ok: false, error: "PRODUCT_NOT_FOUND" });

    const allowedSizes = Array.isArray(product.sizes) ? product.sizes.map((s) => String(s).trim()) : [];
    const sizeNorm = String(body.size || "").trim();
    if (allowedSizes.length > 0) {
      if (!sizeNorm) return res.status(400).json({ ok: false, error: "SIZE_REQUIRED" });
      if (!allowedSizes.includes(sizeNorm)) return res.status(400).json({ ok: false, error: "INVALID_SIZE" });
    } else if (sizeNorm) {
      return res.status(400).json({ ok: false, error: "SIZE_NOT_APPLICABLE" });
    }

    const cart = await getOrCreateCart(req.user._id);
    const idx = cartLineIndex(cart, body.productId, sizeNorm);
    if (idx >= 0) {
      cart.items[idx].quantity += body.quantity;
    } else {
      cart.items.push({ productId: product._id, quantity: body.quantity, size: sizeNorm });
    }
    await cart.save();

    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
});

router.patch("/items/:productId", requireAuth, async (req, res, next) => {
  try {
    const body = z.object({ quantity: z.number().int().min(1).max(999) }).parse(req.body);
    const sizeNorm = String(req.query.size || "").trim();
    const cart = await getOrCreateCart(req.user._id);
    const idx = cartLineIndex(cart, req.params.productId, sizeNorm);
    if (idx < 0) return res.status(404).json({ ok: false, error: "ITEM_NOT_FOUND" });

    cart.items[idx].quantity = body.quantity;
    await cart.save();
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
});

router.delete("/items/:productId", requireAuth, async (req, res, next) => {
  try {
    const sizeNorm = String(req.query.size || "").trim();
    const cart = await getOrCreateCart(req.user._id);
    cart.items = cart.items.filter(
      (i) => !(i.productId.toString() === req.params.productId && (i.size || "") === sizeNorm)
    );
    await cart.save();
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
});

export default router;

