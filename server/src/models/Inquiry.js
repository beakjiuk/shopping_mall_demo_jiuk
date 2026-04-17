import mongoose from "mongoose";

const inquiryMessageSchema = new mongoose.Schema(
  {
    role: { type: String, enum: ["user", "admin"], required: true },
    body: { type: String, required: true, trim: true },
    createdAt: { type: Date, default: () => new Date() }
  },
  { _id: false }
);

const inquirySchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    /** Optional order reference a user can paste (e.g. ORD-XXXXXXXX). */
    orderNumber: { type: String, default: "", trim: true, maxlength: 32 },
    subject: { type: String, required: true, trim: true, maxlength: 200 },
    status: { type: String, enum: ["open", "answered", "closed"], default: "open" },
    messages: { type: [inquiryMessageSchema], default: [] }
  },
  { timestamps: true }
);

inquirySchema.index({ userId: 1, createdAt: -1 });
inquirySchema.index({ status: 1, createdAt: -1 });

export const Inquiry = mongoose.models.Inquiry || mongoose.model("Inquiry", inquirySchema);

