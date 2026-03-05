// =============================================================================
// Rotas de pedidos (orders).
// Aqui gerenciamos todo o ciclo de vida dos pedidos: criação (pelo cliente),
// listagem (pelo painel admin), resumo mensal (pro dashboard) e controle
// de entrega item a item. É uma das rotas mais importantes do sistema.
// =============================================================================

import { Router } from "express";
import { db, admin } from "../db/firestore.js";
import { auth as requireAuth } from "../middlewares/auth.js";

const router = Router();

// Middleware que verifica se o usuário tem acesso ao painel/dashboard.
// Admin tem acesso total. Colaborador precisa ter pelo menos uma permissão
// (canEditStore ou canEditEvents) pra poder visualizar os pedidos.
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


// Calcula o intervalo de datas pro filtro de período.
// Por enquanto só suporta "month" (mês atual), mas a estrutura
// já está pronta pra adicionar outros períodos no futuro.
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


// Retorna um resumo dos pedidos do mês — total de pedidos, itens vendidos
// e receita total. Usado no dashboard do admin pra ter uma visão geral.
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

      // Tenta pegar o total direto do pedido. Se não existir, calcula
      // somando os itens — essa flexibilidade existe porque o formato
      // dos pedidos pode variar (campos diferentes em versões antigas).
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

// Lista todos os pedidos do período (painel admin).
// Converte o Timestamp do Firestore pra ISO string pro frontend conseguir usar.
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

// Auth opcional — se o cliente está logado, pega os dados dele.
// Se não está, segue sem problema (compra como visitante é permitida).
async function optionalAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization || "";
    const [, token] = authHeader.split(" ");

    if (token) {
      const decoded = await admin.auth().verifyIdToken(token);
      req.user = {
        uid: decoded.uid,
        email: decoded.email,
      };
    }
  } catch (e) {
    console.warn("[orders] optionalAuth: token inválido ou expirado", e.message);
  }
  next();
}

// Cria um novo pedido — pode ser feito por usuário logado ou visitante.
// Visitantes precisam informar o nome de retirada (pickupName).
// Esse endpoint tem bastante log de debug pra facilitar a investigação
// caso algo dê errado no fluxo de compra.
router.post("/", optionalAuth, async (req, res) => {
  try {
    console.log("[orders] POST / - Recebendo requisição");
    console.log("[orders] Headers:", JSON.stringify(req.headers, null, 2));
    console.log("[orders] Body recebido:", JSON.stringify(req.body, null, 2));
    console.log("[orders] User autenticado:", req.user ? req.user.uid : "NÃO");

    const { items, totalValue, pickupName, phoneWhatsApp } = req.body || {};

    if (!Array.isArray(items)) {
      console.error("[orders] ERRO: items não é um array:", typeof items);
      return res.status(400).json({
        error: "items_required",
        message: "O campo 'items' deve ser um array de produtos."
      });
    }

    if (items.length === 0) {
      console.error("[orders] ERRO: items está vazio");
      return res.status(400).json({
        error: "items_required",
        message: "O carrinho está vazio. Adicione pelo menos um produto."
      });
    }

    console.log("[orders] ✓ Validação items OK:", items.length, "itens");

    console.log("[orders] totalValue recebido:", totalValue, "tipo:", typeof totalValue);

    const numericTotal = Number(totalValue);

    if (typeof totalValue !== "number" && typeof totalValue !== "string") {
      console.error("[orders] ERRO: totalValue não é number nem string:", typeof totalValue);
      return res.status(400).json({
        error: "invalid_totalValue",
        message: "O campo 'totalValue' deve ser um número."
      });
    }

    if (Number.isNaN(numericTotal)) {
      console.error("[orders] ERRO: totalValue não pode ser convertido para número:", totalValue);
      return res.status(400).json({
        error: "invalid_totalValue",
        message: "O valor total é inválido."
      });
    }

    if (numericTotal <= 0) {
      console.error("[orders] ERRO: totalValue é menor ou igual a zero:", numericTotal);
      return res.status(400).json({
        error: "invalid_totalValue",
        message: "O valor total deve ser maior que zero."
      });
    }

    console.log("[orders] ✓ Validação totalValue OK:", numericTotal);

    if (!req.user && (!pickupName || !pickupName.trim())) {
      console.error("[orders] ERRO: pickupName vazio e usuário não autenticado");
      return res.status(400).json({
        error: "pickup_name_required",
        message: "Para comprar sem login, informe o Nome de Retirada."
      });
    }

    console.log("[orders] ✓ Validação pickupName OK:", pickupName || "(usuário autenticado)");

    const payload = {
      items,
      totalValue: numericTotal,
      userId: req.user?.uid || null,
      userEmail: req.user?.email || null,
      pickupName: pickupName ? pickupName.trim() : null,
      phoneWhatsApp: phoneWhatsApp ? phoneWhatsApp.trim() : null,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    console.log("[orders] Payload a ser salvo no Firestore:", JSON.stringify(payload, null, 2));

    console.log("[orders] Salvando no Firestore...");
    const docRef = await db.collection("orders").add(payload);
    console.log("[orders] ✅ Pedido salvo com sucesso! ID:", docRef.id);

    return res.status(201).json({
      id: docRef.id,
      message: "Pedido registrado com sucesso",
    });
  } catch (e) {
    console.error("[orders] ❌ POST / error:", e);
    console.error("[orders] Stack trace:", e.stack);
    return res.status(500).json({
      error: "internal_error",
      message: e.message || "Erro interno ao processar o pedido.",
    });
  }
});


// Marca um item específico do pedido como entregue (ou desfaz a entrega).
// O admin usa isso no painel de controle pra gerenciar entregas item a item.
router.put("/:id/delivery", requireDashboardAccess, async (req, res) => {
  try {
    const { id } = req.params;
    const { itemIndex, delivered } = req.body;

    if (typeof itemIndex !== "number" || typeof delivered !== "boolean") {
      return res.status(400).json({ error: "invalid_payload" });
    }

    const orderRef = db.collection("orders").doc(id);
    const docSnap = await orderRef.get();

    if (!docSnap.exists) {
      return res.status(404).json({ error: "order_not_found" });
    }

    const data = docSnap.data();
    const items = Array.isArray(data.items) ? data.items : [];

    if (!items[itemIndex]) {
      return res.status(404).json({ error: "item_not_found" });
    }

    items[itemIndex] = {
      ...items[itemIndex],
      delivered: delivered,
    };

    await orderRef.update({ items });

    return res.json({ success: true, items });
  } catch (e) {
    console.error("[orders] PUT /:id/delivery error:", e);
    return res.status(500).json({
      error: "internal_error",
      message: e.message,
    });
  }
});

export default router;
