// =============================================================================
// Rota principal de geração de pagamento PIX via PagBank.
// Recebe o valor e o orderId, cria a cobrança no PagBank e retorna
// o QR Code (imagem base64 + código copia-e-cola) pro frontend exibir.
// =============================================================================

import { Router } from "express";
import axios from "axios";
import QRCode from "qrcode";
import dotenv from "dotenv";

dotenv.config();

const router = Router();

const PAGBANK_TOKEN = process.env.PAGBANK_TOKEN;

// "sandbox" usa sandbox.api.pagseguro.com; qualquer outro valor usa produção.
const PAGBANK_BASE =
  process.env.PAGBANK_ENV === "production"
    ? "https://api.pagseguro.com"
    : "https://sandbox.api.pagseguro.com";

// URL do webhook — registrada em cada cobrança para o PagBank notificar o backend.
const WEBHOOK_URL = process.env.PAGBANK_WEBHOOK_URL || null;

console.log(
  "[pix] PAGBANK_TOKEN prefix:",
  PAGBANK_TOKEN ? PAGBANK_TOKEN.slice(0, 10) + "..." : "NENHUM"
);
console.log("[pix] PAGBANK_BASE:", PAGBANK_BASE);

// Cria uma cobrança PIX e retorna o QR Code para o frontend.
router.post("/", async (req, res) => {
  try {
    if (!PAGBANK_TOKEN) {
      return res.status(500).json({
        error: "missing_token",
        message:
          "Token do PagBank não está configurado no servidor. " +
          "Configure PAGBANK_TOKEN no .env.",
      });
    }

    const { amount, totalValue, description, orderId } = req.body || {};

    // Aceita "amount" ou "totalValue" — compatibilidade com o frontend existente.
    const rawValue = amount ?? totalValue;
    const value = Number(rawValue);

    if (!value || Number.isNaN(value) || value <= 0) {
      return res.status(400).json({ error: "invalid_amount" });
    }

    // PagBank usa centavos (inteiro).
    const valueInCents = Math.round(value * 100);

    const body = {
      reference_id: orderId || `order_${Date.now()}`,
      description: description || "Pagamento Portal APAE – Pinhão",
      amount: {
        value: valueInCents,
        currency: "BRL",
      },
      payment_method: {
        type: "PIX",
        installments: 1,
      },
    };

    // Só inclui notification_urls se a URL estiver configurada.
    if (WEBHOOK_URL) {
      body.notification_urls = [WEBHOOK_URL];
    }

    const result = await axios.post(`${PAGBANK_BASE}/charges`, body, {
      headers: {
        Authorization: `Bearer ${PAGBANK_TOKEN}`,
        "Content-Type": "application/json",
      },
    });

    const charge = result.data;
    const pixData = charge?.payment_method?.pix;
    const qrCodeText = pixData?.qr_codes?.[0]?.text || null;

    // Gera a imagem do QR Code em base64 a partir do texto copia-e-cola.
    let qr_code_base64 = null;
    if (qrCodeText) {
      const dataUrl = await QRCode.toDataURL(qrCodeText);
      // Remove o prefixo "data:image/png;base64," para manter o mesmo formato do MP.
      qr_code_base64 = dataUrl.replace("data:image/png;base64,", "");
    }

    return res.status(201).json({
      id: charge.id,
      status: charge.status,
      qr_code: qrCodeText,
      qr_code_base64: qr_code_base64,
      ticket_url: null,
    });
  } catch (e) {
    console.error("===== ERRO PAGBANK PIX =====");
    console.error("status:", e?.response?.status);
    console.error("message:", e?.message);
    try {
      console.error("data:", JSON.stringify(e?.response?.data, null, 2));
    } catch {
      console.error("data:", e?.response?.data);
    }
    console.error("============================");

    const errMessages = e?.response?.data?.error_messages;
    const errMsg =
      errMessages?.[0]?.description ||
      e?.message ||
      "Erro ao criar pagamento PIX";

    return res.status(e?.response?.status || 500).json({
      error: "pix_error",
      message: errMsg,
      cause: e?.response?.data || null,
    });
  }
});

export default router;
