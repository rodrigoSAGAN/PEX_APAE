"use client";
import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../../lib/firebase";
import { useRouter } from "next/navigation";
import Nav from "../../components/Nav";

export default function DashboardPage() {
  const [ready, setReady] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      if (!u) router.replace("/login");
      else setReady(true);
    });
    return () => unsub();
  }, [router]);

  if (!ready) return null;

  // Layout sem scroll na página; scroll interno no conteúdo
  const page = {
    minHeight: "calc(100svh - 56px)",
    padding: 16,
    display: "grid",
    gridTemplateColumns: "260px 1fr",
    gap: 16,
    maxWidth: 1120,
    margin: "0 auto",
  };

  const panel = {
    border: "1px solid #e5e7eb",
    borderRadius: 12,
    padding: 12,
    background: "#fff",
    minHeight: 0,
    display: "grid",
    gridTemplateRows: "auto 1fr",
    gap: 8,
  };

  const asideList = { listStyle: "none", lineHeight: 1.8, color: "#334155" };

  return (
    <>
      <Nav />
      <main style={page}>
        <aside style={panel}>
          <strong style={{ color: "#0f172a" }}>Menu</strong>
          <ul style={{ ...asideList, overflow: "auto" }}>
            <li>Lojinha / Produtos</li>
            <li>Pedidos</li>
            <li>Notícias</li>
            <li>Eventos</li>
            <li>Cozinha / Estoque</li>
            <li>Relatórios</li>
            <li>Configurações</li>
          </ul>
        </aside>

        <section style={panel}>
          <h2 style={{ color: "#0f172a" }}>Dashboard</h2>
          <div className="scroll-box" style={{ overflow: "auto" }}>
            <p style={{ color: "#475569" }}>Bem-vindo! Conteúdo real entra nas próximas sprints.</p>
            {/* espaço para cards, gráficos, etc */}
          </div>
        </section>
      </main>
    </>
  );
}
