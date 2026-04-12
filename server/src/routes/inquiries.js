import { Router } from "express";
import { z } from "zod";
import { requireAuth } from "../middleware/auth.js";
import { Inquiry } from "../models/Inquiry.js";

const router = Router();

router.use(requireAuth);

router.get("/", async (req, res, next) => {
  try {
    const inquiries = await Inquiry.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .limit(200)
      .lean();
    res.json({ ok: true, inquiries });
  } catch (e) {
    next(e);
  }
});

router.get("/:id", async (req, res, next) => {
  try {
    const inquiry = await Inquiry.findOne({ _id: req.params.id, userId: req.user._id }).lean();
    if (!inquiry) return res.status(404).json({ ok: false, error: "NOT_FOUND" });
    res.json({ ok: true, inquiry });
  } catch (e) {
    next(e);
  }
});

router.post("/", async (req, res, next) => {
  try {
    const body = z
      .object({
        subject: z.string().trim().min(1).max(200),
        body: z.string().trim().min(1).max(5000)
      })
      .parse(req.body);

    const inquiry = await Inquiry.create({
      userId: req.user._id,
      subject: body.subject,
      status: "open",
      messages: [{ role: "user", body: body.body }]
    });

    res.json({ ok: true, inquiry });
  } catch (e) {
    next(e);
  }
});

export default router;

