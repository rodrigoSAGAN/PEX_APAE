import admin from "firebase-admin";

export async function requireAuth(req, res, next) {
  try {
    const auth = req.headers.authorization || "";
    const [, token] = auth.split(" ");
    if (!token) return res.status(401).json({ error: "missing_token" });

    const decoded = await admin.auth().verifyIdToken(token);
    req.user = {
      uid: decoded.uid,
      email: decoded.email,
      roles: Array.isArray(decoded.roles)
        ? decoded.roles
        : [
            decoded.admin && "admin",
            decoded.editor && "editor",
            decoded.cozinha && "cozinha",
            decoded.estoque && "estoque",
          ].filter(Boolean),
    };
    next();
  } catch {
    res.status(401).json({ error: "invalid_token" });
  }
}