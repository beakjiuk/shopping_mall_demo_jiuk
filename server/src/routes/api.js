import { Router } from "express";
import healthRouter from "./health.js";
import authRouter from "./auth.js";
import productsRouter from "./products.js";
import cartRouter from "./cart.js";
import ordersRouter from "./orders.js";
import inquiriesRouter from "./inquiries.js";
import adminRouter from "./admin.js";
import addressesRouter from "./addresses.js";

const router = Router();

router.use("/health", healthRouter);
router.use("/auth", authRouter);
router.use("/products", productsRouter);
router.use("/cart", cartRouter);
router.use("/orders", ordersRouter);
router.use("/addresses", addressesRouter);
router.use("/inquiries", inquiriesRouter);
router.use("/admin", adminRouter);

router.get("/", (req, res) => {
  res.json({ ok: true, service: "api" });
});

export default router;

