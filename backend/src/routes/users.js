import { Router } from "express";
import { admin, db } from "../db/firestore.js";

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
    const actor = req.user || {};
    await db.collection("logs").add({
      type, 
      action, 
      entityId: entityId || null,
      entityName: entityName || null,
      userId: actor.uid || null, 
      userEmail: actor.email || null,
      roles: actor.roles || [],
      ip: req.ip || null,
      userAgent: req.headers["user-agent"] || null,
      before,
      after,
      createdAt: admin.firestore.Timestamp.fromDate(new Date()),
    });
  } catch (e) {
    console.warn("[audit-log][users] falha ao registrar log:", e);
  }
}

//ADMIN pode acessar essas rotas

async function requireAdmin(req, res, next) {
  try {
    const authHeader = req.headers.authorization || "";
    const [, token] = authHeader.split(" ");

    if (!token) {
      return res.status(401).json({ error: "missing_token" });
    }

    const decoded = await admin.auth().verifyIdToken(token);
    const roles = Array.isArray(decoded.roles) ? decoded.roles : [];

    console.log("requireAdmin: decoded.uid =", decoded.uid);
    console.log("requireAdmin: decoded.roles =", roles);

    if (!roles.includes("admin")) {
      console.log("requireAdmin: usuário NÃO é admin, acesso negado");
      return res.status(403).json({ error: "forbidden" });
    }

    console.log("requireAdmin: usuário é ADMIN, acesso liberado");

    req.user = {
      uid: decoded.uid,
      email: decoded.email,
      roles,
    };
    return next();
  } catch (e) {
    console.error("requireAdmin error:", e);
    return res.status(401).json({ error: "invalid_token" });
  }
}

// Lista todos os usuários
 
router.get("/", requireAdmin, async (_req, res) => {
  try {
    const all = [];
    let nextPageToken = undefined;

    do {
      const result = await admin.auth().listUsers(1000, nextPageToken);
      result.users.forEach((u) => {
        const claims = u.customClaims || {};
        all.push({
          uid: u.uid,
          email: u.email,
          displayName: u.displayName || "",
          disabled: u.disabled,
          roles: Array.isArray(claims.roles) ? claims.roles : [],
          canEditStore: claims.canEditStore === true,
          canEditEvents: claims.canEditEvents === true, // 👈 NOVO
          lastSignIn: u.metadata?.lastSignInTime || null,
          creationTime: u.metadata?.creationTime || null,
        });
      });
      nextPageToken = result.pageToken;
    } while (nextPageToken);

    res.json(all);
  } catch (e) {
    console.error("GET /api/users error:", e);
    res.status(500).json({ error: "internal_error", message: e.message });
  }
});

//permissoes de usuarios
router.post("/:uid/permissions", requireAdmin, async (req, res) => {
  try {
    const { uid } = req.params;
    const { canEditStore, canEditEvents } = req.body || {};

    
    if (
      typeof canEditStore !== "boolean" &&
      typeof canEditEvents !== "boolean"
    ) {
      return res.status(400).json({
        error: "invalid_payload",
        hint: 'Envie ao menos um dos campos: { "canEditStore": boolean, "canEditEvents": boolean }',
      });
    }

    const user = await admin.auth().getUser(uid);
    const currentClaims = user.customClaims || {};

   
    const beforeSnapshot = {
      roles: Array.isArray(currentClaims.roles)
        ? [...currentClaims.roles]
        : [],
      canEditStore: currentClaims.canEditStore === true,
      canEditEvents: currentClaims.canEditEvents === true,
    };

    
    let roles = Array.isArray(currentClaims.roles)
      ? [...currentClaims.roles]
      : [];

    // Atualiza flags
    let newClaims = { ...currentClaims };

    if (typeof canEditStore === "boolean") {
      newClaims.canEditStore = canEditStore;
    }

    if (typeof canEditEvents === "boolean") {
      newClaims.canEditEvents = canEditEvents;
    }

    // Verifica permissoes do colaborador 
    const hasStore = newClaims.canEditStore === true;
    const hasEvents = newClaims.canEditEvents === true;
    const hasAnyCollabPermission = hasStore || hasEvents;

    if (hasAnyCollabPermission) {
    
      if (!roles.includes("colaborador")) {
        roles.push("colaborador");
      }
    } else {
      // remove colaborador de roles
      roles = roles.filter((r) => r !== "colaborador");
    }

   
    newClaims.roles = roles;

    await admin.auth().setCustomUserClaims(uid, newClaims);

    const afterSnapshot = {
      roles,
      canEditStore: newClaims.canEditStore === true,
      canEditEvents: newClaims.canEditEvents === true,
    };

    //Log de alteração de permissões
    await writeAuditLog({
      req,
      type: "user",
      action: "permissions_update",
      entityId: uid,
      entityName: user.email || user.displayName || uid,
      before: beforeSnapshot,
      after: afterSnapshot,
    });

    res.json({
      uid,
      roles,
      canEditStore: newClaims.canEditStore === true,
      canEditEvents: newClaims.canEditEvents === true,
    });
  } catch (e) {
    console.error("POST /api/users/:uid/permissions error:", e);
    res.status(500).json({ error: "internal_error", message: e.message });
  }
});


router.post("/:uid/store-permission", requireAdmin, async (req, res) => {
  try {
    const { uid } = req.params;
    const { canEdit } = req.body || {};

    if (typeof canEdit !== "boolean") {
      return res.status(400).json({
        error: "invalid_payload",
        hint: 'Envie { "canEdit": true | false }',
      });
    }

    // Reaproveita a lógica da rota nova
    req.body = { canEditStore: canEdit };
    return router.handle(req, res);
  } catch (e) {
    console.error("POST /api/users/:uid/store-permission error:", e);
    res.status(500).json({ error: "internal_error", message: e.message });
  }
});

export default router;
