"use client";

import { useEffect, useState } from "react";
import Nav from "../../components/Nav";
import SideMenu from "../../components/SideMenu";
import { getIdTokenOrNull } from "../../lib/authToken";
import { useModal } from "../../components/ModalContext";

export default function EventsPage() {
  const { showModal, showConfirm } = useModal();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const [form, setForm] = useState({
    title: "",
    date: "",
    location: "",
    description: "",
  });
  const [editing, setEditing] = useState(null);

  const [canEditEvents, setCanEditEvents] = useState(false);
  const [claims, setClaims] = useState(null);

  const API = "/api/events";

  async function load() {
    setErr("");
    setLoading(true);
    try {
      const res = await fetch(API, { cache: "no-store" });
      if (!res.ok) throw new Error("Falha ao buscar eventos");
      const data = await res.json();
      setEvents(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error("[events] erro ao carregar eventos:", e);
      setErr("Falha ao carregar eventos. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  async function checkPermissions() {
    try {
      const token = await getIdTokenOrNull();
      if (!token) {
        setCanEditEvents(false);
        setClaims(null);
        return;
      }

      const [, payloadBase64] = token.split(".");
      const payloadJson = atob(
        payloadBase64.replace(/-/g, "+").replace(/_/g, "/")
      );
      const payload = JSON.parse(payloadJson);
      setClaims(payload);

      const roles = Array.isArray(payload.roles) ? payload.roles : [];
      const isAdmin = roles.includes("admin");
      const isColab = roles.includes("colaborador");
      const canEditEventsClaim = payload.canEditEvents === true;

      const allow = isAdmin || (isColab && canEditEventsClaim);
      setCanEditEvents(allow);
    } catch (e) {
      console.error("[events] Falha ao verificar permissões:", e);
      setCanEditEvents(false);
    }
  }

  useEffect(() => {
    load();
    checkPermissions();
    
  }, []);

  async function handleSave(e) {
    e.preventDefault();

    try {
      const token = await getIdTokenOrNull();
      if (!token) {
        return showModal(
          "Faça login como ADMIN ou colaborador autorizado (eventos) para executar esta ação.",
          "Acesso Negado"
        );
      }

      const method = editing ? "PUT" : "POST";
      const url = editing ? `${API}/${editing.id}` : API;

      const body = {
        title: form.title,
        date: form.date || null,
        location: form.location || null,
        description: form.description || null,
      };

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const msg =
          res.status === 401
            ? "Você não está autenticado."
            : res.status === 403
            ? "Permissão negada. Apenas ADMIN ou colaborador autorizado (eventos) pode editar."
            : "Falha ao salvar evento.";
        return showModal(msg, "Erro");
      }

      setForm({ title: "", date: "", location: "", description: "" });
      setEditing(null);
      await load();
    } catch (e) {
      console.error("[events] erro ao salvar evento:", e);
      showModal("Erro inesperado ao salvar evento.", "Erro");
    }
  }

  async function handleDelete(id) {
    if (!(await showConfirm("Excluir este evento?"))) return;
    try {
      const token = await getIdTokenOrNull();
      if (!token) {
        return showModal(
          "Faça login como ADMIN ou colaborador autorizado (eventos) para executar esta ação.",
          "Acesso Negado"
        );
      }

      const res = await fetch(`${API}/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        const msg =
          res.status === 401
            ? "Você não está autenticado."
            : res.status === 403
            ? "Permissão negada. Apenas ADMIN ou colaborador autorizado (eventos) pode excluir."
            : res.status === 404
            ? "Evento não encontrado."
            : "Falha ao excluir evento.";
        return showModal(msg, "Erro");
      }

      await load();
    } catch (e) {
      console.error("[events] erro ao excluir evento:", e);
      showModal("Erro inesperado ao excluir evento.", "Erro");
    }
  }

  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const checkSize = () => setIsMobile(window.innerWidth < 768);
    checkSize();
    window.addEventListener("resize", checkSize);
    return () => window.removeEventListener("resize", checkSize);
  }, []);

  const showSidebar = !isMobile && claims;

  return (
    <>
      <Nav />
      <div className={`min-h-[calc(100svh-56px)] ${showSidebar ? "grid grid-cols-[260px_1fr] max-w-7xl mx-auto gap-6 p-6 pb-[80px]" : "block max-w-7xl mx-auto p-6 pb-[80px]"}`}>
        {showSidebar && <SideMenu claims={claims} />}
        
        <main className="w-full min-w-0 bg-gradient-to-br from-blue-50/80 to-blue-100/90 rounded-3xl shadow-xl border border-blue-100/50 p-6 md:p-8">
          <div className="text-center mb-10">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-3">Eventos</h2>
            <p className="text-slate-600 text-sm md:text-base max-w-2xl mx-auto">
              Acompanhe as ações, campanhas e eventos da APAE-Pinhão.
            </p>
          </div>

          {err && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-6 text-sm font-medium text-center">
              {err}
            </div>
          )}

          {canEditEvents && (
            <form onSubmit={handleSave} className="bg-white rounded-2xl shadow-lg border border-slate-100 p-6 mb-10 animate-fade-in">
              <div className="flex items-center gap-2 mb-6 pb-4 border-b border-slate-100">
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                </div>
                <h3 className="font-bold text-slate-800 text-lg">
                  {editing ? "Editar Evento" : "Novo Evento"}
                </h3>
              </div>

              <div className="grid md:grid-cols-3 gap-6 mb-6">
                <div className="md:col-span-1">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2" htmlFor="title">
                    Título do evento
                  </label>
                  <input
                    id="title"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                    value={form.title}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, title: e.target.value }))
                    }
                    required
                    placeholder="Ex.: Festa Junina Solidária"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2" htmlFor="date">
                    Data
                  </label>
                  <input
                    id="date"
                    type="date"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-slate-600"
                    value={form.date}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, date: e.target.value }))
                    }
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2" htmlFor="location">
                    Local
                  </label>
                  <input
                    id="location"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                    value={form.location}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, location: e.target.value }))
                    }
                    placeholder="Ex.: Ginásio Municipal"
                  />
                </div>
              </div>

              <div className="mb-6">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2" htmlFor="description">
                  Descrição
                </label>
                <textarea
                  id="description"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all min-h-[100px] resize-y"
                  value={form.description}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, description: e.target.value }))
                  }
                  placeholder="Detalhes sobre o evento, horário, atividades, etc."
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                {editing && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditing(null);
                      setForm({
                        title: "",
                        date: "",
                        location: "",
                        description: "",
                      });
                    }}
                    className="px-5 py-2.5 rounded-full bg-slate-100 text-slate-600 font-bold text-sm hover:bg-slate-200 transition-colors"
                  >
                    Cancelar
                  </button>
                )}

                <button 
                  type="submit" 
                  className="px-6 py-2.5 rounded-full bg-blue-600 text-white font-bold text-sm shadow-lg shadow-blue-500/30 hover:bg-blue-700 hover:shadow-blue-500/40 hover:-translate-y-0.5 transition-all"
                >
                  {editing ? "Salvar Alterações" : "Cadastrar Evento"}
                </button>
              </div>
            </form>
          )}

          <section>
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20">
                <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mb-4"></div>
                <p className="text-slate-500 font-medium">Carregando eventos...</p>
              </div>
            ) : events.length === 0 ? (
              <div className="text-center py-16 bg-white/50 rounded-2xl border border-blue-100">
                <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">
                  📅
                </div>
                <p className="text-slate-600 font-medium">Nenhum evento cadastrado no momento.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {events.map((ev) => (
                  <div key={ev.id} className="group bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col overflow-hidden">
                    <div className="h-2 bg-gradient-to-r from-blue-500 to-indigo-500"></div>
                    <div className="p-6 flex-1 flex flex-col">
                      <h3 className="text-lg font-bold text-slate-900 mb-3 group-hover:text-blue-600 transition-colors">
                        {ev.title || "Evento sem título"}
                      </h3>
                      
                      <div className="space-y-2 mb-4">
                        {ev.date && (
                          <div className="flex items-center gap-2 text-sm text-slate-600">
                            <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            <span className="font-medium">{ev.date}</span>
                          </div>
                        )}
                        {ev.location && (
                          <div className="flex items-center gap-2 text-sm text-slate-600">
                            <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            <span>{ev.location}</span>
                          </div>
                        )}
                      </div>

                      {ev.description && (
                        <p className="text-sm text-slate-500 leading-relaxed line-clamp-3 mb-4 flex-1">
                          {ev.description}
                        </p>
                      )}

                      {canEditEvents && (
                        <div className="flex items-center gap-2 pt-4 border-t border-slate-50 mt-auto">
                          <button
                            type="button"
                            onClick={() => {
                              setEditing(ev);
                              setForm({
                                title: ev.title || "",
                                date: ev.date || "",
                                location: ev.location || "",
                                description: ev.description || "",
                              });
                            }}
                            className="flex-1 py-2 rounded-lg bg-blue-50 text-blue-600 font-bold text-xs hover:bg-blue-100 transition-colors flex items-center justify-center gap-1"
                          >
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                            Editar
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(ev.id)}
                            className="flex-1 py-2 rounded-lg bg-red-50 text-red-600 font-bold text-xs hover:bg-red-100 transition-colors flex items-center justify-center gap-1"
                          >
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                            Excluir
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          <div className="mt-12 mb-8 max-w-4xl mx-auto rounded-3xl overflow-hidden shadow-2xl border border-slate-200">
            <img
              src="/images/info.jpg"
              alt="Informações APAE-Pinhão"
              className="w-full h-auto object-cover hover:scale-105 transition-transform duration-700"
            />
          </div>

          <p className="text-xs text-center text-slate-500/80 max-w-2xl mx-auto">
            * A criação e edição de eventos é restrita a administradores ou
            colaboradores autorizados. Visitantes podem apenas visualizar a agenda.
          </p>
        </main>
      </div>
    </>
  );
}
