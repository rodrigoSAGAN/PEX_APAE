import { Router } from "express";
import { db } from "../db/firestore.js";

const router = Router();

router.get("/", (_req, res) => {
  res.json({ ok: true, ts: new Date().toISOString() });
});

router.get("/db", async (_req, res) => {
  try {
    
    const snap = await db.collection("products").limit(1).get();
    res.json({ db: "ok", sampleCount: snap.size });
  } catch (e) {
    res.status(500).json({ db: "error", message: e.message });
  }
});

export default router;

