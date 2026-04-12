/**
 * Auth: passwords hashed with bcrypt (one-way; not reversible).
 * Sessions: JWT access tokens signed with JWT_SECRET (see utils/tokens.js).
 */
import { Router } from "express";
import { z } from "zod";
import { User } from "../models/User.js";
import { signAccessToken } from "../utils/tokens.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

function toPublicUser(doc) {
  return {
    id: doc._id.toString(),
    email: doc.email,
    name: doc.name,
    role: doc.role
  };
}

const registerBodySchema = z
  .object({
    email: z.string().email(),
    name: z.string().min(1).max(100),
    password: z.string().min(6).max(200),
    acceptTerms: z.boolean()
  })
  .refine((d) => d.acceptTerms === true, { message: "TERMS_REQUIRED" });

router.post("/register", async (req, res, next) => {
  try {
    const parsed = registerBodySchema.safeParse(req.body);
    if (!parsed.success) {
      const code =
        parsed.error.issues.find((i) => i.message === "TERMS_REQUIRED")?.message ||
        parsed.error.issues[0]?.message ||
        "VALIDATION_ERROR";
      return res.status(400).json({ ok: false, error: code });
    }
    const body = parsed.data;

    const existing = await User.findOne({ email: body.email.toLowerCase() });
    if (existing) return res.status(409).json({ ok: false, error: "EMAIL_TAKEN" });

    const user = await User.create({
      email: body.email.toLowerCase(),
      name: body.name,
      password: body.password,
      role: "user",
      termsAcceptedAt: new Date()
    });

    const token = signAccessToken({ sub: user._id.toString(), role: user.role });
    res.json({
      ok: true,
      token,
      user: toPublicUser(user)
    });
  } catch (e) {
    next(e);
  }
});

router.post("/login", async (req, res, next) => {
  try {
    const body = z
      .object({
        email: z.string().email(),
        password: z.string().min(1)
      })
      .parse(req.body);

    const user = await User.findOne({ email: body.email.toLowerCase() }).select("+passwordHash");
    if (!user) return res.status(401).json({ ok: false, error: "INVALID_CREDENTIALS" });
    if (user.disabled) return res.status(403).json({ ok: false, error: "ACCOUNT_DISABLED" });

    const ok = await user.validatePassword(body.password);
    if (!ok) return res.status(401).json({ ok: false, error: "INVALID_CREDENTIALS" });

    const token = signAccessToken({ sub: user._id.toString(), role: user.role });
    res.json({
      ok: true,
      token,
      user: toPublicUser(user)
    });
  } catch (e) {
    next(e);
  }
});

router.get("/me", requireAuth, (req, res) => {
  res.json({ ok: true, user: toPublicUser(req.user) });
});

router.patch("/me", requireAuth, async (req, res, next) => {
  try {
    const body = z
      .object({
        name: z.string().trim().min(1).max(100)
      })
      .parse(req.body);

    req.user.name = body.name;
    await req.user.save();
    res.json({ ok: true, user: toPublicUser(req.user) });
  } catch (e) {
    next(e);
  }
});

export default router;

