// =============================================================================
// Rotas de eventos da APAE.
// CRUD completo de eventos (festas, encontros, etc.) + simulação de reservas
// e listagem de reservas agrupadas por evento. Só admins e colaboradores com
// permissão canEditEvents podem criar/editar/excluir eventos.
// =============================================================================

import { Router } from "express";
import { db, admin } from "../db/firestore.js";

const router = Router();

// Registra uma ação no log de auditoria — toda alteração importante em eventos
// é registrada aqui pra saber quem fez o quê e quando.
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
    const user = req.user || {};
    await db.collection("logs").add({
      type, 
      action, 
      entityId: entityId || null,
      entityName: entityName || null,
      userId: user.uid || null,
      userEmail: user.email || null,
      roles: user.roles || [],
      ip: req.ip || null,
      userAgent: req.headers["user-agent"] || null,
      before,
      after,
      createdAt: admin.firestore.Timestamp.fromDate(new Date()),
    });
  } catch (e) {
    console.warn("[audit-log][events] falha ao registrar log:", e);
  }
}

// Middleware que verifica se o usuário pode editar eventos.
// Admin tem acesso total; colaborador precisa ter canEditEvents = true.
async function requireEventsEditor(req, res, next) {
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
    const canEditEvents = decoded.canEditEvents === true;

    if (!isAdmin && !(isColab && canEditEvents)) {
      return res.status(403).json({ error: "forbidden" });
    }

    req.user = {
      uid: decoded.uid,
      email: decoded.email,
      roles,
      canEditEvents,
    };

    return next();
  } catch (e) {
    console.error("requireEventsEditor error:", e);
    return res.status(401).json({ error: "invalid_token" });
  }
}
 
// Lista todos os eventos ordenados por data (público, não precisa de auth).
router.get("/", async (_req, res) => {
  try {
    const snap = await db
      .collection("events")
      .orderBy("date", "asc")
      .get();

    const list = snap.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    res.json(list);
  } catch (e) {
    console.error("GET /api/events error:", e);
    res
      .status(500)
      .json({ error: "internal_error", message: e.message });
  }
});

// Cria um novo evento — só quem tem permissão de edição de eventos.
router.post("/", requireEventsEditor, async (req, res) => {
  try {
    const { title, date, location, description, coverImage, isFree, priceAdult, priceChild } = req.body || {};

    if (!title || typeof title !== "string") {
      return res.status(400).json({
        error: "invalid_payload",
        hint: "Campo 'title' é obrigatório e deve ser string.",
      });
    }

    const now = new Date().toISOString();

    const docRef = await db.collection("events").add({
      title: title.trim(),
      date: date || null, 
      location: location || null,
      description: description || null,
      coverImage: coverImage || null,
      isFree: isFree !== undefined ? Boolean(isFree) : true,
      priceAdult: isFree ? 0 : Number(priceAdult) || 0,
      priceChild: isFree ? 0 : Number(priceChild) || 0,
      createdAt: now,
      updatedAt: now,
      active: true,
    });

    const created = await docRef.get();
    const data = { id: created.id, ...created.data() };

    await writeAuditLog({
      req,
      type: "event",
      action: "create",
      entityId: created.id,
      entityName: data.title || created.id,
      before: null,
      after: data,
    });

    res.status(201).json(data);
  } catch (e) {
    console.error("POST /api/events error:", e);
    res
      .status(500)
      .json({ error: "internal_error", message: e.message });
  }
});

// Atualiza um evento existente — só os campos enviados são modificados.
// Se o evento for marcado como gratuito (isFree), os preços são zerados.
router.put("/:id", requireEventsEditor, async (req, res) => {
  try {
    const { id } = req.params;
    const { title, date, location, description, active, coverImage, isFree, priceAdult, priceChild } = req.body || {};

    const docRef = db.collection("events").doc(id);
    const snap = await docRef.get();

    if (!snap.exists) {
      return res.status(404).json({ error: "not_found" });
    }

    const beforeData = { id, ...snap.data() };

    const updateData = {
      updatedAt: new Date().toISOString(),
    };

    if (typeof title === "string") updateData.title = title.trim();
    if (typeof date === "string" || date === null) updateData.date = date || null;
    if (typeof location === "string" || location === null)
      updateData.location = location || null;
    if (typeof description === "string" || description === null)
      updateData.description = description || null;
    if (typeof active === "boolean") updateData.active = active;
    if (typeof coverImage === "string" || coverImage === null) 
      updateData.coverImage = coverImage || null;
    if (typeof isFree === "boolean") {
      updateData.isFree = isFree;
      if (isFree) {
        updateData.priceAdult = 0;
        updateData.priceChild = 0;
      }
    }
    if (!isFree && typeof priceAdult === "number") 
      updateData.priceAdult = Number(priceAdult) || 0;
    if (!isFree && typeof priceChild === "number") 
      updateData.priceChild = Number(priceChild) || 0;

    await docRef.update(updateData);

    const updated = await docRef.get();
    const afterData = { id: updated.id, ...updated.data() };

    await writeAuditLog({
      req,
      type: "event",
      action: "update",
      entityId: id,
      entityName: afterData.title || id,
      before: beforeData,
      after: afterData,
    });

    res.json(afterData);
  } catch (e) {
    console.error("PUT /api/events/:id error:", e);
    res
      .status(500)
      .json({ error: "internal_error", message: e.message });
  }
});

// Remove um evento permanentemente do Firestore.
router.delete("/:id", requireEventsEditor, async (req, res) => {
  try {
    const { id } = req.params;

    const docRef = db.collection("events").doc(id);
    const snap = await docRef.get();

    if (!snap.exists) {
      return res.status(404).json({ error: "not_found" });
    }

    const beforeData = { id, ...snap.data() };

    await docRef.delete();

    await writeAuditLog({
      req,
      type: "event",
      action: "delete",
      entityId: id,
      entityName: beforeData.title || id,
      before: beforeData,
      after: null,
    });

    res.json({ ok: true, id });
  } catch (e) {
    console.error("DELETE /api/events/:id error:", e);
    res
      .status(500)
      .json({ error: "internal_error", message: e.message });
  }
});

// Simula uma reserva de evento — cria um pedido "pago" direto no Firestore,
// sem passar por pagamento real. Usado pelo painel admin pra registrar
// reservas feitas presencialmente ou por outros meios.
router.post("/simulate-reservation", requireEventsEditor, async (req, res) => {
  try {
    const { eventId, adultQuantity, childQuantity, reservationName } = req.body || {};

    if (!eventId) {
      return res.status(400).json({ error: "eventId is required" });
    }

    if ((!adultQuantity || adultQuantity === 0) && (!childQuantity || childQuantity === 0)) {
      return res.status(400).json({ error: "At least one quantity must be greater than 0" });
    }

    if (!reservationName || !reservationName.trim()) {
      return res.status(400).json({ error: "reservationName is required" });
    }

    const eventDoc = await db.collection("events").doc(eventId).get();
    if (!eventDoc.exists) {
      return res.status(404).json({ error: "Event not found" });
    }

    const event = { id: eventDoc.id, ...eventDoc.data() };
    const items = [];
    let totalValue = 0;

    if (adultQuantity && adultQuantity > 0) {
      const adultPrice = event.isFree ? 0 : (Number(event.priceAdult) || 0);
      items.push({
        id: `event-${eventId}`,
        name: `${event.title} - Adulto`,
        quantity: Number(adultQuantity),
        price: adultPrice,
        category: "Evento",
        reservationName: reservationName.trim(),
        eventId: eventId,
        eventTitle: event.title,
        eventDate: event.date,
        isEventItem: true,
      });
      totalValue += adultPrice * Number(adultQuantity);
    }

    if (childQuantity && childQuantity > 0) {
      const childPrice = event.isFree ? 0 : (Number(event.priceChild) || 0);
      items.push({
        id: `event-${eventId}-child`,
        name: `${event.title} - Criança`,
        quantity: Number(childQuantity),
        price: childPrice,
        category: "Evento",
        reservationName: reservationName.trim(),
        eventId: eventId,
        eventTitle: event.title,
        eventDate: event.date,
        isEventItem: true,
      });
      totalValue += childPrice * Number(childQuantity);
    }

    const orderRef = await db.collection("orders").add({
      items,
      totalValue,
      userEmail: req.user.email || "simulator@test.com",
      userId: req.user.uid || null,
      pickupName: reservationName.trim(),
      createdAt: admin.firestore.Timestamp.fromDate(new Date()),
      status: "paid",
      delivered: true,
      paymentMethod: "simulated",
      isSimulated: true,
    });

    await writeAuditLog({
      req,
      type: "event-reservation",
      action: "simulate",
      entityId: orderRef.id,
      entityName: `${event.title} - ${reservationName}`,
      before: null,
      after: { orderId: orderRef.id, eventId, items, totalValue },
    });

    res.json({ ok: true, orderId: orderRef.id, items, totalValue });
  } catch (e) {
    console.error("POST /api/events/simulate-reservation error:", e);
    res.status(500).json({ error: "internal_error", message: e.message });
  }
});

// Lista todas as reservas de eventos agrupadas por evento.
// Percorre todos os pedidos pagos e filtra os itens que são de eventos
// (identificados pelo prefixo "event-" no ID do item), agrupando por eventId.
router.get("/reservations", requireEventsEditor, async (req, res) => {
  try {
    const ordersSnap = await db
      .collection("orders")
      .where("status", "==", "paid")
      .get();

    const eventReservations = {};

    ordersSnap.docs.forEach((doc) => {
      const order = { id: doc.id, ...doc.data() };
      const items = Array.isArray(order.items) ? order.items : [];

      items.forEach((item) => {
        if (item.id && item.id.startsWith("event-")) {
          const eventId = item.eventId || item.id.replace("event-", "").replace("-child", "");
          const isChild = item.id.includes("-child");
          const type = isChild ? "Criança" : "Adulto";

          if (!eventReservations[eventId]) {
            eventReservations[eventId] = {
              eventId,
              eventTitle: item.eventTitle || item.name || "Evento",
              eventDate: item.eventDate || null,
              reservations: [],
              totalAdults: 0,
              totalChildren: 0,
              totalValue: 0,
            };
          }

          const reservation = {
            orderId: order.id,
            responsibleName: item.reservationName || order.pickupName || "Anônimo",
            customerName: order.userEmail || order.pickupName || "Anônimo",
            type,
            quantity: item.quantity || 0,
            unitPrice: item.price || 0,
            totalValue: (item.quantity || 0) * (item.price || 0),
            date: order.createdAt?.toDate?.() || order.createdAt || null,
          };

          eventReservations[eventId].reservations.push(reservation);
          
          if (isChild) {
            eventReservations[eventId].totalChildren += item.quantity || 0;
          } else {
            eventReservations[eventId].totalAdults += item.quantity || 0;
          }
          
          eventReservations[eventId].totalValue += reservation.totalValue;
        }
      });
    });

    const result = Object.values(eventReservations);
    res.json(result);
  } catch (e) {
    console.error("GET /api/events/reservations error:", e);
    res.status(500).json({ error: "internal_error", message: e.message });
  }
});

export default router;

