"use client";

import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../../lib/firebase";
import { useRouter } from "next/navigation";
import Nav from "../../components/Nav";
import SideMenu from "../../components/SideMenu";


const formatCurrency = (v) =>
  typeof v === "number"
    ? v.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    })
    : "R$ 0,00";

export default function RelatoriosPage() {
  const router = useRouter();

  const [ready, setReady] = useState(false);
  const [claims, setClaims] = useState(null);


  const [loadingSummary, setLoadingSummary] = useState(true);
  const [summary, setSummary] = useState({
    totalOrders: 0,
    totalSold: 0,
    totalRevenue: 0,
  });


  const [logs, setLogs] = useState([]);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [showLogs, setShowLogs] = useState(false);
  const [expandedLogs, setExpandedLogs] = useState(new Set());


  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const [allMonths, setAllMonths] = useState(false);

  const [reportData, setReportData] = useState(null);
  const [reportLoading, setReportLoading] = useState(false);
  const [reportError, setReportError] = useState("");


  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (!u) return router.replace("/login");

      try {
        const tokenResult = await u.getIdTokenResult(true);
        const c = tokenResult.claims || {};
        setClaims(c);

        const roles = Array.isArray(c.roles) ? c.roles : [];
        const isAdmin = roles.includes("admin");

        if (!isAdmin) return router.replace("/");

        setReady(true);
      } catch (e) {
        console.error("[relatorios] erro:", e);
        router.replace("/login");
      }
    });

    return () => unsub();
  }, [router]);


  useEffect(() => {
    if (!ready) return;

    async function loadSummary() {
      try {
        setLoadingSummary(true);

        const user = auth.currentUser;
        const token = await user.getIdToken();

        const res = await fetch("/api/orders/summary?period=month", {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (res.ok) {
          const d = await res.json();
          setSummary({
            totalOrders: Number(d.totalOrders || 0),
            totalSold: Number(d.totalSold || 0),
            totalRevenue: Number(d.totalRevenue || 0),
          });
        }
      } catch (err) {
        console.error("[summary] erro:", err);
      } finally {
        setLoadingSummary(false);
      }
    }

    async function loadLogs() {
      try {
        setLoadingLogs(true);

        const user = auth.currentUser;
        const token = await user.getIdToken();

        const res = await fetch("/api/logs?limit=100", {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (res.ok) {
          const arr = await res.json();
          if (Array.isArray(arr)) setLogs(arr);
        }
      } catch (err) {
        console.error("[logs] erro:", err);
      } finally {
        setLoadingLogs(false);
      }
    }

    loadSummary();
    loadLogs();
  }, [ready]);


  const handleGenerateReport = async () => {
    try {
      setReportError("");
      setReportLoading(true);
      setReportData(null);

      const user = auth.currentUser;
      const token = await user.getIdToken();

      let url = "/api/sales";
      if (allMonths) {
        url = "/api/sales/by-month";
      } else {
        url = `/api/sales?month=${month}&year=${year}`;
      }

      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error("Erro ao buscar relatório");

      const json = await res.json();
      setReportData(json);
    } catch (err) {
      console.error(err);
      setReportError("Erro ao carregar relatório.");
    } finally {
      setReportLoading(false);
    }
  };

  if (!ready) return null;

  // Responsive styles
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

  const page = {
    minHeight: "calc(100svh - 56px)",
    padding: "16px 16px 80px 16px",
    display: "grid",
    gridTemplateColumns: isMobile ? "1fr" : "260px 1fr",
    gap: 16,
    maxWidth: 1120,
    margin: "0 auto",
    background: "#e6f3ff",
  };

  const panel = {
    border: "1px solid #e2e8f0",
    borderRadius: 16,
    padding: isMobile ? 16 : 32,
    background: "#ffffff",
    boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
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

  const th = {
    background: "#f1f5f9",
    padding: isMobile ? "8px 12px" : "12px 16px",
    textAlign: "left",
    fontWeight: 600,
    fontSize: 13,
    color: "#475569",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
    whiteSpace: "nowrap",
  };

  const td = {
    padding: isMobile ? "12px" : "16px",
    borderBottom: "1px solid #f1f5f9",
    fontSize: 14,
    color: "#334155",
    whiteSpace: "nowrap",
  };

  const tdDetails = {
    ...td,
    whiteSpace: "normal",
    wordBreak: "break-word",
    maxWidth: "300px",
    cursor: "pointer",
  };

  const toggleLog = (id) => {
    setExpandedLogs((prev) => {
      const newSet = new Set(prev);
      newSet.has(id) ? newSet.delete(id) : newSet.add(id);
      return newSet;
    });
  };


  return (
    <>
      <style jsx global>{`
        @media (max-width: 767px) {
          .table-wrapper {
            overflow-x: auto;
            -webkit-overflow-scrolling: touch;
          }
          .side-menu-mobile {
            display: none !important;
          }
        }
        .log-details-collapsed {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .log-details-expanded {
          white-space: normal;
          word-break: break-word;
        }
        .log-details-cell:hover {
          background-color: #f8fafc;
        }
      `}</style>
      <Nav />

      <main style={page}>
        <div className="side-menu-mobile">
          <SideMenu claims={claims} />
        </div>

        <section style={panel}>
          <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 6 }}>
            Relatórios de vendas
          </h1>
          <p style={{ fontSize: 14, color: "#475569", marginBottom: 16 }}>
            Visão detalhada dos pedidos e itens vendidos na lojinha solidária.
          </p>

          {/* -------------------------------- */}
          {/*      CARDS ORIGINAIS             */}
          {/* -------------------------------- */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
              gap: 24,
              marginBottom: 40,
            }}
          >
            <div style={{ ...panel, padding: 24 }}>
              <div style={cardTitle}>Pedidos no mês</div>
              <div style={cardValue}>
                {loadingSummary ? "…" : summary.totalOrders}
              </div>
              <div style={cardSub}>Quantidade total de pedidos registrados.</div>
            </div>

            <div style={{ ...panel, padding: 24 }}>
              <div style={cardTitle}>Itens vendidos no mês</div>
              <div style={cardValue}>
                {loadingSummary ? "…" : summary.totalSold}
              </div>
              <div style={cardSub}>Soma de unidades vendidas.</div>
            </div>

            <div style={{ ...panel, padding: 24 }}>
              <div style={cardTitle}>Faturamento do mês</div>
              <div style={cardValue}>
                {loadingSummary ? "…" : formatCurrency(summary.totalRevenue)}
              </div>
              <div style={cardSub}>Total em valores registrados.</div>
            </div>
          </div>

          {/* -------------------------------- */}
          {/*      NOVO FILTRO + RELATÓRIO     */}
          {/* -------------------------------- */}
          <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16, color: "#1e293b" }}>
            Relatório avançado
          </h2>

          {/* CONTROLES */}
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 20,
              alignItems: "flex-end",
              marginBottom: 32,
              background: "#f8fafc",
              padding: 24,
              borderRadius: 12,
              border: "1px solid #e2e8f0",
            }}
          >
            {/* month */}
            <div>
              <label style={{ fontSize: 14, fontWeight: 600, color: "#475569", marginBottom: 6, display: "block" }}>
                Mês
              </label>
              <select
                value={month}
                onChange={(e) => setMonth(e.target.value)}
                disabled={allMonths}
                style={{
                  padding: "10px 12px",
                  borderRadius: 8,
                  border: "1px solid #cbd5e1",
                  background: "white",
                  minWidth: 120,
                  fontSize: 14,
                }}
              >
                {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                  <option key={m} value={m}>
                    {m.toString().padStart(2, "0")}
                  </option>
                ))}
              </select>
            </div>

            {/* year */}
            <div>
              <label style={{ fontSize: 14, fontWeight: 600, color: "#475569", marginBottom: 6, display: "block" }}>
                Ano
              </label>
              <select
                value={year}
                onChange={(e) => setYear(e.target.value)}
                disabled={allMonths}
                style={{
                  padding: "10px 12px",
                  borderRadius: 8,
                  border: "1px solid #cbd5e1",
                  background: "white",
                  minWidth: 100,
                  fontSize: 14,
                }}
              >
                {[2023, 2024, 2025].map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>

            {/* checkbox */}
            <label style={{ display: "flex", gap: 8, fontSize: 14, color: "#334155", alignItems: "center", paddingBottom: 10, cursor: "pointer" }}>
              <input
                type="checkbox"
                checked={allMonths}
                onChange={(e) => setAllMonths(e.target.checked)}
              />
              Todos os meses
            </label>

            {/* Botão */}
            <button
              onClick={handleGenerateReport}
              disabled={reportLoading}
              style={{
                padding: "10px 20px",
                background: "#059669",
                color: "white",
                fontWeight: 600,
                borderRadius: 8,
                border: "none",
                cursor: "pointer",
                fontSize: 14,
                boxShadow: "0 2px 4px rgba(5, 150, 105, 0.2)",
              }}
            >
              {reportLoading ? "Gerando..." : "Gerar relatório"}
            </button>
          </div>

          {/* -------------------------------- */}
          {/*       RESULTADOS DO RELATÓRIO    */}
          {/* -------------------------------- */}
          {reportError && (
            <div
              style={{
                background: "#fee2e2",
                border: "1px solid #fecaca",
                color: "#991b1b",
                padding: 10,
                borderRadius: 8,
              }}
            >
              {reportError}
            </div>
          )}

          {/* 1 MÊS */}
          {reportData && Array.isArray(reportData) && !allMonths && (
            <div className="table-wrapper"
              style={{
                border: "1px solid #e5e7eb",
                borderRadius: 12,
                overflow: "hidden",
                background: "white",
                marginBottom: 20,
              }}
            >
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <caption style={{ clip: "rect(0 0 0 0)", position: "absolute" }}>
                  Relatório de vendas do mês selecionado
                </caption>
                <thead>
                  <tr>
                    <th style={th}>Data</th>
                    <th style={th}>Pedido</th>
                    <th style={th}>Cliente</th>
                    <th style={th}>Valor</th>
                  </tr>
                </thead>

                <tbody>
                  {reportData.length === 0 ? (
                    <tr>
                      <td colSpan="4" style={td}>
                        Nenhum dado encontrado.
                      </td>
                    </tr>
                  ) : (
                    reportData.map((order) => (
                      <tr key={order.id}>
                        <td style={td}>
                          {new Date(order.createdAt).toLocaleDateString("pt-BR")}
                        </td>
                        <td style={td}>{order.id}</td>
                        <td style={td}>
                          {order.pickupName || order.userEmail || "Anônimo"}
                        </td>
                        <td style={td}>
                          {formatCurrency(order.totalValue || 0)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* TODOS OS MESES */}
          {reportData && !Array.isArray(reportData) && allMonths && (
            <div style={{ marginBottom: 20 }}>
              {Object.keys(reportData)
                .sort((a, b) => b - a)
                .map((ano) => (
                  <div
                    key={ano}
                    style={{
                      border: "1px solid #e2e8f0",
                      borderRadius: 12,
                      marginBottom: 18,
                      background: "white",
                    }}
                  >
                    <div
                      style={{
                        background: "#f1f5f9",
                        padding: "8px 12px",
                        fontWeight: 700,
                      }}
                    >
                      {ano}
                    </div>

                    {Object.keys(reportData[ano])
                      .sort((a, b) => b - a)
                      .map((mes) => {
                        const arr = reportData[ano][mes];
                        const total = arr.reduce(
                          (acc, o) => acc + (o.totalValue || 0),
                          0
                        );

                        return (
                          <div key={mes} style={{ padding: 12 }}>
                            <div
                              style={{
                                display: "flex",
                                justifyContent: "space-between",
                                marginBottom: 6,
                              }}
                            >
                              <strong>Mês {mes}</strong>

                              <span style={{ fontWeight: 700 }}>
                                Total: {formatCurrency(total)}
                              </span>
                            </div>

                            <div style={{ fontSize: 13, color: "#64748b" }}>
                              {arr.length} pedidos
                            </div>
                          </div>
                        );
                      })}
                  </div>
                ))}
            </div>
          )}

          {/* -------------------------------- */}
          {/*         LOGS ORIGINAIS           */}
          {/* -------------------------------- */}
          <h2 style={{ fontSize: 18, fontWeight: 700, marginTop: 40, marginBottom: 16, color: "#1e293b" }}>
            Logs de alterações
          </h2>

          <button
            type="button"
            style={{
              padding: "10px 20px",
              borderRadius: 8,
              background: "#2563eb",
              color: "white",
              border: "none",
              marginBottom: 24,
              cursor: "pointer",
              fontWeight: 600,
              fontSize: 14,
            }}
            onClick={() => setShowLogs((v) => !v)}
          >
            {showLogs ? "Ocultar logs" : "Mostrar logs"}
          </button>

          {showLogs && (
            <div className="table-wrapper"
              style={{
                border: "1px solid #e5e7eb",
                borderRadius: 12,
                overflow: "hidden",
                background: "white",
              }}
            >
              {loadingLogs ? (
                <div style={{ padding: 16 }}>Carregando logs…</div>
              ) : logs.length === 0 ? (
                <div style={{ padding: 16 }}>
                  Nenhum log encontrado.
                </div>
              ) : (
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <caption style={{ clip: "rect(0 0 0 0)", position: "absolute" }}>
                    Logs de alterações do sistema
                  </caption>
                  <thead>
                    <tr>
                      <th style={th}>Data/Hora</th>
                      <th style={th}>Usuário</th>
                      <th style={th}>Tipo</th>
                      <th style={th}>Ação</th>
                      <th style={th}>Detalhes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {logs.map((log) => (
                      <tr key={log.id}>
                        <td style={td}>{new Date(log.createdAt || log.timestamp).toLocaleString("pt-BR")}</td>
                        <td style={td}>{log.userEmail || log.userName || "—"}</td>
                        <td style={td}>{log.type}</td>
                        <td style={td}>{log.action}</td>
                        <td
                          style={tdDetails}
                          className="log-details-cell"
                          onClick={() => toggleLog(log.id)}
                          onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), toggleLog(log.id))}
                          role="button"
                          tabIndex={0}
                          aria-label="Detalhes do log"
                          aria-expanded={expandedLogs.has(log.id)}
                        >
                          <div className={expandedLogs.has(log.id) ? "log-details-expanded" : "log-details-collapsed"}>
                            {log.details || JSON.stringify(log)}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}
        </section>
      </main>
    </>
  );
}
