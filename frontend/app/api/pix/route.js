// ============================================================
// route.js — API Route de geração de PIX (POST /api/pix)
//
// Proxy para o endpoint de PIX do backend.
// O frontend chama esta rota e ela repassa ao backend real,
// que se comunica com o Mercado Pago e retorna o QR code.
// ============================================================

import { NextResponse } from "next/server";

const BACKEND_BASE_URL =
  process.env.BACKEND_URL || "http://localhost:4000";

export async function POST(request) {
  try {
    const body = await request.json();

    const res = await fetch(`${BACKEND_BASE_URL}/api/pix`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    let data = null;
    try {
      data = await res.json();
    } catch {
      // resposta sem corpo JSON
    }

    if (!res.ok) {
      console.error("[api/pix] erro do backend:", res.status, data);
      return NextResponse.json(
        {
          message: data?.message || "Erro ao criar PIX",
          cause: data?.cause || null,
        },
        { status: res.status }
      );
    }

    return NextResponse.json(data, { status: 200 });
  } catch (e) {
    console.error("[api/pix] erro inesperado:", e);
    return NextResponse.json(
      { message: "Erro interno ao criar PIX" },
      { status: 500 }
    );
  }
}
