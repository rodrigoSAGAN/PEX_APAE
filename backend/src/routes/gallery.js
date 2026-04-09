// =============================================================================
// Rotas de edição e exclusão da galeria de fotos da APAE.
// Apenas admins e colaboradores com canEditEvents podem editar/excluir.
// O cadastro de novas fotos ainda é feito diretamente via SDK do Firestore
// no frontend — este arquivo cuida só de PUT e DELETE.
// =============================================================================

import { Router } from "express";
import { db } from "../db/firestore.js";
import admin from "firebase-admin";
import multer from "multer";
import { uploadToCloudinary } from "../lib/cloudinary.js";

const router = Router();

const upload = multer({ storage: multer.memoryStorage() });

async function uploadImage(file) {
  return uploadToCloudinary(file.buffer, "gallery");
}

// Middleware — admin tem acesso total; colaborador precisa de canEditEvents = true.
async function requireGalleryEditor(req, res, next) {
  try {
    const authHeader = req.headers.authorization || "";
    const [, token] = authHeader.split(" ");
    if (!token) return res.status(401).json({ error: "missing_token" });

    const decoded = await admin.auth().verifyIdToken(token);

    let roles = [];
    if (Array.isArray(decoded.roles)) {
      roles = decoded.roles;
    } else {
      roles = [
        decoded.admin && "admin",
        decoded.colaborador && "colaborador",
      ].filter(Boolean);
    }

    const isAdmin = roles.includes("admin");
    const isColab = roles.includes("colaborador");
    const canEditEvents = decoded.canEditEvents === true;

    if (!isAdmin && !(isColab && canEditEvents)) {
      return res.status(403).json({ error: "forbidden" });
    }

    req.user = { uid: decoded.uid, email: decoded.email, roles };
    return next();
  } catch (e) {
    console.error("[gallery] requireGalleryEditor error:", e);
    return res.status(401).json({ error: "invalid_token" });
  }
}

// Atualiza título, descrição, categoria e opcionalmente a imagem de uma foto.
router.put("/:id", requireGalleryEditor, upload.single("image"), async (req, res) => {
  try {
    const ref = db.collection("gallery").doc(req.params.id);
    const doc = await ref.get();
    if (!doc.exists) return res.status(404).json({ error: "not_found" });

    const body = req.body || {};
    const up = {};
    for (const k of ["title", "description", "category"]) {
      if (k in body) up[k] = body[k];
    }

    if (req.file) {
      up.imageUrl = await uploadImage(req.file);
    }

    up.updatedAt = new Date().toISOString();
    up.updatedBy = req.user?.uid || null;

    await ref.update(up);
    return res.json({ id: doc.id, ...doc.data(), ...up });
  } catch (e) {
    console.error("[gallery] PUT /:id error:", e);
    res.status(500).json({ message: e.message });
  }
});

// Remove permanentemente uma foto da galeria.
router.delete("/:id", requireGalleryEditor, async (req, res) => {
  try {
    const ref = db.collection("gallery").doc(req.params.id);
    const doc = await ref.get();
    if (!doc.exists) return res.status(404).json({ error: "not_found" });

    await ref.delete();
    return res.status(204).end();
  } catch (e) {
    console.error("[gallery] DELETE /:id error:", e);
    res.status(500).json({ message: e.message });
  }
});

export default router;
