// ============================================================
// route.js — API Route de geração de cobrança PIX (POST /api/orders/pix)
//
// Essa rota é o proxy pra criação de cobranças PIX.
// O frontend manda os dados do pagamento pra cá, e a gente
// repassa pro endpoint /pix do backend, que se comunica com
// o gateway de pagamento (ex: Mercado Pago) e retorna o
// QR code e dados da cobrança.
// ============================================================

import { NextResponse } from "next/server";

// URL base do backend — usa variável de ambiente ou fallback local
const BACKEND_BASE_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:4000";

// Handler POST — recebe os dados do pagamento e solicita a criação do PIX ao backend
export async function POST(request) {
  try {
    // Lê os dados do pagamento enviados pelo frontend
    const body = await request.json();

    // Repassa a requisição pro endpoint de PIX do backend
    const res = await fetch(`${BACKEND_BASE_URL}/pix`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    // Tenta parsear a resposta como JSON (pode falhar se o backend não retornar JSON)
    let data = null;
    try {
      data = await res.json();
    } catch {

    }

    // Se deu erro no backend, repassa o status e a mensagem pro frontend
    if (!res.ok) {
      console.error("[api/pix] erro do backend:", res.status, data);
      return NextResponse.json(
        { message: data?.message || "Erro ao criar PIX" },
        { status: res.status }
      );
    }

    // Sucesso — retorna os dados do PIX (QR code, copia-e-cola, etc.)
    return NextResponse.json(data, { status: 200 });
  } catch (e) {
    console.error("[api/pix] erro inesperado:", e);
    return NextResponse.json(
      { message: "Erro interno ao criar PIX" },
      { status: 500 }
    );
  }
}
