/**
 * PortOne REST API v2 helpers.
 *
 * Docs: https://developers.portone.io/api/rest-v2
 * Auth: `Authorization: PortOne <V2_API_SECRET>`
 */

const PORTONE_API_BASE = "https://api.portone.io";

function getV2ApiSecret() {
  const secret =
    process.env.PORTONE_V2_API_SECRET ||
    process.env.PORTONE_API_V2_SECRET ||
    process.env.PORTONE_API_SECRET;
  if (!secret) throw new Error("PORTONE_V2_SECRET_MISSING");
  return secret;
}

/**
 * @param {string} paymentId
 * @param {{ storeId?: string }} [opts]
 */
export async function getPortOneV2Payment(paymentId, opts = {}) {
  const secret = getV2ApiSecret();
  const url = new URL(`${PORTONE_API_BASE}/payments/${encodeURIComponent(paymentId)}`);
  if (opts.storeId) url.searchParams.set("storeId", String(opts.storeId));

  const res = await fetch(url, {
    headers: {
      Authorization: `PortOne ${secret}`
    }
  });

  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = json?.message || json?.type || `PORTONE_V2_PAYMENT_LOOKUP_FAILED:${res.status}`;
    throw new Error(msg);
  }

  return json;
}

/**
 * Back-compat name used by routes historically (Iamport imp_uid lookup).
 * @param {string} paymentId
 */
export async function getPortOnePayment(paymentId) {
  return await getPortOneV2Payment(paymentId);
}
