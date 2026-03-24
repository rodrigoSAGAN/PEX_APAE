// ============================================================
// route.js — API Route de produto por ID (PUT/DELETE /api/products/[id])
//
// Proxy para as operações de edição e exclusão de produtos.
// Repassa a requisição ao backend com o token de autorização,
// garantindo que o cabeçalho Authorization chegue corretamente.
// Suporta tanto JSON puro quanto multipart/form-data (com imagem).
// ============================================================

import { NextResponse } from "next/server";

const BACKEND_BASE_URL =
  process.env.BACKEND_URL || "http://localhost:4000";

export async function PUT(request, { params }) {
  try {
    const { id } = await params;

    const contentType = request.headers.get("content-type") || "";
    const authHeader = request.headers.get("authorization") || "";

    // Lê o corpo bruto para suportar tanto JSON quanto multipart/form-data
    const rawBody = await request.arrayBuffer();

    const headers = {};
    if (authHeader) headers["authorization"] = authHeader;
    if (contentType) headers["content-type"] = contentType;

    const res = await fetch(`${BACKEND_BASE_URL}/api/products/${id}`, {
      method: "PUT",
      headers,
      body: rawBody,
    });

    let data = null;
    try {
      data = await res.json();
    } catch {
      // resposta sem corpo JSON
    }

    if (!res.ok) {
      console.error("[api/products/:id PUT] erro do backend:", res.status, data);
      return NextResponse.json(
        data || { message: "Erro ao atualizar produto" },
        { status: res.status }
      );
    }

    return NextResponse.json(data, { status: res.status });
  } catch (e) {
    console.error("[api/products/:id PUT] erro inesperado:", e);
    return NextResponse.json({ message: "Erro interno" }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = await params;

    const authHeader = request.headers.get("authorization") || "";

    const res = await fetch(`${BACKEND_BASE_URL}/api/products/${id}`, {
      method: "DELETE",
      headers: authHeader ? { authorization: authHeader } : {},
    });

    // DELETE retorna 204 sem corpo quando bem-sucedido
    if (res.status === 204) {
      return new Response(null, { status: 204 });
    }

    let data = null;
    try {
      data = await res.json();
    } catch {
      // resposta sem corpo JSON
    }

    if (!res.ok) {
      console.error("[api/products/:id DELETE] erro do backend:", res.status, data);
      return NextResponse.json(
        data || { message: "Erro ao excluir produto" },
        { status: res.status }
      );
    }

    return NextResponse.json(data || {}, { status: res.status });
  } catch (e) {
    console.error("[api/products/:id DELETE] erro inesperado:", e);
    return NextResponse.json({ message: "Erro interno" }, { status: 500 });
  }
}
