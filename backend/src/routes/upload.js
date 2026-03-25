// =============================================================================
// Rota genérica de upload de imagens para o Firebase Storage.
// Recebe um arquivo via multipart/form-data e retorna a URL pública.
// Usada pelo frontend de eventos e qualquer outra página que precise
// fazer upload de imagem antes de salvar o registro.
// =============================================================================

import { Router } from "express";
import multer from "multer";
import { uploadToCloudinary } from "../lib/cloudinary.js";

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

router.post("/", upload.single("image"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "Nenhum arquivo enviado." });
    }

    const imageUrl = await uploadToCloudinary(req.file.buffer, "uploads");
    return res.json({ imageUrl });
  } catch (e) {
    console.error("[upload] erro:", e);
    return res.status(500).json({ error: "Falha ao fazer upload da imagem." });
  }
});

export default router;
