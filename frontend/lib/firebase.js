// ============================================================
// firebase.js — Inicialização e configuração do Firebase
//
// Aqui a gente configura e inicializa o Firebase no frontend.
// Puxa as credenciais das variáveis de ambiente (NEXT_PUBLIC_*)
// e exporta as instâncias do Firestore, Auth e Storage pra
// serem usadas em qualquer lugar da aplicação.
// ============================================================

import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";

// Configuração do Firebase — todas as credenciais vêm das variáveis de ambiente
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Avisa no console se alguma variável obrigatória estiver faltando
if (
  !firebaseConfig.apiKey ||
  !firebaseConfig.authDomain ||
  !firebaseConfig.projectId
) {
  console.warn(
    "[firebase] Variáveis de ambiente incompletas. Verifique seu .env.local / NEXT_PUBLIC_FIREBASE_*"
  );
}

// Evita inicializar o app mais de uma vez (importante no Next.js com hot reload)
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

// Exporta as instâncias prontas pra uso no restante do projeto
export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);
export default app;