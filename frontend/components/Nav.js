"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { auth } from "../lib/firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";

export default function Nav() {
  const pathname = usePathname();
  const [user, setUser] = useState(null);
  const [authReady, setAuthReady] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u || null);
      setAuthReady(true);
    });
    return () => unsub();
  }, []);

  const bar = {
    position: "sticky",
    top: 0,
    zIndex: 50,
    backdropFilter: "saturate(180%) blur(6px)",
    background:
      "linear-gradient(180deg, rgba(255,255,255,0.85) 0%, rgba(255,255,255,0.75) 100%)",
    borderBottom: "1px solid rgba(226,232,240,0.9)",
  };

  const wrap = {
    maxWidth: 1120,
    margin: "0 auto",
    padding: "10px 16px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  };

  const brandWrap = { display: "flex", alignItems: "center", gap: 10 };

  const brandMark = {
    width: 30,
    height: 30,
    borderRadius: 10,
    background:
      "conic-gradient(from 160deg at 50% 50%, #FACC15 0deg, #fde68a 160deg, #FACC15 360deg)",
    boxShadow: "inset 0 1px 0 rgba(255,255,255,0.6)",
  };

  const brand = {
    fontWeight: 800,
    color: "#0f172a",
    letterSpacing: 0.2,
  };

  const nav = { display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" };

  const link = (href) => ({
    display: "inline-block",
    padding: "8px 12px",
    borderRadius: 10,
    fontWeight: 700,
    fontSize: 14,
    color: pathname === href ? "#0f172a" : "#334155",
    textDecoration: "none",
    background: pathname === href ? "#ECFDF5" : "transparent",
    border: pathname === href ? "1px solid #bbf7d0" : "1px solid transparent",
    transition: "background-color 120ms, color 120ms, border-color 120ms",
  });

  const cta = {
    padding: "8px 12px",
    borderRadius: 10,
    border: "1px solid #16A34A",
    background: "linear-gradient(180deg, #22C55E 0%, #16A34A 100%)",
    color: "#fff",
    fontWeight: 800,
    textDecoration: "none",
    boxShadow: "0 6px 14px rgba(22,163,74,0.20)",
  };

  const logoutBtn = {
    padding: "8px 12px",
    borderRadius: 10,
    border: "1px solid #e5e7eb",
    background: "#ffffff",
    color: "#0f172a",
    fontWeight: 800,
    cursor: "pointer",
  };

  async function handleLogout() {
    try {
      await signOut(auth);
    } catch (e) {
      console.error("Erro ao sair:", e);
      alert("Não foi possível sair. Tente novamente.");
    }
  }

  return (
    <header style={bar}>
      <div style={wrap}>
        <div style={brandWrap}>
          <div aria-hidden style={brandMark} />
          <Link href="/" style={brand}>Portal APAE</Link>
        </div>

        <nav style={nav}>
          <Link href="/" style={link("/")}>Início</Link>
          <Link href="/products" style={link("/products")}>Produtos</Link>
          <Link href="/dashboard" style={link("/dashboard")}>Dashboard</Link>

          {/* Se não estiver autenticado, mostra Login/Registrar */}
          {authReady && !user && (
            <>
              <Link href="/login" style={link("/login")}>Login</Link>
              <Link href="/register" style={link("/register")}>Registrar</Link>
            </>
          )}

          {/* Se estiver autenticado, mostra Sair */}
          {authReady && user && (
            <button onClick={handleLogout} type="button" style={logoutBtn}>
              Sair
            </button>
          )}

          <Link href="/products" style={cta}>Apoiar</Link>
        </nav>
      </div>
    </header>
  );
}
