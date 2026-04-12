import { Router } from "express";
import mongoose from "mongoose";

const router = Router();

router.get("/", (req, res) => {
  const state = mongoose.connection?.readyState ?? 0;
  const stateLabel =
    state === 1 ? "connected" : state === 2 ? "connecting" : state === 3 ? "disconnecting" : "disconnected";

  res.json({
    ok: true,
    db: { readyState: state, state: stateLabel }
  });
});

export default router;

