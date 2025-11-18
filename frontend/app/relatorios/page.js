"use client";

import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../../lib/firebase";
import { useRouter } from "next/navigation";
import Nav from "../../components/Nav";
import Link from "next/link";

export default function RelatoriosPage() {
  const router = useRouter();

  const [ready, setReady] = useState(false);
  const [claims, setClaims] = useState(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [summary, setSummary] = useState({
    totalOrders: 0,
    totalSold: 0,
    totalRevenue: 0,
  });

  const [orders, setOrders] = useState([]);
  const [logs, setLogs] = useState([]); // logs 
  const [showLogs, setShowLogs] = useState(false); //exibição dos logs

  //Autenticação + permissão
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

        // Relatórios: apenas admin
        if (!isAdmin) {
          router.replace("/");
          return;
        }

        setReady(true);
      } catch (e) {
        console.error("[relatorios] erro ao ler claims:", e);
        router.replace("/login");
      }
    });

    return () => unsub();
  }, [router]);

  //Carregar resumo do mes
  useEffect(() => {
    if (!ready) return;

    async function loadData() {
      setLoading(true);
      setError("");

      try {
        const user = auth.currentUser;
        const token = await user.getIdToken();

        const [resSummary, resOrders, resLogs] = await Promise.all([
          fetch("/api/orders/summary?period=month", {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch("/api/orders?period=month", {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch("/api/logs?limit=100", {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        let summaryData = {
          totalOrders: 0,
          totalSold: 0,
          totalRevenue: 0,
        };

      //sumary
        if (resSummary.ok) {
          const rawSum = await resSummary.json();
          summaryData = {
            totalOrders: Number(rawSum.totalOrders || 0),
            totalSold: Number(rawSum.totalSold || 0),
            totalRevenue: Number(rawSum.totalRevenue || 0),
          };
        }

        // Pedidos
        let ordersList = [];
        if (resOrders.ok) {
          const rawOrders = await resOrders.json();
          if (Array.isArray(rawOrders)) {
            ordersList = rawOrders;
          }
        }

        //fallback se necessario
        if (!resSummary.ok && ordersList.length > 0) {
          let totalOrders = ordersList.length;
          let totalSold = 0;
          let totalRevenue = 0;

          for (const order of ordersList) {
            if (Array.isArray(order.items)) {
              for (const item of order.items) {
                const q =
                  typeof item.quantity === "number"
                    ? item.quantity
                    : Number(item.quantity || 0);
                if (!Number.isNaN(q)) totalSold += q;

                const price =
                  typeof item.price === "number"
                    ? item.price
                    : Number(item.price || 0);
                if (!Number.isNaN(price)) {
                  totalRevenue += q * price;
                }
              }
            }

            if (typeof order.totalValue === "number") {
              totalRevenue += order.totalValue;
            }
          }

          summaryData = {
            totalOrders,
            totalSold,
            totalRevenue,
          };
        }

        //Logs
        let logsList = [];
        if (resLogs.ok) {
          try {
            const rawLogs = await resLogs.json();
            if (Array.isArray(rawLogs)) {
              logsList = rawLogs;
            }
          } catch (e) {
            console.warn("[relatorios] erro ao parsear logs:", e);
          }
        }

        setSummary(summaryData);
        setOrders(ordersList);
        setLogs(logsList);
      } catch (e) {
        console.error("[relatorios] erro ao carregar dados:", e);
        setError("Não foi possível carregar os relatórios agora.");
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [ready]);

  if (!ready) return null;

  //Helpers

  function formatDateTime(iso) {
    if (!iso) return "-";
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "-";
    return d.toLocaleString("pt-BR", {
      dateStyle: "short",
      timeStyle: "short",
    });
  }

  function formatCurrency(v) {
    if (typeof v !== "number" || Number.isNaN(v)) return "R$ 0,00";
    return v.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
  }

  function buildItemsText(order) {
    if (!Array.isArray(order.items) || order.items.length === 0) {
      return "—";
    }
    return order.items
      .map((it) => {
        const name = it.name || it.title || "Item";
        const q =
          typeof it.quantity === "number"
            ? it.quantity
            : Number(it.quantity || 0);
        return `${name} (x${!Number.isNaN(q) ? q : "?"})`;
      })
      .join(", ");
  }

  // Permissões (das claims)
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
    overflow: "hidden",
  };

  const asideList = { listStyle: "none", lineHeight: 1.8, color: "#334155" };

  const inactiveItem = {
    opacity: 0.5,
    cursor: "not-allowed",
  };

  const linkStyle = {
    color: "#0f172a",
    textDecoration: "none",
  };

  const title = {
    fontSize: 22,
    fontWeight: 700,
    color: "#0f172a",
    marginBottom: 6,
  };

  const subtitle = {
    fontSize: 14,
    color: "#475569",
    marginBottom: 16,
  };

  const cardsGrid = {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: 12,
    marginBottom: 20,
  };

  const card = {
    borderRadius: 12,
    padding: 12,
    border: "1px solid #e5e7eb",
    background: "rgba(255,255,255,0.95)",
    boxShadow: "0 4px 10px rgba(15,23,42,0.06)",
  };

  const cardTitle = {
    fontSize: 14,
    fontWeight: 600,
    color: "#0f172a",
    marginBottom: 4,
  };

  const cardValue = {
    fontSize: 22,
    fontWeight: 800,
    color: "#15803d",
  };

  const cardSub = {
    fontSize: 12,
    color: "#6b7280",
    marginTop: 4,
  };

  const errorBox = {
    background: "#fef2f2",
    borderRadius: 8,
    border: "1px solid #fecaca",
    color: "#991b1b",
    padding: 10,
    fontSize: 13,
    marginBottom: 12,
  };

  const tableWrap = {
    borderRadius: 12,
    border: "1px solid #e5e7eb",
    background: "#ffffff",
    boxShadow: "0 4px 10px rgba(15,23,42,0.05)",
    overflow: "hidden",
    marginTop: 12,
  };

  const table = {
    width: "100%",
    borderCollapse: "collapse",
    fontSize: 13,
  };

  const th = {
    background: "#f1f5f9",
    padding: "8px 10px",
    textAlign: "left",
    borderBottom: "1px solid #e5e7eb",
    color: "#0f172a",
    fontWeight: 600,
  };

  const td = {
    padding: "8px 10px",
    borderBottom: "1px solid #e5e7eb",
    color: "#334155",
    verticalAlign: "top",
  };

  const loadingBox = {
    textAlign: "center",
    padding: 16,
    color: "#4b5563",
    fontSize: 14,
  };

  const emptyBox = {
    textAlign: "center",
    padding: 16,
    color: "#6b7280",
    fontSize: 13,
  };

  const logsToggleBtn = {
    padding: "8px 14px",
    borderRadius: 8,
    background: "#2563eb",
    color: "#ffffff",
    border: "none",
    cursor: "pointer",
    fontSize: 14,
    fontWeight: 600,
    marginTop: 8,
    marginBottom: 8,
    boxShadow: "0 2px 6px rgba(0,0,0,0.15)",
  };

  return (
    <>
      <Nav />
      <main style={page}>
        {/* MENU LATERAL*/}
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

            {/* Relatórios e Permissões*/}
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

        {/* CONTEÚDO PRINCIPAL */}
        <section style={mainPanel}>
          <div>
            <h1 style={title}>Relatórios de vendas</h1>
            <p style={subtitle}>
              Visão detalhada dos pedidos e itens vendidos na lojinha solidária.
            </p>

            {error && <div style={errorBox}>{error}</div>}

            {/* Cards de resumo */}
            <section style={cardsGrid}>
              <div style={card}>
                <div style={cardTitle}>Pedidos no mês</div>
                <div style={cardValue}>
                  {loading ? "…" : summary.totalOrders}
                </div>
                <div style={cardSub}>
                  Quantidade total de pedidos registrados.
                </div>
              </div>

              <div style={card}>
                <div style={cardTitle}>Itens vendidos no mês</div>
                <div style={cardValue}>
                  {loading ? "…" : summary.totalSold}
                </div>
                <div style={cardSub}>
                  Soma de unidades em todos os pedidos.
                </div>
              </div>

              <div style={card}>
                <div style={cardTitle}>Faturamento do mês</div>
                <div style={cardValue}>
                  {loading ? "…" : formatCurrency(summary.totalRevenue)}
                </div>
                <div style={cardSub}>
                  Total em valores registrados nos pedidos.
                </div>
              </div>
            </section>

            {/* Tabela de logs de pedidos */}
            <section>
              <h2 style={{ ...cardTitle, fontSize: 16, marginBottom: 8 }}>
                Registro de vendas (mês atual)
              </h2>

              <div style={tableWrap}>
                {loading ? (
                  <div style={loadingBox}>Carregando registros...</div>
                ) : orders.length === 0 ? (
                  <div style={emptyBox}>
                    Nenhum pedido registrado no período selecionado.
                  </div>
                ) : (
                  <table style={table}>
                    <thead>
                      <tr>
                        <th style={th}>Data / Hora</th>
                        <th style={th}>Usuário</th>
                        <th style={th}>Itens</th>
                        <th style={th}>Valor</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orders.map((order) => {
                        const createdAt =
                          order.createdAt || order.timestamp || order.date;
                        const userEmail =
                          order.userEmail ||
                          order.email ||
                          order.user?.email ||
                          "—";
                        const total =
                          typeof order.totalValue === "number"
                            ? order.totalValue
                            : Number(order.totalValue || 0);

                        return (
                          <tr key={order.id || createdAt}>
                            <td style={td}>{formatDateTime(createdAt)}</td>
                            <td style={td}>{userEmail}</td>
                            <td style={td}>{buildItemsText(order)}</td>
                            <td style={td}>{formatCurrency(total)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>
            </section>

            {/* Logs com botão de toggle */}
            <section style={{ marginTop: 24 }}>
              <h2 style={{ ...cardTitle, fontSize: 16, marginBottom: 4 }}>
                Logs de alterações (auditoria)
              </h2>

              <button
                type="button"
                style={logsToggleBtn}
                onClick={() => setShowLogs((v) => !v)}
              >
                {showLogs ? "Ocultar logs" : "Mostrar logs de alterações"}
              </button>

              {showLogs && (
                <div style={tableWrap}>
                  {loading ? (
                    <div style={loadingBox}>Carregando logs...</div>
                  ) : logs.length === 0 ? (
                    <div style={emptyBox}>
                      Nenhum log de alteração registrado no período / limite
                      atual.
                    </div>
                  ) : (
                    <table style={table}>
                      <thead>
                        <tr>
                          <th style={th}>Data / Hora</th>
                          <th style={th}>Usuário</th>
                          <th style={th}>Tipo</th>
                          <th style={th}>Ação</th>
                          <th style={th}>Detalhes</th>
                        </tr>
                      </thead>
                      <tbody>
                        {logs.map((log) => {
                          const createdAt = log.createdAt || log.timestamp;
                          const userEmail =
                            log.userEmail ||
                            log.email ||
                            log.user?.email ||
                            "—";
                          const type = log.type || log.entityType || "—";
                          const action = log.action || log.operation || "—";
                          const details =
                            log.details ||
                            log.entityName ||
                            log.entityId ||
                            JSON.stringify(log.entity || {}, null, 0);

                          return (
                            <tr
                              key={
                                log.id ||
                                `${createdAt}-${userEmail}-${action}`
                              }
                            >
                              <td style={td}>{formatDateTime(createdAt)}</td>
                              <td style={td}>{userEmail}</td>
                              <td style={td}>{type}</td>
                              <td style={td}>{action}</td>
                              <td style={td}>{details}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  )}
                </div>
              )}
            </section>
          </div>
        </section>
      </main>
    </>
  );
}
