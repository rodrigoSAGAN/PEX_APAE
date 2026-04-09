// ============================================================
// route.js — API Route de galeria por ID (PUT/DELETE /api/gallery/[id])
//
// Proxy para edição e exclusão de fotos da galeria.
// Repassa a requisição ao backend com o token de autorização.
// Suporta JSON e multipart/form-data (quando há troca de imagem).
// ============================================================

import { NextResponse } from "next/server";

const BACKEND_BASE_URL = process.env.BACKEND_URL || "http://localhost:4000";

export async function PUT(request, { params }) {
  try {
    const { id } = await params;

    const contentType = request.headers.get("content-type") || "";
    const authHeader = request.headers.get("authorization") || "";

    const rawBody = await request.arrayBuffer();

    const headers = {};
    if (authHeader) headers["authorization"] = authHeader;
    if (contentType) headers["content-type"] = contentType;

    const res = await fetch(`${BACKEND_BASE_URL}/api/gallery/${id}`, {
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
      console.error("[api/gallery/:id PUT] erro do backend:", res.status, data);
      return NextResponse.json(
        data || { message: "Erro ao atualizar foto" },
        { status: res.status }
      );
    }

    return NextResponse.json(data, { status: res.status });
  } catch (e) {
    console.error("[api/gallery/:id PUT] erro inesperado:", e);
    return NextResponse.json({ message: "Erro interno" }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = await params;

    const authHeader = request.headers.get("authorization") || "";

    const res = await fetch(`${BACKEND_BASE_URL}/api/gallery/${id}`, {
      method: "DELETE",
      headers: authHeader ? { authorization: authHeader } : {},
    });

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
      console.error("[api/gallery/:id DELETE] erro do backend:", res.status, data);
      return NextResponse.json(
        data || { message: "Erro ao excluir foto" },
        { status: res.status }
      );
    }

    return NextResponse.json(data || {}, { status: res.status });
  } catch (e) {
    console.error("[api/gallery/:id DELETE] erro inesperado:", e);
    return NextResponse.json({ message: "Erro interno" }, { status: 500 });
  }
}
