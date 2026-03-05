// =============================================================================
// Rotas de relatórios de vendas.
// Usadas pelo painel admin e pela tela de relatórios. Permitem filtrar
// pedidos por mês/ano e também agrupar todos os pedidos por mês
// (pra exibir gráficos e tabelas no frontend).
// =============================================================================

import { Router } from "express";
import { db, admin } from "../db/firestore.js";

const router = Router();

// Mesmo middleware de acesso ao dashboard usado nas orders.
async function requireDashboardAccess(req, res, next) {
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

    const canStore = decoded.canEditStore === true;
    const canEvents = decoded.canEditEvents === true;

    const canDashboard = isAdmin || (isColab && (canStore || canEvents));

    if (!canDashboard) {
      return res.status(403).json({ error: "forbidden" });
    }

    req.user = {
      uid: decoded.uid,
      email: decoded.email,
      roles,
      canStore,
      canEvents,
    };

    return next();
  } catch (e) {
    console.error("[sales] requireDashboardAccess error:", e);
    return res.status(401).json({ error: "invalid_token" });
  }
}

// Lista pedidos filtrados por mês/ano — se não passar filtro, retorna tudo.
router.get("/", requireDashboardAccess, async (req, res) => {
  try {
    const { month, year } = req.query;

    let query = db.collection("orders");

    if (month && year) {
      const m = parseInt(month, 10);
      const y = parseInt(year, 10);

      if (!isNaN(m) && !isNaN(y)) {
        const start = new Date(y, m - 1, 1);
        const end = new Date(y, m, 1);

        const startTs = admin.firestore.Timestamp.fromDate(start);
        const endTs = admin.firestore.Timestamp.fromDate(end);

        query = query
          .where("createdAt", ">=", startTs)
          .where("createdAt", "<", endTs);
      }
    }

    query = query.orderBy("createdAt", "desc");

    const snap = await query.get();

    const orders = snap.docs.map((doc) => {
      const data = doc.data();
      let createdAtIso = null;

      if (data.createdAt instanceof admin.firestore.Timestamp) {
        createdAtIso = data.createdAt.toDate().toISOString();
      } else if (typeof data.createdAt === "string") {
        createdAtIso = data.createdAt;
      }

      return {
        id: doc.id,
        ...data,
        createdAt: createdAtIso,
      };
    });

    return res.json(orders);
  } catch (e) {
    console.error("[sales] GET / error:", e);
    return res.status(500).json({ error: "internal_error", message: e.message });
  }
});

// Agrupa todos os pedidos por ano e mês — retorna um objeto tipo:
// { "2024": { "01": [...], "02": [...] }, "2025": { ... } }
// Usado nos relatórios pra montar gráficos e tabelas mensais.
router.get("/by-month", requireDashboardAccess, async (req, res) => {
  try {
    const snap = await db.collection("orders").orderBy("createdAt", "desc").get();

    const grouped = {};

    snap.forEach((doc) => {
      const data = doc.data();
      let dateObj = null;

      if (data.createdAt instanceof admin.firestore.Timestamp) {
        dateObj = data.createdAt.toDate();
      } else if (typeof data.createdAt === "string") {
        dateObj = new Date(data.createdAt);
      }

      if (dateObj) {
        const year = dateObj.getFullYear().toString();
        const month = (dateObj.getMonth() + 1).toString().padStart(2, "0");

        if (!grouped[year]) {
          grouped[year] = {};
        }
        if (!grouped[year][month]) {
          grouped[year][month] = [];
        }

        grouped[year][month].push({
          id: doc.id,
          ...data,
          createdAt: dateObj.toISOString(),
        });
      }
    });

    return res.json(grouped);
  } catch (e) {
    console.error("[sales] GET /by-month error:", e);
    return res.status(500).json({ error: "internal_error", message: e.message });
  }
});

export default router;
