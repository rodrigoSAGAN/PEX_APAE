"use client";

import { useEffect, useState, useMemo } from "react";
import Nav from "../../components/Nav";
import { auth, db, storage } from "../../lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

export default function GaleriaPage() {
  const [items, setItems] = useState([]); 
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  // permissões
  const [user, setUser] = useState(null);
  const [claims, setClaims] = useState(null);
  const [authReady, setAuthReady] = useState(false);

  // filtro simples
  const [filterCategory, setFilterCategory] = useState("todos");

  // modal de zoom
  const [zoomItem, setZoomItem] = useState(null);

  // upload
  const [form, setForm] = useState({
    title: "",
    description: "",
    category: "Eventos",
  });
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  //OBSERVA AUTH E PEGA CLAIMS
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u || null);
      if (u) {
        const token = await u.getIdTokenResult(true);
        setClaims(token.claims);
      } else {
        setClaims(null);
      }
      setAuthReady(true);
    });
    return () => unsub();
  }, []);

  const roles = Array.isArray(claims?.roles) ? claims.roles : [];
  const isAdmin = roles.includes("admin");
  const isColab = roles.includes("colaborador");
  const canEvents = claims?.canEditEvents === true;
  const canEditGallery = isAdmin || (isColab && canEvents);

  //CARREGA FOTOS DA GALERIA (FIRESTORE)
  useEffect(() => {
    try {
      const colRef = collection(db, "gallery");
      const q = query(colRef, orderBy("createdAt", "desc"));

      const unsub = onSnapshot(
        q,
        (snap) => {
          const list = snap.docs.map((doc) => {
            const data = doc.data();
            return {
              id: doc.id,
              title: data.title || "",
              description: data.description || "",
              category: data.category || "Outros",
              imageUrl: data.imageUrl || "",
              createdAt: data.createdAt?.toDate
                ? data.createdAt.toDate()
                : null,
            };
          });
          setItems(list);
          setLoading(false);
        },
        (e) => {
          console.error("[galeria] erro ao ouvir coleção:", e);
          setErr("Não foi possível carregar a galeria.");
          setLoading(false);
        }
      );

      return () => unsub();
    } catch (e) {
      console.error("[galeria] erro geral:", e);
      setErr("Falha ao conectar à galeria.");
      setLoading(false);
    }
  }, []);

  //CATEGORIAS FIXAS
  const CATEGORY_OPTIONS = [
    "Eventos",
    "Estrutura",
    "Horta",
    "Atividades pedagógicas",
    "Confraternizações",
    "Outros",
  ];

  const categoriesFromData = useMemo(() => {
    const set = new Set();
    items.forEach((it) => {
      if (it.category) set.add(it.category);
    });
    return Array.from(set);
  }, [items]);

  const filteredItems = useMemo(() => {
    if (filterCategory === "todos") return items;
    return items.filter((it) => it.category === filterCategory);
  }, [items, filterCategory]);

  //UPLOAD SIMPLES
  async function handleUpload(e) {
    e.preventDefault();
    setErr("");

    if (!canEditGallery) {
      setErr("Você não tem permissão para enviar fotos.");
      return;
    }

    if (!file) {
      setErr("Selecione uma imagem para enviar.");
      return;
    }

    if (!form.title.trim()) {
      setErr("Informe um título para a foto.");
      return;
    }

    try {
      setUploading(true);

      //Faz o upload do arquivo
      const fileName = `${Date.now()}-${file.name}`;
      const storageRef = ref(storage, `gallery/${fileName}`);
      await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(storageRef);

      //Salva no Firestore
      const colRef = collection(db, "gallery");
      await addDoc(colRef, {
        title: form.title.trim(),
        description: form.description.trim(),
        category: form.category || "Outros",
        imageUrl: downloadURL,
        createdAt: serverTimestamp(),
      });

      //Limpa formulário
      setForm({
        title: "",
        description: "",
        category: form.category, 
      });
      setFile(null);
      (e.target.reset && e.target.reset()); 
    } catch (error) {
      console.error("[galeria] erro ao enviar imagem:", error);
      setErr("Não foi possível enviar a imagem. Tente novamente.");
    } finally {
      setUploading(false);
    }
  }

  //ESTILOS
  const page = {
    minHeight: "calc(100svh - 56px)",
    background: "#e6f3ff",
    padding: 16,
  };

  const wrap = {
    maxWidth: 1100,
    margin: "0 auto",
  };

  const title = {
    fontSize: 28,
    fontWeight: 700,
    color: "#0f172a",
    margin: "12px 0 4px 0",
  };

  const subtitle = {
    fontSize: 14,
    color: "#4b5563",
    marginBottom: 16,
  };

  const errorBox = {
    background: "#fef2f2",
    borderRadius: 10,
    border: "1px solid #fecaca",
    padding: "8px 10px",
    color: "#991b1b",
    fontSize: 14,
    marginBottom: 12,
  };

  const uploadCard = {
    background: "#ffffff",
    borderRadius: 18,
    border: "1px solid #e5e7eb",
    padding: 16,
    boxShadow: "0 10px 22px rgba(15,23,42,0.08)",
    marginBottom: 16,
  };

  const uploadTitle = {
    fontSize: 16,
    fontWeight: 700,
    color: "#0f172a",
    marginBottom: 8,
  };

  const fieldRow = {
    display: "grid",
    gridTemplateColumns: "1.4fr 1fr",
    gap: 10,
    marginBottom: 8,
  };

  const label = {
    display: "block",
    fontSize: 13,
    color: "#334155",
    marginBottom: 4,
    fontWeight: 600,
  };

  const input = {
    width: "100%",
    borderRadius: 10,
    border: "1px solid #d1d5db",
    padding: "8px 10px",
    fontSize: 14,
    outline: "none",
  };

  const textarea = {
    ...input,
    minHeight: 60,
    resize: "vertical",
  };

  const select = {
    ...input,
  };

  const fileInput = {
    width: "100%",
    fontSize: 13,
  };

  const uploadBtn = {
    marginTop: 8,
    padding: "10px 16px",
    borderRadius: 999,
    border: "none",
    cursor: uploading ? "not-allowed" : "pointer",
    fontWeight: 700,
    fontSize: 14,
    background: "linear-gradient(135deg, #22c55e, #16a34a)",
    color: "#ffffff",
    boxShadow: "0 8px 18px rgba(34,197,94,0.35)",
    opacity: uploading ? 0.75 : 1,
  };

  const galleryHeader = {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    marginTop: 8,
    marginBottom: 8,
    flexWrap: "wrap",
  };

  const filterSelect = {
    borderRadius: 999,
    border: "1px solid #cbd5f5",
    padding: "6px 12px",
    fontSize: 13,
    background: "#ffffff",
  };

  const grid = {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(170px, 1fr))",
    gap: 12,
    marginTop: 8,
  };

  const card = {
    background: "#ffffff",
    borderRadius: 14,
    overflow: "hidden",
    border: "1px solid #e5e7eb",
    boxShadow: "0 8px 18px rgba(15,23,42,0.06)",
    cursor: "pointer",
    display: "flex",
    flexDirection: "column",
  };

  const imgBox = {
    width: "100%",
    height: 140,
    objectFit: "cover",
    display: "block",
  };

  const cardBody = {
    padding: 8,
  };

  const cardTitle = {
    fontSize: 14,
    fontWeight: 600,
    color: "#111827",
    marginBottom: 2,
  };

  const cardCat = {
    fontSize: 11,
    color: "#0f766e",
    textTransform: "uppercase",
  };

  const empty = {
    fontSize: 14,
    color: "#6b7280",
    marginTop: 12,
  };

  // Modal do zoom
  const modalBackdrop = {
    position: "fixed",
    inset: 0,
    background: "rgba(15,23,42,0.75)",
    display: "grid",
    placeItems: "center",
    zIndex: 60,
    padding: 16,
  };

  const modalBox = {
    background: "#ffffff",
    borderRadius: 20,
    maxWidth: 900,
    width: "100%",
    maxHeight: "90vh",
    overflow: "hidden",
    boxShadow: "0 20px 50px rgba(15,23,42,0.7)",
    display: "grid",
    gridTemplateColumns: "minmax(0, 1.4fr) minmax(0, 1fr)",
    gap: 0,
  };

  const modalImgWrap = {
    background: "#020617",
  };

  const modalImg = {
    width: "100%",
    height: "100%",
    maxHeight: "90vh",
    objectFit: "cover",
    display: "block",
  };

  const modalContent = {
    padding: 18,
    display: "flex",
    flexDirection: "column",
    gap: 8,
  };

  const modalClose = {
    alignSelf: "flex-end",
    border: "none",
    background: "transparent",
    fontSize: 20,
    cursor: "pointer",
  };

  const modalTitle = {
    fontSize: 18,
    fontWeight: 700,
    color: "#0f172a",
  };

  const modalDesc = {
    fontSize: 14,
    color: "#4b5563",
  };

  //RENDER
  return (
    <>
      <Nav />
      <main style={page}>
        <div style={wrap}>
          <h1 style={title}>Galeria de fotos</h1>
          <p style={subtitle}>
            Veja registros de eventos, atividades pedagógicas e momentos
            especiais da APAE – Pinhão.
          </p>

          {err && <div style={errorBox}>{err}</div>}

          {/* UPLOAD  */}
          {authReady && canEditGallery && (
            <section style={uploadCard}>
              <div style={uploadTitle}>Adicionar foto à galeria</div>
              <form onSubmit={handleUpload}>
                <div style={fieldRow}>
                  <div>
                    <label style={label} htmlFor="title">
                      Título da foto
                    </label>
                    <input
                      id="title"
                      style={input}
                      type="text"
                      value={form.title}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, title: e.target.value }))
                      }
                      placeholder="Ex.: Apresentação na Semana da Pessoa com Deficiência"
                    />
                  </div>
                  <div>
                    <label style={label} htmlFor="category">
                      Categoria
                    </label>
                    <select
                      id="category"
                      style={select}
                      value={form.category}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, category: e.target.value }))
                      }
                    >
                      {CATEGORY_OPTIONS.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <label style={label} htmlFor="description">
                  Descrição (opcional)
                </label>
                <textarea
                  id="description"
                  style={textarea}
                  value={form.description}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, description: e.target.value }))
                  }
                  placeholder="Breve descrição do momento registrado na foto."
                />

                <label style={label} htmlFor="file">
                  Imagem (upload direto do computador)
                </label>
                <input
                  id="file"
                  type="file"
                  accept="image/*"
                  style={fileInput}
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                />

                <button type="submit" style={uploadBtn} disabled={uploading}>
                  {uploading ? "Enviando foto..." : "Enviar para a galeria"}
                </button>
              </form>
            </section>
          )}

          {/* LISTA GALERIA */}
          <section>
            <div style={galleryHeader}>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: "#0f172a" }}>
                Fotos cadastradas
              </h2>

              <div>
                <label
                  htmlFor="filter"
                  style={{ fontSize: 12, color: "#4b5563", marginRight: 6 }}
                >
                  Filtrar por categoria:
                </label>
                <select
                  id="filter"
                  style={filterSelect}
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                >
                  <option value="todos">Todas</option>
                  {categoriesFromData.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {loading ? (
              <p style={empty}>Carregando fotos...</p>
            ) : filteredItems.length === 0 ? (
              <p style={empty}>
                Nenhuma foto cadastrada nesta categoria até o momento.
              </p>
            ) : (
              <div style={grid}>
                {filteredItems.map((it) => (
                  <article
                    key={it.id}
                    style={card}
                    onClick={() => it.imageUrl && setZoomItem(it)}
                  >
                    {it.imageUrl ? (
                      <img
                        src={it.imageUrl}
                        alt={it.title || "Foto da galeria"}
                        style={imgBox}
                      />
                    ) : (
                      <div
                        style={{
                          ...imgBox,
                          display: "grid",
                          placeItems: "center",
                          color: "#9ca3af",
                          fontSize: 12,
                        }}
                      >
                        Sem imagem
                      </div>
                    )}
                    <div style={cardBody}>
                      <div style={cardTitle}>{it.title || "Foto"}</div>
                      <div style={cardCat}>{it.category || "Outros"}</div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        </div>

        {/* MODAL DE ZOOM DA IMAGEM */}
        {zoomItem && (
          <div
            style={modalBackdrop}
            onClick={() => setZoomItem(null)}
          >
            <div
              style={modalBox}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={modalImgWrap}>
                {zoomItem.imageUrl && (
                  <img
                    src={zoomItem.imageUrl}
                    alt={zoomItem.title || "Foto ampliada"}
                    style={modalImg}
                  />
                )}
              </div>
              <div style={modalContent}>
                <button
                  type="button"
                  style={modalClose}
                  onClick={() => setZoomItem(null)}
                  aria-label="Fechar"
                >
                  ×
                </button>
                <h3 style={modalTitle}>{zoomItem.title || "Foto"}</h3>
                {zoomItem.category && (
                  <span
                    style={{
                      fontSize: 11,
                      textTransform: "uppercase",
                      color: "#0f766e",
                    }}
                  >
                    {zoomItem.category}
                  </span>
                )}
                {zoomItem.description && (
                  <p style={modalDesc}>{zoomItem.description}</p>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </>
  );
}
