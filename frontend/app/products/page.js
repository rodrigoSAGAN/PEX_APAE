"use client";

import { useEffect, useState, useRef } from "react";
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

  const [showCamera, setShowCamera] = useState(false);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [stream, setStream] = useState(null);
  const [readyToPersist, setReadyToPersist] = useState(false);

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
    } finally {
      setReadyToPersist(true);
    }
  }, []);

  useEffect(() => {
    if (!readyToPersist) return;
    try {
      localStorage.setItem("portal-apae-cart", JSON.stringify(cart));
    } catch (e) {
      console.warn(
        "[products] não foi possível salvar o carrinho no localStorage:",
        e
      );
    }
  }, [cart, readyToPersist]);

  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [stream]);

  function addToCart(product) {
    if (claims) {
      showModal("Faça logout para realizar compras.", "Acesso Restrito");
      return;
    }

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

  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const checkSize = () => setIsMobile(window.innerWidth < 768);
    checkSize();
    window.addEventListener("resize", checkSize);
    return () => window.removeEventListener("resize", checkSize);
  }, []);

  const showSidebar = !isMobile && claims;

  function handleQuickAdd(product) {
    if (claims) {
      showModal("Faça logout para realizar compras.", "Acesso Restrito");
      return;
    }

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
  }

  function handleDecrease(product) {
    if (claims) {
      showModal("Faça logout para realizar compras.", "Acesso Restrito");
      return;
    }

    const currentQ = cart[product.id] || 0;
    if (currentQ <= 0) return;

    const newQ = currentQ - 1;
    let newCart;

    if (newQ === 0) {
      newCart = { ...cart };
      delete newCart[product.id];
    } else {
      newCart = { ...cart, [product.id]: newQ };
    }

    setCart(newCart);
    localStorage.setItem("portal-apae-cart", JSON.stringify(newCart));
  }

  async function startCamera() {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        showModal("Seu navegador não suporta acesso à câmera.", "Erro");
        return;
      }

      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = devices.filter((device) => device.kind === "videoinput");
        if (videoDevices.length === 0) {
          showModal("Nenhuma câmera encontrada neste dispositivo.", "Aviso");
          return;
        }
      } catch (e) {
        console.warn("Erro ao listar dispositivos:", e);
      }

      let mediaStream;
      try {
        mediaStream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: "environment" } },
        });
      } catch (err) {
        console.warn("Falha ao abrir câmera com facingMode ideal, tentando fallback...", err);
        mediaStream = await navigator.mediaDevices.getUserMedia({
          video: true,
        });
      }

      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      setShowCamera(true);
    } catch (err) {
      console.error("Erro ao acessar câmera:", err);
      let msg = "Não foi possível acessar a câmera.";

      if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
        msg = "Permissão de câmera negada. Verifique as configurações do seu navegador.";
      } else if (err.name === "NotFoundError" || err.name === "DevicesNotFoundError") {
        msg = "Nenhuma câmera encontrada.";
      } else if (err.message) {
        msg = err.message;
      }

      showModal(msg, "Erro");
    }
  }

  function stopCamera() {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
    setShowCamera(false);
  }

  function capturePhoto() {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext("2d");

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      context.drawImage(video, 0, 0, canvas.width, canvas.height);

      canvas.toBlob((blob) => {
        if (blob) {
          const file = new File([blob], `camera_capture_${Date.now()}.jpg`, {
            type: "image/jpeg",
          });
          setImageFile(file);
          setImagePreview(URL.createObjectURL(file));
          stopCamera();
        } else {
          showModal("Falha ao processar a imagem capturada.", "Erro");
        }
      }, "image/jpeg", 0.4);
    }
  }

  return (
    <>
      <Nav />
      <div
        className={`min-h-screen ${showSidebar
          ? "grid grid-cols-[260px_1fr] gap-6 max-w-[1400px] mx-auto px-6 pt-8 pb-[80px]"
          : "max-w-7xl mx-auto px-6 pt-12 pb-[80px]"
          }`}
      >
        {showSidebar && <SideMenu claims={claims} />}

        <main className="w-full">
          <div className="bg-white/80 backdrop-blur-md rounded-3xl shadow-xl border border-slate-100 p-8">
            <h2 className="text-3xl font-bold text-slate-900 text-center mb-8">
              Produtos
            </h2>

            <div className="flex flex-wrap items-center justify-between gap-4 mb-8 bg-slate-50 p-4 rounded-2xl border border-slate-100">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full sm:w-auto">
                <span className="text-sm font-semibold text-slate-600">
                  Filtrar por classe:
                </span>
                <div className="flex gap-2 flex-wrap">
                  <button
                    onClick={() => setFilterClass("all")}
                    className={`px-5 py-2 rounded-full text-sm font-semibold transition-all shadow-sm ${
                      filterClass === "all"
                        ? "bg-emerald-500 text-white shadow-emerald-200"
                        : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 hover:border-emerald-300"
                    }`}
                  >
                    Todas
                  </button>
                  <button
                    onClick={() => setFilterClass("artigos")}
                    className={`px-5 py-2 rounded-full text-sm font-semibold transition-all shadow-sm ${
                      filterClass === "artigos"
                        ? "bg-emerald-500 text-white shadow-emerald-200"
                        : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 hover:border-emerald-300"
                    }`}
                  >
                    Artigos
                  </button>
                  <button
                    onClick={() => setFilterClass("cozinha")}
                    className={`px-5 py-2 rounded-full text-sm font-semibold transition-all shadow-sm ${
                      filterClass === "cozinha"
                        ? "bg-emerald-500 text-white shadow-emerald-200"
                        : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 hover:border-emerald-300"
                    }`}
                  >
                    Cozinha
                  </button>
                </div>
              </div>

              {!claims && (
                <div className="flex items-center gap-4">
                  <div className="text-sm text-slate-600">
                    Itens no carrinho:{" "}
                    <strong className="text-emerald-600 text-base ml-1">
                      {Object.values(cart).reduce((acc, n) => acc + n, 0)}
                    </strong>
                  </div>
                  <Link
                    href="/carrinho"
                    className="inline-flex items-center justify-center px-6 py-2.5 rounded-full bg-gradient-to-r from-blue-600 to-blue-700 text-white text-sm font-bold shadow-lg shadow-blue-500/30 hover:shadow-blue-500/40 hover:-translate-y-0.5 transition-all duration-300"
                  >
                    Ver carrinho
                  </Link>
                </div>
              )}
            </div>

            {canEdit && (
              <form
                onSubmit={handleSave}
                className="mb-10 bg-slate-50 rounded-2xl p-6 border border-slate-200 shadow-sm"
              >
                <div className="flex flex-wrap gap-4 items-center justify-center">
                  <input
                    placeholder="Nome"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    required
                    className="flex-1 min-w-[200px] px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                  />
                  <input
                    placeholder="Preço"
                    type="number"
                    step="0.01"
                    value={form.price}
                    onChange={(e) =>
                      setForm({ ...form, price: e.target.value })
                    }
                    required
                    className="w-32 px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                  />
                  <input
                    placeholder="Estoque"
                    type="number"
                    value={form.stock}
                    onChange={(e) =>
                      setForm({ ...form, stock: e.target.value })
                    }
                    required
                    className="w-32 px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                  />
                  <input
                    placeholder="Categoria (artigos, cozinha...)"
                    value={form.category}
                    onChange={(e) =>
                      setForm({ ...form, category: e.target.value })
                    }
                    className="flex-1 min-w-[200px] px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                  />

                  <div className="relative group w-full flex flex-col gap-2">
                    <div className="flex gap-2 items-end">
                      <div className="flex-1">
                        <label className="block text-xs font-semibold text-slate-500 mb-1 ml-2">
                          Imagem do Produto
                        </label>
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
                          className="block w-full text-xs text-slate-500
                            file:mr-4 file:py-2 file:px-4
                            file:rounded-full file:border-0
                            file:text-xs file:font-semibold
                            file:bg-emerald-50 file:text-emerald-700
                            hover:file:bg-emerald-100 cursor-pointer"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={startCamera}
                        className="px-4 py-2 rounded-full bg-blue-50 text-blue-600 text-xs font-bold hover:bg-blue-100 transition-colors h-[34px] flex items-center gap-2"
                      >
                        <span>📷</span> Tirar foto
                      </button>
                    </div>

                    {showCamera && (
                      <div className="mt-4 p-4 bg-slate-100 rounded-xl border border-slate-200 flex flex-col items-center gap-4">
                        <div className="relative w-full max-w-sm aspect-video bg-black rounded-lg overflow-hidden">
                          <video
                            ref={videoRef}
                            autoPlay
                            playsInline
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <canvas ref={canvasRef} className="hidden" />
                        <div className="flex gap-3">
                          <button
                            type="button"
                            onClick={capturePhoto}
                            className="px-6 py-2 rounded-full bg-emerald-600 text-white text-sm font-bold shadow-md hover:bg-emerald-700 transition-all"
                          >
                            Capturar
                          </button>
                          <button
                            type="button"
                            onClick={stopCamera}
                            className="px-6 py-2 rounded-full bg-slate-400 text-white text-sm font-bold hover:bg-slate-500 transition-all"
                          >
                            Cancelar
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  <button
                    type="submit"
                    className="px-6 py-2.5 rounded-full bg-emerald-600 text-white text-sm font-bold shadow-lg shadow-emerald-500/20 hover:bg-emerald-700 hover:shadow-emerald-500/30 hover:-translate-y-0.5 transition-all duration-300"
                  >
                    {editing ? "Salvar Alterações" : "Adicionar Produto"}
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
                        stopCamera();
                      }}
                      className="px-6 py-2.5 rounded-full bg-slate-400 text-white text-sm font-bold hover:bg-slate-500 transition-all duration-300"
                    >
                      Cancelar
                    </button>
                  )}
                </div>

                {imagePreview && (
                  <div className="mt-4 text-center">
                    <p className="text-xs text-slate-500 mb-2">
                      Pré-visualização:
                    </p>
                    <img
                      src={imagePreview}
                      alt="Pré-visualização"
                      className="w-24 h-24 object-cover rounded-xl border border-slate-200 mx-auto shadow-sm"
                      onError={(e) => {
                        e.currentTarget.src = "/images/imagem-erro.jpeg";
                        e.currentTarget.onerror = null;
                      }}
                    />
                  </div>
                )}
              </form>
            )}

            {loading && (
              <div className="flex flex-col items-center justify-center py-20">
                <div className="w-10 h-10 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin mb-4"></div>
                <p className="text-slate-500 font-medium">
                  Carregando produtos...
                </p>
              </div>
            )}

            {err && (
              <div className="p-4 bg-red-50 text-red-600 rounded-xl text-center border border-red-100 mb-8">
                {err}
              </div>
            )}

            {!loading && !err && items.length === 0 && (
              <div className="text-center py-20 bg-slate-50 rounded-2xl border border-slate-100 border-dashed">
                <p className="text-slate-500 text-lg">
                  Nenhum produto cadastrado ainda.
                </p>
              </div>
            )}

            {!loading && !err && items.length > 0 && filteredItems.length === 0 && (
              <div className="text-center py-20 bg-slate-50 rounded-2xl border border-slate-100 border-dashed">
                <p className="text-slate-500 text-lg">
                  Nenhum produto encontrado nesta categoria.
                </p>
              </div>
            )}

            {filteredItems.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
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
                    stockNumber !== null &&
                    (stockNumber <= 0 || available <= 0);

                  return (
                    <div
                      key={p.id}
                      className="group bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col overflow-hidden"
                    >
                      <div className="relative w-full pt-[75%] bg-slate-50 overflow-hidden">
                        <img
                          src={p.imageUrl || "/images/imagem-erro.jpeg"}
                          alt={p.name || p.title || "Produto"}
                          className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                          onError={(e) => {
                            e.currentTarget.src = "/images/imagem-erro.jpeg";
                            e.currentTarget.onerror = null;
                          }}
                        />

                        <div className="absolute top-3 right-3 z-10">
                          <span
                            className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider shadow-sm ${p.active === false
                              ? "bg-red-100 text-red-700 border border-red-200"
                              : "bg-emerald-100 text-emerald-700 border border-emerald-200"
                              }`}
                          >
                            {p.active === false ? "Inativo" : "Ativo"}
                          </span>
                        </div>

                        {qtyInCart > 0 && !claims && (
                          <div className="absolute top-3 left-3 z-10 animate-in fade-in zoom-in duration-300">
                            <span className="bg-emerald-500 text-white text-xs font-bold px-2.5 py-1 rounded-full shadow-md flex items-center gap-1">
                              {qtyInCart}
                            </span>
                          </div>
                        )}

                        {!isOutOfStock && !claims && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleQuickAdd(p);
                            }}
                            className="absolute bottom-3 right-3 bg-emerald-600 hover:bg-emerald-700 text-white w-10 h-10 rounded-full grid place-items-center shadow-lg transition-transform active:scale-90 z-10"
                            title="Adicionar 1 unidade"
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              width="20"
                              height="20"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="3"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <line x1="12" y1="5" x2="12" y2="19"></line>
                              <line x1="5" y1="12" x2="19" y2="12"></line>
                            </svg>
                          </button>
                        )}
                      </div>

                      <div className="p-5 flex flex-col gap-4 flex-1">
                        <div>
                          <div className="flex justify-between items-start gap-2 mb-1">
                            <h3
                              className="font-bold text-slate-900 text-base leading-tight line-clamp-2"
                              title={p.name || p.title}
                            >
                              {p.name || p.title}
                            </h3>
                          </div>
                          <span className="inline-block px-2 py-0.5 rounded-md bg-blue-50 text-blue-600 text-[10px] font-bold uppercase tracking-wide border border-blue-100">
                            {p.category || "Geral"}
                          </span>
                        </div>

                        <div className="flex items-end justify-between mt-auto pt-2 border-t border-slate-50">
                          <div>
                            <p className="text-xs text-slate-500 mb-0.5">
                              Preço
                            </p>
                            <p className="text-xl font-extrabold text-emerald-600">
                              {price !== null ? `R$ ${price.toFixed(2)}` : "—"}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-slate-500 mb-0.5">
                              Estoque
                            </p>
                            <p
                              className={`text-sm font-bold ${stockNumber !== null && stockNumber > 0
                                ? "text-slate-700"
                                : "text-red-500"
                                }`}
                            >
                              {stockNumber !== null
                                ? `${stockNumber} un.`
                                : "N/A"}
                            </p>
                          </div>
                        </div>

                        <div className="flex flex-col gap-3 mt-2">
                          {!claims && (
                            <>
                              {isOutOfStock ? (
                                <button
                                  disabled
                                  className="w-full py-2.5 rounded-xl bg-slate-200 text-slate-500 font-bold text-sm cursor-not-allowed"
                                >
                                  Esgotado
                                </button>
                              ) : (
                                <div className="grid grid-cols-2 gap-2">
                                  {qtyInCart > 0 ? (
                                    <div className="flex items-center justify-between bg-slate-50 rounded-xl border border-slate-200 px-1">
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleDecrease(p);
                                        }}
                                        className="w-8 h-full grid place-items-center text-amber-700 hover:bg-slate-100 rounded-l-md transition-colors"
                                      >
                                        -
                                      </button>
                                      <span className="text-sm font-bold text-slate-800">
                                        {qtyInCart}
                                      </span>
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleQuickAdd(p);
                                        }}
                                        className="w-8 h-full grid place-items-center text-emerald-700 hover:bg-slate-100 rounded-r-md transition-colors"
                                      >
                                        +
                                      </button>
                                    </div>
                                  ) : (
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleQuickAdd(p);
                                        showModal(
                                          "Produto adicionado ao carrinho!",
                                          "Sucesso"
                                        );
                                      }}
                                      className="py-2.5 rounded-xl bg-white border border-slate-200 text-slate-700 font-bold text-sm hover:bg-slate-50 hover:border-slate-300 transition-colors"
                                    >
                                      + Carrinho
                                    </button>
                                  )}

                                  <button
                                    type="button"
                                    onClick={() => addToCart(p)}
                                    className="py-2.5 rounded-xl bg-emerald-600 text-white font-bold text-sm shadow-md shadow-emerald-200 hover:bg-emerald-700 hover:shadow-lg hover:-translate-y-0.5 transition-all"
                                  >
                                    Comprar
                                  </button>
                                </div>
                              )}
                            </>
                          )}

                          {canEdit && (
                            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                              <button
                                type="button"
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
                                  window.scrollTo({
                                    top: 0,
                                    behavior: "smooth",
                                  });
                                }}
                                className="px-3 py-1.5 rounded-lg bg-blue-50 text-blue-600 text-xs font-bold hover:bg-blue-100 transition-colors"
                              >
                                Editar
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDelete(p.id)}
                                className="px-3 py-1.5 rounded-lg bg-red-50 text-red-600 text-xs font-bold hover:bg-red-100 transition-colors"
                              >
                                Excluir
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
          {Object.values(cart).reduce((acc, n) => acc + n, 0) > 0 && !claims && (
            <Link
              href="/carrinho"
              className="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-8 py-4 bg-emerald-600 text-white rounded-full shadow-2xl hover:bg-emerald-700 hover:scale-105 transition-all duration-300 font-bold text-lg animate-in slide-in-from-bottom-10 fade-in cursor-pointer group"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="group-hover:-translate-x-1 transition-transform"
              >
                <circle cx="8" cy="21" r="1" />
                <circle cx="19" cy="21" r="1" />
                <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12" />
              </svg>
              ver carrinho
            </Link>
          )}
        </main>
      </div>
    </>
  );
}
