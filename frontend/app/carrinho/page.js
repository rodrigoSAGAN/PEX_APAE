"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Nav from "../../components/Nav";
import { getIdTokenOrNull } from "../../lib/authToken";
import { useModal } from "../../components/ModalContext";

const DONATION_ITEMS = {
  "donation-10": {
    id: "donation-10",
    name: "Doação solidária - R$ 10,00",
    price: 10,
    category: "Doação",
    imageUrl: "/images/flor11.png",
  },
  "donation-30": {
    id: "donation-30",
    name: "Doação solidária - R$ 30,00",
    price: 30,
    category: "Doação",
    imageUrl: "/images/flor22.png",
  },
  "donation-100": {
    id: "donation-100",
    name: "Doação solidária - R$ 100,00",
    price: 100,
    category: "Doação",
    imageUrl: "/images/flor33.png",
  },
};

export default function CartPage() {
  const router = useRouter();
  const { showModal } = useModal();

  const [cartMap, setCartMap] = useState({});
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [readyToPersist, setReadyToPersist] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [showThanksModal, setShowThanksModal] = useState(false);
  const [pixData, setPixData] = useState(null);

  const API = "/api/products";

  useEffect(() => {
    try {
      const raw =
        typeof window !== "undefined"
          ? localStorage.getItem("portal-apae-cart")
          : null;

      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === "object") {
          setCartMap(parsed);
        }
      }
    } catch (e) {
      console.warn("[cart] erro ao ler localStorage:", e);
    } finally {
      setReadyToPersist(true);
    }
  }, []);

  useEffect(() => {
    if (!readyToPersist) return;
    try {
      if (typeof window !== "undefined") {
        localStorage.setItem("portal-apae-cart", JSON.stringify(cartMap));
      }
    } catch (e) {
      console.warn("[cart] erro ao salvar localStorage:", e);
    }
  }, [cartMap, readyToPersist]);

 
  useEffect(() => {
    async function load() {
      setErr("");
      setLoading(true);
      try {
        const ids = Object.keys(cartMap);

        if (ids.length === 0) {
          setItems([]);
          setLoading(false);
          return;
        }

        const res = await fetch(API, { cache: "no-store" });
        if (!res.ok) throw new Error("Falha ao buscar produtos");
        const data = await res.json();
        const allProducts = Array.isArray(data) ? data : [];

        const list = ids
          .map((id) => {
            const quantity = cartMap[id];

            
            if (id in DONATION_ITEMS) {
              const donationProduct = DONATION_ITEMS[id];
              return {
                product: donationProduct,
                quantity,
              };
            }

            const product = allProducts.find((p) => p.id === id);
            if (!product) return null;

            return {
              product,
              quantity,
            };
          })
          .filter(Boolean);

        setItems(list);
      } catch (e) {
        console.error("[cart] erro ao montar carrinho:", e);
        setErr("Não foi possível carregar o carrinho. Tente novamente.");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [cartMap]);

  function formatCurrency(value) {
    const num = Number(value) || 0;
    return num.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
  }

  const total = items.reduce((acc, item) => {
    const price = Number(item.product.price) || 0;
    return acc + price * item.quantity;
  }, 0);

  function removeFromCart(productId) {
    setCartMap((prev) => {
      const current = prev[productId] || 0;
      if (current <= 1) {
        const clone = { ...prev };
        delete clone[productId];
        return clone;
      }
      return { ...prev, [productId]: current - 1 };
    });
  }

  function addDonationToCart(donationId) {
    if (!(donationId in DONATION_ITEMS)) return;

    setCartMap((prev) => {
      const current = prev[donationId] || 0;
      return {
        ...prev,
        [donationId]: current + 1,
      };
    });
  }

  
  async function handleCopyPixCode() {
    
    const code =
      pixData?.qr_code || pixData?.copyPaste || pixData?.qrCode || "";

    if (!code) return;
    try {
      await navigator.clipboard.writeText(code);
      showModal("Código PIX copiado para a área de transferência!", "Sucesso");
    } catch (e) {
      console.error("Erro ao copiar código PIX:", e);
      showModal("Não foi possível copiar o código PIX, copie manualmente.", "Erro");
    }
  }

  const [pickupName, setPickupName] = useState("");
  const [whatsapp, setWhatsapp] = useState("");

  function handlePhoneChange(e) {
    let val = e.target.value.replace(/\D/g, "");
    if (val.length > 11) val = val.slice(0, 11);
    
    if (val.length > 2) {
      val = `(${val.slice(0, 2)}) ${val.slice(2)}`;
    }
    if (val.length > 9) {
      val = `${val.slice(0, 9)}-${val.slice(9)}`;
    }
    setWhatsapp(val);
  }

  async function handleCheckout() {
    try {
      setErr("");

      if (!items.length) {
        showModal("Seu carrinho está vazio.", "Aviso");
        return;
      }

      if (!total || Number.isNaN(total) || total <= 0) {
        showModal("Valor total do carrinho inválido.", "Erro");
        return;
      }

      if (!pickupName.trim()) {
        showModal("Por favor, informe o nome de quem vai retirar o pedido.", "Atenção");
        return;
      }

      if (whatsapp && whatsapp.replace(/\D/g, "").length < 11) {
        showModal("Por favor, informe um número de WhatsApp válido com DDD (11 dígitos).", "Atenção");
        return;
      }

      const token = await getIdTokenOrNull();
      
      setSubmitting(true);
      const orderItems = items.map(({ product, quantity }) => ({
        productId: product.id,
        name: product.name || product.title || "",
        price: Number(product.price) || 0,
        quantity,
        category: product.category || null,
      }));

      const payload = {
        items: orderItems,
        totalValue: total,
        pickupName: pickupName.trim(),
        phoneWhatsApp: whatsapp.replace(/\D/g, "") || null,
      };

      const headers = {
        "Content-Type": "application/json",
      };
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const res = await fetch("/api/orders", {
        method: "POST",
        headers,
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        let msg = "Falha ao registrar o pedido.";
        try {
          const data = await res.json();
          if (data?.message) msg = data.message;
        } catch (_) {
        }
        setErr(msg);
        showModal(msg, "Erro");
        return;
      }

      try {
        const pixRes = await fetch("/api/pix", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            
            amount: total,
            totalValue: total,
            description: "Pagamento Portal APAE – Pinhão",
          }),
        });

        if (!pixRes.ok) {
          let bodyText = "";
          try {
            bodyText = await pixRes.text();
          } catch {
            bodyText = "<sem corpo>";
          }
          console.error(
            "Erro ao criar PIX:",
            pixRes.status,
            pixRes.statusText,
            bodyText
          );
          alert(
            "Pedido registrado, mas houve um erro ao gerar o PIX. Tente novamente em instantes."
          );
          return;
        }

        const data = await pixRes.json();
        setPixData(data || null);
      } catch (e) {
        console.error("Erro ao chamar /api/pix:", e);
        alert(
          "Pedido registrado, mas não foi possível gerar o PIX agora. Tente novamente."
        );
        return;
      }

      setCartMap({});
      setShowThanksModal(true);
    } catch (e) {
      console.error("[cart] erro ao finalizar pedido:", e);
      setErr("Erro inesperado ao finalizar o pedido.");
      alert("Erro inesperado ao finalizar o pedido.");
    } finally {
      setSubmitting(false);
    }
  }

  function handleGoBackToStore() {
    setShowThanksModal(false);
    router.push("/products");
  }

  const pixQrBase64 =
    pixData?.qr_code_base64 || pixData?.qrCodeBase64 || null;

  const pixCopyCode =
    pixData?.qr_code || pixData?.copyPaste || pixData?.qrCode || "";

  const pixTicketUrl = pixData?.ticket_url || pixData?.ticketUrl || "";

  return (
    <>
      <Nav />
      <main className="min-h-[calc(100svh-56px)] max-w-5xl mx-auto px-6 pt-12 pb-[80px]">
        <h2 className="text-3xl font-bold text-slate-900 text-center mb-8">Carrinho de Compras</h2>

        {err && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-6 text-sm font-medium text-center">
            {err}
          </div>
        )}

        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="w-10 h-10 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin mb-4"></div>
              <p className="text-slate-500 font-medium">Carregando itens do carrinho...</p>
            </div>
          ) : items.length === 0 ? (
            <div className="text-center py-20 px-6">
              <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-10 h-10 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
              </div>
              <p className="text-slate-600 text-lg mb-6">
                Seu carrinho está vazio.
              </p>
              <button 
                onClick={() => router.push("/products")}
                className="inline-flex items-center justify-center px-8 py-3 rounded-full bg-emerald-600 text-white font-bold shadow-lg shadow-emerald-500/20 hover:bg-emerald-700 hover:shadow-emerald-500/30 hover:-translate-y-0.5 transition-all"
              >
                Voltar à Loja
              </button>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50 border-b border-slate-100">
                    <tr>
                      <th className="text-left py-4 px-6 text-sm font-bold text-slate-700 uppercase tracking-wider">Produto</th>
                      <th className="text-left py-4 px-6 text-sm font-bold text-slate-700 uppercase tracking-wider">Preço</th>
                      <th className="text-left py-4 px-6 text-sm font-bold text-slate-700 uppercase tracking-wider">Qtd.</th>
                      <th className="text-left py-4 px-6 text-sm font-bold text-slate-700 uppercase tracking-wider">Subtotal</th>
                      <th className="text-left py-4 px-6 text-sm font-bold text-slate-700 uppercase tracking-wider">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {items.map((item) => {
                      const p = item.product;
                      const price = Number(p.price) || 0;
                      const subtotal = price * item.quantity;

                      return (
                        <tr key={p.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="py-4 px-6">
                            <div className="flex items-center gap-4">
                              {p.imageUrl ? (
                                <img
                                  src={p.imageUrl}
                                  alt={p.name || p.title || "Produto"}
                                  className="w-14 h-14 rounded-lg object-cover border border-slate-200 shadow-sm"
                                />
                              ) : (
                                <div className="w-14 h-14 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400 text-xs border border-slate-200">
                                  —
                                </div>
                              )}
                              <div>
                                <div className="font-bold text-slate-900 text-sm md:text-base">
                                  {p.name || p.title}
                                </div>
                                <div className="text-xs text-slate-500 mt-0.5">
                                  {p.category || "Sem categoria"}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="py-4 px-6 text-sm font-medium text-slate-600">
                            {formatCurrency(price)}
                          </td>
                          <td className="py-4 px-6">
                            <span className="inline-flex items-center justify-center min-w-[2rem] h-8 px-2 rounded-lg bg-slate-100 text-slate-700 font-bold text-sm">
                              {item.quantity}
                            </span>
                          </td>
                          <td className="py-4 px-6 text-sm font-bold text-emerald-600">
                            {formatCurrency(subtotal)}
                          </td>
                          <td className="py-4 px-6">
                            <button
                              type="button"
                              onClick={() => removeFromCart(p.id)}
                              className="text-red-500 hover:text-red-700 font-semibold text-xs bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-lg transition-colors"
                            >
                              Remover
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="bg-slate-50 p-6 md:p-8 border-t border-slate-100">
                <div className="grid md:grid-cols-2 gap-8 items-start">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-1.5">
                        Nome de quem vai retirar <span className="text-red-500">*</span>
                      </label>
                      <input
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                        placeholder="Ex: João da Silva"
                        value={pickupName}
                        onChange={(e) => setPickupName(e.target.value)}
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-1.5">
                        WhatsApp para contato (opcional)
                      </label>
                      <input
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                        placeholder="(00) 00000-0000"
                        value={whatsapp}
                        onChange={handlePhoneChange}
                        maxLength={15}
                      />
                    </div>
                  </div>

                  <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-6">
                    <div className="flex justify-between items-center pb-4 border-b border-slate-100">
                      <span className="text-slate-600 font-medium">Total geral</span>
                      <span className="text-2xl font-extrabold text-emerald-600">{formatCurrency(total)}</span>
                    </div>

                    <button
                      type="button"
                      onClick={handleCheckout}
                      disabled={submitting}
                      className="w-full py-3.5 rounded-full bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-bold shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/30 hover:-translate-y-0.5 transition-all disabled:opacity-70 disabled:cursor-not-allowed disabled:shadow-none disabled:translate-y-0"
                    >
                      {submitting ? (
                        <span className="flex items-center justify-center gap-2">
                          <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                          Processando...
                        </span>
                      ) : (
                        "Finalizar Pedido com PIX"
                      )}
                    </button>
                    
                    <p className="text-xs text-center text-slate-400">
                      Ao finalizar, você receberá um QR Code para pagamento.
                    </p>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        <p className="text-xs text-center text-slate-400 mt-6">
          * O carrinho é salvo apenas neste navegador. Para adicionar ou remover
          itens, utilize esta tela ou a página de <strong className="text-slate-600">Produtos</strong>.
        </p>

        <section className="mt-16 mb-8">
          <div className="text-center mb-8">
            <h3 className="text-xl font-bold text-slate-900 mb-2">Apoie a APAE – Pinhão com uma doação</h3>
            <p className="text-slate-600 text-sm">
              Escolha um valor simbólico e adicione ao carrinho. Toda ajuda faz diferença 💛
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {Object.values(DONATION_ITEMS).map((item) => (
              <div key={item.id} className="group bg-white rounded-2xl border border-slate-100 shadow-sm p-4 flex flex-col items-center text-center hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                <div className="w-full aspect-[4/3] rounded-xl overflow-hidden mb-4 bg-yellow-50">
                  <img
                    src={item.imageUrl}
                    alt={item.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                </div>
                <div className="font-bold text-slate-900 mb-1">Doação solidária</div>
                <div className="text-2xl font-extrabold text-emerald-600 mb-4">
                  {formatCurrency(item.price)}
                </div>
                <button
                  type="button"
                  onClick={() => addDonationToCart(item.id)}
                  className="w-full py-2.5 rounded-full bg-yellow-400 text-yellow-950 font-bold text-sm shadow-md shadow-yellow-400/20 hover:bg-yellow-300 hover:shadow-yellow-400/30 transition-all"
                >
                  Adicionar Doação
                </button>
              </div>
            ))}
          </div>
        </section>

        {showThanksModal && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-zoom-in">
              <div className="p-6 text-center">
                <h3 className="text-xl font-bold text-slate-900 mb-2">Obrigado pelo seu apoio!</h3>
                <p className="text-slate-600 text-sm leading-relaxed mb-5">
                  Seu pedido foi registrado com sucesso. Para concluir o
                  pagamento, utilize o QR Code PIX ou o código copia-e-cola abaixo.
                </p>

                {pixQrBase64 && (
                  <div className="bg-white p-2 rounded-xl border border-slate-200 shadow-inner mb-4 inline-block">
                    <img
                      src={`data:image/png;base64,${pixQrBase64}`}
                      alt="QR Code PIX"
                      className="w-32 h-32 object-contain"
                    />
                  </div>
                )}

                {pixCopyCode && (
                  <div className="text-left bg-slate-50 rounded-xl p-3 border border-slate-200 mb-4">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 block">Código PIX (copia e cola):</span>
                    <textarea
                      readOnly
                      className="w-full h-12 bg-white border border-slate-200 rounded-lg p-2 text-[10px] text-slate-600 font-mono resize-none focus:outline-none mb-2"
                      value={pixCopyCode}
                    />
                    <button
                      type="button"
                      onClick={handleCopyPixCode}
                      className="w-full py-2 rounded-lg bg-yellow-400 text-yellow-950 font-bold text-xs hover:bg-yellow-300 transition-colors flex items-center justify-center gap-2"
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                      </svg>
                      Copiar código PIX
                    </button>
                  </div>
                )}

                <button
                  type="button"
                  onClick={handleGoBackToStore}
                  className="w-full py-3 rounded-full bg-slate-900 text-white font-bold shadow-lg hover:bg-slate-800 hover:-translate-y-0.5 transition-all text-sm"
                >
                  Voltar à loja
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </>
  );
}
