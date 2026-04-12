import dotenv from "dotenv";
import { connectDb } from "../src/db.js";
import { Product } from "../src/models/Product.js";
import { appleProducts } from "./appleProducts.js";

dotenv.config();

async function main() {
  await connectDb(process.env.MONGODB_URI);

  for (const doc of appleProducts) {
    await Product.findOneAndUpdate({ title: doc.title, brand: "Apple" }, { $set: doc }, { upsert: true });
  }

  // eslint-disable-next-line no-console
  console.log(`[seed:apple] upserted ${appleProducts.length} Apple products (no wipe). Refresh /products?brand=Apple`);
  process.exit(0);
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error("[seed:apple] failed", err);
  process.exit(1);
});
