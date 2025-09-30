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

  const grid = {
    display: "grid",
    gridTemplateColumns: "1fr 3fr",
    gap: 16,
    padding: 16,
  };

  return (
    <>
      <Nav />
      <main style={grid}>
        <aside style={{ border: "1px solid #eee", borderRadius: 8, padding: 12 }}>
          <strong>Menu</strong>
          <ul>
            <li>Lojinha / Produtos</li>
            <li>Pedidos</li>
            <li>Notícias</li>
            <li>Eventos</li>
            <li>Cozinha / Estoque</li>
            <li>Relatórios</li>
            <li>Configurações</li>
          </ul>
        </aside>
        <section style={{ border: "1px solid #eee", borderRadius: 8, padding: 12 }}>
          <h2>Dashboard</h2>
          <p>Bem-vindo! Conteúdo real entra nas próximas sprints.</p>
        </section>
      </main>
    </>
  );
}
