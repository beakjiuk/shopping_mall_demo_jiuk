import dns from "node:dns";

/** `DNS_SERVERS=8.8.8.8,1.1.1.1` — Windows 등에서 `mongodb+srv` SRV 조회가 막힐 때 사용 */
export function applyDnsServersFromEnv() {
  const raw = process.env.DNS_SERVERS;
  if (!raw?.trim()) return;
  const list = raw.split(",").map((s) => s.trim()).filter(Boolean);
  if (list.length) dns.setServers(list);
}
