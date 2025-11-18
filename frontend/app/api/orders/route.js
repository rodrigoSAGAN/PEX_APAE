import { NextResponse } from "next/server";

// Base do backend Express
const BACKEND_BASE_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:4000";

export async function POST(request) {
  try {
    
    const body = await request.json();

    
    const authHeader = request.headers.get("authorization") || "";

    const res = await fetch(`${BACKEND_BASE_URL}/api/orders`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: authHeader,
      },
      body: JSON.stringify(body),
    });

    let data = null;
    try {
      data = await res.json();
    } catch {
      
    }

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

    
    return NextResponse.json(data || { ok: true }, { status: 201 });
  } catch (e) {
    console.error("[api/orders] erro inesperado:", e);
    return NextResponse.json(
      { message: "Erro interno ao registrar pedido." },
      { status: 500 }
    );
  }
}
