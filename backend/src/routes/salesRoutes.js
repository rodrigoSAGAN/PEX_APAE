import { Router } from "express";
import { db, admin } from "../db/firestore.js";

const router = Router();

// Middleware duplicado de orders.js para evitar refatoração de arquivos existentes
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

// GET /sales?month=MM&year=YYYY
router.get("/", requireDashboardAccess, async (req, res) => {
  try {
    const { month, year } = req.query;

    let query = db.collection("orders");

    if (month && year) {
      const m = parseInt(month, 10);
      const y = parseInt(year, 10);

      if (!isNaN(m) && !isNaN(y)) {
        // Mês em JS é 0-indexado (0 = Janeiro, 11 = Dezembro)
        // Mas a UI deve mandar 1-12. Então subtraímos 1.
        const start = new Date(y, m - 1, 1);
        const end = new Date(y, m, 1); // Primeiro dia do próximo mês

        const startTs = admin.firestore.Timestamp.fromDate(start);
        const endTs = admin.firestore.Timestamp.fromDate(end);

        query = query
          .where("createdAt", ">=", startTs)
          .where("createdAt", "<", endTs);
      }
    }

    // Ordenação
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

// GET /sales/by-month
router.get("/by-month", requireDashboardAccess, async (req, res) => {
  try {
    // Busca todos os pedidos. 
    // Em produção com muitos dados, isso deveria ser paginado ou agregado via Cloud Functions.
    // Como solicitado, buscamos tudo.
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
        // PadStart para garantir "01", "02", etc.
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
