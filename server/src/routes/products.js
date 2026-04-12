import { Router } from "express";
import { Product } from "../models/Product.js";

const router = Router();

/** Browsers may cache; admin uses /api/admin/products (uncached). */
const CACHE_PUBLIC = "public, max-age=60, stale-while-revalidate=120";

function regexCatalogFilter(q) {
  const rx = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
  return { $or: [{ title: rx }, { description: rx }, { brand: rx }, { category: rx }] };
}

router.get("/", async (req, res, next) => {
  try {
    const qRaw = String(req.query.q || "").trim();
    const limitRaw = Number(req.query.limit || 200);
    const limit = Number.isFinite(limitRaw) ? Math.min(Math.max(limitRaw, 1), 200) : 200;

    if (qRaw) {
      const search = qRaw.slice(0, 200);
      try {
        const products = await Product.aggregate([
          { $match: { $text: { $search: search } } },
          { $sort: { score: { $meta: "textScore" } } },
          { $limit: limit },
          { $project: { features: 0 } }
        ]);
        res.set("Cache-Control", CACHE_PUBLIC);
        res.json({ ok: true, products });
        return;
      } catch {
        /* No text index yet, bad $search token, etc. — fall back to regex. */
      }
      const products = await Product.find(regexCatalogFilter(search))
        .select("-features")
        .sort({ createdAt: -1 })
        .limit(limit)
        .lean();
      res.set("Cache-Control", CACHE_PUBLIC);
      res.json({ ok: true, products });
      return;
    }

    const products = await Product.find({})
      .select("-features")
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();
    res.set("Cache-Control", CACHE_PUBLIC);
    res.json({ ok: true, products });
  } catch (e) {
    next(e);
  }
});

router.get("/:id", async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id).lean();
    if (!product) return res.status(404).json({ ok: false, error: "NOT_FOUND" });
    res.set("Cache-Control", CACHE_PUBLIC);
    res.json({ ok: true, product });
  } catch (e) {
    next(e);
  }
});

export default router;
