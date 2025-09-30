"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { auth } from "../lib/firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { useRouter } from "next/navigation";

export default function Nav() {
  const [user, setUser] = useState(null);
  const router = useRouter();

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => setUser(u));
    return () => unsub();
  }, []);

  async function handleLogout() {
    try {
      await signOut(auth);
      router.push("/login");
    } catch (e) {
      alert("Falha ao sair: " + (e?.message || e));
    }
  }

  
  const bar = {
    background: "linear-gradient(90deg, #3b82f6 0%, #10b981 100%)", 
    color: "#fff",
    padding: "12px 16px",
    borderBottom: "1px solid rgba(255,255,255,0.2)",
    display: "flex",
    alignItems: "center",
    gap: 12,
  };
  const container = {
    width: "100%",
    maxWidth: 1080,
    margin: "0 auto",
    display: "flex",
    alignItems: "center",
    gap: 12,
  };
  const left = { display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" };
  const right = { marginLeft: "auto", display: "flex", gap: 10, alignItems: "center" };
  const link = {
    color: "white",
    textDecoration: "none",
    fontWeight: 600,
    padding: "6px 12px",
    borderRadius: 6,
    transition: "background .2s, opacity .2s",
  };
  const linkGhost = { ...link, background: "rgba(255,255,255,0.15)" };
  const brand = { ...link, background: "rgba(255,255,255,0.18)", letterSpacing: 0.4 };
  const badge = {
    background: "rgba(255,255,255,0.25)",
    border: "1px solid rgba(255,255,255,0.4)",
    borderRadius: 999,
    padding: "6px 12px",
    fontSize: 13,
  };
  const btn = {
    background: "#111827",
    color: "#fff",
    borderRadius: 6,
    padding: "8px 14px",
    border: 0,
    cursor: "pointer",
    fontWeight: 600,
    transition: "background .2s, transform .05s",
  };

  return (
    <nav style={bar}>
      <div style={container}>
        <div style={left}>
          <Link href="/" style={brand}>APAE</Link>
          <Link href="/products" style={link}>Produtos</Link>
          {/* Dashboard só aparece se estiver logado */}
          {user && <Link href="/dashboard" style={link}>Dashboard</Link>}
        </div>

        <div style={right}>
          {user ? (
            <>
              <span style={badge}>{user.displayName || user.email}</span>
              <button style={btn} onClick={handleLogout}>Sair</button>
            </>
          ) : (
            <>
              <Link href="/login" style={linkGhost}>Entrar</Link>
              <Link href="/register" style={{ ...linkGhost, background: "rgba(255,255,255,0.3)" }}>
                Registrar
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
