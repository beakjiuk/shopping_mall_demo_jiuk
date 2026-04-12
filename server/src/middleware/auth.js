import { verifyAccessToken } from "../utils/tokens.js";
import { User } from "../models/User.js";

export async function requireAuth(req, res, next) {
  try {
    const header = req.headers.authorization || "";
    const [kind, token] = header.split(" ");
    if (kind !== "Bearer" || !token) {
      return res.status(401).json({ ok: false, error: "UNAUTHORIZED" });
    }

    const decoded = verifyAccessToken(token);
    const user = await User.findById(decoded.sub).select("-passwordHash");
    if (!user) return res.status(401).json({ ok: false, error: "UNAUTHORIZED" });
    if (user.disabled) return res.status(403).json({ ok: false, error: "ACCOUNT_DISABLED" });

    req.user = user;
    next();
  } catch (e) {
    res.status(401).json({ ok: false, error: "UNAUTHORIZED" });
  }
}

export function requireAdmin(req, res, next) {
  if (!req.user) return res.status(401).json({ ok: false, error: "UNAUTHORIZED" });
  if (req.user.role !== "admin") return res.status(403).json({ ok: false, error: "FORBIDDEN" });
  next();
}

