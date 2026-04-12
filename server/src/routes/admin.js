import { Router } from "express";
import { z } from "zod";
import { requireAuth, requireAdmin } from "../middleware/auth.js";
import { Product } from "../models/Product.js";
import { Order } from "../models/Order.js";
import { Inquiry } from "../models/Inquiry.js";
import { User } from "../models/User.js";

const router = Router();

router.use(requireAuth, requireAdmin);

const sizesFieldCreate = z
  .array(z.string().trim().min(1).max(32))
  .max(32)
  .optional()
  .default([]);

const sizesFieldUpdate = z.array(z.string().trim().min(1).max(32)).max(32).optional();

/** URLs are short; pasted data:image/...;base64,... strings are much longer (MongoDB doc limit ~16MB). */
const PRODUCT_IMAGE_STRING_MAX = 12 * 1024 * 1024;

const imagesFieldCreate = z
  .array(z.string().trim().max(PRODUCT_IMAGE_STRING_MAX))
  .max(40)
  .optional()
  .default([]);
const imagesFieldUpdate = z.array(z.string().trim().max(PRODUCT_IMAGE_STRING_MAX)).max(40).optional();
const colorsFieldCreate = z.array(z.string().trim().max(64)).max(32).optional().default([]);
const colorsFieldUpdate = z.array(z.string().trim().max(64)).max(32).optional();
const featuresFieldCreate = z.array(z.string().trim().max(200)).max(40).optional().default([]);
const featuresFieldUpdate = z.array(z.string().trim().max(200)).max(40).optional();

router.get("/products", async (req, res, next) => {
  try {
    const products = await Product.find().sort({ createdAt: -1, _id: -1 }).limit(500).lean();
    res.json({ ok: true, products });
  } catch (e) {
    next(e);
  }
});

router.post("/products", async (req, res, next) => {
  try {
    const body = z
      .object({
        title: z.string().min(1),
        description: z.string().optional().default(""),
        price: z.number().min(0),
        imageUrl: z.string().max(PRODUCT_IMAGE_STRING_MAX).optional().default(""),
        stock: z.number().int().min(0).optional().default(0),
        category: z.string().trim().optional().default(""),
        brand: z.string().trim().optional().default(""),
        isNew: z.boolean().optional().default(false),
        isBestSeller: z.boolean().optional().default(false),
        featuredHome: z.boolean().optional().default(false),
        fastDelivery: z.boolean().optional().default(false),
        sizes: sizesFieldCreate,
        images: imagesFieldCreate,
        colors: colorsFieldCreate,
        features: featuresFieldCreate,
        originalPrice: z.union([z.number().min(0), z.null()]).optional().default(null),
        rating: z.number().min(0).max(5).optional(),
        reviews: z.number().int().min(0).optional()
      })
      .parse(req.body);

    const rawImages = body.images.map((s) => String(s).trim()).filter(Boolean);
    let images = rawImages;
    const singleImageUrl = (body.imageUrl || "").trim();
    if (images.length === 0 && singleImageUrl) images = [singleImageUrl];
    const imageUrl = images[0] || "";

    const rawCols = body.colors.map((c) => String(c).trim());
    const aligned = images.map((_, i) => rawCols[i] ?? "");
    const colors = images.length === 1 && !aligned[0] ? [] : aligned;

    const features = body.features.map((f) => String(f).trim()).filter(Boolean);

    const product = await Product.create({
      title: body.title,
      description: body.description,
      price: body.price,
      stock: body.stock,
      category: body.category,
      brand: body.brand,
      isNew: body.isNew,
      isBestSeller: body.isBestSeller,
      featuredHome: body.featuredHome,
      fastDelivery: body.fastDelivery,
      sizes: body.sizes,
      originalPrice: body.originalPrice ?? null,
      imageUrl,
      images,
      colors,
      features,
      ...(body.rating !== undefined ? { rating: body.rating } : {}),
      ...(body.reviews !== undefined ? { reviews: body.reviews } : {})
    });
    res.json({ ok: true, product });
  } catch (e) {
    next(e);
  }
});

router.put("/products/:id", async (req, res, next) => {
  try {
    const body = z
      .object({
        title: z.string().min(1).optional(),
        description: z.string().optional(),
        price: z.number().min(0).optional(),
        imageUrl: z.string().max(PRODUCT_IMAGE_STRING_MAX).optional(),
        stock: z.number().int().min(0).optional(),
        category: z.string().trim().optional(),
        brand: z.string().trim().optional(),
        isNew: z.boolean().optional(),
        isBestSeller: z.boolean().optional(),
        featuredHome: z.boolean().optional(),
        fastDelivery: z.boolean().optional(),
        sizes: sizesFieldUpdate,
        images: imagesFieldUpdate,
        colors: colorsFieldUpdate,
        features: featuresFieldUpdate,
        originalPrice: z.union([z.number().min(0), z.null()]).optional(),
        rating: z.number().min(0).max(5).optional(),
        reviews: z.number().int().min(0).optional()
      })
      .parse(req.body);

    const update = { ...body };
    if (Array.isArray(body.images)) {
      const imgs = body.images.map((s) => String(s).trim()).filter(Boolean);
      update.images = imgs;
      update.imageUrl = imgs[0] || "";
    }
    if (Array.isArray(body.colors)) {
      const raw = body.colors.map((c) => String(c).trim());
      const n = Array.isArray(update.images) ? update.images.length : null;
      if (n === 1 && !raw[0]) {
        update.colors = [];
      } else if (typeof n === "number" && n > 0) {
        update.colors = Array.from({ length: n }, (_, i) => raw[i] ?? "");
      } else {
        update.colors = raw;
      }
    }
    if (Array.isArray(body.features)) {
      update.features = body.features.map((f) => String(f).trim()).filter(Boolean);
    }

    const product = await Product.findByIdAndUpdate(req.params.id, update, { new: true });
    if (!product) return res.status(404).json({ ok: false, error: "NOT_FOUND" });
    res.json({ ok: true, product });
  } catch (e) {
    next(e);
  }
});

router.delete("/products/:id", async (req, res, next) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) return res.status(404).json({ ok: false, error: "NOT_FOUND" });
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
});

router.get("/stats", async (req, res, next) => {
  try {
    const q = z
      .object({
        from: z.string().optional(),
        to: z.string().optional()
      })
      .parse(req.query);

    const from = q.from ? new Date(q.from) : null;
    const to = q.to ? new Date(q.to) : null;

    const createdAt = {};
    if (from && !Number.isNaN(from.getTime())) createdAt.$gte = from;
    if (to && !Number.isNaN(to.getTime())) createdAt.$lte = to;

    const salesStatuses = ["paid", "fulfilment", "shipped", "delivered"];

    const match = { status: { $in: salesStatuses } };
    if (Object.keys(createdAt).length) match.createdAt = createdAt;

    const [kpiAgg, topAgg] = await Promise.all([
      Order.aggregate([
        { $match: match },
        {
          $group: {
            _id: null,
            ordersCount: { $sum: 1 },
            revenue: { $sum: "$total" },
            itemsSold: { $sum: { $sum: "$items.quantity" } }
          }
        }
      ]),
      Order.aggregate([
        { $match: match },
        { $unwind: "$items" },
        {
          $group: {
            _id: "$items.productId",
            title: { $first: "$items.title" },
            quantity: { $sum: "$items.quantity" },
            revenue: { $sum: { $multiply: ["$items.quantity", "$items.price"] } }
          }
        },
        { $sort: { revenue: -1 } },
        { $limit: 8 }
      ])
    ]);

    const kpi = kpiAgg[0] || { ordersCount: 0, revenue: 0, itemsSold: 0 };
    res.json({ ok: true, kpi, topProducts: topAgg });
  } catch (e) {
    next(e);
  }
});

const ADMIN_ORDER_PIPELINE = ["paid", "fulfilment", "shipped", "delivered"];

router.get("/orders", async (req, res, next) => {
  try {
    const q = z
      .object({
        status: z.string().optional(),
        page: z.coerce.number().int().min(1).optional().default(1),
        limit: z.coerce.number().int().min(1).max(200).optional().default(50)
      })
      .parse(req.query);

    const filter = {};
    const st = (q.status || "pipeline").trim();
    if (st === "pipeline") {
      filter.status = { $in: ADMIN_ORDER_PIPELINE };
    } else if (ADMIN_ORDER_PIPELINE.includes(st)) {
      filter.status = st;
    } else {
      filter.status = { $in: ADMIN_ORDER_PIPELINE };
    }

    const [orders, total] = await Promise.all([
      Order.find(filter)
        .sort({ createdAt: -1 })
        .skip((q.page - 1) * q.limit)
        .limit(q.limit)
        .lean(),
      Order.countDocuments(filter)
    ]);

    res.json({ ok: true, orders, page: q.page, limit: q.limit, total });
  } catch (e) {
    next(e);
  }
});

router.get("/orders/:id", async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ ok: false, error: "NOT_FOUND" });
    res.json({ ok: true, order });
  } catch (e) {
    next(e);
  }
});

router.patch("/orders/:id", async (req, res, next) => {
  try {
    const body = z
      .object({
        status: z.enum(["created", "paid", "fulfilment", "shipped", "delivered", "cancelled", "refunded"]).optional(),
        shipping: z
          .object({
            carrier: z.string().optional(),
            trackingNumber: z.string().optional(),
            memo: z.string().optional()
          })
          .optional()
      })
      .parse(req.body);

    const update = {};
    if (body.status) update.status = body.status;
    if (body.shipping) {
      update.shipping = {
        carrier: body.shipping.carrier ?? "",
        trackingNumber: body.shipping.trackingNumber ?? "",
        memo: body.shipping.memo ?? "",
        updatedAt: new Date()
      };
    }

    const order = await Order.findByIdAndUpdate(req.params.id, update, { new: true });
    if (!order) return res.status(404).json({ ok: false, error: "NOT_FOUND" });
    res.json({ ok: true, order });
  } catch (e) {
    next(e);
  }
});

router.get("/inquiries", async (req, res, next) => {
  try {
    const q = z
      .object({
        status: z.string().optional(),
        page: z.coerce.number().int().min(1).optional().default(1),
        limit: z.coerce.number().int().min(1).max(200).optional().default(50)
      })
      .parse(req.query);

    const filter = {};
    if (q.status) filter.status = q.status;

    const [inquiries, total] = await Promise.all([
      Inquiry.find(filter)
        .sort({ createdAt: -1 })
        .skip((q.page - 1) * q.limit)
        .limit(q.limit)
        .lean(),
      Inquiry.countDocuments(filter)
    ]);

    res.json({ ok: true, inquiries, page: q.page, limit: q.limit, total });
  } catch (e) {
    next(e);
  }
});

router.get("/inquiries/:id", async (req, res, next) => {
  try {
    const inquiry = await Inquiry.findById(req.params.id);
    if (!inquiry) return res.status(404).json({ ok: false, error: "NOT_FOUND" });
    res.json({ ok: true, inquiry });
  } catch (e) {
    next(e);
  }
});

router.post("/inquiries/:id/reply", async (req, res, next) => {
  try {
    const body = z
      .object({
        body: z.string().trim().min(1).max(5000)
      })
      .parse(req.body);

    const inquiry = await Inquiry.findById(req.params.id);
    if (!inquiry) return res.status(404).json({ ok: false, error: "NOT_FOUND" });

    inquiry.messages.push({ role: "admin", body: body.body, createdAt: new Date() });
    inquiry.status = "answered";
    await inquiry.save();

    res.json({ ok: true, inquiry });
  } catch (e) {
    next(e);
  }
});

router.patch("/inquiries/:id", async (req, res, next) => {
  try {
    const body = z
      .object({
        status: z.enum(["open", "answered", "closed"])
      })
      .parse(req.body);

    const inquiry = await Inquiry.findByIdAndUpdate(req.params.id, { status: body.status }, { new: true });
    if (!inquiry) return res.status(404).json({ ok: false, error: "NOT_FOUND" });
    res.json({ ok: true, inquiry });
  } catch (e) {
    next(e);
  }
});

router.get("/users", async (req, res, next) => {
  try {
    const q = z
      .object({
        q: z.string().optional(),
        page: z.coerce.number().int().min(1).optional().default(1),
        limit: z.coerce.number().int().min(1).max(200).optional().default(50)
      })
      .parse(req.query);

    const filter = {};
    if (q.q) {
      filter.$or = [
        { email: { $regex: q.q, $options: "i" } },
        { name: { $regex: q.q, $options: "i" } }
      ];
    }

    const [users, total] = await Promise.all([
      User.find(filter)
        .select("_id email name role disabled createdAt")
        .sort({ createdAt: -1 })
        .skip((q.page - 1) * q.limit)
        .limit(q.limit),
      User.countDocuments(filter)
    ]);

    res.json({ ok: true, users, page: q.page, limit: q.limit, total });
  } catch (e) {
    next(e);
  }
});

router.patch("/users/:id", async (req, res, next) => {
  try {
    const body = z
      .object({
        role: z.enum(["user", "admin"]).optional(),
        disabled: z.boolean().optional()
      })
      .parse(req.body);

    // Prevent an admin from locking themselves out via this endpoint.
    if (req.params.id === req.user._id.toString() && body.disabled === true) {
      return res.status(400).json({ ok: false, error: "CANNOT_DISABLE_SELF" });
    }

    const update = {};
    if (body.role) update.role = body.role;
    if (typeof body.disabled === "boolean") update.disabled = body.disabled;

    const user = await User.findByIdAndUpdate(req.params.id, update, { new: true })
      .select("_id email name role disabled createdAt");
    if (!user) return res.status(404).json({ ok: false, error: "NOT_FOUND" });

    res.json({ ok: true, user });
  } catch (e) {
    next(e);
  }
});

export default router;

