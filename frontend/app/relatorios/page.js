// =============================================================================
// relatorios/page.js — Página de relatórios de vendas (admin-only)
//
// Oferece uma visão completa das vendas da loja solidária:
//   - Cards de resumo do mês (pedidos, itens vendidos, faturamento, doações)
//   - Relatório avançado filtrado por mês/ano ou todos os meses agrupados
//   - Exportação para PDF (usando jsPDF + autotable, carregados dinamicamente)
//   - Seção de logs de auditoria com toggle expandir/colapsar
// Acesso restrito a administradores.
// =============================================================================

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
    totalDonations: 0,
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
            totalDonations: Number(d.totalDonations || 0),
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

  // Gera o relatório avançado conforme os filtros selecionados.
  // Se "todos os meses" estiver marcado, busca /api/sales/by-month (agrupado por ano/mês).
  // Senão, busca /api/sales?month=X&year=Y (lista simples do mês escolhido).
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

  // Gera e baixa o relatório em PDF usando jsPDF + autotable.
  // Essas libs são carregadas dinamicamente (import()) pra não pesar no bundle principal.
  // O PDF inclui: cabeçalho, tabela de itens por pedido e resumo geral no final.
  const handleDownloadPDF = async () => {
    if (!reportData || !Array.isArray(reportData) || reportData.length === 0) {
      alert("Nenhum dado disponível para gerar o PDF. Gere um relatório primeiro.");
      return;
    }

    try {
      const jsPDF = (await import("jspdf")).default;
      const autoTable = (await import("jspdf-autotable")).default;

      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();

      doc.setFontSize(18);
      doc.setFont(undefined, "bold");
      doc.text("APAE - Pinhão", pageWidth / 2, 15, { align: "center" });

      doc.setFontSize(14);
      doc.text("Relatório Completo de Vendas", pageWidth / 2, 25, { align: "center" });

      doc.setFontSize(10);
      doc.setFont(undefined, "normal");
      const monthName = new Date(Number(year), Number(month) - 1).toLocaleDateString("pt-BR", {
        month: "long",
        year: "numeric",
      });
      doc.text(`Período: ${monthName}`, pageWidth / 2, 32, { align: "center" });

      let yPosition = 45;

      reportData.forEach((order, index) => {
        if (yPosition > 250) {
          doc.addPage();
          yPosition = 20;
        }

        doc.setFontSize(12);
        doc.setFont(undefined, "bold");
        const orderLabel = order.isDonation ? "Doação" : "Pedido";
        doc.text(`${orderLabel} n${index + 1}`, 14, yPosition);

        doc.setFontSize(9);
        doc.setFont(undefined, "normal");
        doc.text(`Data: ${new Date(order.createdAt).toLocaleDateString("pt-BR")}`, 14, yPosition + 5);
        doc.text(`Cliente: ${order.pickupName || order.userEmail || "Anônimo"}`, 14, yPosition + 10);

        yPosition += 18;

        const items = Array.isArray(order.items) ? order.items : [];

        if (items.length > 0) {
          const tableData = items.map((item) => [
            item.name || item.title || "Item sem nome",
            item.quantity || item.qty || 1,
            formatCurrency(item.price || item.unitPrice || 0),
            formatCurrency((item.quantity || item.qty || 1) * (item.price || item.unitPrice || 0)),
          ]);

          autoTable(doc, {
            startY: yPosition,
            head: [["Item", "Qtd", "Valor Unitário", "Subtotal"]],
            body: tableData,
            theme: "grid",
            styles: { fontSize: 8, cellPadding: 2 },
            headStyles: { fillColor: [16, 185, 129], textColor: 255, fontStyle: "bold" },
            margin: { left: 14, right: 14 },
          });

          yPosition = (doc.lastAutoTable?.finalY ?? yPosition) + 5;
        }

        doc.setFontSize(10);
        doc.setFont(undefined, "bold");
        doc.text(`Total do Pedido: ${formatCurrency(order.totalValue || 0)}`, 14, yPosition);

        yPosition += 10;

        doc.setDrawColor(200);
        doc.line(14, yPosition, pageWidth - 14, yPosition);
        yPosition += 8;
      });
      const totalRevenue = reportData.reduce((acc, order) => acc + (order.totalValue || 0), 0);
      const totalOrders = reportData.length;
      const totalItems = reportData.reduce((acc, order) => {
        const items = Array.isArray(order.items) ? order.items : [];
        return acc + items.reduce((sum, item) => sum + (item.quantity || item.qty || 1), 0);
      }, 0);

      if (yPosition > 230) {
        doc.addPage();
        yPosition = 20;
      }

      doc.setFontSize(12);
      doc.setFont(undefined, "bold");
      doc.text("Resumo Geral", 14, yPosition);

      doc.setFontSize(10);
      doc.setFont(undefined, "normal");
      doc.text(`Total de Pedidos: ${totalOrders}`, 14, yPosition + 7);
      doc.text(`Total de Itens Vendidos: ${totalItems}`, 14, yPosition + 13);
      doc.text(`Faturamento Total: ${formatCurrency(totalRevenue)}`, 14, yPosition + 19);

      const fileName = `relatorio_${String(month).padStart(2, "0")}_${year}.pdf`;
      doc.save(fileName);
    } catch (error) {
      console.error("Erro ao gerar PDF:", error);
      alert("Erro ao gerar o PDF. Tente novamente.");
    }
  };

  if (!ready) return null;

  const isMobile = typeof window !== "undefined" && window.innerWidth < 768;

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
          <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 6 }}>Relatórios de vendas</h1>
          <p style={{ fontSize: 14, color: "#475569", marginBottom: 16 }}>
            Visão detalhada dos pedidos e itens vendidos na loja solidária.
          </p>

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
              <div style={cardValue}>{loadingSummary ? "…" : summary.totalOrders}</div>
              <div style={cardSub}>Quantidade total de pedidos registrados.</div>
            </div>

            <div style={{ ...panel, padding: 24 }}>
              <div style={cardTitle}>Itens vendidos no mês</div>
              <div style={cardValue}>{loadingSummary ? "…" : summary.totalSold}</div>
              <div style={cardSub}>Soma de unidades vendidas.</div>
            </div>

            <div style={{ ...panel, padding: 24 }}>
              <div style={cardTitle}>Faturamento do mês</div>
              <div style={cardValue}>{loadingSummary ? "…" : formatCurrency(summary.totalRevenue)}</div>
              <div style={cardSub}>Total em valores registrados.</div>
            </div>

            <div style={{ ...panel, padding: 24 }}>
              <div style={cardTitle}>Doações no mês</div>
              <div style={cardValue}>{loadingSummary ? "…" : summary.totalDonations}</div>
              <div style={cardSub}>Quantidade de doações recebidas.</div>
            </div>
          </div>

          <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16, color: "#1e293b" }}>
            Relatório avançado
          </h2>

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
            <div>
              <label
                style={{
                  fontSize: 14,
                  fontWeight: 600,
                  color: "#475569",
                  marginBottom: 6,
                  display: "block",
                }}
              >
                Mês
              </label>
              <select
                value={month}
                onChange={(e) => setMonth(Number(e.target.value))}
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

            <div>
              <label
                style={{
                  fontSize: 14,
                  fontWeight: 600,
                  color: "#475569",
                  marginBottom: 6,
                  display: "block",
                }}
              >
                Ano
              </label>
              <select
                value={year}
                onChange={(e) => setYear(Number(e.target.value))}
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
                {(() => {
                  const currentYear = new Date().getFullYear();
                  const years = [];
                  for (let y = 2023; y <= currentYear; y++) years.push(y);
                  return years.map((y) => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  ));
                })()}
              </select>
            </div>

            <label
              style={{
                display: "flex",
                gap: 8,
                fontSize: 14,
                color: "#334155",
                alignItems: "center",
                paddingBottom: 10,
                cursor: "pointer",
              }}
            >
              <input type="checkbox" checked={allMonths} onChange={(e) => setAllMonths(e.target.checked)} />
              Todos os meses
            </label>

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

          {reportData && Array.isArray(reportData) && !allMonths && (
            <>
              <div
                className="table-wrapper"
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
                      <th style={th}>Tipo</th>
                      <th style={th}>Cliente</th>
                      <th style={th}>Valor</th>
                    </tr>
                  </thead>

                  <tbody>
                    {reportData.length === 0 ? (
                      <tr>
                        <td colSpan="5" style={td}>
                          Nenhum dado encontrado.
                        </td>
                      </tr>
                    ) : (
                      reportData.map((order, index) => (
                        <tr key={order.id}>
                          <td style={td}>{new Date(order.createdAt).toLocaleDateString("pt-BR")}</td>
                          <td style={td}>Pedido n{index + 1}</td>
                          <td style={td}>
                            <span
                              style={{
                                display: "inline-block",
                                padding: "4px 8px",
                                borderRadius: 4,
                                fontSize: 12,
                                fontWeight: 600,
                                background: order.isDonation ? "#dbeafe" : "#d1fae5",
                                color: order.isDonation ? "#1e40af" : "#065f46",
                              }}
                            >
                              {order.isDonation ? "Doação" : "Venda"}
                            </span>
                          </td>
                          <td style={td}>{order.pickupName || order.userEmail || "Anônimo"}</td>
                          <td style={td}>{formatCurrency(order.totalValue || 0)}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              <div style={{ textAlign: "center", marginBottom: 32 }}>
                <button
                  onClick={handleDownloadPDF}
                  style={{
                    padding: "12px 24px",
                    background: "#dc2626",
                    color: "white",
                    fontWeight: 700,
                    borderRadius: 8,
                    border: "none",
                    cursor: "pointer",
                    fontSize: 14,
                    boxShadow: "0 4px 6px rgba(220, 38, 38, 0.3)",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 8,
                  }}
                >
                  📄 Baixar relatório completo (PDF)
                </button>
              </div>
            </>
          )}

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
                        const total = arr.reduce((acc, o) => acc + (o.totalValue || 0), 0);

                        return (
                          <div key={mes} style={{ padding: 12 }}>
                            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                              <strong>Mês {mes}</strong>
                              <span style={{ fontWeight: 700 }}>Total: {formatCurrency(total)}</span>
                            </div>

                            <div style={{ fontSize: 13, color: "#64748b" }}>{arr.length} pedidos</div>
                          </div>
                        );
                      })}
                  </div>
                ))}
            </div>
          )}

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
            <div
              className="table-wrapper"
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
                <div style={{ padding: 16 }}>Nenhum log encontrado.</div>
              ) : (
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <caption style={{ clip: "rect(0 0 0 0)", position: "absolute" }}>Logs de alterações do sistema</caption>
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
                          onKeyDown={(e) =>
                            (e.key === "Enter" || e.key === " ") && (e.preventDefault(), toggleLog(log.id))
                          }
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
