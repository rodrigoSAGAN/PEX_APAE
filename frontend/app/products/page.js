"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Nav from "../../components/Nav";
import SideMenu from "../../components/SideMenu";
import { getIdTokenOrNull } from "../../lib/authToken";
import { auth } from "../../lib/firebase";
import { useModal } from "../../components/ModalContext";

export default function ProductsPage() {
  const router = useRouter();
  const { showModal, showConfirm } = useModal();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const [form, setForm] = useState({
    name: "",
    price: "",
    stock: "",
    category: "",
  });
  const [editing, setEditing] = useState(null);

  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState("");

  const [canEdit, setCanEdit] = useState(false);
  const [claims, setClaims] = useState(null);

  const [cart, setCart] = useState({});

  const [filterClass, setFilterClass] = useState("all"); 

  const API = "/api/products";

  useEffect(() => {
    try {
      const raw = localStorage.getItem("portal-apae-cart");
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === "object") {
          setCart(parsed);
        }
      }
    } catch (e) {
      console.warn(
        "[products] não foi possível ler o carrinho do localStorage:",
        e
      );
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem("portal-apae-cart", JSON.stringify(cart));
    } catch (e) {
      console.warn(
        "[products] não foi possível salvar o carrinho no localStorage:",
        e
      );
    }
  }, [cart]);

  function addToCart(product) {
    const newQ = (cart[product.id] || 0) + 1;
    const rawStock = product.stock ?? 0;
    const stockNumber =
      typeof rawStock === "number" ? rawStock : Number(rawStock);

    if (stockNumber > 0 && newQ > stockNumber) {
       showModal("Quantidade solicitada excede o estoque disponível.", "Aviso");
       return;
    }

    const newCart = { ...cart, [product.id]: newQ };
    setCart(newCart);
    localStorage.setItem("portal-apae-cart", JSON.stringify(newCart));

    if (auth.currentUser) {
      auth.currentUser.getIdToken().then(token => {
        fetch("/api/cart", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ items: newCart }),
        }).catch(err => console.error("Erro ao salvar carrinho remoto:", err));
      });
    }

    router.push("/carrinho");
  }

  async function load() {
    setErr("");
    setLoading(true);
    try {
      const res = await fetch(API, { cache: "no-store" });
      if (!res.ok) throw new Error("Falha ao buscar produtos");
      const data = await res.json();
      setItems(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error("[products] erro ao carregar produtos:", e);
      setErr("Falha ao carregar produtos. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  async function checkPermissions() {
    try {
      const token = await getIdTokenOrNull();
      if (!token) {
        console.log("[products] usuário não logado, sem permissão de edição.");
        setCanEdit(false);
        setClaims(null);
        return;
      }

      const parts = token.split(".");
      if (parts.length !== 3) {
        console.warn("[products] token JWT em formato inesperado.");
        setCanEdit(false);
        return;
      }

      const [, payloadBase64] = parts;

      const payloadJson = atob(
        payloadBase64.replace(/-/g, "+").replace(/_/g, "/")
      );
      const payload = JSON.parse(payloadJson);
      setClaims(payload);

      const roles = Array.isArray(payload.roles) ? payload.roles : [];
      const isAdmin = roles.includes("admin");
      const isColab = roles.includes("colaborador");
      const canEditStore = payload.canEditStore === true;

      const allow = isAdmin || (isColab && canEditStore);
      setCanEdit(allow);
    } catch (e) {
      console.error("Falha ao verificar permissões do usuário:", e);
      setCanEdit(false);
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
          "Faça login como ADMIN ou colaborador de cozinha autorizado para executar esta ação.",
          "Acesso Negado"
        );
      }

      const method = editing ? "PUT" : "POST";
      const url = editing ? `${API}/${editing.id}` : API;

      let res;

      if (imageFile) {
        
        const formData = new FormData();
        formData.append("name", form.name);
        formData.append("price", String(Number(form.price)));
        formData.append("stock", String(Number(form.stock)));
        formData.append("category", form.category || "");
        formData.append("image", imageFile);

        res = await fetch(url, {
          method,
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        });
      } else {
        
        const body = {
          name: form.name,
          price: Number(form.price),
          stock: Number(form.stock),
          category: form.category || null,
        };

        res = await fetch(url, {
          method,
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(body),
        });
      }

      if (!res.ok) {
        const msg =
          res.status === 401
            ? "Você não está autenticado."
            : res.status === 403
            ? "Permissão negada. Apenas ADMIN ou colaborador de cozinha autorizado pode editar a loja."
            : "Falha ao salvar produto.";
        return showModal(msg, "Erro");
      }

      setForm({ name: "", price: "", stock: "", category: "" });
      setEditing(null);
      setImageFile(null);
      setImagePreview("");
      await load();
    } catch (e) {
      console.error("[products] erro ao salvar produto:", e);
      showModal("Erro inesperado ao salvar produto.", "Erro");
    }
  }

  async function handleDelete(id) {
    if (!(await showConfirm("Excluir este produto?"))) return;
    try {
      const token = await getIdTokenOrNull();
      if (!token) {
        return showModal(
          "Faça login como ADMIN ou colaborador de cozinha autorizado para executar esta ação.",
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
            ? "Permissão negada. Apenas ADMIN ou colaborador autorizado pode excluir."
            : res.status === 404
            ? "Produto não encontrado."
            : "Falha ao excluir produto.";
        return showModal(msg, "Erro");
      }

      await load();
    } catch (e) {
      console.error("[products] erro ao excluir produto:", e);
      showModal("Erro inesperado ao excluir produto.", "Erro");
    }
  }

  const filteredItems = items.filter((p) => {
    if (filterClass === "all") return true;
    const cat = (p.category || "").toString().toLowerCase();
    return cat === filterClass;
  });

  const wrapGrid = {
    padding: 16,
    maxWidth: 1200,
    margin: "0 auto",
    display: "grid",
    gridTemplateColumns: "260px 1fr",
    gap: 16,
  };

  const wrapFull = {
    padding: 16,
    maxWidth: 1200,
    margin: "0 auto",
    display: "block",
  };

  const mainContent = {
    background:
      "linear-gradient(135deg, rgba(219,234,254,0.85), rgba(239,246,255,0.9))",
    borderRadius: 24,
    boxShadow: "0 12px 30px rgba(15,23,42,0.08)",
    padding: 24,
    minWidth: 0,
  };

  const h2 = {
    textAlign: "center",
    margin: "12px 0 16px 0",
    color: "#111827",
    fontSize: 26,
  };

  const filterBar = {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
    marginBottom: 16,
    flexWrap: "wrap",
  };

  const filterLabel = {
    fontSize: 14,
    color: "#374151",
    fontWeight: 600,
  };

  const select = {
    padding: "6px 10px",
    borderRadius: 8,
    border: "1px solid #d1d5db",
    fontSize: 14,
    background: "#fff",
  };

  const cartInfoWrap = {
    display: "flex",
    alignItems: "center",
    gap: 8,
    flexWrap: "wrap",
  };

  const cartInfoText = {
    fontSize: 13,
    color: "#4b5563",
  };

  const cartButton = {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "8px 16px",
    borderRadius: 999,
    border: "1px solid rgba(191,219,254,0.95)",
    background:
      "linear-gradient(135deg, #3b82f6 0%, #2563eb 40%, #1d4ed8 100%)",
    color: "#f9fafb",
    fontWeight: 800,
    fontSize: 14,
    textDecoration: "none",
    boxShadow: "0 6px 14px rgba(37,99,235,0.45)",
  };

  const cardsGrid = {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: 16,
  };

  const card = {
    borderRadius: 16,
    border: "1px solid #e5e7eb",
    background: "#ffffff",
    boxShadow: "0 8px 18px rgba(15,23,42,0.05)",
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
  };

  const imageWrap = {
    width: "100%",
    paddingTop: "62%",
    position: "relative",
    background: "#f9fafb",
  };

  const cardImg = {
    position: "absolute",
    inset: 0,
    width: "100%",
    height: "100%",
    objectFit: "cover",
  };

  const cardBody = {
    padding: 12,
    display: "flex",
    flexDirection: "column",
    gap: 6,
    flex: 1,
  };

  const titleRow = {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 8,
  };

  const prodName = {
    fontWeight: 700,
    color: "#0f172a",
    fontSize: 15,
  };

  const categoryChip = {
    padding: "2px 8px",
    borderRadius: 999,
    fontSize: 11,
    background: "#eff6ff",
    color: "#1d4ed8",
    border: "1px solid #bfdbfe",
  };

  const priceText = {
    fontSize: 18,
    fontWeight: 800,
    color: "#16a34a",
  };

  const metaRow = {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    fontSize: 12,
    color: "#6b7280",
  };

  const statusBadgeBase = {
    display: "inline-block",
    padding: "2px 8px",
    borderRadius: 999,
    fontSize: 11,
    border: "1px solid transparent",
  };

  const statusAtivo = {
    ...statusBadgeBase,
    background: "#e0f2fe",
    color: "#1e40af",
    borderColor: "#bfdbfe",
  };

  const statusInativo = {
    ...statusBadgeBase,
    background: "#fee2e2",
    color: "#991b1b",
    borderColor: "#fecaca",
  };

  const cardFooter = {
    padding: "0 12px 10px 12px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 8,
    flexWrap: "wrap",
  };

  const btnCart = {
    background: "#10b981",
    color: "#fff",
    border: "none",
    borderRadius: 999,
    padding: "6px 12px",
    cursor: "pointer",
    fontSize: 13,
    fontWeight: 600,
    boxShadow: "0 4px 10px rgba(16,185,129,0.25)",
    flexShrink: 0,
  };

  const esgotadoBadge = {
    ...btnCart,
    background: "#9ca3af",
    boxShadow: "none",
    cursor: "default",
  };

  const adminActions = {
    display: "flex",
    gap: 6,
    flexWrap: "wrap",
    justifyContent: "flex-end",
    flex: 1,
  };

  const btnEdit = {
    background: "#2563eb",
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

  const formWrap = {
    marginBottom: 20,
    padding: 12,
    borderRadius: 14,
    background: "#f9fafb",
    border: "1px solid #e5e7eb",
  };

  const formRow = {
    display: "flex",
    flexWrap: "wrap",
    gap: 8,
    alignItems: "center",
    justifyContent: "center",
  };

  const inputSmall = {
    padding: "8px 10px",
    borderRadius: 8,
    border: "1px solid #d1d5db",
    fontSize: 13,
    minWidth: 140,
  };

  const fileInput = {
    fontSize: 12,
  };

  const previewBox = {
    marginTop: 8,
    textAlign: "center",
    fontSize: 12,
    color: "#6b7280",
  };

  const previewImg = {
    marginTop: 4,
    width: 80,
    height: 80,
    objectFit: "cover",
    borderRadius: 12,
    border: "1px solid #e5e7eb",
  };

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
      <div style={showSidebar ? wrapGrid : wrapFull}>
        {showSidebar && <SideMenu claims={claims} />}
        
        <main style={mainContent}>
          <h2 style={h2}>Produtos</h2>

          <div style={filterBar}>
            <div>
              <span style={filterLabel}>Filtrar por classe:&nbsp;</span>
              <select
                value={filterClass}
                onChange={(e) => setFilterClass(e.target.value)}
                style={select}
              >
                <option value="all">Todas</option>
                <option value="artigos">Artigos</option>
                <option value="cozinha">Cozinha</option>
              </select>
            </div>

            <div style={cartInfoWrap}>
              <div style={cartInfoText}>
                Itens no carrinho:{" "}
                <strong>
                  {Object.values(cart).reduce((acc, n) => acc + n, 0)}
                </strong>
              </div>
              <Link href="/carrinho" style={cartButton}>
                Ver carrinho
              </Link>
            </div>
          </div>

          {canEdit && (
            <form onSubmit={handleSave} style={formWrap}>
              <div style={formRow}>
                <input
                  placeholder="Nome"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                  style={inputSmall}
                />
                <input
                  placeholder="Preço"
                  type="number"
                  step="0.01"
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: e.target.value })}
                  required
                  style={inputSmall}
                />
                <input
                  placeholder="Estoque"
                  type="number"
                  value={form.stock}
                  onChange={(e) => setForm({ ...form, stock: e.target.value })}
                  required
                  style={inputSmall}
                />
                <input
                  placeholder="Categoria (artigos, cozinha, ...)"
                  value={form.category}
                  onChange={(e) =>
                    setForm({ ...form, category: e.target.value })
                  }
                  style={inputSmall}
                />

                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setImageFile(file);
                      setImagePreview(URL.createObjectURL(file));
                    } else {
                      setImageFile(null);
                      setImagePreview("");
                    }
                  }}
                  style={fileInput}
                />

                <button
                  type="submit"
                  style={{
                    background: "#16a34a",
                    color: "#fff",
                    border: "none",
                    padding: "8px 14px",
                    borderRadius: 999,
                    cursor: "pointer",
                    fontWeight: 700,
                    fontSize: 13,
                  }}
                >
                  {editing ? "Salvar" : "Adicionar"}
                </button>

                {editing && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditing(null);
                      setForm({
                        name: "",
                        price: "",
                        stock: "",
                        category: "",
                      });
                      setImageFile(null);
                      setImagePreview("");
                    }}
                    style={{
                      background: "#9ca3af",
                      color: "#fff",
                      border: "none",
                      padding: "8px 14px",
                      borderRadius: 999,
                      cursor: "pointer",
                      fontWeight: 600,
                      fontSize: 13,
                    }}
                  >
                    Cancelar
                  </button>
                )}
              </div>

              {imagePreview && (
                <div style={previewBox}>
                  Pré-visualização da imagem:
                  <br />
                  <img
                    src={imagePreview}
                    alt="Pré-visualização"
                    style={previewImg}
                  />
                </div>
              )}
            </form>
          )}

          {loading && <div style={{ textAlign: "center" }}>Carregando...</div>}
          {err && (
            <div style={{ color: "crimson", textAlign: "center" }}>{err}</div>
          )}
          {!loading && !err && items.length === 0 && (
            <div style={{ textAlign: "center", color: "#6b7280" }}>
              Nenhum produto cadastrado.
            </div>
          )}

          {!loading &&
            !err &&
            items.length > 0 &&
            filteredItems.length === 0 && (
              <div style={{ textAlign: "center", color: "#6b7280" }}>
                Nenhum produto encontrado para a classe selecionada.
              </div>
            )}

          {filteredItems.length > 0 && (
            <div style={cardsGrid}>
              {filteredItems.map((p) => {
                const price = "price" in p ? Number(p.price) : null;
                const rawStock = "stock" in p ? p.stock : null;
                const stockNumber =
                  rawStock !== null
                    ? typeof rawStock === "number"
                      ? rawStock
                      : Number(rawStock)
                    : null;
                const qtyInCart = cart[p.id] || 0;

                const available =
                  stockNumber !== null ? stockNumber - qtyInCart : null;
                const isOutOfStock =
                  stockNumber !== null && (stockNumber <= 0 || available <= 0);

                return (
                  <div key={p.id} style={card}>
                    <div style={imageWrap}>
                      {p.imageUrl ? (
                        <img
                          src={p.imageUrl}
                          alt={p.name || p.title || "Produto"}
                          style={cardImg}
                        />
                      ) : (
                        <div
                          style={{
                            ...cardImg,
                            display: "grid",
                            placeItems: "center",
                            color: "#9ca3af",
                            fontSize: 12,
                          }}
                        >
                          Sem imagem
                        </div>
                      )}
                    </div>

                    <div style={cardBody}>
                      <div style={titleRow}>
                        <div style={prodName}>{p.name || p.title}</div>
                        <div style={categoryChip}>
                          {(p.category || "Sem categoria").toString()}
                        </div>
                      </div>

                      <div style={priceText}>
                        {price !== null ? `R$ ${price.toFixed(2)}` : "—"}
                      </div>

                      <div style={metaRow}>
                        <span>
                          {stockNumber !== null
                            ? `${stockNumber} un.`
                            : "Estoque não inf."}
                        </span>
                        <span
                          style={
                            p.active === false ? statusInativo : statusAtivo
                          }
                        >
                          {p.active === false ? "Inativo" : "Ativo"}
                        </span>
                      </div>
                    </div>

                    <div style={cardFooter}>
                      {isOutOfStock ? (
                        <div style={esgotadoBadge}>Esgotado</div>
                      ) : (
                        <div style={{ display: "flex", gap: 8 }}>
                          <button
                            type="button"
                            style={{
                              ...btnCart,
                              background: "#f3f4f6",
                              color: "#1f2937",
                              border: "1px solid #d1d5db",
                              boxShadow: "none",
                            }}
                            onClick={(e) => {
                              e.stopPropagation();
                              const newQ = (cart[p.id] || 0) + 1;
                              const newCart = { ...cart, [p.id]: newQ };
                              setCart(newCart);
                              localStorage.setItem("portal-apae-cart", JSON.stringify(newCart));
                              
                              if (auth.currentUser) {
                                auth.currentUser.getIdToken().then(token => {
                                  fetch("/api/cart", {
                                    method: "POST",
                                    headers: {
                                      "Content-Type": "application/json",
                                      Authorization: `Bearer ${token}`,
                                    },
                                    body: JSON.stringify({ items: newCart }),
                                  }).catch(err => console.error("Erro ao salvar carrinho remoto:", err));
                                });
                              }
                              
                              showModal("Produto adicionado ao carrinho!", "Sucesso");
                            }}
                          >
                            Adicionar
                          </button>
                          <button
                            type="button"
                            style={btnCart}
                            onClick={() => addToCart(p)}
                          >
                            Comprar
                          </button>
                        </div>
                      )}

                      {canEdit && (
                        <div style={adminActions}>
                          <button
                            type="button"
                            style={btnEdit}
                            onClick={() => {
                              setEditing(p);
                              setForm({
                                name: p.name || "",
                                price: p.price || "",
                                stock: p.stock || "",
                                category: p.category || "",
                              });
                              setImageFile(null);
                              setImagePreview(p.imageUrl || "");
                              window.scrollTo({ top: 0, behavior: "smooth" });
                            }}
                          >
                            Editar
                          </button>
                          <button
                            type="button"
                            style={btnDelete}
                            onClick={() => handleDelete(p.id)}
                          >
                            Excluir
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </main>
      </div>
    </>
  );
}
