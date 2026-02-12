import { NextResponse } from "next/server";

const BACKEND_BASE_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:4000";

export async function POST(request) {
  try {
    const body = await request.json();

    const res = await fetch(`${BACKEND_BASE_URL}/pix`, {
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
      
    }

    if (!res.ok) {
      console.error("[api/pix] erro do backend:", res.status, data);
      return NextResponse.json(
        { message: data?.message || "Erro ao criar PIX" },
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
