// ============================================================
// route.js — Webhook do PagBank (POST /api/webhook/pagbank)
//
// O PagBank envia notificações de pagamento para esta URL.
// Esta rota repassa o payload para o backend, que verifica
// o status na API do PagBank e atualiza o pedido no Firestore.
// ============================================================

import { NextResponse } from "next/server";

const BACKEND_BASE_URL = process.env.BACKEND_URL || "http://localhost:4000";

export async function POST(request) {
  try {
    const body = await request.json();

    const res = await fetch(`${BACKEND_BASE_URL}/webhook/pagbank`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    return NextResponse.json({ received: true }, { status: 200 });
  } catch (e) {
    console.error("[webhook/pagbank] erro:", e);
    // Sempre retorna 200 para o PagBank não reenviar indefinidamente.
    return NextResponse.json({ received: true }, { status: 200 });
  }
}
