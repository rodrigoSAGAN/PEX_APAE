import { Router } from "express";
import { db, admin } from "../db/firestore.js";
import { auth as requireAuth } from "../middlewares/auth.js";

const router = Router();

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
    console.error("[orders] requireDashboardAccess error:", e);
    return res.status(401).json({ error: "invalid_token" });
  }
}


function getDateRangeForPeriod(period) {
  const now = new Date();

  if (period === "month") {
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfNextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);

    return {
      start: admin.firestore.Timestamp.fromDate(startOfMonth),
      end: admin.firestore.Timestamp.fromDate(startOfNextMonth),
    };
  }


  return { start: null, end: null };
}


router.get("/summary", requireDashboardAccess, async (req, res) => {
  try {
    const period = (req.query.period || "month").toString();

    if (period !== "month") {
      return res.status(400).json({
        error: "invalid_period",
        hint: 'Atualmente só suportamos period="month".',
      });
    }

    const { start, end } = getDateRangeForPeriod(period);

    let query = db.collection("orders");
    if (start && end) {
      query = query.where("createdAt", ">=", start).where("createdAt", "<", end);
    }

    const snap = await query.get();

    let totalSold = 0;
    let totalRevenue = 0;

    snap.forEach((doc) => {
      const data = doc.data() || {};
      const items = Array.isArray(data.items) ? data.items : [];

      let orderTotal = 0;

      if (typeof data.totalValue === "number") {
        orderTotal = data.totalValue;
      } else {
        items.forEach((item) => {
          const q = Number(item.quantity ?? item.qty ?? 0);
          const price = Number(
            item.price ?? item.unitPrice ?? item.value ?? 0
          );

          if (!Number.isNaN(q) && q > 0) {
            totalSold += q;
          }

          if (!Number.isNaN(q) && !Number.isNaN(price) && q > 0 && price >= 0) {
            orderTotal += q * price;
          }
        });

        if (orderTotal === 0 && typeof data.total === "number") {
          orderTotal = data.total;
        }
      }

      if (!Number.isNaN(orderTotal) && orderTotal > 0) {
        totalRevenue += orderTotal;
      }
    });

    return res.json({
      period: "month",
      totalOrders: snap.size,
      totalSold,
      totalRevenue,
    });
  } catch (e) {
    console.error("[orders] GET /summary error:", e);
    return res.status(500).json({
      error: "internal_error",
      message: e.message,
    });
  }
});

//Lista pedidos do período 
router.get("/", requireDashboardAccess, async (req, res) => {
  try {
    const period = (req.query.period || "month").toString();

    const { start, end } = getDateRangeForPeriod(period);

    let query = db.collection("orders");
    if (start && end) {
      query = query.where("createdAt", ">=", start).where("createdAt", "<", end);
    }

    const snap = await query.get();

    const list = snap.docs.map((doc) => {
      const data = doc.data() || {};
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

    return res.json(list);
  } catch (e) {
    console.error("[orders] GET / error:", e);
    return res.status(500).json({
      error: "internal_error",
      message: e.message,
    });
  }
});

router.post("/", requireAuth, async (req, res) => {
  try {
    const { items, totalValue } = req.body || {};

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: "items_required" });
    }

    if (typeof totalValue !== "number" || Number.isNaN(totalValue)) {
      return res.status(400).json({ error: "invalid_totalValue" });
    }

    const payload = {
      items,
      totalValue,
      userId: req.user?.uid || null,
      userEmail: req.user?.email || null,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    const docRef = await db.collection("orders").add(payload);

    return res.status(201).json({
      id: docRef.id,
      message: "Pedido registrado com sucesso",
    });
  } catch (e) {
    console.error("[orders] POST / error:", e);
    return res.status(500).json({
      error: "internal_error",
      message: e.message,
    });
  }
});

export default router;
