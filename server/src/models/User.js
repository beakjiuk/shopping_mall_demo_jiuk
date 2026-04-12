import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    name: { type: String, required: true, trim: true },
    passwordHash: { type: String, required: true, select: false },
    role: { type: String, enum: ["user", "admin"], default: "user" },
    disabled: { type: Boolean, default: false },
    termsAcceptedAt: { type: Date, default: null }
  },
  { timestamps: true }
);

userSchema
  .virtual("password")
  .set(function setPassword(plain) {
    this._password = plain;
  });

userSchema.pre("validate", async function ensurePasswordHash(next) {
  try {
    if (!this.isNew && !this._password) return next();

    if (this._password) {
      const roundsRaw = process.env.BCRYPT_ROUNDS;
      const rounds = Number.isFinite(Number(roundsRaw)) ? Math.max(10, Number(roundsRaw)) : 12;
      this.passwordHash = await bcrypt.hash(String(this._password), rounds);
      this._password = undefined;
      return next();
    }

    if (!this.passwordHash) {
      return next(new Error("password is required"));
    }

    return next();
  } catch (e) {
    next(e);
  }
});

userSchema.methods.validatePassword = async function validatePassword(plain) {
  return bcrypt.compare(String(plain), String(this.passwordHash || ""));
};

export const User = mongoose.models.User || mongoose.model("User", userSchema);

