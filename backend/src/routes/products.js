import { Router } from "express";
import { db } from "../db/firestore.js";
import admin from "firebase-admin";
import multer from "multer";
import path from "path";
import fs from "fs";

const router = Router();


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
    console.warn("[audit-log][products] falha ao registrar log:", e);
  }
}

//base publica
 
const PUBLIC_BASE_URL = process.env.PUBLIC_BASE_URL || "http://localhost:4000";

//UPLOAD 

const rootDir = process.cwd();
const uploadsDir = path.join(rootDir, "uploads");
const productsDir = path.join(uploadsDir, "products");

// garante que a pasta exista
if (!fs.existsSync(productsDir)) {
  fs.mkdirSync(productsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, productsDir);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname) || "";
    const base = path
      .basename(file.originalname, ext)
      .replace(/\s+/g, "-")
      .toLowerCase();
    const unique = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, `${base}-${unique}${ext}`);
  },
});

const upload = multer({ storage });

// exige token Firebase e permissão:

async function requireAdmin(req, res, next) {
  try {
    const authHeader = req.headers.authorization || "";
    const [, token] = authHeader.split(" ");
    if (!token) {
      return res.status(401).json({ error: "missing_token" });
    }

    const decoded = await admin.auth().verifyIdToken(token);

    let roles = [];
    if (Array.isArray(decoded.roles)) {
      roles = decoded.roles;
    } else {

      roles = [
        decoded.admin && "admin",
        decoded.colaborador && "colaborador",
        decoded.editor && "editor",
        decoded.cozinha && "cozinha",
        decoded.estoque && "estoque",
      ].filter(Boolean);
    }

    const isAdmin = roles.includes("admin");
    const isColab = roles.includes("colaborador");
    const canEditStore = decoded.canEditStore === true;

    // Regra: admin OU colaborador 
    if (!isAdmin && !(isColab && canEditStore)) {
      return res.status(403).json({ error: "forbidden" });
    }

    // Anexa info do usuário
    req.user = {
      uid: decoded.uid,
      email: decoded.email,
      roles,
      canEditStore,
    };

    return next();
  } catch (e) {
    console.error("[products] requireAdmin error:", e);
    return res.status(401).json({ error: "invalid_token" });
  }
}

//lista os produtos
 
router.get("/", async (_req, res) => {
  try {
    const snap = await db.collection("products").get();
    const items = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    res.json(items);
  } catch (e) {
    console.error("[products] GET / error:", e);
    res.status(500).json({ message: e.message });
  }
});


router.get("/:id", async (req, res) => {
  try {
    const ref = db.collection("products").doc(req.params.id);
    const doc = await ref.get();
    if (!doc.exists) return res.status(404).json({ error: "not_found" });
    res.json({ id: doc.id, ...doc.data() });
  } catch (e) {
    console.error("[products] GET /:id error:", e);
    res.status(500).json({ message: e.message });
  }
});

//cria produto
 
router.post("/", requireAdmin, upload.single("image"), async (req, res) => {
  try {
    const {
      name,
      price,
      stock,
      category = null,
      active = true,
      images = [],
      description = "",
      imageUrl: bodyImageUrl = "",
    } = req.body || {};

    const priceNum = Number(price);
    const stockNum =
      typeof stock === "undefined" || stock === "" ? 0 : Number(stock);

    if (!name || Number.isNaN(priceNum)) {
      return res.status(400).json({
        error: "invalid_payload",
        hint: 'Campos obrigatórios: "name" (string) e "price" (number).',
      });
    }

    if (!Number.isNaN(stockNum) && stockNum < 0) {
      return res.status(400).json({
        error: "invalid_payload",
        hint: '"stock" não pode ser negativo.',
      });
    }

    // gera URL pública da img

    let finalImageUrl = bodyImageUrl || "";
    if (req.file) {
      const relativePath = `/uploads/products/${req.file.filename}`;
      finalImageUrl = `${PUBLIC_BASE_URL}${relativePath}`;
    }

    const activeBool =
      typeof active === "string" ? active === "true" : !!active;

    const payload = {
      name,
      price: priceNum,
      category,
      active: activeBool,
      images,
      imageUrl: finalImageUrl,
      stock: Number.isNaN(stockNum) ? 0 : stockNum,
      description,
      createdAt: new Date().toISOString(),
      createdBy: req.user?.uid || null,
    };

    const ref = await db.collection("products").add(payload);

    // Log de criação
    await writeAuditLog({
      req,
      type: "product",
      action: "create",
      entityId: ref.id,
      entityName: name,
      before: null,
      after: { id: ref.id, ...payload },
    });

    return res.status(201).json({ id: ref.id, ...payload });
  } catch (e) {
    console.error("[products] POST / error:", e);
    res.status(500).json({ message: e.message });
  }
});

// atualiza produto por ID
router.put("/:id", requireAdmin, upload.single("image"), async (req, res) => {
  try {
    const ref = db.collection("products").doc(req.params.id);
    const doc = await ref.get();
    if (!doc.exists) return res.status(404).json({ error: "not_found" });

    const beforeData = { id: doc.id, ...doc.data() };

    const body = req.body || {};
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

    for (const k of allowed) {
      if (k in body) {
        up[k] = body[k];
      }
    }

    //  sobrescreve imageUrl com URL pública
    if (req.file) {
      const relativePath = `/uploads/products/${req.file.filename}`;
      up.imageUrl = `${PUBLIC_BASE_URL}${relativePath}`;
    }


    if ("price" in up) {
      const priceNum = Number(up.price);
      if (Number.isNaN(priceNum)) {
        return res.status(400).json({
          error: "invalid_payload",
          hint: '"price" deve ser number',
        });
      }
      up.price = priceNum;
    }

    if ("stock" in up) {
      const stockNum = Number(up.stock);
      if (Number.isNaN(stockNum)) {
        return res.status(400).json({
          error: "invalid_payload",
          hint: '"stock" deve ser number',
        });
      }
      up.stock = stockNum;
    }

    if ("active" in up) {
      up.active =
        typeof up.active === "string" ? up.active === "true" : !!up.active;
    }

    up.updatedAt = new Date().toISOString();
    up.updatedBy = req.user?.uid || null;

    await ref.update(up);
    const final = await ref.get();
    const afterData = { id: final.id, ...final.data() };

    // Log de atualização
    await writeAuditLog({
      req,
      type: "product",
      action: "update",
      entityId: final.id,
      entityName: afterData.name || afterData.title || final.id,
      before: beforeData,
      after: afterData,
    });

    return res.json(afterData);
  } catch (e) {
    console.error("[products] PUT /:id error:", e);
    res.status(500).json({ message: e.message });
  }
});

// remove produto por ID
 
router.delete("/:id", requireAdmin, async (req, res) => {
  try {
    const ref = db.collection("products").doc(req.params.id);
    const doc = await ref.get();
    if (!doc.exists) return res.status(404).json({ error: "not_found" });

    const beforeData = { id: doc.id, ...doc.data() };

    await ref.delete();

    // Log de exclusão
    await writeAuditLog({
      req,
      type: "product",
      action: "delete",
      entityId: doc.id,
      entityName: beforeData.name || beforeData.title || doc.id,
      before: beforeData,
      after: null,
    });

    return res.status(204).end();
  } catch (e) {
    console.error("[products] DELETE /:id error:", e);
    res.status(500).json({ message: e.message });
  }
});

export default router;
