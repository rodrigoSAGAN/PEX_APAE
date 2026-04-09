// =============================================================================
// controle/page.js — Painel de controle de permissões (admin-only)
//
// Área exclusiva para administradores: lista todos os usuários do sistema
// e permite conceder/revogar duas permissões granulares:
//   - canEditStore: permite editar produtos na loja
//   - canEditEvents: permite editar eventos
// =============================================================================

"use client";

import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import Nav from "../../components/Nav";
import { auth } from "../../lib/firebase";
import SideMenu from "../../components/SideMenu";
import { useModal } from "../../components/ModalContext";
import Spinner from "../../components/Spinner";

export default function ControlePage() {
  const { showModal, showConfirm } = useModal();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [busyUid, setBusyUid] = useState(null);
  const [claims, setClaims] = useState(null);
  const [isMobile, setIsMobile] = useState(false);

  const API = `/api/users`;

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  async function loadUsers(firebaseUser) {
    setErr("");
    setLoading(true);
    try {
      const token = await firebaseUser.getIdToken(true);
      const res = await fetch(API, { headers: { Authorization: `Bearer ${token}` } });
      if (res.status === 401 || res.status === 403) {
        setErr("Apenas administradores podem acessar esta área.");
        setUsers([]);
        return;
      }
      if (!res.ok) throw new Error("Falha ao buscar usuários");
      const data = await res.json();
      setUsers(Array.isArray(data) ? data : []);
    } catch (e) {
      setErr("Não foi possível carregar os usuários. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  async function toggleStorePermission(user, firebaseUser) {
    const next = !user.canEditStore;
    if (!(await showConfirm(
      next
        ? `Conceder permissão para editar a LOJA a ${user.email}?`
        : `Revogar permissão de edição da LOJA de ${user.email}?`
    ))) return;

    try {
      setBusyUid(user.uid);
      const token = await firebaseUser.getIdToken(true);
      const res = await fetch(`${API}/${user.uid}/permissions`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ canEditStore: next }),
      });
      if (!res.ok) { showModal("Não foi possível atualizar permissão de LOJA.", "Erro"); return; }
      const updated = await res.json();
      setUsers((prev) => prev.map((u) => u.uid === user.uid ? { ...u, ...updated } : u));
    } catch {
      showModal("Erro ao atualizar permissão.", "Erro");
    } finally {
      setBusyUid(null);
    }
  }

  async function toggleEventsPermission(user, firebaseUser) {
    const next = !user.canEditEvents;
    if (!(await showConfirm(
      next
        ? `Conceder permissão para editar EVENTOS a ${user.email}?`
        : `Revogar permissão de edição de EVENTOS de ${user.email}?`
    ))) return;

    try {
      setBusyUid(user.uid);
      const token = await firebaseUser.getIdToken(true);
      const res = await fetch(`${API}/${user.uid}/permissions`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ canEditEvents: next }),
      });
      if (!res.ok) { showModal("Não foi possível atualizar permissão de EVENTOS.", "Erro"); return; }
      const updated = await res.json();
      setUsers((prev) => prev.map((u) => u.uid === user.uid ? { ...u, ...updated } : u));
    } catch {
      showModal("Erro ao atualizar permissão.", "Erro");
    } finally {
      setBusyUid(null);
    }
  }

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
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
        if (!roles.includes("admin")) {
          setErr("Apenas administradores podem acessar esta área.");
          setUsers([]);
          setLoading(false);
          return;
        }
        loadUsers(firebaseUser);
      } catch {
        setErr("Erro de autenticação. Faça login novamente.");
        setUsers([]);
        setLoading(false);
      }
    });
    return () => unsub();
  }, []);

  const showSidebar = !isMobile && !!claims;

  return (
    <>
      <Nav />
      <div className="min-h-screen bg-blue-50/60 pb-20">
        <div className={`max-w-[1120px] mx-auto px-4 pt-6 ${showSidebar ? "md:grid md:grid-cols-[260px_1fr] md:gap-4" : ""}`}>
          {showSidebar && <SideMenu claims={claims} />}

          <main className="flex flex-col gap-5 min-w-0">
            {/* Cabeçalho */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 sm:p-6">
              <h1 className="text-2xl font-bold text-slate-900 mb-1">Controle de acesso</h1>
              <p className="text-slate-500 text-sm leading-relaxed">
                Área exclusiva para administradores. Defina permissões de edição para loja e eventos.
              </p>
            </div>

            {/* Erro */}
            {err && (
              <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm font-medium">
                {err}
              </div>
            )}

            {/* Conteúdo */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
              {loading ? (
                <Spinner message="Carregando usuários..." />
              ) : users.length === 0 ? (
                <div className="text-center py-16 text-slate-400 text-sm">
                  Nenhum usuário encontrado.
                </div>
              ) : (
                <>
                  {/* ── Cards (mobile) ── */}
                  <div className="md:hidden divide-y divide-slate-100">
                    {users.map((u) => {
                      const isAdminUser = u.roles?.includes("admin");
                      const rolesLabel = Array.isArray(u.roles) && u.roles.length > 0
                        ? u.roles.join(", ")
                        : "sem papel";
                      const busy = busyUid === u.uid;

                      return (
                        <div key={u.uid} className="p-4 flex flex-col gap-3">
                          {/* Identidade */}
                          <div>
                            <p className="font-bold text-slate-900 text-base">{u.displayName || "Sem nome"}</p>
                            <p className="text-sm text-slate-500 break-all">{u.email || "—"}</p>
                            <span className={`inline-block mt-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                              isAdminUser
                                ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                                : "bg-slate-100 border-slate-200 text-slate-500"
                            }`}>
                              {rolesLabel}
                            </span>
                          </div>

                          {/* Permissões */}
                          <div className="flex gap-3 flex-wrap">
                            <div className="flex items-center gap-2">
                              <span className="text-sm text-slate-600 font-medium">Loja:</span>
                              <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                                u.canEditStore
                                  ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                                  : "bg-slate-100 border-slate-200 text-slate-500"
                              }`}>
                                {u.canEditStore ? "Sim" : "Não"}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-sm text-slate-600 font-medium">Eventos:</span>
                              <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                                u.canEditEvents
                                  ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                                  : "bg-slate-100 border-slate-200 text-slate-500"
                              }`}>
                                {u.canEditEvents ? "Sim" : "Não"}
                              </span>
                            </div>
                          </div>

                          {/* Ações */}
                          {isAdminUser ? (
                            <p className="text-xs text-slate-400 italic">Admin principal — sem alterações</p>
                          ) : (
                            <div className="flex flex-col gap-2">
                              <button
                                type="button"
                                disabled={busy}
                                onClick={() => toggleStorePermission(u, auth.currentUser)}
                                className={`w-full py-3 rounded-xl text-sm font-bold transition-all disabled:opacity-60 ${
                                  u.canEditStore
                                    ? "bg-orange-100 text-orange-700 hover:bg-orange-200 active:bg-orange-300"
                                    : "bg-emerald-600 text-white hover:bg-emerald-700 active:bg-emerald-800"
                                }`}
                              >
                                {busy ? "Aguarde..." : u.canEditStore ? "Revogar acesso à Loja" : "Permitir editar Loja"}
                              </button>
                              <button
                                type="button"
                                disabled={busy}
                                onClick={() => toggleEventsPermission(u, auth.currentUser)}
                                className={`w-full py-3 rounded-xl text-sm font-bold transition-all disabled:opacity-60 ${
                                  u.canEditEvents
                                    ? "bg-orange-100 text-orange-700 hover:bg-orange-200 active:bg-orange-300"
                                    : "bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800"
                                }`}
                              >
                                {busy ? "Aguarde..." : u.canEditEvents ? "Revogar acesso a Eventos" : "Permitir editar Eventos"}
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* ── Tabela (desktop) ── */}
                  <div className="hidden md:block overflow-x-auto">
                    <table className="w-full" style={{ borderCollapse: "separate", borderSpacing: 0 }}>
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-100">
                          <th className="text-left py-3 px-4 text-sm font-bold text-slate-700 uppercase tracking-wider whitespace-nowrap">Nome</th>
                          <th className="text-left py-3 px-4 text-sm font-bold text-slate-700 uppercase tracking-wider whitespace-nowrap">E-mail</th>
                          <th className="text-left py-3 px-4 text-sm font-bold text-slate-700 uppercase tracking-wider whitespace-nowrap">Papel</th>
                          <th className="text-left py-3 px-4 text-sm font-bold text-slate-700 uppercase tracking-wider whitespace-nowrap">Loja</th>
                          <th className="text-left py-3 px-4 text-sm font-bold text-slate-700 uppercase tracking-wider whitespace-nowrap">Eventos</th>
                          <th className="text-left py-3 px-4 text-sm font-bold text-slate-700 uppercase tracking-wider whitespace-nowrap">Ações</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {users.map((u, i) => {
                          const isAdminUser = u.roles?.includes("admin");
                          const rolesLabel = Array.isArray(u.roles) && u.roles.length > 0
                            ? u.roles.join(", ")
                            : "—";
                          const busy = busyUid === u.uid;

                          return (
                            <tr key={u.uid} className={i % 2 ? "bg-slate-50/50" : ""}>
                              <td className="py-3 px-4 text-sm text-slate-800 font-medium whitespace-nowrap">
                                {u.displayName || "—"}
                              </td>
                              <td className="py-3 px-4 text-sm text-slate-600">
                                {u.email || "—"}
                              </td>
                              <td className="py-3 px-4">
                                <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                                  isAdminUser
                                    ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                                    : "bg-slate-100 border-slate-200 text-slate-500"
                                }`}>
                                  {rolesLabel}
                                </span>
                              </td>
                              <td className="py-3 px-4">
                                <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                                  u.canEditStore
                                    ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                                    : "bg-slate-100 border-slate-200 text-slate-500"
                                }`}>
                                  {u.canEditStore ? "Sim" : "Não"}
                                </span>
                              </td>
                              <td className="py-3 px-4">
                                <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                                  u.canEditEvents
                                    ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                                    : "bg-slate-100 border-slate-200 text-slate-500"
                                }`}>
                                  {u.canEditEvents ? "Sim" : "Não"}
                                </span>
                              </td>
                              <td className="py-3 px-4">
                                {isAdminUser ? (
                                  <span className="text-xs text-slate-400 italic">Admin principal</span>
                                ) : (
                                  <div className="flex gap-2 flex-wrap">
                                    <button
                                      type="button"
                                      disabled={busy}
                                      onClick={() => toggleStorePermission(u, auth.currentUser)}
                                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all disabled:opacity-60 whitespace-nowrap ${
                                        u.canEditStore
                                          ? "bg-orange-100 text-orange-700 hover:bg-orange-200"
                                          : "bg-emerald-600 text-white hover:bg-emerald-700"
                                      }`}
                                    >
                                      {busy ? "..." : u.canEditStore ? "Revogar Loja" : "Permitir Loja"}
                                    </button>
                                    <button
                                      type="button"
                                      disabled={busy}
                                      onClick={() => toggleEventsPermission(u, auth.currentUser)}
                                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all disabled:opacity-60 whitespace-nowrap ${
                                        u.canEditEvents
                                          ? "bg-orange-100 text-orange-700 hover:bg-orange-200"
                                          : "bg-blue-600 text-white hover:bg-blue-700"
                                      }`}
                                    >
                                      {busy ? "..." : u.canEditEvents ? "Revogar Eventos" : "Permitir Eventos"}
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
                </>
              )}
            </div>
          </main>
        </div>
      </div>
    </>
  );
}
