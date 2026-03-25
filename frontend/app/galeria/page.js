// =============================================================================
// galeria/page.js — Galeria de fotos da APAE
// =============================================================================

"use client";

import { useEffect, useState, useMemo, useRef } from "react";
import Nav from "../../components/Nav";
import SideMenu from "../../components/SideMenu";
import { auth, db } from "../../lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";
import { compressImage } from "../../lib/compressImage";

const CATEGORY_OPTIONS = [
  "Eventos",
  "Estrutura",
  "Horta",
  "Atividades pedagógicas",
  "Confraternizações",
  "Outros",
];

export default function GaleriaPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [success, setSuccess] = useState("");

  const [user, setUser] = useState(null);
  const [claims, setClaims] = useState(null);
  const [authReady, setAuthReady] = useState(false);

  const [filterCategory, setFilterCategory] = useState("todos");
  const [zoomItem, setZoomItem] = useState(null);

  const [form, setForm] = useState({ title: "", description: "", category: "Eventos" });
  const [file, setFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const [fileInputKey, setFileInputKey] = useState(0);
  const [uploading, setUploading] = useState(false);

  const [showCamera, setShowCamera] = useState(false);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

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
  const showSidebar = !isMobile && !!claims;

  useEffect(() => {
    try {
      const colRef = collection(db, "gallery");
      const q = query(colRef, orderBy("createdAt", "desc"));
      const unsub = onSnapshot(
        q,
        (snap) => {
          setItems(snap.docs.map((doc) => {
            const d = doc.data();
            return {
              id: doc.id,
              title: d.title || "",
              description: d.description || "",
              category: d.category || "Outros",
              imageUrl: d.imageUrl || "",
              createdAt: d.createdAt?.toDate ? d.createdAt.toDate() : null,
            };
          }));
          setLoading(false);
        },
        () => {
          setErr("Não foi possível carregar a galeria.");
          setLoading(false);
        }
      );
      return () => unsub();
    } catch {
      setErr("Falha ao conectar à galeria.");
      setLoading(false);
    }
  }, []);

  const categoriesFromData = useMemo(() => {
    const set = new Set();
    items.forEach((it) => { if (it.category) set.add(it.category); });
    return Array.from(set);
  }, [items]);

  const filteredItems = useMemo(() => {
    if (filterCategory === "todos") return items;
    return items.filter((it) => it.category === filterCategory);
  }, [items, filterCategory]);

  // Camera — inicia quando showCamera muda para true
  useEffect(() => {
    if (!showCamera) return;
    let localStream = null;

    const start = async () => {
      try {
        const video = videoRef.current;
        if (!video) return;
        try {
          localStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: "environment" } } });
        } catch {
          localStream = await navigator.mediaDevices.getUserMedia({ video: true });
        }
        video.srcObject = localStream;
        await new Promise((res) => { video.onloadedmetadata = () => video.play().then(res); });
      } catch {
        setErr("Não foi possível acessar a câmera.");
        setShowCamera(false);
      }
    };

    start();
    return () => {
      if (localStream) localStream.getTracks().forEach((t) => t.stop());
    };
  }, [showCamera]);

  const capturePhoto = () => {
    const video = videoRef.current;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext("2d").drawImage(video, 0, 0);
    canvas.toBlob((blob) => {
      if (!blob) { setErr("Falha ao capturar imagem."); return; }
      const photoFile = new File([blob], "foto.jpg", { type: "image/jpeg" });
      setFile(photoFile);
      setFilePreview(URL.createObjectURL(photoFile));
      setShowCamera(false);
    }, "image/jpeg", 0.7);
  };

  async function handleUpload(e) {
    e.preventDefault();
    setErr("");
    setSuccess("");

    if (!file) { setErr("Selecione ou capture uma imagem."); return; }
    if (!form.title.trim()) { setErr("Informe um título para a foto."); return; }

    try {
      setUploading(true);
      const compressed = await compressImage(file);
      const token = user ? await user.getIdToken() : null;
      const formData = new FormData();
      formData.append("image", compressed);

      const uploadRes = await fetch("/api/upload", {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      });

      if (!uploadRes.ok) throw new Error("Falha no upload da imagem.");
      const { imageUrl } = await uploadRes.json();

      await addDoc(collection(db, "gallery"), {
        title: form.title.trim(),
        description: form.description.trim(),
        category: form.category || "Outros",
        imageUrl,
        createdAt: serverTimestamp(),
      });

      setForm({ title: "", description: "", category: form.category });
      setFile(null);
      setFilePreview(null);
      setFileInputKey((k) => k + 1);
      setSuccess("Foto adicionada com sucesso!");
      setTimeout(() => setSuccess(""), 4000);
    } catch {
      setErr("Erro ao enviar imagem. Tente novamente.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <>
      <Nav />
      <div className="min-h-screen bg-slate-50 pb-20">
        <div className={`max-w-[1120px] mx-auto px-4 pt-6 ${showSidebar ? "md:grid md:grid-cols-[260px_1fr] md:gap-4" : ""}`}>
          {showSidebar && <SideMenu claims={claims} />}

          <main className="flex flex-col gap-5 min-w-0">
            {/* Header */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
              <h1 className="text-2xl font-bold text-slate-900 mb-1">Galeria de fotos</h1>
              <p className="text-slate-500 text-sm">Registros de eventos, atividades e momentos especiais da APAE – Pinhão.</p>
            </div>

            {/* Mensagens */}
            {err && (
              <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm font-medium flex items-center justify-between gap-3">
                {err}
                <button onClick={() => setErr("")} className="text-red-400 hover:text-red-600 font-bold text-lg leading-none">×</button>
              </div>
            )}
            {success && (
              <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl px-4 py-3 text-sm font-medium flex items-center gap-2">
                <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                {success}
              </div>
            )}

            {/* Upload form */}
            {authReady && canEditGallery && (
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
                <h2 className="text-base font-bold text-slate-800 mb-4 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-600 text-xs flex items-center justify-center font-bold">+</span>
                  Adicionar nova foto
                </h2>

                <form onSubmit={handleUpload} className="flex flex-col gap-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1">
                      <label className="text-xs font-semibold text-slate-600">Título <span className="text-red-400">*</span></label>
                      <input
                        type="text"
                        value={form.title}
                        onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                        placeholder="Ex.: Festa Junina 2025"
                        className="px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                      />
                    </div>

                    <div className="flex flex-col gap-1">
                      <label className="text-xs font-semibold text-slate-600">Categoria</label>
                      <select
                        value={form.category}
                        onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                        className="px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all bg-white"
                      >
                        {CATEGORY_OPTIONS.map((cat) => (
                          <option key={cat} value={cat}>{cat}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-semibold text-slate-600">Descrição <span className="text-slate-400 font-normal">(opcional)</span></label>
                    <textarea
                      value={form.description}
                      onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                      placeholder="Detalhes sobre a foto..."
                      rows={2}
                      className="px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all resize-none"
                    />
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-semibold text-slate-600">Imagem <span className="text-red-400">*</span></label>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <input
                        key={fileInputKey}
                        id="gallery-file-input"
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const f = e.target.files?.[0] || null;
                          setFile(f);
                          setFilePreview(f ? URL.createObjectURL(f) : null);
                        }}
                        className="hidden"
                      />
                      <label
                        htmlFor="gallery-file-input"
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-full border border-dashed border-slate-300 bg-slate-50 text-slate-600 text-xs font-semibold hover:bg-emerald-50 hover:border-emerald-400 hover:text-emerald-700 transition-colors cursor-pointer select-none"
                      >
                        🖼️ Selecionar imagem
                      </label>
                      <button
                        type="button"
                        onClick={() => setShowCamera(true)}
                        className="flex items-center justify-center gap-2 px-4 py-2 rounded-full bg-blue-50 text-blue-600 text-xs font-bold hover:bg-blue-100 transition-colors whitespace-nowrap cursor-pointer"
                      >
                        📷 Tirar foto
                      </button>
                    </div>

                    {filePreview && (
                      <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200 mt-1">
                        <img
                          src={filePreview}
                          alt="Pré-visualização"
                          className="w-16 h-16 object-cover rounded-lg border border-slate-200 shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-slate-700 truncate">{file?.name}</p>
                          <p className="text-xs text-slate-400 mt-0.5">{file ? (file.size / 1024).toFixed(0) + " KB" : ""}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => { setFile(null); setFilePreview(null); setFileInputKey((k) => k + 1); }}
                          className="w-7 h-7 rounded-full bg-slate-200 hover:bg-red-100 hover:text-red-600 flex items-center justify-center text-slate-500 text-sm font-bold transition-colors shrink-0"
                        >
                          ×
                        </button>
                      </div>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={uploading}
                    className="w-full sm:w-auto self-start px-6 py-2.5 rounded-full bg-emerald-600 text-white text-sm font-bold shadow-lg shadow-emerald-500/20 hover:bg-emerald-700 transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {uploading ? (
                      <>
                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Enviando...
                      </>
                    ) : "Enviar foto"}
                  </button>
                </form>
              </div>
            )}

            {/* Galeria */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
                <h2 className="text-base font-bold text-slate-800">
                  Fotos cadastradas
                  {!loading && <span className="ml-2 text-xs font-normal text-slate-400">({filteredItems.length})</span>}
                </h2>
                <select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  className="px-4 py-2 rounded-full border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                >
                  <option value="todos">Todas as categorias</option>
                  {categoriesFromData.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              {loading ? (
                <div className="flex flex-col items-center justify-center py-16 gap-3">
                  <div className="w-8 h-8 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin" />
                  <p className="text-slate-400 text-sm">Carregando fotos...</p>
                </div>
              ) : filteredItems.length === 0 ? (
                <div className="text-center py-16 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                  <p className="text-slate-400 text-sm">Nenhuma foto encontrada.</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                  {filteredItems.map((it) => (
                    <article
                      key={it.id}
                      onClick={() => it.imageUrl && setZoomItem(it)}
                      className="group relative rounded-xl overflow-hidden border border-slate-100 shadow-sm cursor-pointer hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 bg-slate-50"
                    >
                      <div className="aspect-square">
                        <img
                          src={it.imageUrl || "/images/imagem-erro.webp"}
                          alt={it.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          onError={(e) => { e.currentTarget.src = "/images/imagem-erro.webp"; e.currentTarget.onerror = null; }}
                        />
                      </div>
                      <div className="p-2.5">
                        <p className="text-xs font-semibold text-slate-800 truncate">{it.title || "Sem título"}</p>
                        <p className="text-[10px] text-teal-600 font-bold uppercase tracking-wide mt-0.5 truncate">{it.category}</p>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </div>
          </main>
        </div>
      </div>

      {/* Modal zoom */}
      {zoomItem && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setZoomItem(null)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col sm:flex-row"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-slate-900 flex items-center justify-center sm:w-[60%] min-h-[220px]">
              <img
                src={zoomItem.imageUrl}
                alt={zoomItem.title}
                className="w-full h-full max-h-[70vh] object-contain"
                onError={(e) => { e.currentTarget.src = "/images/imagem-erro.webp"; e.currentTarget.onerror = null; }}
              />
            </div>
            <div className="flex flex-col gap-3 p-5 sm:w-[40%] overflow-y-auto">
              <button
                onClick={() => setZoomItem(null)}
                className="self-end w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 font-bold transition-colors"
              >
                ×
              </button>
              <div>
                <h3 className="text-lg font-bold text-slate-900">{zoomItem.title}</h3>
                {zoomItem.category && (
                  <span className="text-xs text-teal-600 font-bold uppercase tracking-wide mt-1 block">{zoomItem.category}</span>
                )}
              </div>
              {zoomItem.description && (
                <p className="text-sm text-slate-500 leading-relaxed">{zoomItem.description}</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal câmera */}
      {showCamera && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-5 flex flex-col gap-4">
            <h3 className="text-base font-bold text-slate-800">Tirar foto</h3>
            <div className="relative w-full aspect-video bg-black rounded-xl overflow-hidden">
              <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
            </div>
            <canvas ref={canvasRef} className="hidden" />
            <div className="flex gap-3">
              <button
                type="button"
                onClick={capturePhoto}
                className="flex-1 py-2.5 rounded-full bg-emerald-600 text-white text-sm font-bold hover:bg-emerald-700 transition-all"
              >
                Capturar
              </button>
              <button
                type="button"
                onClick={() => setShowCamera(false)}
                className="flex-1 py-2.5 rounded-full bg-slate-200 text-slate-700 text-sm font-bold hover:bg-slate-300 transition-all"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
