import { Router } from "express";
import { db } from "../db/firestore.js";
import admin from "firebase-admin";

const router = Router();

/**
 * Middleware local: exige token Firebase e role de ADMIN
 * - Header: Authorization: Bearer <ID_TOKEN>
 * - Aceita claims como:
 *   - { roles: ["admin", ...] }  OU
 *   - { admin: true }
 */
async function requireAdmin(req, res, next) {
  try {
    const auth = req.headers.authorization || "";
    const [, token] = auth.split(" ");
    if (!token) {
      return res.status(401).json({ error: "missing_token" });
    }

    const decoded = await admin.auth().verifyIdToken(token);

    // Extrai roles (array) ou booleano "admin"
    const roles = Array.isArray(decoded.roles)
      ? decoded.roles
      : [
          decoded.admin && "admin",
          decoded.editor && "editor",
          decoded.cozinha && "cozinha",
          decoded.estoque && "estoque",
        ].filter(Boolean);

    const isAdmin = roles.includes("admin");
    if (!isAdmin) {
      return res.status(403).json({ error: "forbidden" });
    }

    // Anexa info do usuário para auditoria
    req.user = { uid: decoded.uid, email: decoded.email, roles };
    return next();
  } catch (e) {
    return res.status(401).json({ error: "invalid_token" });
  }
}

/**
 * GET /api/products
 * Público — lista todos os produtos
 */
router.get("/", async (_req, res) => {
  try {
    const snap = await db.collection("products").get();
    const items = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    res.json(items);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

/**
 * GET /api/products/:id
 * Público — detalhe por ID
 */
router.get("/:id", async (req, res) => {
  try {
    const ref = db.collection("products").doc(req.params.id);
    const doc = await ref.get();
    if (!doc.exists) return res.status(404).json({ error: "not_found" });
    res.json({ id: doc.id, ...doc.data() });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

/**
 * POST /api/products
 * ADMIN — cria produto
 */
router.post("/", requireAdmin, async (req, res) => {
  try {
    const {
      name,
      price,
      category = null,
      active = true,
      images = [],
      stock = 0,
      description = "",
      imageUrl = "",
    } = req.body || {};

    if (!name || typeof price !== "number") {
      return res.status(400).json({
        error: "invalid_payload",
        hint: 'Campos obrigatórios: "name" (string) e "price" (number).',
      });
    }

    const payload = {
      name,
      price,
      category,
      active: !!active,
      images,
      imageUrl,
      stock,
      description,
      createdAt: new Date().toISOString(),
      createdBy: req.user?.uid || null,
    };

    const ref = await db.collection("products").add(payload);
    return res.status(201).json({ id: ref.id, ...payload });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

/**
 * PUT /api/products/:id
 * ADMIN — atualiza produto por ID
 */
router.put("/:id", requireAdmin, async (req, res) => {
  try {
    const ref = db.collection("products").doc(req.params.id);
    const doc = await ref.get();
    if (!doc.exists) return res.status(404).json({ error: "not_found" });

    const up = {};
    const allowed = [
      "name",
      "price",
      "stock",
      "category",
      "active",
      "images",
      "description",
      "imageUrl",
    ];
    for (const k of allowed) if (k in req.body) up[k] = req.body[k];

    if ("price" in up && typeof up.price !== "number") {
      return res.status(400).json({ error: "invalid_payload", hint: '"price" deve ser number' });
    }
    if ("stock" in up && typeof up.stock !== "number") {
      return res.status(400).json({ error: "invalid_payload", hint: '"stock" deve ser number' });
    }

    up.updatedAt = new Date().toISOString();
    up.updatedBy = req.user?.uid || null;

    await ref.update(up);
    const final = await ref.get();
    return res.json({ id: final.id, ...final.data() });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

/**
 * DELETE /api/products/:id
 * ADMIN — remove produto por ID
 */
router.delete("/:id", requireAdmin, async (req, res) => {
  try {
    const ref = db.collection("products").doc(req.params.id);
    const doc = await ref.get();
    if (!doc.exists) return res.status(404).json({ error: "not_found" });

    await ref.delete();
    return res.status(204).end();
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

export default router;