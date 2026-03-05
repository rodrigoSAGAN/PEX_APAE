// =============================================================================
// Middleware de autenticação principal.
// Esse cara verifica se o usuário que está fazendo a requisição é legítimo.
// Ele pega o token JWT do Firebase (vem no header Authorization), valida com
// o Firebase Admin e extrai as informações do usuário (uid, email, roles,
// permissões). Se o token for inválido ou estiver faltando, barra a requisição.
// =============================================================================

import admin from "../db/firestore.js";

export async function auth(req, res, next) {
  const authHeader = req.headers.authorization || "";

  // O padrão esperado é "Bearer <token>" — se não seguir esse formato,
  // o token não foi enviado corretamente.
  if (!authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Token não informado" });
  }

  const token = authHeader.split(" ")[1];

  try {
    // O Firebase Admin decodifica e valida o token.
    // Se estiver expirado, adulterado ou inválido, lança um erro.
    const decoded = await admin.auth().verifyIdToken(token);

    // Montamos o req.user com tudo que as próximas rotas vão precisar.
    // As roles e permissões vêm das custom claims do Firebase,
    // que são definidas pelo admin na gestão de usuários.
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
