import { Router } from "express";
import { MercadoPagoConfig, Payment } from "mercadopago";
import dotenv from "dotenv";

// Carrega o .env 
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

// Só cria o cliente se tiver token
const mpClient = ACCESS_TOKEN
  ? new MercadoPagoConfig({
      accessToken: ACCESS_TOKEN,
    })
  : null;

// Serviço de pagamentos 
const payment = mpClient ? new Payment(mpClient) : null;

//Cria um pagamento pix e devolve qr_code, qr_code_base64, ticket_url
 
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
      // Dados mínimos do pagador
      payer: {
        email: "pagador@test.com",
      },
    };

    // Chama a api do Mercado Pago
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

    const status = e?.status || e?.status_code || 500;
    return res.status(status).json({
      error: "pix_error",
      message: e?.message || "Erro ao criar pagamento PIX",
      cause: e?.cause || null,
    });
  }
});

export default router;
