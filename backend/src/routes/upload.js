// =============================================================================
// Rota genérica de upload de imagens para o Firebase Storage.
// Recebe um arquivo via multipart/form-data e retorna a URL pública.
// Usada pelo frontend de eventos e qualquer outra página que precise
// fazer upload de imagem antes de salvar o registro.
// =============================================================================

import { Router } from "express";
import multer from "multer";
import path from "path";
import { bucket } from "../db/firestore.js";

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

router.post("/", upload.single("image"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "Nenhum arquivo enviado." });
    }

    const ext = path.extname(req.file.originalname) || "";
    const base = path
      .basename(req.file.originalname, ext)
      .replace(/\s+/g, "-")
      .toLowerCase();
    const unique = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const filename = `uploads/${base}-${unique}${ext}`;

    const fileRef = bucket.file(filename);
    await fileRef.save(req.file.buffer, { contentType: req.file.mimetype });
    await fileRef.makePublic();

    const imageUrl = `https://storage.googleapis.com/${bucket.name}/${filename}`;
    return res.json({ imageUrl });
  } catch (e) {
    console.error("[upload] erro:", e);
    return res.status(500).json({ error: "Falha ao fazer upload da imagem." });
  }
});

export default router;
