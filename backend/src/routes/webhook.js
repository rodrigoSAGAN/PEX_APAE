// =============================================================================
// Webhook do PagBank.
// Esse endpoint é chamado automaticamente pelo PagBank quando o status
// de uma cobrança muda. O fluxo é:
//   1. PagBank envia uma notificação pra cá com o ID da cobrança
//   2. Consultamos a API do PagBank pra confirmar o status real
//   3. Se o pagamento foi aprovado (PAID), atualizamos o pedido no Firestore
// =============================================================================

import express from "express";
import axios from "axios";
import { db } from "../db/firestore.js";
import dotenv from "dotenv";

dotenv.config();

const router = express.Router();

const PAGBANK_TOKEN = process.env.PAGBANK_TOKEN;
const PAGBANK_BASE =
  process.env.PAGBANK_ENV === "production"
    ? "https://api.pagseguro.com"
    : "https://sandbox.api.pagseguro.com";

router.post("/pagbank", express.json(), async (req, res) => {
  try {
    console.log("[webhook] Recebido do PagBank");

    const { id: notificationId } = req.body || {};

    if (!notificationId) {
      console.log("[webhook] Sem id no payload, ignorando.");
      return res.status(200).json({ received: true });
    }

    // Verificação: busca o status real do pedido na API /orders do PagBank.
    // Nunca confiamos apenas no payload do webhook.
    // A API /charges foi descontinuada — usamos /orders conforme orientação do PagBank.
    const response = await axios.get(`${PAGBANK_BASE}/orders/${notificationId}`, {
      headers: { Authorization: `Bearer ${PAGBANK_TOKEN}` },
    });

    const order = response.data;
    console.log("[webhook] Order status:", order.status);
    console.log("[webhook] Reference:", order.reference_id);

    // Considera pago se o pedido estiver PAID ou se algum qr_code estiver PAID.
    const qrPaid = order?.qr_codes?.some((qr) => qr.status === "PAID");
    const isPaid = order.status === "PAID" || qrPaid;

    // Se o pagamento foi confirmado e temos a referência do pedido, atualiza o Firestore.
    if (isPaid && order.reference_id) {
      const orderId = order.reference_id;

      await db.collection("orders").doc(orderId).update({
        status: "paid",
        paidAt: new Date(),
        paymentId: notificationId,
        updatedAt: new Date(),
      });

      console.log("✅ PEDIDO PAGO:", orderId);
    }

    return res.status(200).json({ received: true });
  } catch (err) {
    console.error("🔥 ERRO NO WEBHOOK:", err?.response?.data || err.message);
    // Retorna 200 mesmo em erro para o PagBank não ficar reenviando.
    return res.status(200).json({ error: "webhook_error" });
  }
});

export default router;
