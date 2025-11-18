"use client";

import { getAuth } from "firebase/auth";

//Retorna o ID token JWT do usuário logado no Firebase Sempre força refresh 
 
export async function getIdTokenOrNull() {
  try {
    const auth = getAuth();
    const user = auth.currentUser;

    if (!user) {
      console.log("[authToken] Nenhum usuário logado (currentUser = null)");
      return null;
    }

    // true -> força o Firebase a buscar as claims novas
    const token = await user.getIdToken(true);

    console.log("[authToken] Token obtido com sucesso para UID:", user.uid);
    return token;
  } catch (e) {
    console.error("[authToken] Erro ao obter ID token:", e);
    return null;
  }
}
