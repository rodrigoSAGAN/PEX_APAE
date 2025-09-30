import { Router } from "express";
import { db } from "../db/firestore.js";

const router = Router();


router.get("/", async (_req, res) => {
  try {
    const snap = await db.collection("products").get();
    const items = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    res.json(items);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

export default router;
