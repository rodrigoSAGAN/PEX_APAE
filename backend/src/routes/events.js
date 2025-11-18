import { Router } from "express";
import { db, admin } from "../db/firestore.js";

const router = Router();

// registra logs
 
async function writeAuditLog({
  req,
  type,
  action,
  entityId,
  entityName,
  before = null,
  after = null,
}) {
  try {
    const user = req.user || {};
    await db.collection("logs").add({
      type, 
      action, 
      entityId: entityId || null,
      entityName: entityName || null,
      userId: user.uid || null,
      userEmail: user.email || null,
      roles: user.roles || [],
      ip: req.ip || null,
      userAgent: req.headers["user-agent"] || null,
      before,
      after,
      createdAt: admin.firestore.Timestamp.fromDate(new Date()),
    });
  } catch (e) {
    console.warn("[audit-log][events] falha ao registrar log:", e);
  }
}

//verifica se o usuário é ADMIN ou colaborador 
async function requireEventsEditor(req, res, next) {
  try {
    const authHeader = req.headers.authorization || "";
    const [, token] = authHeader.split(" ");

    if (!token) {
      return res.status(401).json({ error: "missing_token" });
    }

    const decoded = await admin.auth().verifyIdToken(token);
    const roles = Array.isArray(decoded.roles) ? decoded.roles : [];
    const isAdmin = roles.includes("admin");
    const isColab = roles.includes("colaborador");
    const canEditEvents = decoded.canEditEvents === true;

    if (!isAdmin && !(isColab && canEditEvents)) {
      return res.status(403).json({ error: "forbidden" });
    }

    req.user = {
      uid: decoded.uid,
      email: decoded.email,
      roles,
      canEditEvents,
    };

    return next();
  } catch (e) {
    console.error("requireEventsEditor error:", e);
    return res.status(401).json({ error: "invalid_token" });
  }
}

//Lista todos os eventos
 
router.get("/", async (_req, res) => {
  try {
    const snap = await db
      .collection("events")
      .orderBy("date", "asc")
      .get();

    const list = snap.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    res.json(list);
  } catch (e) {
    console.error("GET /api/events error:", e);
    res
      .status(500)
      .json({ error: "internal_error", message: e.message });
  }
});

//Cria novo evento 

router.post("/", requireEventsEditor, async (req, res) => {
  try {
    const { title, date, location, description } = req.body || {};

    if (!title || typeof title !== "string") {
      return res.status(400).json({
        error: "invalid_payload",
        hint: "Campo 'title' é obrigatório e deve ser string.",
      });
    }

    const now = new Date().toISOString();

    const docRef = await db.collection("events").add({
      title: title.trim(),
      date: date || null, 
      location: location || null,
      description: description || null,
      createdAt: now,
      updatedAt: now,
      active: true,
    });

    const created = await docRef.get();
    const data = { id: created.id, ...created.data() };

    // Log de criação
    await writeAuditLog({
      req,
      type: "event",
      action: "create",
      entityId: created.id,
      entityName: data.title || created.id,
      before: null,
      after: data,
    });

    res.status(201).json(data);
  } catch (e) {
    console.error("POST /api/events error:", e);
    res
      .status(500)
      .json({ error: "internal_error", message: e.message });
  }
});

//Atualiza o evento 
router.put("/:id", requireEventsEditor, async (req, res) => {
  try {
    const { id } = req.params;
    const { title, date, location, description, active } = req.body || {};

    const docRef = db.collection("events").doc(id);
    const snap = await docRef.get();

    if (!snap.exists) {
      return res.status(404).json({ error: "not_found" });
    }

    const beforeData = { id, ...snap.data() };

    const updateData = {
      updatedAt: new Date().toISOString(),
    };

    if (typeof title === "string") updateData.title = title.trim();
    if (typeof date === "string" || date === null) updateData.date = date || null;
    if (typeof location === "string" || location === null)
      updateData.location = location || null;
    if (typeof description === "string" || description === null)
      updateData.description = description || null;
    if (typeof active === "boolean") updateData.active = active;

    await docRef.update(updateData);

    const updated = await docRef.get();
    const afterData = { id: updated.id, ...updated.data() };

    //Log de atualização
    await writeAuditLog({
      req,
      type: "event",
      action: "update",
      entityId: id,
      entityName: afterData.title || id,
      before: beforeData,
      after: afterData,
    });

    res.json(afterData);
  } catch (e) {
    console.error("PUT /api/events/:id error:", e);
    res
      .status(500)
      .json({ error: "internal_error", message: e.message });
  }
});

//Remove evento 
router.delete("/:id", requireEventsEditor, async (req, res) => {
  try {
    const { id } = req.params;

    const docRef = db.collection("events").doc(id);
    const snap = await docRef.get();

    if (!snap.exists) {
      return res.status(404).json({ error: "not_found" });
    }

    const beforeData = { id, ...snap.data() };

    await docRef.delete();

    //Log de exclusão
    await writeAuditLog({
      req,
      type: "event",
      action: "delete",
      entityId: id,
      entityName: beforeData.title || id,
      before: beforeData,
      after: null,
    });

    res.json({ ok: true, id });
  } catch (e) {
    console.error("DELETE /api/events/:id error:", e);
    res
      .status(500)
      .json({ error: "internal_error", message: e.message });
  }
});

export default router;
