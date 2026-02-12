import { Router } from "express";
import { MercadoPagoConfig, Payment } from "mercadopago";
import dotenv from "dotenv";

dotenv.config();

const router = Router();

const ACCESS_TOKEN =
  process.env.MP_ACCESS_TOKEN || process.env.MERCADOPAGO_ACCESS_TOKEN;

console.log(
  "[pix] ACCESS_TOKEN prefix:",
  ACCESS_TOKEN ? ACCESS_TOKEN.slice(0, 10) + "..." : "NENHUM"
);

if (!ACCESS_TOKEN) {
  console.warn(
    "⚠ [pix] Access token do Mercado Pago não definido. " +
      "Verifique seu arquivo .env (MP_ACCESS_TOKEN ou MERCADOPAGO_ACCESS_TOKEN)."
  );
} else {
  console.log("✅ [pix] Access token do Mercado Pago foi carregado.");
}

const mpClient = ACCESS_TOKEN
  ? new MercadoPagoConfig({
      accessToken: ACCESS_TOKEN,
    })
  : null;

const payment = mpClient ? new Payment(mpClient) : null;
 
router.post("/", async (req, res) => {
  try {
    
    if (!ACCESS_TOKEN || !mpClient || !payment) {
      return res.status(500).json({
        error: "missing_access_token",
        message:
          "Access token do Mercado Pago não está configurado no servidor. " +
          "Contate o administrador ou configure MP_ACCESS_TOKEN no .env.",
      });
    }

    const { amount, totalValue, description } = req.body || {};


    const rawValue = amount ?? totalValue;
    const value = Number(rawValue);

    if (!value || Number.isNaN(value) || value <= 0) {
      return res.status(400).json({ error: "invalid_amount" });
    }

    const body = {
      transaction_amount: Number(value.toFixed(2)),
      description: description || "Pagamento Portal APAE – Pinhão",
      payment_method_id: "pix",
      payer: {
        email: "pagador@test.com",
      },
    };

    const result = await payment.create({ body });

    const txData = result?.point_of_interaction?.transaction_data || {};

    return res.status(201).json({
      id: result.id,
      status: result.status,
      qr_code: txData.qr_code || null,
      qr_code_base64: txData.qr_code_base64 || null,
      ticket_url: txData.ticket_url || null,
    });
  } catch (e) {
    console.error("===== ERRO MERCADO PAGO PIX =====");
    console.error("status:", e?.status || e?.status_code);
    console.error("message:", e?.message);
    console.error("cause:", e?.cause);
    try {
      console.error("full error:", JSON.stringify(e, null, 2));
    } catch {
      console.error("full error (raw):", e);
    }
    console.error("=================================");

    const isSandbox = ACCESS_TOKEN && ACCESS_TOKEN.startsWith("TEST-");
    const status = e?.status || e?.status_code || 500;

    if (isSandbox && status === 403) {
      console.warn("⚠ [pix] Erro 403 em Sandbox. Retornando PIX MOCKADO para teste.");
      
      return res.status(201).json({
        id: "mock_pix_" + Date.now(),
        status: "pending",
        qr_code: "00020126580014BR.GOV.BCB.PIX0136123e4567-e89b-12d3-a456-426614174000520400005303986540510.005802BR5913Fulano de Tal6008BRASILIA62070503***6304ABCD",
        qr_code_base64: "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",
        ticket_url: "https://sandbox.mercadopago.com.br/checkout/v1/payment/redirect/mock",
        mock: true
      });
    }

    return res.status(status).json({
      error: "pix_error",
      message: e?.message || "Erro ao criar pagamento PIX",
      cause: e?.cause || null,
    });
  }
});

export default router;
