// =============================================================================
// Webhook do Mercado Pago.
// Esse endpoint é chamado automaticamente pelo Mercado Pago quando o status
// de um pagamento muda. O fluxo é:
//   1. Mercado Pago envia uma notificação pra cá
//   2. Validamos a assinatura HMAC pra garantir que é legítimo
//   3. Consultamos a API do MP pra pegar os detalhes do pagamento
//   4. Se o pagamento foi aprovado, atualizamos o pedido no Firestore
//
// IMPORTANTE: Esse endpoint usa express.raw() porque precisa do body cru
// pra validar a assinatura. Por isso ele é registrado ANTES do express.json()
// no server.js.
// =============================================================================

import express from "express";
import crypto from "crypto";
import axios from "axios";
import { db } from "../db/firestore.js";
import dotenv from "dotenv";

dotenv.config();

const router = express.Router();

const MP_ACCESS_TOKEN =
  process.env.MP_ACCESS_TOKEN || process.env.MERCADOPAGO_ACCESS_TOKEN;

// Segredo usado pra validar que a notificação realmente veio do Mercado Pago.
const MP_WEBHOOK_SECRET = process.env.MP_WEBHOOK_SECRET;

router.post(
  "/mercadopago",
  express.raw({ type: "application/json" }),
  async (req, res) => {
    try {
      console.log("[webhook] Recebido do Mercado Pago");

      const xSignature = req.headers["x-signature"];
      const xRequestId = req.headers["x-request-id"];

      if (!xSignature || !xRequestId || !MP_WEBHOOK_SECRET) {
        console.log("[webhook] Assinatura ausente");
        return res.status(401).json({ error: "missing_signature" });
      }

      const parts = xSignature.split(",");
      let ts = null;
      let hash = null;

      for (const part of parts) {
        const [key, value] = part.split("=");
        if (key?.trim() === "ts") ts = value?.trim();
        if (key?.trim() === "v1") hash = value?.trim();
      }

      if (!ts || !hash) {
        return res.status(401).json({ error: "invalid_signature_format" });
      }

      const body = JSON.parse(req.body.toString("utf-8"));
      const paymentId = body?.data?.id;

      if (!paymentId) {
        return res.status(200).json({ received: true });
      }

      // Monta o "manifesto" e calcula o hash HMAC-SHA256.
      // Se o hash que calculamos bater com o que veio no header, a notificação é legítima.
      const manifest = `id:${paymentId};request-id:${xRequestId};ts:${ts};`;

      const expectedHash = crypto
        .createHmac("sha256", MP_WEBHOOK_SECRET)
        .update(manifest)
        .digest("hex");

      if (expectedHash !== hash) {
        console.log("[webhook] ❌ Assinatura inválida");
        return res.status(403).json({ error: "invalid_signature" });
      }

      console.log("[webhook] ✅ Assinatura validada");

      if (body.type !== "payment") {
        return res.status(200).json({ received: true });
      }

      const mpRes = await axios.get(
        `https://api.mercadopago.com/v1/payments/${paymentId}`,
        {
          headers: {
            Authorization: `Bearer ${MP_ACCESS_TOKEN}`,
          },
        }
      );

      const payment = mpRes.data;

      console.log("[webhook] Status:", payment.status);
      console.log("[webhook] External ref:", payment.external_reference);

      // Se o pagamento foi aprovado e tem referência ao pedido, atualiza o status
      // no Firestore pra "paid" — isso é o que faz o pedido aparecer como pago no sistema.
      if (payment.status === "approved" && payment.external_reference) {
        const orderId = payment.external_reference;

        await db.collection("orders").doc(orderId).update({
          status: "paid",
          paidAt: new Date(),
          paymentId: paymentId,
          updatedAt: new Date(),
        });

        console.log("✅ PEDIDO PAGO:", orderId);
      }

      return res.status(200).json({ received: true });
    } catch (err) {
      console.error("🔥 ERRO NO WEBHOOK:", err?.response?.data || err.message);
      return res.status(200).json({ error: "webhook_error" });
    }
  }
);

export default router;
