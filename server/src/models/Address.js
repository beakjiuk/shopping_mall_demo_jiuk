import mongoose from "mongoose";

const addressSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    label: { type: String, default: "" }, // e.g. "Home", "Office"
    recipientName: { type: String, required: true, trim: true, maxlength: 120 },
    phone: { type: String, default: "", trim: true, maxlength: 40 },
    address1: { type: String, required: true, trim: true, maxlength: 200 },
    address2: { type: String, default: "", trim: true, maxlength: 200 },
    city: { type: String, required: true, trim: true, maxlength: 120 },
    stateRegion: { type: String, required: true, trim: true, maxlength: 120 },
    zip: { type: String, required: true, trim: true, maxlength: 30 },
    isDefault: { type: Boolean, default: false }
  },
  { timestamps: true }
);

addressSchema.index({ userId: 1, isDefault: -1, createdAt: -1 });

export const Address = mongoose.models.Address || mongoose.model("Address", addressSchema);

