/**
 * Atlas / Mongo 연결만 확인하고 종료합니다.
 * 사용: server 폴더에서 `npm run check-db`
 */
import dotenv from "dotenv";
import mongoose from "mongoose";
import { applyDnsServersFromEnv } from "../src/utils/dnsServers.js";

dotenv.config();
applyDnsServersFromEnv();

const uri = process.env.MONGODB_URI;
if (!uri) {
  console.error("[check-db] MONGODB_URI 가 server/.env 에 없습니다.");
  process.exit(1);
}

try {
  await mongoose.connect(uri);
  const { host, name } = mongoose.connection;
  console.log("[check-db] 연결 성공");
  console.log("  host:", host);
  console.log("  database:", name || "(default)");
  await mongoose.disconnect();
  console.log("[check-db] 정상 종료");
  process.exit(0);
} catch (e) {
  const msg = String(e.message || e);
  console.error("[check-db] 연결 실패:", msg);
  if (msg.includes("querySrv") || msg.includes("ECONNREFUSED")) {
    console.error(
      "  → SRV/DNS 문제일 수 있습니다. server/.env 에 DNS_SERVERS=8.8.8.8,1.1.1.1 추가 후 다시 실행해 보세요.",
    );
    console.error("  → 또는 Atlas에서 '표준 연결 문자열(mongodb://…)' 을 쓰는 방법도 있습니다.");
  }
  process.exit(1);
}
