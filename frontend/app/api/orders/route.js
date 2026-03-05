// ============================================================
// route.js — API Route de Pedidos (POST /api/orders)
//
// Essa rota funciona como um proxy entre o frontend e o backend.
// O frontend manda o pedido pra cá, e a gente repassa pro
// backend real, incluindo o header de autenticação do usuário.
// Isso evita expor a URL do backend direto no navegador.
// ============================================================

import { NextResponse } from "next/server";

// URL base do backend — usa variável de ambiente ou fallback local
const BACKEND_BASE_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:4000";

// Handler POST — recebe os dados do pedido e repassa ao backend
export async function POST(request) {
  try {
    // Lê o corpo da requisição que veio do frontend
    const body = await request.json();

    // Captura o header de autorização pra repassar ao backend (token Firebase)
    const authHeader = request.headers.get("authorization") || "";

    // Faz o proxy da requisição pro backend real
    const res = await fetch(`${BACKEND_BASE_URL}/api/orders`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: authHeader,
      },
      body: JSON.stringify(body),
    });

    // Tenta parsear a resposta como JSON (pode falhar se o backend não retornar JSON)
    let data = null;
    try {
      data = await res.json();
    } catch {

    }

    // Se o backend retornou erro, monta uma mensagem amigável e devolve pro frontend
    if (!res.ok) {
      console.error(
        "[api/orders] erro do backend:",
        res.status,
        JSON.stringify(data)
      );

      const msg =
        data?.error ||
        data?.message ||
        (res.status === 401
          ? "Não autorizado."
          : "Falha ao registrar o pedido.");

      return NextResponse.json({ message: msg }, { status: res.status });
    }

    // Pedido criado com sucesso — retorna os dados do backend
    return NextResponse.json(data || { ok: true }, { status: 201 });
  } catch (e) {
    console.error("[api/orders] erro inesperado:", e);
    return NextResponse.json(
      { message: "Erro interno ao registrar pedido." },
      { status: 500 }
    );
  }
}
