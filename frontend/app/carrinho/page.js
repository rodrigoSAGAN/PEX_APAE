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

  const page = {
    minHeight: "calc(100svh - 56px)",
    padding: 16,
    maxWidth: 960,
    margin: "0 auto",
    background: "#e6f3ff",
  };

  const h2 = {
    textAlign: "center",
    margin: "12px 0 16px 0",
    color: "#111827",
    fontSize: 26,
  };
  const note = {
    fontSize: 12,
    color: "#6b7280",
    textAlign: "center",
    marginTop: 10,
  };

  const card = {
    borderRadius: 16,
    border: "1px solid #e5e7eb",
    background: "#ffffff",
    boxShadow: "0 8px 22px rgba(15,23,42,0.06)",
    padding: 16,
  };

  const tableWrap = {
    borderRadius: 12,
    overflow: "hidden",
    border: "1px solid #e5e7eb",
  };

  const table = {
    width: "100%",
    borderCollapse: "separate",
    borderSpacing: 0,
  };

  const th = {
    textAlign: "left",
    padding: "10px 12px",
    background: "#f3f4f6",
    color: "#111827",
    fontWeight: 700,
    borderBottom: "1px solid #e5e7eb",
    fontSize: 14,
  };

  const td = {
    padding: "10px 12px",
    borderBottom: "1px solid #f1f5f9",
    color: "#4b5563",
    fontSize: 14,
    verticalAlign: "middle",
  };

  const rowAlt = { background: "#f9fafb" };

  const imgBox = {
    width: 56,
    height: 42,
    borderRadius: 8,
    objectFit: "cover",
    border: "1px solid #e5e7eb",
  };

  const totalBox = {
    marginTop: 16,
    paddingTop: 12,
    borderTop: "1px dashed #e5e7eb",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
    flexWrap: "wrap",
  };

  const totalLabel = {
    fontSize: 15,
    color: "#374151",
    marginRight: 8,
  };

  const totalValue = {
    fontSize: 18,
    fontWeight: 800,
    color: "#16a34a",
  };

  const empty = {
    textAlign: "center",
    color: "#6b7280",
    padding: 24,
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

  const btnRemove = {
    background: "#dc2626",
    color: "#fff",
    border: "none",
    borderRadius: 6,
    padding: "4px 10px",
    cursor: "pointer",
    fontSize: 13,
    fontWeight: 600,
  };

  const payBtn = {
    padding: "10px 18px",
    borderRadius: 999,
    border: "none",
    cursor: submitting ? "not-allowed" : "pointer",
    fontWeight: 700,
    fontSize: 14,
    background: "linear-gradient(135deg, #22c55e, #10b981)",
    color: "#ffffff",
    boxShadow: "0 8px 18px rgba(34,197,94,0.35)",
    opacity: submitting ? 0.7 : 1,
  };

  const inputStyle = {
    width: "100%",
    padding: "10px 12px",
    borderRadius: 8,
    border: "1px solid #d1d5db",
    fontSize: 14,
    marginBottom: 12,
  };

  const donationSection = {
    marginTop: 32,
  };

  const donationTitle = {
    fontSize: 18,
    fontWeight: 700,
    color: "#0f172a",
    marginBottom: 8,
    textAlign: "center",
  };

  const donationSubtitle = {
    fontSize: 13,
    color: "#64748b",
    marginBottom: 16,
    textAlign: "center",
  };

  const donationGrid = {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: 12,
  };

  const donationCard = {
    borderRadius: 16,
    border: "1px solid #e5e7eb",
    background: "#ffffff",
    boxShadow: "0 8px 22px rgba(15,23,42,0.06)",
    padding: 12,
    display: "flex",
    flexDirection: "column",
    alignItems: "stretch",
    gap: 8,
  };

  const donationImg = {
    width: "100%",
    height: 140,
    borderRadius: 12,
    objectFit: "cover",
    border: "1px solid #e5e7eb",
  };

  const donationName = {
    fontSize: 14,
    fontWeight: 700,
    color: "#111827",
  };

  const donationPrice = {
    fontSize: 16,
    fontWeight: 800,
    color: "#16a34a",
    marginTop: 4,
  };

  const donationBtn = {
    marginTop: 8,
    padding: "8px 12px",
    borderRadius: 999,
    border: "none",
    cursor: "pointer",
    fontWeight: 600,
    fontSize: 13,
    background: "linear-gradient(135deg, #FACC15, #EAB308)",
    color: "#1f2933",
    boxShadow: "0 6px 14px rgba(250,204,21,0.45)",
  };

  const modalOverlay = {
    position: "fixed",
    inset: 0,
    background: "rgba(15,23,42,0.45)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 40,
  };

  const modalCard = {
    background: "#ffffff",
    borderRadius: 18,
    padding: 24,
    maxWidth: 480,
    width: "90%",
    boxShadow: "0 20px 40px rgba(15,23,42,0.25)",
    textAlign: "center",
  };

  const modalTitle = {
    fontSize: 20,
    fontWeight: 700,
    color: "#0f172a",
    marginBottom: 8,
  };

  const modalText = {
    fontSize: 14,
    color: "#4b5563",
    marginBottom: 16,
    lineHeight: 1.5,
  };

  const modalButton = {
    padding: "10px 18px",
    borderRadius: 999,
    border: "none",
    cursor: "pointer",
    fontWeight: 700,
    fontSize: 14,
    background: "linear-gradient(135deg, #2563eb, #1d4ed8)",
    color: "#ffffff",
    boxShadow: "0 8px 18px rgba(37,99,235,0.35)",
  };

  const pixQrImg = {
    width: 200,
    height: 200,
    objectFit: "contain",
    margin: "0 auto 12px auto",
    borderRadius: 12,
    border: "1px solid #e5e7eb",
    background: "#f9fafb",
  };

  const pixCodeBox = {
    width: "100%",
    textAlign: "left",
    fontSize: 12,
    color: "#374151",
    marginTop: 10,
  };

  const pixCodeLabel = {
    fontWeight: 600,
    marginBottom: 4,
    display: "block",
  };

  const pixCodeTextArea = {
    width: "100%",
    minHeight: 70,
    borderRadius: 10,
    border: "1px solid #e5e7eb",
    padding: 8,
    fontSize: 12,
    resize: "none",
    background: "#f9fafb",
  };

  const pixCopyBtn = {
    marginTop: 8,
    padding: "6px 12px",
    borderRadius: 999,
    border: "none",
    cursor: "pointer",
    fontWeight: 600,
    fontSize: 13,
    background: "linear-gradient(135deg, #FACC15, #EAB308)",
    color: "#1f2933",
    boxShadow: "0 6px 14px rgba(250,204,21,0.45)",
  };

  return (
    <>
      <Nav />
      <main style={page}>
        <h2 style={h2}>Carrinho</h2>

        {err && <div style={errorBox}>{err}</div>}

        <div style={card}>
          {loading ? (
            <div style={empty}>Carregando itens do carrinho...</div>
          ) : items.length === 0 ? (
            <div style={empty}>
              Seu carrinho está vazio. Acesse a página de{" "}
              <strong>Produtos</strong> para escolher itens.
            </div>
          ) : (
            <>
              <div style={tableWrap}>
                <table style={table}>
                  <thead>
                    <tr>
                      <th style={th}>Produto</th>
                      <th style={th}>Preço</th>
                      <th style={th}>Qtd.</th>
                      <th style={th}>Subtotal</th>
                      <th style={th}>Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item, index) => {
                      const p = item.product;
                      const price = Number(p.price) || 0;
                      const subtotal = price * item.quantity;

                      return (
                        <tr key={p.id} style={index % 2 ? rowAlt : undefined}>
                          <td style={td}>
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 10,
                              }}
                            >
                              {p.imageUrl ? (
                                <img
                                  src={p.imageUrl}
                                  alt={p.name || p.title || "Produto"}
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
                                  —
                                </div>
                              )}
                              <div>
                                <div
                                  style={{
                                    fontWeight: 600,
                                    color: "#111827",
                                  }}
                                >
                                  {p.name || p.title}
                                </div>
                                <div
                                  style={{
                                    fontSize: 12,
                                    color: "#6b7280",
                                  }}
                                >
                                  {p.category || "Sem categoria"}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td style={td}>{formatCurrency(price)}</td>
                          <td style={td}>{item.quantity}</td>
                          <td style={td}>{formatCurrency(subtotal)}</td>
                          <td style={td}>
                            <button
                              type="button"
                              style={btnRemove}
                              onClick={() => removeFromCart(p.id)}
                            >
                              Retirar
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div style={totalBox}>
                <div style={{ width: "100%", marginBottom: 16 }}>
                  <label style={{ display: "block", marginBottom: 4, fontWeight: 600, fontSize: 14 }}>
                    Nome de quem vai retirar <span style={{ color: "red" }}>*</span>
                  </label>
                  <input
                    style={inputStyle}
                    placeholder="Ex: João da Silva"
                    value={pickupName}
                    onChange={(e) => setPickupName(e.target.value)}
                    required
                  />

                  <label style={{ display: "block", marginBottom: 4, fontWeight: 600, fontSize: 14 }}>
                    WhatsApp para contato (opcional)
                  </label>
                  <input
                    style={inputStyle}
                    placeholder="(00) 00000-0000"
                    value={whatsapp}
                    onChange={handlePhoneChange}
                    maxLength={15}
                  />
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%" }}>
                  <div>
                    <span style={totalLabel}>Total geral:</span>
                    <span style={totalValue}>{formatCurrency(total)}</span>
                  </div>

                  <button
                    type="button"
                    style={payBtn}
                    onClick={handleCheckout}
                    disabled={submitting}
                  >
                    {submitting ? "Gerando PIX..." : "Pagar com PIX"}
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        <p style={note}>
          * O carrinho é salvo apenas neste navegador. Para adicionar ou remover
          itens, utilize esta tela ou a página de <strong>Produtos</strong>.
        </p>

        <section style={donationSection}>
          <h3 style={donationTitle}>Apoie a APAE – Pinhão com uma doação</h3>
          <p style={donationSubtitle}>
            Escolha um valor simbólico e adicione ao carrinho. Toda ajuda faz
            diferença 💛
          </p>

          <div style={donationGrid}>
            <div style={donationCard}>
              <img
                src={DONATION_ITEMS["donation-10"].imageUrl}
                alt="Doação R$ 10,00"
                style={donationImg}
              />
              <div style={donationName}>Doação solidária</div>
              <div style={donationPrice}>
                {formatCurrency(DONATION_ITEMS["donation-10"].price)}
              </div>
              <button
                type="button"
                style={donationBtn}
                onClick={() => addDonationToCart("donation-10")}
              >
                Doar
              </button>
            </div>

            <div style={donationCard}>
              <img
                src={DONATION_ITEMS["donation-30"].imageUrl}
                alt="Doação R$ 30,00"
                style={donationImg}
              />
              <div style={donationName}>Doação solidária</div>
              <div style={donationPrice}>
                {formatCurrency(DONATION_ITEMS["donation-30"].price)}
              </div>
              <button
                type="button"
                style={donationBtn}
                onClick={() => addDonationToCart("donation-30")}
              >
                Doar
              </button>
            </div>

            <div style={donationCard}>
              <img
                src={DONATION_ITEMS["donation-100"].imageUrl}
                alt="Doação R$ 100,00"
                style={donationImg}
              />
              <div style={donationName}>Doação solidária</div>
              <div style={donationPrice}>
                {formatCurrency(DONATION_ITEMS["donation-100"].price)}
              </div>
              <button
                type="button"
                style={donationBtn}
                onClick={() => addDonationToCart("donation-100")}
              >
                Doar
              </button>
            </div>
          </div>
        </section>

        {showThanksModal && (
          <div style={modalOverlay}>
            <div style={modalCard}>
              <h3 style={modalTitle}>💛 Obrigado pelo seu apoio!</h3>
              <p style={modalText}>
                Seu pedido foi registrado com sucesso. Para concluir o
                pagamento, utilize o QR Code PIX ou o código copia-e-cola abaixo.
                Assim que o pagamento for confirmado, o valor será destinado
                diretamente à APAE – Pinhão.
              </p>

              {pixQrBase64 && (
                <img
                  src={`data:image/png;base64,${pixQrBase64}`}
                  alt="QR Code PIX"
                  style={pixQrImg}
                />
              )}

              {pixCopyCode && (
                <div style={pixCodeBox}>
                  <span style={pixCodeLabel}>Código PIX (copia e cola):</span>
                  <textarea
                    readOnly
                    style={pixCodeTextArea}
                    value={pixCopyCode}
                  />
                  <button
                    type="button"
                    style={pixCopyBtn}
                    onClick={handleCopyPixCode}
                  >
                    Copiar código PIX
                  </button>
                </div>
              )}

              {pixTicketUrl && (
                <p
                  style={{
                    fontSize: 12,
                    marginTop: 10,
                    color: "#1d4ed8",
                  }}
                >
                  Se preferir, você pode abrir o pagamento em outra aba:{" "}
                  <a
                    href={pixTicketUrl}
                    target="_blank"
                    rel="noreferrer"
                    style={{ textDecoration: "underline", color: "#1d4ed8" }}
                  >
                    ver detalhes do PIX
                  </a>
                </p>
              )}

              <div style={{ marginTop: 18 }}>
                <button
                  type="button"
                  style={modalButton}
                  onClick={handleGoBackToStore}
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
