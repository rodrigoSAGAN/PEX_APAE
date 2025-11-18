

// IMPORTA o admin de src/db/firestore.js
import admin from "../db/firestore.js";

//autorizaçao
export async function auth(req, res, next) {
  const authHeader = req.headers.authorization || "";

  if (!authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Token não informado" });
  }

  const token = authHeader.split(" ")[1];

  try {
    // Valida o ID token do Firebase
    const decoded = await admin.auth().verifyIdToken(token);

    // Anexa os dados do usuário 
    req.user = {
      uid: decoded.uid,
      email: decoded.email || null,
      roles: Array.isArray(decoded.roles) ? decoded.roles : [],
      canEditStore: decoded.canEditStore === true,
      canEditEvents: decoded.canEditEvents === true,
    };

    return next();
  } catch (err) {
    console.error("[auth middleware] Erro ao verificar token:", err);
    return res.status(401).json({ error: "Token inválido" });
  }
}
