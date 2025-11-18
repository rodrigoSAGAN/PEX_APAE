"use client";

import { useEffect, useState } from "react";
import Nav from "../../components/Nav";
import { getIdTokenOrNull } from "../../lib/authToken";

export default function EventsPage() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  // criação / edição
  const [form, setForm] = useState({
    title: "",
    date: "",
    location: "",
    description: "",
  });
  const [editing, setEditing] = useState(null);

  // permissão para editar eventos 
  const [canEditEvents, setCanEditEvents] = useState(false);

  const API = "/api/events";

  //Carregar eventos
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

  // Verifica permissões
  async function checkPermissions() {
    try {
      const token = await getIdTokenOrNull();
      if (!token) {
        setCanEditEvents(false);
        return;
      }

      const [, payloadBase64] = token.split(".");
      const payloadJson = atob(
        payloadBase64.replace(/-/g, "+").replace(/_/g, "/")
      );
      const payload = JSON.parse(payloadJson);

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

  // Salvar/criar/editar evento
  async function handleSave(e) {
    e.preventDefault();

    try {
      const token = await getIdTokenOrNull();
      if (!token) {
        return alert(
          "Faça login como ADMIN ou colaborador autorizado (eventos) para executar esta ação."
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
        return alert(msg);
      }

      setForm({ title: "", date: "", location: "", description: "" });
      setEditing(null);
      await load();
    } catch (e) {
      console.error("[events] erro ao salvar evento:", e);
      alert("Erro inesperado ao salvar evento.");
    }
  }

  //Excluir evento
  async function handleDelete(id) {
    if (!confirm("Excluir este evento?")) return;
    try {
      const token = await getIdTokenOrNull();
      if (!token) {
        return alert(
          "Faça login como ADMIN ou colaborador autorizado (eventos) para executar esta ação."
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
        return alert(msg);
      }

      await load();
    } catch (e) {
      console.error("[events] erro ao excluir evento:", e);
      alert("Erro inesperado ao excluir evento.");
    }
  }

  //Estilos

  const wrap = {
    padding: 16,
    maxWidth: 1080,
    margin: "24px auto",
    background:
      "linear-gradient(135deg, rgba(219,234,254,0.85), rgba(239,246,255,0.9))",
    borderRadius: 24,
    boxShadow: "0 12px 30px rgba(15,23,42,0.08)",
  };

  const h2 = {
    textAlign: "center",
    margin: "12px 0 8px 0",
    color: "#111827",
    fontSize: 26,
  };

  const subtitle = {
    textAlign: "center",
    fontSize: 14,
    color: "#4b5563",
    marginBottom: 12,
  };

  const note = {
    fontSize: 12,
    color: "#6b7280",
    textAlign: "center",
    marginTop: 10,
  };

  const formWrap = {
    marginBottom: 20,
    padding: 16,
    borderRadius: 16,
    border: "1px solid #e5e7eb",
    background: "#ffffff",
    boxShadow: "0 8px 20px rgba(15,23,42,0.05)",
  };

  const formRow = {
    display: "grid",
    gridTemplateColumns: "2fr 1fr 1fr",
    gap: 10,
    marginBottom: 10,
  };

  const textAreaRow = { marginBottom: 10 };

  const label = {
    fontSize: 13,
    fontWeight: 600,
    color: "#374151",
    marginBottom: 4,
    display: "block",
  };

  const input = {
    width: "100%",
    padding: "8px 10px",
    borderRadius: 10,
    border: "1px solid #e5e7eb",
    fontSize: 14,
  };

  const textArea = {
    ...input,
    minHeight: 70,
    resize: "vertical",
  };

  const formActions = {
    display: "flex",
    alignItems: "center",
    gap: 8,
    justifyContent: "flex-end",
  };

  const btnPrimary = {
    background: "#2563eb",
    color: "#fff",
    border: "none",
    borderRadius: 999,
    padding: "8px 16px",
    cursor: "pointer",
    fontWeight: 700,
    fontSize: 14,
  };

  const btnSecondary = {
    background: "#9ca3af",
    color: "#fff",
    border: "none",
    borderRadius: 999,
    padding: "8px 16px",
    cursor: "pointer",
    fontWeight: 600,
    fontSize: 13,
  };

  const listCard = {
    borderRadius: 16,
    border: "1px solid #e5e7eb",
    background: "#ffffff",
    boxShadow: "0 8px 22px rgba(15,23,42,0.06)",
    padding: 16,
  };

  const empty = {
    textAlign: "center",
    color: "#6b7280",
    padding: 20,
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

  const eventItem = {
    borderBottom: "1px solid #f1f5f9",
    padding: "10px 0",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 12,
  };

  const eventMain = { flex: 1 };

  const eventTitle = {
    fontSize: 16,
    fontWeight: 700,
    color: "#111827",
    marginBottom: 4,
  };

  const eventMeta = {
    fontSize: 13,
    color: "#4b5563",
    marginBottom: 4,
  };

  const eventDesc = {
    fontSize: 13,
    color: "#6b7280",
  };

  const eventActions = {
    display: "flex",
    gap: 6,
  };

  const btnEdit = {
    background: "#3b82f6",
    color: "#fff",
    border: "none",
    borderRadius: 999,
    padding: "4px 10px",
    cursor: "pointer",
    fontSize: 12,
    fontWeight: 600,
  };

  const btnDelete = {
    background: "#dc2626",
    color: "#fff",
    border: "none",
    borderRadius: 999,
    padding: "4px 10px",
    cursor: "pointer",
    fontSize: 12,
    fontWeight: 600,
  };

  // img abaixo dos eventos
  const infoImageWrap = {
    margin: "24px auto 8px auto",
    maxWidth: 900,
    borderRadius: 24,
    overflow: "hidden",
    boxShadow: "0 16px 40px rgba(15,23,42,0.18)",
    border: "1px solid #e5e7eb",
    background: "#ffffff",
  };

  const infoImage = {
    display: "block",
    width: "100%",
    height: "100%",
    objectFit: "cover",
  };

  return (
    <>
      <Nav />
      <main style={wrap}>
        <h2 style={h2}>Eventos</h2>
        <p style={subtitle}>
          Acompanhe as ações, campanhas e eventos da APAE-Pinhão.
        </p>

        {err && <div style={errorBox}>{err}</div>}

        {/* Formulário de criação/edição */}
        {canEditEvents && (
          <form onSubmit={handleSave} style={formWrap}>
            <div style={formRow}>
              <div>
                <label style={label} htmlFor="title">
                  Título do evento
                </label>
                <input
                  id="title"
                  style={input}
                  value={form.title}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, title: e.target.value }))
                  }
                  required
                  placeholder="Ex.: Festa Junina Solidária"
                />
              </div>

              <div>
                <label style={label} htmlFor="date">
                  Data
                </label>
                <input
                  id="date"
                  type="date"
                  style={input}
                  value={form.date}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, date: e.target.value }))
                  }
                />
              </div>

              <div>
                <label style={label} htmlFor="location">
                  Local
                </label>
                <input
                  id="location"
                  style={input}
                  value={form.location}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, location: e.target.value }))
                  }
                  placeholder="Ex.: Ginásio Municipal"
                />
              </div>
            </div>

            <div style={textAreaRow}>
              <label style={label} htmlFor="description">
                Descrição
              </label>
              <textarea
                id="description"
                style={textArea}
                value={form.description}
                onChange={(e) =>
                  setForm((f) => ({ ...f, description: e.target.value }))
                }
                placeholder="Detalhes sobre o evento, horário, atividades, etc."
              />
            </div>

            <div style={formActions}>
              {editing && (
                <button
                  type="button"
                  style={btnSecondary}
                  onClick={() => {
                    setEditing(null);
                    setForm({
                      title: "",
                      date: "",
                      location: "",
                      description: "",
                    });
                  }}
                >
                  Cancelar
                </button>
              )}

              <button type="submit" style={btnPrimary}>
                {editing ? "Salvar alterações" : "Cadastrar evento"}
              </button>
            </div>
          </form>
        )}

        {/* Lista de eventos */}
        <section style={listCard}>
          {loading ? (
            <div style={empty}>Carregando eventos...</div>
          ) : events.length === 0 ? (
            <div style={empty}>Nenhum evento cadastrado no momento.</div>
          ) : (
            events.map((ev) => (
              <div key={ev.id} style={eventItem}>
                <div style={eventMain}>
                  <div style={eventTitle}>
                    {ev.title || "Evento sem título"}
                  </div>
                  <div style={eventMeta}>
                    {ev.date && (
                      <>
                        <strong>Data:</strong> {ev.date}
                        {" | "}
                      </>
                    )}
                    {ev.location && (
                      <>
                        <strong>Local:</strong> {ev.location}
                      </>
                    )}
                  </div>
                  {ev.description && (
                    <div style={eventDesc}>{ev.description}</div>
                  )}
                </div>

                {canEditEvents && (
                  <div style={eventActions}>
                    <button
                      type="button"
                      style={btnEdit}
                      onClick={() => {
                        setEditing(ev);
                        setForm({
                          title: ev.title || "",
                          date: ev.date || "",
                          location: ev.location || "",
                          description: ev.description || "",
                        });
                      }}
                    >
                      Editar
                    </button>
                    <button
                      type="button"
                      style={btnDelete}
                      onClick={() => handleDelete(ev.id)}
                    >
                      Excluir
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </section>

        {/* Imagem informativa abaixo dos eventos */}
        <div style={infoImageWrap}>
          <img
            src="/images/info.jpg"
            alt="Informações APAE-Pinhão"
            style={infoImage}
          />
        </div>

        <p style={note}>
          * A criação e edição de eventos é restrita a administradores ou
          colaboradores autorizados (canEditEvents). Visitantes podem apenas
          visualizar a agenda.
        </p>
      </main>
    </>
  );
}
