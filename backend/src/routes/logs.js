import { Router } from "express";
import { db, admin } from "../db/firestore.js";

const router = Router();

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

router.post("/", async (req, res) => {
  try {
    const authHeader = req.headers.authorization || "";
    const [, token] = authHeader.split(" ");

    if (!token) {
      return res.status(401).json({ error: "missing_token" });
    }

    const decoded = await admin.auth().verifyIdToken(token);
    const roles = Array.isArray(decoded.roles) ? decoded.roles : [];
    const canEditStore = decoded.canEditStore === true;
    const canEditEvents = decoded.canEditEvents === true;
    const isAdmin = roles.includes("admin");

    if (!isAdmin && !canEditStore && !canEditEvents) {
      return res.status(403).json({ error: "forbidden" });
    }

    const { action, details, entityId, entityName, type, newStatus, userName } = req.body;

    const logData = {
      action,
      details,
      entityId: entityId || null,
      entityName: entityName || null,
      type: type || "general",
      newStatus: newStatus !== undefined ? newStatus : null,
      userEmail: decoded.email,
      userId: decoded.uid,
      userName: userName || decoded.name || decoded.email || "Usuário",
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    const docRef = await db.collection("logs").add(logData);

    res.status(201).json({ id: docRef.id, ...logData });
  } catch (e) {
    console.error("[logs] POST / error:", e);
    res.status(500).json({ error: "internal_error", message: e.message });
  }
});

export default router;
