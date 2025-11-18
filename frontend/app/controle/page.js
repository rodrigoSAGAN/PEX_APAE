"use client";

import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import Nav from "../../components/Nav";
import { auth } from "../../lib/firebase";
import Link from "next/link";

export default function ControlePage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [busyUid, setBusyUid] = useState(null);
  const [claims, setClaims] = useState(null); 

 
  const API_BASE =
    process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000";
  const API = `${API_BASE}/api/users`;

  console.log("[controle] componente montado");


  async function loadUsers(firebaseUser) {
    console.log("[controle] loadUsers() chamado");
    setErr("");
    setLoading(true);

    try {
      const token = await firebaseUser.getIdToken(true);

      console.log("[controle] Token atualizado para UID:", firebaseUser.uid);

      const res = await fetch(API, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      console.log("[controle] Resposta /api/users:", res.status);

      if (res.status === 401 || res.status === 403) {
        setErr("Apenas administradores podem acessar esta área.");
        setUsers([]);
        return;
      }

      if (!res.ok) throw new Error("Falha ao buscar usuários");

      const data = await res.json();
      console.log("[controle] Usuários recebidos:", data);

      setUsers(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error("[controle] Erro em loadUsers:", e);
      setErr("Não foi possível carregar os usuários. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }


  async function toggleStorePermission(user, firebaseUser) {
    const next = !user.canEditStore;

    if (
      !confirm(
        next
          ? `Conceder permissão para editar a LOJA a ${user.email}?`
          : `Revogar permissão de edição da LOJA de ${user.email}?`
      )
    ) {
      return;
    }

    try {
      setBusyUid(user.uid);

      const token = await firebaseUser.getIdToken(true);
      const url = `${API}/${user.uid}/permissions`;

      console.log("[controle] Chamando API /permissions (LOJA):", url);

      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ canEditStore: next }),
      });

      console.log("[controle] Resposta /permissions LOJA:", res.status);

      if (!res.ok) {
        alert("Não foi possível atualizar permissão de LOJA.");
        return;
      }

      const updated = await res.json();

      console.log("[controle] Atualizado (LOJA):", updated);

      setUsers((prev) =>
        prev.map((u) =>
          u.uid === user.uid
            ? {
                ...u,
                canEditStore: updated.canEditStore,
                canEditEvents: updated.canEditEvents,
                roles: updated.roles,
              }
            : u
        )
      );
    } catch (e) {
      console.error("[controle] Erro toggleStorePermission:", e);
      alert("Erro ao atualizar permissão.");
    } finally {
      setBusyUid(null);
    }
  }

  
  async function toggleEventsPermission(user, firebaseUser) {
    const next = !user.canEditEvents;

    if (
      !confirm(
        next
          ? `Conceder permissão para editar EVENTOS a ${user.email}?`
          : `Revogar permissão de edição de EVENTOS de ${user.email}?`
      )
    ) {
      return;
    }

    try {
      setBusyUid(user.uid);

      const token = await firebaseUser.getIdToken(true);
      const url = `${API}/${user.uid}/permissions`;

      console.log("[controle] Chamando API /permissions (EVENTOS):", url);

      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ canEditEvents: next }),
      });

      console.log("[controle] Resposta /permissions EVENTOS:", res.status);

      if (!res.ok) {
        alert("Não foi possível atualizar permissão de EVENTOS.");
        return;
      }

      const updated = await res.json();

      console.log("[controle] Atualizado (EVENTOS):", updated);

      setUsers((prev) =>
        prev.map((u) =>
          u.uid === user.uid
            ? {
                ...u,
                canEditStore: updated.canEditStore,
                canEditEvents: updated.canEditEvents,
                roles: updated.roles,
              }
            : u
        )
      );
    } catch (e) {
      console.error("[controle] Erro toggleEventsPermission:", e);
      alert("Erro ao atualizar permissão.");
    } finally {
      setBusyUid(null);
    }
  }


  useEffect(() => {
    console.log("[controle] useEffect inicial");

    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      console.log(
        "[controle] onAuthStateChanged →",
        firebaseUser ? firebaseUser.uid : null
      );

      if (!firebaseUser) {
        setErr("Você precisa estar logado como ADMIN para acessar esta página.");
        setUsers([]);
        setClaims(null);
        setLoading(false);
        return;
      }

      try {
        const tokenResult = await firebaseUser.getIdTokenResult(true);
        const c = tokenResult.claims || {};
        setClaims(c);

        const roles = Array.isArray(c.roles) ? c.roles : [];
        const isAdmin = roles.includes("admin");

        if (!isAdmin) {
          setErr("Apenas administradores podem acessar esta área.");
          setUsers([]);
          setLoading(false);
          return;
        }

        
        loadUsers(firebaseUser);
      } catch (e) {
        console.error("[controle] erro ao ler claims:", e);
        setErr("Erro de autenticação. Faça login novamente.");
        setUsers([]);
        setLoading(false);
      }
    });

    return () => unsub();
  }, []);

  
  const roles = Array.isArray(claims?.roles) ? claims.roles : [];
  const isAdmin = roles.includes("admin");
  const isColab = roles.includes("colaborador");
  const canStore = claims?.canEditStore === true;
  const canEvents = claims?.canEditEvents === true;

  //  Estilos 

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

  const wrap = {
    maxWidth: "100%",
    margin: "0 auto",
  };

  const title = {
    fontSize: 26,
    fontWeight: 700,
    color: "#0f172a",
    marginBottom: 8,
    textAlign: "left",
  };

  const subtitle = {
    fontSize: 14,
    color: "#64748b",
    marginBottom: 16,
  };

  const card = {
    background: "#ffffff",
    borderRadius: 16,
    border: "1px solid #e5e7eb",
    boxShadow: "0 10px 26px rgba(15,23,42,0.06)",
    padding: 16,
  };

  const tableWrap = {
    width: "100%",
    overflowX: "auto",
  };

  const table = {
    width: "100%",
    borderCollapse: "separate",
    borderSpacing: 0,
    fontSize: 14,
  };

  const th = {
    textAlign: "left",
    padding: "10px 12px",
    background: "#f3f4f6",
    color: "#111827",
    fontWeight: 700,
    borderBottom: "1px solid #e5e7eb",
    fontSize: 13,
    whiteSpace: "nowrap",
  };

  const td = {
    padding: "10px 12px",
    borderBottom: "1px solid #f1f5f9",
    color: "#4b5563",
    verticalAlign: "middle",
  };

  const rowAlt = { background: "#f9fafb" };

  const pill = {
    display: "inline-flex",
    alignItems: "center",
    gap: 4,
    padding: "2px 8px",
    borderRadius: 999,
    fontSize: 11,
    border: "1px solid #bbf7d0",
    background: "#ecfdf5",
    color: "#166534",
  };

  const pillMuted = {
    ...pill,
    borderColor: "#e5e7eb",
    background: "#f9fafb",
    color: "#6b7280",
  };

  const btn = {
    padding: "6px 10px",
    borderRadius: 999,
    border: "none",
    fontSize: 13,
    cursor: "pointer",
    fontWeight: 600,
  };

  const btnGrant = {
    ...btn,
    background: "#16a34a",
    color: "#ffffff",
  };

  const btnRevoke = {
    ...btn,
    background: "#f97316",
    color: "#ffffff",
  };

  const empty = {
    textAlign: "center",
    padding: 16,
    color: "#6b7280",
  };

  const errorBox = {
    background: "#fef2f2",
    borderRadius: 8,
    border: "1px solid #fecaca",
    color: "#991b1b",
    padding: "10px 12px",
    marginBottom: 12,
    fontSize: 14,
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

  return (
    <>
      <Nav />
      <main style={page}>
        {}
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

            {}
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

        {/* Conteúdo principal */}
        <section style={mainPanel}>
          <div style={wrap}>
            <h1 style={title}>Controle de acesso</h1>

            <p style={subtitle}>
              Área exclusiva para administradores: defina permissões de edição
              para loja (cozinha) e eventos.
            </p>

            {err && <div style={errorBox}>{err}</div>}

            <div style={card}>
              {loading ? (
                <div style={empty}>Carregando usuários...</div>
              ) : users.length === 0 ? (
                <div style={empty}>Nenhum usuário encontrado.</div>
              ) : (
                <div style={tableWrap}>
                  <table style={table}>
                    <thead>
                      <tr>
                        <th style={th}>Nome</th>
                        <th style={th}>E-mail</th>
                        <th style={th}>Papel</th>
                        <th style={th}>Loja</th>
                        <th style={th}>Eventos</th>
                        <th style={th}>Ações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map((u, i) => {
                        const isAdminUser = u.roles?.includes("admin");
                        const rolesLabel =
                          Array.isArray(u.roles) && u.roles.length > 0
                            ? u.roles.join(", ")
                            : "—";

                        return (
                          <tr key={u.uid} style={i % 2 ? rowAlt : undefined}>
                            <td style={td}>{u.displayName || "—"}</td>
                            <td style={td}>{u.email || "—"}</td>

                            <td style={td}>
                              {rolesLabel === "—" ? (
                                <span style={pillMuted}>sem papel</span>
                              ) : (
                                <span style={isAdminUser ? pill : pillMuted}>
                                  {rolesLabel}
                                </span>
                              )}
                            </td>

                            {/* LOJA */}
                            <td style={td}>
                              {u.canEditStore ? (
                                <span style={pill}>Sim</span>
                              ) : (
                                <span style={pillMuted}>Não</span>
                              )}
                            </td>

                            {/* EVENTOS */}
                            <td style={td}>
                              {u.canEditEvents ? (
                                <span style={pill}>Sim</span>
                              ) : (
                                <span style={pillMuted}>Não</span>
                              )}
                            </td>

                            {/* AÇÕES */}
                            <td style={td}>
                              {isAdminUser ? (
                                <span
                                  style={{ fontSize: 12, color: "#9ca3af" }}
                                >
                                  (Admin principal)
                                </span>
                              ) : (
                                <div
                                  style={{
                                    display: "flex",
                                    gap: 6,
                                    flexWrap: "wrap",
                                  }}
                                >
                                  <button
                                    type="button"
                                    onClick={() =>
                                      toggleStorePermission(u, auth.currentUser)
                                    }
                                    disabled={busyUid === u.uid}
                                    style={u.canEditStore ? btnRevoke : btnGrant}
                                  >
                                    {busyUid === u.uid
                                      ? "..."
                                      : u.canEditStore
                                      ? "Revogar edição da loja"
                                      : "Permitir edição da loja"}
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() =>
                                      toggleEventsPermission(
                                        u,
                                        auth.currentUser
                                      )
                                    }
                                    disabled={busyUid === u.uid}
                                    style={
                                      u.canEditEvents ? btnRevoke : btnGrant
                                    }
                                  >
                                    {busyUid === u.uid
                                      ? "..."
                                      : u.canEditEvents
                                      ? "Revogar editar eventos"
                                      : "Permitir editar eventos"}
                                  </button>
                                </div>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
