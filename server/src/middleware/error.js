export function notFound(req, res) {
  res.status(404).json({ ok: false, error: "NOT_FOUND" });
}

// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, next) {
  // eslint-disable-next-line no-console
  console.error("[server] error", err);
  const status = Number(err?.statusCode || err?.status || 500);
  const message = err?.message || "INTERNAL_SERVER_ERROR";
  res.status(status).json({ ok: false, error: message });
}

