import { Router } from "express";
import mercadopago from "mercadopago";

const router = Router();

mercadopago.configure({
  access_token: process.env.MP_ACCESS_TOKEN,
});



router.post("/", async (req, res) => {
  try {
    const { totalValue, description } = req.body || {};

    const amount = Number(totalValue);
    if (!amount || Number.isNaN(amount) || amount <= 0) {
      return res.status(400).json({ error: "invalid_amount" });
    }

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
