import { Router } from "express";
import { db } from "../db/firestore.js";

const router = Router();

router.get("/status/:orderId", async (req, res) => {
    try {
        const { orderId } = req.params;

        if (!orderId) {
            return res.status(400).json({ error: "missing_order_id" });
        }

        const orderDoc = await db.collection("orders").doc(orderId).get();

        if (!orderDoc.exists) {
            return res.status(404).json({ status: "not_found" });
        }

        const order = orderDoc.data();
        const status = order.status || "pending";

        // Mapear status interno para status do pagamento
        let paymentStatus = "pending";

        if (status === "paid") {
            paymentStatus = "approved";
        } else if (status === "cancelled" || status === "rejected") {
            paymentStatus = "rejected";
        }

        return res.status(200).json({
            status: paymentStatus,
            orderId: orderId,
            paidAt: order.paidAt || null,
            paymentId: order.paymentId || null,
        });

    } catch (error) {
        console.error("[payments/status] Erro:", error);
        return res.status(500).json({ error: error.message });
    }
});

export default router;
