"use client";
import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../../lib/firebase";
import { useRouter } from "next/navigation";
import Nav from "../../components/Nav";
import Link from "next/link";

export default function DashboardPage() {
  const [ready, setReady] = useState(false);
  const [claims, setClaims] = useState(null);
  const [stats, setStats] = useState({
    products: 0,
    events: 0,
    users: 0,
    soldThisMonth: 0,
  });
  const [statsLoading, setStatsLoading] = useState(true);
  const [statsError, setStatsError] = useState("");
  const router = useRouter();

  //Autenticação
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (!u) {
        router.replace("/login");
        return;
      }

      try {
        const tokenResult = await u.getIdTokenResult(true);
        const c = tokenResult.claims || {};
        setClaims(c);

        const roles = Array.isArray(c.roles) ? c.roles : [];
        const isAdmin = roles.includes("admin");
        const isColab = roles.includes("colaborador");
        const canStore = c.canEditStore === true;
        const canEvents = c.canEditEvents === true;

        const canDashboard = isAdmin || (isColab && (canStore || canEvents));

        if (!canDashboard) {
          router.replace("/");
          return;
        }

        setReady(true);
      } catch (e) {
        console.error("[dashboard] erro ao ler claims:", e);
        router.replace("/login");
      }
    });

    return () => unsub();
  }, [router]);

 
  useEffect(() => {
    if (!ready) return;

    async function loadStats() {
      setStatsLoading(true);
      setStatsError("");

      try {
        const user = auth.currentUser;
        const token = await user.getIdToken(); // obrigatório para rotas protegidas

        const [resProd, resEvents, resUsers, resOrders] = await Promise.all([
          fetch("/api/products", { cache: "no-store" }),
          fetch("/api/events", { cache: "no-store" }),
          fetch("/api/users", {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch("/api/orders/summary?period=month", {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        if (!resProd.ok || !resEvents.ok) {
          throw new Error("Falha ao buscar estatísticas principais");
        }

        const prodData = await resProd.json();
        const eventsData = await resEvents.json();

        // Usuários
        let usersCount = 0;
        if (resUsers.ok) {
          const usersData = await resUsers.json();
          if (Array.isArray(usersData)) usersCount = usersData.length;
        }

        // Vendas do mês
        let soldThisMonth = 0;
        if (resOrders.ok) {
          const summary = await resOrders.json();
          soldThisMonth = Number(summary.totalSold || 0);
        }

        setStats({
          products: Array.isArray(prodData) ? prodData.length : 0,
          events: Array.isArray(eventsData) ? eventsData.length : 0,
          users: usersCount,
          soldThisMonth,
        });
      } catch (e) {
        console.error("[dashboard] erro ao carregar stats:", e);
        setStatsError("Não foi possível carregar estatísticas agora.");
      } finally {
        setStatsLoading(false);
      }
    }

    loadStats();
  }, [ready]);

  if (!ready) return null;

  const roles = Array.isArray(claims?.roles) ? claims.roles : [];
  const isAdmin = roles.includes("admin");
  const isColab = roles.includes("colaborador");
  const canStore = claims?.canEditStore === true;
  const canEvents = claims?.canEditEvents === true;

  //Estilos
  const page = {
    minHeight: "calc(100svh - 56px)",
    padding: 16,
    display: "grid",
    gridTemplateColumns: "260px 1fr",
    gap: 16,
    maxWidth: 1120,
    margin: "0 auto",
    background: "#e6f3ff", 
  };

  const panelBase = {
    border: "1px solid #e5e7eb",
    borderRadius: 12,
    padding: 12,
    background: "#ffffff",
    minHeight: 0,
    display: "grid",
    gridTemplateRows: "auto 1fr",
    gap: 8,
  };

  const asidePanel = { ...panelBase };

  const mainPanel = {
    ...panelBase,
    position: "relative",
    overflow: "hidden",
    backgroundColor: "#ffffffcc",
  };

  const bgImageOverlay = {
    position: "absolute",
    inset: 0,
    backgroundImage: "url(/images/logo22.jpg)",
    backgroundSize: "cover",
    backgroundPosition: "center",
    opacity: 0.3,
    zIndex: 0,
  };

  const panelContent = {
    position: "relative",
    zIndex: 1,
  };

  const asideList = { listStyle: "none", lineHeight: 1.8, color: "#334155" };
  const inactiveItem = { opacity: 0.5, cursor: "not-allowed" };
  const linkStyle = { color: "#0f172a", textDecoration: "none" };

  const cardsGrid = {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: 12,
    marginTop: 8,
  };

  const card = {
    borderRadius: 12,
    padding: 12,
    border: "1px solid #e5e7eb",
    background: "rgba(255,255,255,0.92)",
    boxShadow: "0 4px 12px rgba(15,23,42,0.06)",
  };

  const cardTitle = { fontSize: 14, fontWeight: 600, marginBottom: 4 };
  const cardValue = { fontSize: 24, fontWeight: 800, color: "#15803d" };
  const cardSub = { fontSize: 12, color: "#6b7280", marginTop: 4 };

  const quickBtn = {
    display: "inline-block",
    padding: "6px 10px",
    borderRadius: 999,
    border: "1px solid #d1d5db",
    fontSize: 13,
    fontWeight: 600,
    background: "#f9fafb",
    marginRight: 6,
    marginTop: 6,
    textDecoration: "none",
    color: "#0f172a",
  };

  const errorBox = {
    background: "#fef2f2",
    borderRadius: 8,
    border: "1px solid #fecaca",
    color: "#991b1b",
    padding: 10,
    fontSize: 13,
    marginBottom: 8,
  };

  return (
    <>
      <Nav />
      <main style={page}>
        <aside style={asidePanel}>
          <strong style={{ color: "#0f172a" }}>Menu</strong>
          <ul style={{ ...asideList, overflow: "auto" }}>
            <li>
              <Link href="/products" style={linkStyle}>
                Lojinha
              </Link>
            </li>

            <li style={inactiveItem}>Pedidos</li>

            <li>
              <Link href="/events" style={linkStyle}>
                Eventos
              </Link>
            </li>

            {/* Relatórios e Permissões */}
            {isAdmin && (
              <>
                <li>
                  <Link href="/relatorios" style={linkStyle}>
                    Relatórios
                  </Link>
                </li>
                <li>
                  <Link href="/controle" style={linkStyle}>
                    Permissões
                  </Link>
                </li>
              </>
            )}
          </ul>
        </aside>

        <section style={mainPanel}>
          <div style={bgImageOverlay} />

          <div style={panelContent}>
            <h2 style={{ color: "#0f172a", marginBottom: 4 }}>Dashboard</h2>
            <p style={{ color: "#475569", fontSize: 14, marginBottom: 8 }}>
              Visão geral da Lojinha APAE – Pinhão e eventos.
            </p>

            {statsError && <div style={errorBox}>{statsError}</div>}

            <div style={cardsGrid}>
              {/* Produtos */}
              <div style={card}>
                <div style={cardTitle}>Produtos cadastrados</div>
                <div style={cardValue}>
                  {statsLoading ? "…" : stats.products}
                </div>
                <div style={cardSub}>Itens disponíveis.</div>
              </div>

              {/* Eventos */}
              <div style={card}>
                <div style={cardTitle}>Eventos futuros</div>
                <div style={cardValue}>
                  {statsLoading ? "…" : stats.events}
                </div>
                <div style={cardSub}>Ações da APAE.</div>
              </div>

              {/* Usuários */}
              <div style={card}>
                <div style={cardTitle}>Usuários cadastrados</div>
                <div style={cardValue}>
                  {statsLoading ? "…" : stats.users}
                </div>
                <div style={cardSub}>Contas registradas.</div>
              </div>

              {/* Produtos vendidos */}
              <div style={card}>
                <div style={cardTitle}>Produtos vendidos no mês</div>
                <div style={cardValue}>
                  {statsLoading ? "…" : stats.soldThisMonth}
                </div>
                <div style={cardSub}>Total de itens vendidos.</div>
              </div>

              {/* Acesso rápido */}
              <div style={card}>
                <div style={cardTitle}>Acesso rápido</div>
                <div style={cardSub}>Atalhos conforme permissões.</div>

                {canStore && (
                  <Link href="/products" style={quickBtn}>
                    ➕ Gerenciar produtos
                  </Link>
                )}

                {canEvents && (
                  <Link href="/events" style={quickBtn}>
                    📅 Gerenciar eventos
                  </Link>
                )}

                {isAdmin && (
                  <>
                    <Link href="/relatorios" style={quickBtn}>
                      📊 Relatórios
                    </Link>
                    <Link href="/controle" style={quickBtn}>
                      🛡️ Permissões
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
