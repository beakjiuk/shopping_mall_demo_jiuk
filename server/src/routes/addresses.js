import { Router } from "express";
import { z } from "zod";
import mongoose from "mongoose";
import { requireAuth } from "../middleware/auth.js";
import { Address } from "../models/Address.js";

const router = Router();

const addressBodySchema = z.object({
  label: z.string().max(60).optional().default(""),
  recipientName: z.string().trim().min(1).max(120),
  phone: z.string().trim().max(40).optional().default(""),
  address1: z.string().trim().min(1).max(200),
  address2: z.string().trim().max(200).optional().default(""),
  city: z.string().trim().min(1).max(120),
  stateRegion: z.string().trim().min(1).max(120),
  zip: z.string().trim().min(1).max(30),
  isDefault: z.boolean().optional().default(false)
});

router.get("/", requireAuth, async (req, res, next) => {
  try {
    const addresses = await Address.find({ userId: req.user._id }).sort({ isDefault: -1, createdAt: -1 }).lean();
    res.json({ ok: true, addresses });
  } catch (e) {
    next(e);
  }
});

router.post("/", requireAuth, async (req, res, next) => {
  try {
    const body = addressBodySchema.parse(req.body || {});
    const userId = req.user._id;

    const existingCount = await Address.countDocuments({ userId });
    const makeDefault = body.isDefault || existingCount === 0;

    const doc = await Address.create({
      userId,
      label: body.label,
      recipientName: body.recipientName,
      phone: body.phone,
      address1: body.address1,
      address2: body.address2,
      city: body.city,
      stateRegion: body.stateRegion,
      zip: body.zip,
      isDefault: makeDefault
    });

    if (makeDefault) {
      await Address.updateMany({ userId, _id: { $ne: doc._id } }, { $set: { isDefault: false } });
    }

    res.json({ ok: true, address: doc });
  } catch (e) {
    next(e);
  }
});

router.put("/:id", requireAuth, async (req, res, next) => {
  try {
    const id = req.params.id;
    if (!mongoose.isValidObjectId(id)) return res.status(400).json({ ok: false, error: "INVALID_ID" });

    const body = addressBodySchema.partial().parse(req.body || {});

    const updated = await Address.findOneAndUpdate(
      { _id: id, userId: req.user._id },
      { $set: body },
      { new: true }
    );
    if (!updated) return res.status(404).json({ ok: false, error: "NOT_FOUND" });

    if (body.isDefault) {
      await Address.updateMany({ userId: req.user._id, _id: { $ne: updated._id } }, { $set: { isDefault: false } });
    }

    res.json({ ok: true, address: updated });
  } catch (e) {
    next(e);
  }
});

router.post("/:id/default", requireAuth, async (req, res, next) => {
  try {
    const id = req.params.id;
    if (!mongoose.isValidObjectId(id)) return res.status(400).json({ ok: false, error: "INVALID_ID" });

    const address = await Address.findOneAndUpdate(
      { _id: id, userId: req.user._id },
      { $set: { isDefault: true } },
      { new: true }
    );
    if (!address) return res.status(404).json({ ok: false, error: "NOT_FOUND" });

    await Address.updateMany({ userId: req.user._id, _id: { $ne: address._id } }, { $set: { isDefault: false } });
    res.json({ ok: true, address });
  } catch (e) {
    next(e);
  }
});

router.delete("/:id", requireAuth, async (req, res, next) => {
  try {
    const id = req.params.id;
    if (!mongoose.isValidObjectId(id)) return res.status(400).json({ ok: false, error: "INVALID_ID" });

    const existing = await Address.findOne({ _id: id, userId: req.user._id });
    if (!existing) return res.status(404).json({ ok: false, error: "NOT_FOUND" });

    const wasDefault = !!existing.isDefault;
    await Address.deleteOne({ _id: id, userId: req.user._id });

    if (wasDefault) {
      const nextDefault = await Address.findOne({ userId: req.user._id }).sort({ createdAt: -1 });
      if (nextDefault) {
        nextDefault.isDefault = true;
        await nextDefault.save();
      }
    }

    res.json({ ok: true, deleted: true });
  } catch (e) {
    next(e);
  }
});

export default router;

