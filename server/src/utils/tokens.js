import jwt from "jsonwebtoken";

export function signAccessToken(payload) {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET is required");

  return jwt.sign(payload, secret, { expiresIn: "7d" });
}

export function verifyAccessToken(token) {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET is required");

  return jwt.verify(token, secret);
}

