"use client";
import { useEffect, useState } from "react";
import { auth } from "../lib/firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import NavbarAdmin from "./navbar/NavbarAdmin";
import NavbarUser from "./navbar/NavbarUser";
import { useModal } from "./ModalContext";

export default function Nav() {
  const { showModal } = useModal();
  const [user, setUser] = useState(null);
  const [claims, setClaims] = useState(null);
  const [authReady, setAuthReady] = useState(false);

  // auth
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u || null);

      if (u) {
        const token = await u.getIdTokenResult(true);
        setClaims(token.claims);
      } else {
        setClaims(null);
      }

      setAuthReady(true);
    });
    return () => unsub();
  }, []);

  async function handleLogout() {
    try {
      await signOut(auth);
    } catch (e) {
      console.error("Erro ao sair:", e);
      showModal("Não foi possível sair. Tente novamente.", "Erro");
    }
  }

  if (!authReady) return null;

  const roles = Array.isArray(claims?.roles) ? claims.roles : [];
  const isAdmin = roles.includes("admin");
  const isColab = roles.includes("colaborador");

  const canStore = claims?.canEditStore === true;
  const canEvents = claims?.canEditEvents === true;

  const canAccessDashboard = isAdmin || (isColab && (canStore || canEvents));

  if (canAccessDashboard) {
    return <NavbarAdmin user={user} handleLogout={handleLogout} />;
  }

  return <NavbarUser user={user} handleLogout={handleLogout} />;
}
