import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    price: { type: Number, required: true, min: 0 },
    imageUrl: { type: String, default: "" },
    stock: { type: Number, required: true, min: 0, default: 0 },

    // Optional "catalog UI" fields (used by the backup design)
    brand: { type: String, default: "" },
    category: { type: String, default: "" },
    rating: { type: Number, default: 4.6, min: 0, max: 5 },
    reviews: { type: Number, default: 120, min: 0 },
    originalPrice: { type: Number, default: null },
    isNew: { type: Boolean, default: false },
    isBestSeller: { type: Boolean, default: false },
    fastDelivery: { type: Boolean, default: false },
    images: { type: [String], default: [] },
    features: { type: [String], default: [] },
    colors: { type: [String], default: [] },
    sizes: { type: [String], default: [] }
  },
  { timestamps: true, suppressReservedKeysWarning: true }
);

productSchema.index({ createdAt: -1 });
/** Catalog search (`/api/products?q=`); `none` tokenizer works better for mixed EN/KO than default English stemmer. */
productSchema.index(
  { title: "text", description: "text", brand: "text", category: "text" },
  { default_language: "none", name: "product_text_search" }
);

export const Product = mongoose.models.Product || mongoose.model("Product", productSchema);

