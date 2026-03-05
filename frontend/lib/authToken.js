// ============================================================
// authToken.js — Utilitário de autenticação (token Firebase)
//
// Esse arquivo tem uma função só, mas é essencial: ele pega
// o ID Token do usuário logado no Firebase Auth pra gente
// poder mandar nas requisições autenticadas ao backend.
// Se o usuário não estiver logado, retorna null sem quebrar.
// ============================================================

"use client";

import { getAuth } from "firebase/auth";

// Tenta obter o ID Token do usuário autenticado no Firebase.
// Força a renovação do token (true) pra garantir que ele esteja válido.
// Retorna null caso não haja usuário logado ou ocorra algum erro.
export async function getIdTokenOrNull() {
  try {
    const auth = getAuth();
    const user = auth.currentUser;

    // Se não tem ninguém logado, não tem token pra retornar
    if (!user) {
      console.log("[authToken] Nenhum usuário logado (currentUser = null)");
      return null;
    }

    // Força refresh do token pra evitar token expirado
    const token = await user.getIdToken(true);

    console.log("[authToken] Token obtido com sucesso para UID:", user.uid);
    return token;
  } catch (e) {
    console.error("[authToken] Erro ao obter ID token:", e);
    return null;
  }
}
