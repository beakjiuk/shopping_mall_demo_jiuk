import dotenv from "dotenv";
import { createApp } from "./app.js";
import { connectDb } from "./db.js";

dotenv.config();

const port = Number(process.env.PORT || 5000);
const mongoUri = process.env.MONGODB_URI;

async function main() {
  await connectDb(mongoUri);

  const app = createApp();

  app.listen(port, () => {
    // eslint-disable-next-line no-console
    console.log(`[server] listening on http://localhost:${port}`);
  });
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error("[server] failed to start", err);
  process.exit(1);
});

