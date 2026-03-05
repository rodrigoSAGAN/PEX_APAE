// =============================================================================
// Rotas de health check — usadas pra verificar se o servidor e o banco
// de dados estão funcionando. Útil pra monitoramento e deploys.
// =============================================================================

import { Router } from "express";
import { db } from "../db/firestore.js";

const router = Router();

// Verifica se o servidor está respondendo.
router.get("/", (_req, res) => {
  res.json({ ok: true, ts: new Date().toISOString() });
});

// Verifica se a conexão com o Firestore está ok fazendo uma query simples.
router.get("/db", async (_req, res) => {
  try {
    const snap = await db.collection("products").limit(1).get();
    res.json({ db: "ok", sampleCount: snap.size });
  } catch (e) {
    res.status(500).json({ db: "error", message: e.message });
  }
});

export default router;
