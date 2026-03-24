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
// Usa o token em cache (sem forçar refresh) — o SDK renova automaticamente.
// Retorna null caso não haja usuário logado ou ocorra algum erro.
export async function getIdTokenOrNull() {
  try {
    const auth = getAuth();
    const user = auth.currentUser;

    if (!user) return null;

    // Usa o token em cache; o SDK renova automaticamente quando próximo do vencimento
    const token = await user.getIdToken();
    return token;
  } catch (e) {
    console.error("[authToken] Erro ao obter ID token:", e);
    return null;
  }
}
