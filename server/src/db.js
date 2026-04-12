import mongoose from "mongoose";
import { applyDnsServersFromEnv } from "./utils/dnsServers.js";

export async function connectDb(mongoUri) {
  if (!mongoUri) {
    throw new Error("MONGODB_URI is required");
  }

  applyDnsServersFromEnv();

  mongoose.set("strictQuery", true);

  await mongoose.connect(mongoUri, {
    autoIndex: true
  });

  const { host, port, name } = mongoose.connection;
  // eslint-disable-next-line no-console
  console.log(`[db] MongoDB connected: ${host}${port ? `:${port}` : ""}/${name || ""}`);

  return mongoose.connection;
}

