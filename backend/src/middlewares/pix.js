// =============================================================================
// Rota legada de criação de pagamento PIX via Mercado Pago (SDK antigo).
// ATENÇÃO: Este arquivo usa mercadopago.configure (versão antiga do SDK).
// A versão principal e atualizada está em routes/pix.js, que usa a nova API
// (MercadoPagoConfig + Payment). Confira no server.js qual está registrada.
// =============================================================================

import { Router } from "express";
import mercadopago from "mercadopago";

const router = Router();

// Configura o SDK antigo do Mercado Pago com o token de acesso.
mercadopago.configure({
  access_token: process.env.MP_ACCESS_TOKEN,
});

// Gera um pagamento PIX — recebe o valor e descrição, cria no Mercado Pago
// e retorna o QR Code pro frontend exibir ao cliente.
router.post("/", async (req, res) => {
  try {
    const { totalValue, description } = req.body || {};

    // O valor precisa ser um número positivo, senão não faz sentido criar o PIX.
    const amount = Number(totalValue);
    if (!amount || Number.isNaN(amount) || amount <= 0) {
      return res.status(400).json({ error: "invalid_amount" });
    }

    // Monta o pagamento no formato do Mercado Pago.
    // O email do pagador é fixo porque em sandbox não precisamos de um email real.
    const paymentData = {
      transaction_amount: Number(amount.toFixed(2)),
      description: description || "Doação / compra APAE Pinhão",
      payment_method_id: "pix",
      payer: {
        email: "comprador_teste@teste.com",
      },
    };

    const response = await mercadopago.payment.create(paymentData);
    const payment = response.body;

    // O QR Code e o copia-e-cola ficam dentro de point_of_interaction —
    // é isso que o frontend usa pra mostrar o PIX pro cliente.
    const txData = payment.point_of_interaction?.transaction_data || {};

    return res.json({
      id: payment.id,
      status: payment.status,
      qrCode: txData.qr_code || null,
      qrCodeBase64: txData.qr_code_base64 || null,
      copyPaste: txData.qr_code || null,
    });
  } catch (e) {
    console.error("[pix] erro ao criar PIX:", e);
    const status = e?.status || 500;

    return res.status(status).json({
      error: "pix_error",
      message: e.message || "Erro ao criar pagamento PIX",
    });
  }
});

export default router;
