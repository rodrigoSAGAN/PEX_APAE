"use client";
import { useEffect, useState } from "react";
import Nav from "../../components/Nav";
import { getIdTokenOrNull } from "../../lib/authToken";
import { auth } from "../../lib/firebase";
import { onAuthStateChanged } from "firebase/auth";

export default function ProductsPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  // estado para criação/edição (somente admin usa)
  const [form, setForm] = useState({ name: "", price: "", stock: "", category: "" });
  const [editing, setEditing] = useState(null);

  // auth / claims
  const [isAdmin, setIsAdmin] = useState(false);
  const [authReady, setAuthReady] = useState(false);

  // API
  const API = "/api/products"; // rota relativa (proxy do Next ou mesmo host do backend)

  // --------- Auth state + claims (checa ADMIN) ----------
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      try {
        if (!u) {
          setIsAdmin(false);
          setAuthReady(true);
          return;
        }
        // força atualização do token para garantir claims atuais
        const tokenResult = await u.getIdTokenResult(true);
        const c = tokenResult?.claims || {};
        const roles = Array.isArray(c.roles)
          ? c.roles
          : [
              c.admin && "admin",
              c.editor && "editor",
              c.cozinha && "cozinha",
              c.estoque && "estoque",
            ].filter(Boolean);

        setIsAdmin(roles.includes("admin") || c.admin === true);
        setAuthReady(true);
      } catch {
        setIsAdmin(false);
        setAuthReady(true);
      }
    });
    return () => unsub();
  }, []);

  // --------- Carregar produtos ----------
  async function load() {
    setErr("");
    setLoading(true);
    try {
      const res = await fetch(API, { cache: "no-store" });
      if (!res.ok) throw new Error("Falha ao buscar produtos");
      const data = await res.json();
      setItems(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
      setErr("Falha ao carregar produtos. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  // --------- CRUD (somente admin) ----------
  async function handleSave(e) {
    e.preventDefault();

    try {
      const token = await getIdTokenOrNull();
      if (!token) return alert("Faça login como ADMIN para executar esta ação.");

      const method = editing ? "PUT" : "POST";
      const url = editing ? `${API}/${editing.id}` : API;

      const body = {
        name: form.name,
        price: Number(form.price),
        stock: Number(form.stock),
        category: form.category || null,
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
            ? "Permissão negada. Somente ADMIN pode executar esta ação."
            : "Falha ao salvar produto.";
        return alert(msg);
      }

      setForm({ name: "", price: "", stock: "", category: "" });
      setEditing(null);
      await load();
    } catch (e) {
      console.error(e);
      alert("Erro inesperado ao salvar produto.");
    }
  }

  async function handleDelete(id) {
    if (!confirm("Excluir este produto?")) return;
    try {
      const token = await getIdTokenOrNull();
      if (!token) return alert("Faça login como ADMIN para executar esta ação.");

      const res = await fetch(`${API}/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        const msg =
          res.status === 401
            ? "Você não está autenticado."
            : res.status === 403
            ? "Permissão negada. Somente ADMIN pode executar esta ação."
            : res.status === 404
            ? "Produto não encontrado."
            : "Falha ao excluir produto.";
        return alert(msg);
      }

      await load();
    } catch (e) {
      console.error(e);
      alert("Erro inesperado ao excluir produto.");
    }
  }

  // --------- “Comprar” (para não-admin) ----------
  function handleBuy(p) {
    // placeholder — aqui você pode integrar com carrinho futuramente
    alert(`Produto adicionado ao carrinho: ${p.name || p.title}`);
  }

  // --------- Estilos (mantidos/compatíveis) ----------
  const page = {
    minHeight: "calc(100svh - 56px)",
    padding: 16,
    display: "grid",
    gridTemplateRows: "auto 1fr auto",
    gap: 12,
    maxWidth: 1080,
    margin: "0 auto",
  };

  const h2 = { textAlign: "center", margin: "8px 0 8px 0", color: "#111827", fontSize: 26 };

  // barra de ações (só renderiza para admin)
  const formRow = {
    display: "flex",
    justifyContent: "center",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 6,
  };
  const input = {
    border: "1px solid #e5e7eb",
    borderRadius: 10,
    padding: "8px 10px",
  };
  const btnAdd = {
    background: "#16a34a",
    color: "#fff",
    border: "none",
    padding: "8px 12px",
    borderRadius: 10,
    cursor: "pointer",
    fontWeight: 700,
  };
  const btnCancel = {
    background: "#9ca3af",
    color: "#fff",
    border: "none",
    padding: "8px 12px",
    borderRadius: 10,
    cursor: "pointer",
    fontWeight: 700,
  };

  const tableWrapOuter = {
    border: "1px solid #e5e7eb",
    borderRadius: 14,
    overflow: "hidden",
    boxShadow: "0 8px 22px rgba(0,0,0,0.05)",
    background: "#fff",
    display: "grid",
    gridTemplateRows: "auto 1fr",
    minHeight: 0,
  };

  const tableScroller = {
    maxHeight: "calc(100svh - 56px - 140px)", // evita scroll vertical da página
    overflow: "auto",
  };

  const table = { width: "100%", borderCollapse: "separate", borderSpacing: 0 };
  const th = {
    textAlign: "left",
    padding: "12px 14px",
    background: "#f3f4f6",
    color: "#111827",
    fontWeight: 700,
    borderBottom: "1px solid #e5e7eb",
    fontSize: 14,
    position: "sticky",
    top: 0,
    zIndex: 1,
  };
  const td = {
    padding: "12px 14px",
    borderBottom: "1px solid #f1f5f9",
    color: "#4b5563",
    fontSize: 14,
    verticalAlign: "middle",
  };
  const rowAlt = { background: "#f9fafb" };
  const imgBox = { width: 64, height: 48, borderRadius: 8, objectFit: "cover", border: "1px solid #e5e7eb" };
  const badge = {
    display: "inline-block",
    padding: "2px 8px",
    borderRadius: 999,
    background: "#e0f2fe",
    color: "#1e40af",
    fontSize: 12,
    border: "1px solid #bfdbfe",
  };

  const note = { fontSize: 12, color: "#6b7280", textAlign: "center", marginTop: 8 };

  return (
    <>
      <Nav />
      <main style={page}>
        <h2 style={h2}>Produtos</h2>

        {/* Só exibe o CRUD quando a auth estiver carregada e o user for ADMIN */}
        {authReady && isAdmin && (
          <form onSubmit={handleSave} style={formRow}>
            <input
              placeholder="Nome"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
              style={input}
            />
            <input
              placeholder="Preço"
              type="number"
              step="0.01"
              value={form.price}
              onChange={(e) => setForm({ ...form, price: e.target.value })}
              required
              style={input}
            />
            <input
              placeholder="Estoque"
              type="number"
              value={form.stock}
              onChange={(e) => setForm({ ...form, stock: e.target.value })}
              required
              style={input}
            />
            <input
              placeholder="Categoria"
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              style={input}
            />

            <button type="submit" style={btnAdd}>
              {editing ? "Salvar" : "Adicionar"}
            </button>

            {editing && (
              <button
                type="button"
                onClick={() => {
                  setEditing(null);
                  setForm({ name: "", price: "", stock: "", category: "" });
                }}
                style={btnCancel}
              >
                Cancelar
              </button>
            )}
          </form>
        )}

        {loading && <div style={{ textAlign: "center" }}>Carregando...</div>}
        {err && <div style={{ color: "crimson", textAlign: "center" }}>{err}</div>}
        {!loading && !err && items.length === 0 && (
          <div style={{ textAlign: "center", color: "#6b7280" }}>Nenhum produto cadastrado.</div>
        )}

        {items.length > 0 && (
          <div style={tableWrapOuter}>
            <div style={tableScroller}>
              <table style={table}>
                <thead>
                  <tr>
                    <th style={th}>Imagem</th>
                    <th style={th}>Produto</th>
                    <th style={th}>Preço</th>
                    <th style={th}>Estoque</th>
                    <th style={th}>Categoria</th>
                    <th style={th}>Status</th>
                    <th style={th}>{isAdmin ? "Ações" : "Comprar"}</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((p, i) => (
                    <tr key={p.id} style={i % 2 ? rowAlt : undefined}>
                      <td style={td}>
                        {p.imageUrl ? (
                          <img src={p.imageUrl} alt={p.name || p.title || "Produto"} style={imgBox} />
                        ) : (
                          <div style={{ ...imgBox, display: "grid", placeItems: "center", color: "#9ca3af" }}>—</div>
                        )}
                      </td>
                      <td style={td}>
                        <strong style={{ color: "#111827" }}>{p.name || p.title}</strong>
                      </td>
                      <td style={td}>
                        {"price" in p ? `R$ ${Number(p.price).toFixed(2)}` : "—"}
                      </td>
                      <td style={td}>
                        {"stock" in p ? `${p.stock} un.` : "—"}
                      </td>
                      <td style={td}>
                        {"category" in p ? p.category : "—"}
                      </td>
                      <td style={td}>
                        {p.active === false ? (
                          <span style={{ ...badge, background: "#fee2e2", color: "#991b1b", borderColor: "#fecaca" }}>
                            Inativo
                          </span>
                        ) : (
                          <span style={badge}>Ativo</span>
                        )}
                      </td>

                      <td style={td}>
                        {isAdmin ? (
                          <>
                            <button
                              onClick={() => {
                                setEditing(p);
                                setForm({
                                  name: p.name || "",
                                  price: p.price ?? "",
                                  stock: p.stock ?? "",
                                  category: p.category || "",
                                });
                              }}
                              style={{
                                marginRight: 8,
                                background: "#2563eb",
                                color: "#fff",
                                border: "none",
                                borderRadius: 6,
                                padding: "4px 8px",
                                cursor: "pointer",
                              }}
                            >
                              Editar
                            </button>
                            <button
                              onClick={() => handleDelete(p.id)}
                              style={{
                                background: "#dc2626",
                                color: "#fff",
                                border: "none",
                                borderRadius: 6,
                                padding: "4px 8px",
                                cursor: "pointer",
                              }}
                            >
                              Excluir
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() => handleBuy(p)}
                            style={{
                              background: "linear-gradient(180deg, #22C55E 0%, #16A34A 100%)",
                              color: "#fff",
                              border: "none",
                              borderRadius: 8,
                              padding: "6px 12px",
                              cursor: "pointer",
                              fontWeight: 700,
                              boxShadow: "0 6px 14px rgba(22,163,74,0.2)",
                            }}
                          >
                            Comprar
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <p style={note}>
          * Leitura pública de <code>/api/products</code>. Operações de escrita exigem usuário ADMIN (Firebase).
        </p>
      </main>
    </>
  );
}
