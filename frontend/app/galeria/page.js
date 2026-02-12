"use client";

import { useEffect, useState, useMemo, useRef } from "react";
import Nav from "../../components/Nav";
import SideMenu from "../../components/SideMenu";
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

  const [user, setUser] = useState(null);
  const [claims, setClaims] = useState(null);
  const [authReady, setAuthReady] = useState(false);

  const [filterCategory, setFilterCategory] = useState("todos");

  const [zoomItem, setZoomItem] = useState(null);

  const [form, setForm] = useState({
    title: "",
    description: "",
    category: "Eventos",
  });

  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  const [showCamera, setShowCamera] = useState(false);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

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
        () => {
          setErr("Não foi possível carregar a galeria.");
          setLoading(false);
        }
      );

      return () => unsub();
    } catch (e) {
      setErr("Falha ao conectar à galeria.");
      setLoading(false);
    }
  }, []);

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

  useEffect(() => {
    if (!showCamera) return;

    const startCamera = async () => {
      try {
        const video = videoRef.current;
        if (!video) return;

        let stream;
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: { ideal: "environment" } },
          });
        } catch (e) {
          stream = await navigator.mediaDevices.getUserMedia({
            video: true,
          });
        }

        video.srcObject = stream;

        await new Promise((resolve) => {
          video.onloadedmetadata = () => {
            video.play().then(resolve);
          };
        });

        await new Promise((r) => setTimeout(r, 200));

        if (video.videoWidth === 0 || video.videoHeight === 0) {
          alert("A câmera não iniciou corretamente. Tente novamente.");
          stopStream();
          setShowCamera(false);
        }
      } catch {
        alert("Não foi possível acessar a câmera.");
        setShowCamera(false);
      }
    };

    startCamera();
  }, [showCamera]);

  const stopStream = () => {
    const video = videoRef.current;
    if (video && video.srcObject) {
      video.srcObject.getTracks().forEach((t) => t.stop());
    }
  };

  const capturePhoto = () => {
    const video = videoRef.current;
    const canvas = document.createElement("canvas");

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext("2d");
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob(
      (blob) => {
        if (!blob) {
          alert("Falha ao processar imagem.");
          return;
        }

        const photoFile = new File([blob], "foto.jpg", {
          type: "image/jpeg",
        });

        setFile(photoFile);
        stopStream();
        setShowCamera(false);
      },
      "image/jpeg",
      0.7
    );
  };

  const handleCloseCamera = () => {
    stopStream();
    setShowCamera(false);
  };
  async function handleUpload(e) {
    e.preventDefault();
    setErr("");

    if (!canEditGallery) {
      setErr("Você não tem permissão para enviar fotos.");
      return;
    }

    if (!file) {
      setErr("Selecione ou capture uma imagem.");
      return;
    }

    if (!form.title.trim()) {
      setErr("Informe um título.");
      return;
    }

    try {
      setUploading(true);
      const fileName = `${Date.now()}-${file.name}`;
      const storageRef = ref(storage, `gallery/${fileName}`);
      await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(storageRef);

      const colRef = collection(db, "gallery");
      await addDoc(colRef, {
        title: form.title.trim(),
        description: form.description.trim(),
        category: form.category || "Outros",
        imageUrl: downloadURL,
        createdAt: serverTimestamp(),
      });

      setForm({
        title: "",
        description: "",
        category: form.category,
      });
      setFile(null);
      e.target.reset && e.target.reset();
    } catch {
      setErr("Erro ao enviar imagem.");
    } finally {
      setUploading(false);
    }
  }

  const page = {
    minHeight: "calc(100svh - 56px)",
    padding: "16px 16px 80px 16px",
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

  const mainPanel = {
    ...panelBase,
    overflow: "hidden",
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

  const errorBox = {
    background: "#fef2f2",
    borderRadius: 8,
    border: "1px solid #fecaca",
    color: "#991b1b",
    padding: 10,
    fontSize: 13,
    marginBottom: 12,
  };

  const uploadSection = {
    background: "#f8fafc",
    borderRadius: 12,
    border: "1px solid #e2e8f0",
    padding: 16,
    marginBottom: 24,
  };

  const sectionTitle = {
    fontSize: 16,
    fontWeight: 600,
    color: "#0f172a",
    marginBottom: 12,
  };

  const fieldRow = {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 12,
    marginBottom: 12,
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
    borderRadius: 8,
    border: "1px solid #cbd5e1",
    padding: "8px 12px",
    fontSize: 14,
    outline: "none",
    background: "#ffffff",
  };

  const textarea = {
    ...input,
    minHeight: 80,
    resize: "vertical",
  };

  const select = {
    ...input,
  };

  const fileInput = {
    width: "100%",
    fontSize: 13,
    marginTop: 4,
  };

  const uploadBtn = {
    marginTop: 12,
    padding: "10px 20px",
    borderRadius: 999,
    border: "none",
    cursor: uploading ? "not-allowed" : "pointer",
    fontWeight: 600,
    fontSize: 14,
    background: "#16a34a",
    color: "#ffffff",
    opacity: uploading ? 0.7 : 1,
  };

  const cameraBtn = {
    marginTop: 12,
    marginLeft: 12,
    padding: "10px 20px",
    borderRadius: 999,
    border: "none",
    cursor: "pointer",
    fontWeight: 600,
    fontSize: 14,
    background: "#2563eb",
    color: "#ffffff",
  };

  const galleryHeader = {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 16,
  };

  const filterSelect = {
    borderRadius: 999,
    border: "1px solid #cbd5e1",
    padding: "6px 16px",
    fontSize: 13,
    background: "#ffffff",
    cursor: "pointer",
  };

  const grid = {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
    gap: 16,
  };

  const card = {
    background: "#ffffff",
    borderRadius: 12,
    overflow: "hidden",
    border: "1px solid #e5e7eb",
    boxShadow: "0 4px 6px rgba(15,23,42,0.05)",
    cursor: "pointer",
    display: "flex",
    flexDirection: "column",
    transition: "transform 0.2s",
  };

  const imgBox = {
    width: "100%",
    height: 160,
    objectFit: "cover",
    display: "block",
    background: "#f1f5f9",
  };

  const cardBody = {
    padding: 12,
  };

  const cardTitleStyle = {
    fontSize: 14,
    fontWeight: 600,
    color: "#0f172a",
    marginBottom: 4,
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  };

  const cardCat = {
    fontSize: 11,
    color: "#0f766e",
    textTransform: "uppercase",
    fontWeight: 600,
  };

  const empty = {
    textAlign: "center",
    padding: 24,
    color: "#64748b",
    fontSize: 14,
    background: "#f8fafc",
    borderRadius: 12,
    border: "1px dashed #cbd5e1",
  };

  const modalBackdrop = {
    position: "fixed",
    inset: 0,
    background: "rgba(15,23,42,0.8)",
    display: "grid",
    placeItems: "center",
    zIndex: 9999,
    padding: 16,
  };

  const modalBox = {
    background: "#ffffff",
    borderRadius: 16,
    maxWidth: 900,
    width: "100%",
    maxHeight: "90vh",
    overflow: "hidden",
    boxShadow:
      "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)",
    display: "grid",
    gridTemplateColumns: "minmax(0, 1.5fr) minmax(0, 1fr)",
  };

  const modalImgWrap = {
    background: "#0f172a",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  };

  const modalImg = {
    width: "100%",
    height: "100%",
    maxHeight: "90vh",
    objectFit: "contain",
  };

  const modalContent = {
    padding: 24,
    display: "flex",
    flexDirection: "column",
    gap: 12,
    overflowY: "auto",
  };

  const modalClose = {
    alignSelf: "flex-end",
    border: "none",
    background: "transparent",
    fontSize: 24,
    cursor: "pointer",
    color: "#64748b",
    lineHeight: 1,
  };

  const modalTitleStyle = {
    fontSize: 20,
    fontWeight: 700,
    color: "#0f172a",
  };

  const modalDesc = {
    fontSize: 14,
    color: "#475569",
    lineHeight: 1.6,
  };
  return (
    <>
      <Nav />
      <main style={page}>
        <SideMenu claims={claims} />

        <section style={mainPanel}>
          <div>
            <h1 style={title}>Galeria de fotos</h1>
            <p style={subtitle}>
              Veja registros de eventos, atividades pedagógicas e momentos especiais da APAE – Pinhão.
            </p>

            {err && <div style={errorBox}>{err}</div>}

            {authReady && canEditGallery && (
              <div style={uploadSection}>
                <h3 style={sectionTitle}>Adicionar nova foto</h3>

                <form onSubmit={handleUpload}>
                  <div style={fieldRow}>
                    <div>
                      <label style={label}>Título da foto</label>
                      <input
                        style={input}
                        type="text"
                        value={form.title}
                        onChange={(e) =>
                          setForm((f) => ({ ...f, title: e.target.value }))
                        }
                        placeholder="Ex.: Festa Junina"
                      />
                    </div>

                    <div>
                      <label style={label}>Categoria</label>
                      <select
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

                  <div style={{ marginBottom: 12 }}>
                    <label style={label}>Descrição (opcional)</label>
                    <textarea
                      style={textarea}
                      value={form.description}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, description: e.target.value }))
                      }
                      placeholder="Detalhes sobre a foto..."
                    />
                  </div>

                  <div style={{ marginBottom: 12 }}>
                    <label style={label}>Imagem</label>
                    <input
                      type="file"
                      accept="image/*"
                      style={fileInput}
                      onChange={(e) => setFile(e.target.files?.[0] || null)}
                    />
                  </div>

                  <div style={{ display: "flex", alignItems: "center" }}>
                    <button type="submit" style={uploadBtn} disabled={uploading}>
                      {uploading ? "Enviando..." : "Enviar foto"}
                    </button>

                    <button
                      type="button"
                      style={cameraBtn}
                      onClick={() => setShowCamera(true)}
                    >
                      Tirar foto
                    </button>
                  </div>
                </form>
              </div>
            )}

            <div style={galleryHeader}>
              <h2 style={{ ...sectionTitle, marginBottom: 0 }}>Fotos cadastradas</h2>

              <div>
                <label
                  style={{ fontSize: 13, color: "#64748b", marginRight: 8 }}
                >
                  Filtrar:
                </label>
                <select
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
              <div style={empty}>Carregando fotos...</div>
            ) : filteredItems.length === 0 ? (
              <div style={empty}>Nenhuma foto encontrada.</div>
            ) : (
              <div style={grid}>
                {filteredItems.map((it) => (
                  <article
                    key={it.id}
                    style={card}
                    onClick={() => it.imageUrl && setZoomItem(it)}
                  >
                      <img
                        src={it.imageUrl || "/images/imagem-erro.jpeg"}
                        alt={it.title}
                        style={imgBox}
                        onError={(e) => {
                          e.currentTarget.src = "/images/imagem-erro.jpeg";
                          e.currentTarget.onerror = null;
                        }}
                      />

                    <div style={cardBody}>
                      <div style={cardTitleStyle} title={it.title}>
                        {it.title || "Sem título"}
                      </div>
                      <div style={cardCat}>{it.category || "Geral"}</div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        </section>

        {zoomItem && (
          <div style={modalBackdrop} onClick={() => setZoomItem(null)}>
            <div style={modalBox} onClick={(e) => e.stopPropagation()}>
              <div style={modalImgWrap}>
                <img
                  src={zoomItem.imageUrl}
                  alt={zoomItem.title}
                  style={modalImg}
                  onError={(e) => {
                    e.currentTarget.src = "/images/imagem-erro.jpeg";
                    e.currentTarget.onerror = null;
                  }}
                />
              </div>

              <div style={modalContent}>
                <button
                  type="button"
                  style={modalClose}
                  onClick={() => setZoomItem(null)}
                >
                  ×
                </button>

                <div>
                  <h3 style={modalTitleStyle}>{zoomItem.title}</h3>

                  {zoomItem.category && (
                    <span
                      style={{
                        fontSize: 12,
                        textTransform: "uppercase",
                        color: "#0f766e",
                        fontWeight: 600,
                        marginTop: 4,
                        display: "block",
                      }}
                    >
                      {zoomItem.category}
                    </span>
                  )}
                </div>

                {zoomItem.description && (
                  <p style={modalDesc}>{zoomItem.description}</p>
                )}
              </div>
            </div>
          </div>
        )}

        {showCamera && (
          <div style={modalBackdrop}>
            <div
              style={{
                background: "#ffffff",
                borderRadius: 16,
                width: "100%",
                maxWidth: 500,
                padding: 20,
                display: "flex",
                flexDirection: "column",
                gap: 16,
              }}
            >
              <video
                ref={videoRef}
                autoPlay
                playsInline
                style={{
                  width: "100%",
                  borderRadius: 12,
                  background: "#000",
                }}
              />

              <canvas ref={canvasRef} style={{ display: "none" }} />

              <div style={{ display: "flex", gap: 12 }}>
                <button
                  style={{
                    flex: 1,
                    padding: "12px",
                    background: "#2563eb",
                    color: "#fff",
                    borderRadius: 8,
                    border: "none",
                    fontWeight: 600,
                  }}
                  onClick={capturePhoto}
                >
                  Capturar
                </button>

                <button
                  style={{
                    flex: 1,
                    padding: "12px",
                    background: "#aaa",
                    color: "#fff",
                    borderRadius: 8,
                    border: "none",
                  }}
                  onClick={handleCloseCamera}
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </>
  );
}
