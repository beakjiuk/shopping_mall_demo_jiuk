import express from "express";
import compression from "compression";
import cors from "cors";
import morgan from "morgan";
import apiRouter from "./routes/api.js";
import healthRouter from "./routes/health.js";
import { errorHandler, notFound } from "./middleware/error.js";

export function createApp() {
  const app = express();

  app.use(
    cors({
      origin: process.env.CLIENT_ORIGIN || true,
      credentials: true
    })
  );
  app.use(compression());
  /** Large enough for admin data URLs (base64) on product images; default 100kb is too small. */
  app.use(express.json({ limit: process.env.JSON_BODY_LIMIT || "15mb" }));
  app.use(morgan(process.env.NODE_ENV === "production" ? "tiny" : "dev"));

  app.get("/", (req, res) => {
    res.json({ ok: true, service: "server" });
  });

  app.use("/api", apiRouter);
  app.use("/health", healthRouter);

  app.use(notFound);
  app.use(errorHandler);

  return app;
}

