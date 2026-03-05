// =============================================================================
// Rotas do carrinho de compras.
// Gerenciamos o carrinho do usuário no Firestore — salvar, buscar e mesclar
// com itens que ele tinha no localStorage antes de fazer login.
// Cada usuário tem um documento na coleção "carts" com seu UID como ID.
// =============================================================================

import { Router } from "express";
import { db, admin } from "../db/firestore.js";

const router = Router();

// Autenticação simplificada — verifica o token do Firebase
// e coloca uid/email no req.user pra usar nas rotas abaixo.
async function requireAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization || "";
    const [, token] = authHeader.split(" ");

    if (!token) {
      return res.status(401).json({ error: "missing_token" });
    }

    const decoded = await admin.auth().verifyIdToken(token);
    req.user = {
      uid: decoded.uid,
      email: decoded.email,
    };
    next();
  } catch (e) {
    console.error("[cart] requireAuth error:", e);
    return res.status(401).json({ error: "invalid_token" });
  }
}

// Salva (ou atualiza) o carrinho inteiro do usuário no Firestore.
router.post("/", requireAuth, async (req, res) => {
  try {
    const { items } = req.body || {};
    const uid = req.user.uid;

    if (!items || typeof items !== "object") {
      return res.status(400).json({ error: "invalid_items" });
    }

    await db.collection("carts").doc(uid).set({ items }, { merge: true });

    return res.json({ success: true });
  } catch (e) {
    console.error("[cart] POST / error:", e);
    return res.status(500).json({ error: "internal_error", message: e.message });
  }
});

// Mescla o carrinho local (localStorage) com o que já existe no Firestore.
// Isso acontece quando o usuário faz login e já tinha itens salvos localmente —
// a gente soma as quantidades pra não perder nada.
router.post("/merge", requireAuth, async (req, res) => {
  try {
    const { localItems } = req.body || {};
    const uid = req.user.uid;

    if (!localItems || typeof localItems !== "object") {
      return res.status(400).json({ error: "invalid_localItems" });
    }

    const cartRef = db.collection("carts").doc(uid);
    const cartSnap = await cartRef.get();

    let finalCart = { ...localItems };

    if (cartSnap.exists) {
      const remoteData = cartSnap.data();
      const remoteItems = remoteData.items || {};

      Object.keys(remoteItems).forEach((itemId) => {
        if (finalCart[itemId]) {
          finalCart[itemId] += remoteItems[itemId];
        } else {
          finalCart[itemId] = remoteItems[itemId];
        }
      });
    }

    await cartRef.set({ items: finalCart }, { merge: true });

    return res.json({ success: true, items: finalCart });
  } catch (e) {
    console.error("[cart] POST /merge error:", e);
    return res.status(500).json({ error: "internal_error", message: e.message });
  }
});

// Busca o carrinho atual do usuário no Firestore.
router.get("/", requireAuth, async (req, res) => {
  try {
    const uid = req.user.uid;
    const cartRef = db.collection("carts").doc(uid);
    const cartSnap = await cartRef.get();

    if (cartSnap.exists) {
      return res.json(cartSnap.data());
    } else {
      return res.json({ items: {} });
    }
  } catch (e) {
    console.error("[cart] GET / error:", e);
    return res.status(500).json({ error: "internal_error", message: e.message });
  }
});

export default router;
