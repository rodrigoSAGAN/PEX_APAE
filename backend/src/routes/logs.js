import { Router } from "express";
import { db, admin } from "../db/firestore.js";

const router = Router();

//Apenas ADMIN pode ver logs de auditoria

async function requireAdmin(req, res, next) {
  try {
    const authHeader = req.headers.authorization || "";
    const [, token] = authHeader.split(" ");

    if (!token) {
      return res.status(401).json({ error: "missing_token" });
    }

    const decoded = await admin.auth().verifyIdToken(token);
    const roles = Array.isArray(decoded.roles) ? decoded.roles : [];

    if (!roles.includes("admin")) {
      return res.status(403).json({ error: "forbidden" });
    }

    req.user = {
      uid: decoded.uid,
      email: decoded.email,
      roles,
    };

    return next();
  } catch (e) {
    console.error("[logs] requireAdmin error:", e);
    return res.status(401).json({ error: "invalid_token" });
  }
}

//retorna logs recentes
router.get("/", requireAdmin, async (req, res) => {
  try {
    const rawLimit = parseInt(req.query.limit, 10);
    let limit = Number.isNaN(rawLimit) ? 100 : rawLimit;
    limit = Math.min(Math.max(limit, 1), 500);

    const snap = await db
      .collection("logs")
      .orderBy("createdAt", "desc")
      .limit(limit)
      .get();

    const list = snap.docs.map((doc) => {
      const data = doc.data() || {};
      let createdAtIso = null;

      if (data.createdAt && typeof data.createdAt.toDate === "function") {
        createdAtIso = data.createdAt.toDate().toISOString();
      } else if (typeof data.createdAt === "string") {
        createdAtIso = data.createdAt;
      }

      return {
        id: doc.id,
        ...data,
        createdAt: createdAtIso,
      };
    });

    res.json(list);
  } catch (e) {
    console.error("[logs] GET / error:", e);
    res.status(500).json({ error: "internal_error", message: e.message });
  }
});

export default router;
