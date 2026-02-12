"use client";

import { useEffect, useState } from "react";
import Nav from "../../components/Nav";
import SideMenu from "../../components/SideMenu";
import { db, auth } from "../../lib/firebase";
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  doc,
  updateDoc,
  addDoc,
  serverTimestamp,
  getDocs,
  limit,
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { useRouter } from "next/navigation";
import { useModal } from "../../components/ModalContext";

export default function PedidosPage() {
  const { showModal } = useModal();
  const [soldItems, setSoldItems] = useState([]);
  const [filteredItems, setFilteredItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isMobile, setIsMobile] = useState(false);
  const [activeTab, setActiveTab] = useState("todo");

  const [authorized, setAuthorized] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [claims, setClaims] = useState(null);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.replace("/");
        return;
      }

      try {
        const tokenResult = await user.getIdTokenResult(true);
        const c = tokenResult.claims || {};
        setClaims(c);
        
        const roles = Array.isArray(c.roles) ? c.roles : [];
        const isAdmin = roles.includes("admin");

        if (c.canEditStore === true || isAdmin) {
          setAuthorized(true);
          setCurrentUser(user);
        } else {
          router.replace("/");
        }
      } catch (err) {
        console.error("Error checking permissions", err);
        router.replace("/");
      } finally {
        setCheckingAuth(false);
      }
    });
    return () => unsubscribe();
  }, [router]);

  useEffect(() => {
    const checkSize = () => {
      if (typeof window !== "undefined") {
        setIsMobile(window.innerWidth < 768);
      }
    };
    checkSize();
    window.addEventListener("resize", checkSize);
    return () => window.removeEventListener("resize", checkSize);
  }, []);

  useEffect(() => {
    if (!authorized) return;

    setLoading(true);
    const q = query(collection(db, "orders"), orderBy("createdAt", "desc"));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const items = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();

          const status = (data.status || "").toLowerCase();
          const paymentStatus = (data.paymentStatus || "").toLowerCase();
          const pixStatus = (data.pixStatus || "").toLowerCase();

          const isPaid =
            status === "paid" ||
            status === "approved" ||
            status === "pago" ||
            paymentStatus === "approved" ||
            paymentStatus === "confirmed" ||
            paymentStatus === "pago" ||
            pixStatus === "approved" ||
            pixStatus === "pago";

          if (!isPaid) return;

          const orderItems = Array.isArray(data.items) ? data.items : [];

          const buyerName =
            data.userName ||
            data.buyerName ||
            data.payerName ||
            data.payer?.name ||
            data.user?.name ||
            data.userEmail ||
            "Cliente";

          orderItems.forEach((item, index) => {
            const qty = Number(item.quantity || item.qty || 0);
            if (qty > 0) {
              const isDonation =
                (item.category && item.category.toLowerCase() === "doação") ||
                (item.name && item.name.toLowerCase().includes("doação"));

              items.push({
                orderId: docSnap.id,
                itemIndex: index,
                productName: item.name || item.title || "Produto sem nome",
                price: Number(item.price || item.unitPrice || item.value || 0),
                quantity: qty,
                buyerName: buyerName,
                buyerEmail: data.userEmail || data.email || "N/A",
                date: data.createdAt?.toDate
                  ? data.createdAt.toDate()
                  : new Date(data.createdAt),
                delivered: item.delivered === true,
                isDonation: isDonation,
                originalOrderData: data,
              });
            }
          });
        });
        setSoldItems(items);
        setLoading(false);
      },
      (err) => {
        console.error("Erro ao buscar relatórios:", err);
        setError("Falha ao carregar relatórios de vendas.");
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [authorized]);

  useEffect(() => {
    let res = [...soldItems];

    if (activeTab === "donations") {
      res = res.filter((i) => i.isDonation);
    } else if (activeTab === "todo") {
      res = res.filter((i) => !i.delivered && !i.isDonation);
    } else if (activeTab === "done") {
      res = res.filter((i) => i.delivered);
    }

    setFilteredItems(res);
  }, [soldItems, activeTab]);

  const toggleDelivered = async (item) => {
    const originalItems = [...soldItems];
    const updatedItems = soldItems.map((i) => {
      if (i.orderId === item.orderId && i.itemIndex === item.itemIndex) {
        return { ...i, delivered: !i.delivered };
      }
      return i;
    });
    setSoldItems(updatedItems);

    try {
      const token = await currentUser.getIdToken();
      const res = await fetch(`/api/orders/${item.orderId}/delivery`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          itemIndex: item.itemIndex,
          delivered: !item.delivered,
        }),
      });

      if (!res.ok) {
        throw new Error("Falha ao atualizar status via API");
      }

      if (currentUser) {
        try {
          const token = await currentUser.getIdToken();
          await fetch("/api/logs", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              action: "toggle_delivery",
              details: `Pedido ${item.orderId} - Item: ${item.productName} - Entregue: ${!item.delivered ? "Sim" : "Não"}`,
              entityId: item.orderId,
              entityName: item.productName,
              type: "order",
              userName: currentUser.displayName || currentUser.email || "Usuário",
              newStatus: !item.delivered
            }),
          });
        } catch (logErr) {
          console.error("Erro ao salvar log via API:", logErr);
        }
      }

    } catch (err) {
      console.error("Erro ao atualizar status de entrega:", err);
      alert("Erro ao atualizar status. Revertendo...");
      setSoldItems(originalItems);
    }
  };

  const simulateSale = async () => {
    if (!confirm("Confirmar simulação de venda? Isso criará um pedido falso no banco de dados.")) return;

    try {
      const productsRef = collection(db, "products");
      const q = query(productsRef, limit(1));
      const snapshot = await getDocs(q);

      let productItem = {
        name: "Produto Teste Simulado",
        price: 10.0,
        quantity: 1,
        delivered: false
      };

      if (!snapshot.empty) {
        const docData = snapshot.docs[0].data();
        productItem = {
          name: docData.name || docData.title || "Produto Simulado",
          price: Number(docData.price || 10),
          quantity: 1,
          delivered: false
        };
      }

      await addDoc(collection(db, "orders"), {
        createdAt: serverTimestamp(),
        status: "paid",
        paymentStatus: "approved",
        items: [productItem],
        buyerName: "Simulação Admin",
        userEmail: currentUser?.email || "admin@teste.com",
        total: productItem.price,
        simulated: true
      });

      alert("Venda simulada criada com sucesso!");
    } catch (e) {
      console.error("Erro ao simular venda:", e);
      alert("Erro ao criar simulação.");
    }
  };

  const pageWrap = {
    minHeight: "100vh",
    background: "#f8fafc",
    paddingBottom: 80,
  };

  const gridLayout = {
    display: "grid",
    gridTemplateColumns: isMobile ? "1fr" : "260px 1fr",
    gap: 16,
    maxWidth: 1200,
    margin: "0 auto",
    padding: isMobile ? "20px 16px" : "40px 24px",
  };

  const mainContent = {
    minWidth: 0,
  };

  const header = {
    marginBottom: 32,
    textAlign: "center",
  };

  const title = {
    fontSize: isMobile ? 24 : 32,
    fontWeight: 800,
    color: "#1e293b",
    marginBottom: 8,
  };

  const subtitle = {
    fontSize: 16,
    color: "#64748b",
  };

  const tabsWrap = {
    display: "flex",
    justifyContent: "center",
    gap: 8,
    marginBottom: 24,
    flexWrap: "wrap",
  };

  const tabBtn = (isActive) => ({
    padding: "12px 24px",
    borderRadius: 999,
    border: "none",
    background: isActive ? "#10b981" : "#ffffff",
    color: isActive ? "#ffffff" : "#64748b",
    fontWeight: 700,
    fontSize: 15,
    cursor: "pointer",
    transition: "all 0.2s",
    boxShadow: isActive ? "0 4px 12px rgba(16, 185, 129, 0.3)" : "0 1px 3px rgba(0,0,0,0.1)",
    border: isActive ? "none" : "1px solid #e2e8f0",
  });

  const tableWrap = {
    background: "#ffffff",
    borderRadius: 16,
    boxShadow:
      "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
    overflow: "hidden",
    border: "1px solid #e2e8f0",
  };

  const table = {
    width: "100%",
    borderCollapse: "collapse",
    textAlign: "left",
  };

  const th = {
    padding: "16px 24px",
    background: "#f1f5f9",
    color: "#475569",
    fontWeight: 600,
    fontSize: 14,
    textTransform: "uppercase",
    letterSpacing: "0.05em",
    borderBottom: "1px solid #e2e8f0",
  };

  const td = {
    padding: "16px 24px",
    borderBottom: "1px solid #e2e8f0",
    color: "#334155",
    fontSize: 15,
  };

  const checkbox = {
    width: 20,
    height: 20,
    cursor: "pointer",
    accentColor: "#16a34a",
  };

  const statusBadge = (delivered) => ({
    display: "inline-flex",
    alignItems: "center",
    padding: "4px 12px",
    borderRadius: 9999,
    fontSize: 12,
    fontWeight: 600,
    background: delivered ? "#dcfce7" : "#fee2e2",
    color: delivered ? "#166534" : "#991b1b",
  });

  const donationBadge = {
    display: "inline-flex",
    alignItems: "center",
    padding: "2px 8px",
    borderRadius: 999,
    fontSize: 11,
    fontWeight: 700,
    background: "#fef3c7",
    color: "#b45309",
    marginLeft: 8,
  };

  const cardGrid = {
    display: "flex",
    flexDirection: "column",
    gap: 16,
  };

  const card = {
    background: "#ffffff",
    borderRadius: 12,
    padding: 16,
    boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
    border: "1px solid #e2e8f0",
  };

  const cardRow = {
    display: "flex",
    justifyContent: "space-between",
    marginBottom: 8,
    fontSize: 14,
  };

  const cardLabel = {
    color: "#64748b",
    fontWeight: 500,
  };

  const cardValue = {
    color: "#1e293b",
    fontWeight: 600,
    textAlign: "right",
  };

  if (checkingAuth) {
    return (
      <>
        <Nav />
        <div
          style={{
            ...pageWrap,
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <div style={{ fontSize: 18, color: "#64748b" }}>
            Verificando permissões...
          </div>
        </div>
      </>
    );
  }

  if (!authorized) {
    return null;
  }

  if (loading) {
    return (
      <>
        <Nav />
        <div
          style={{
            ...pageWrap,
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <div style={{ fontSize: 18, color: "#64748b" }}>
            Carregando relatórios...
          </div>
        </div>
      </>
    );
  }

  return (
    <div style={pageWrap}>
      <Nav />
      <div style={gridLayout}>
        {!isMobile && <SideMenu claims={claims} />}
        
        <div style={mainContent}>
          <div style={header}>
            <h1 style={title}>Pedidos</h1>
            <p style={subtitle}>
              Acompanhe os produtos vendidos e status de entrega
            </p>
          </div>

          <div style={{ textAlign: "center", marginBottom: 24 }}>
            <button
              onClick={simulateSale}
              style={{
                background: "#7c3aed",
                color: "#fff",
                border: "none",
                padding: "8px 20px",
                borderRadius: 999,
                cursor: "pointer",
                fontWeight: 700,
                fontSize: 14,
                boxShadow: "0 4px 12px rgba(124, 58, 237, 0.3)",
                transition: "transform 0.2s",
              }}
              onMouseOver={(e) => (e.currentTarget.style.transform = "scale(1.05)")}
              onMouseOut={(e) => (e.currentTarget.style.transform = "scale(1)")}
            >
              🛠 Simular Venda (Teste)
            </button>
          </div>

          <div style={tabsWrap}>
            <button
              onClick={() => setActiveTab("all")}
              style={tabBtn(activeTab === "all")}
            >
              Todas as vendas
            </button>
            <button
              onClick={() => setActiveTab("todo")}
              style={tabBtn(activeTab === "todo")}
            >
              Para entregar
            </button>
            <button
              onClick={() => setActiveTab("done")}
              style={tabBtn(activeTab === "done")}
            >
              Entregues
            </button>
          </div>

          {error && (
            <div
              style={{
                padding: 16,
                background: "#fee2e2",
                color: "#991b1b",
                borderRadius: 8,
                marginBottom: 24,
                textAlign: "center",
              }}
            >
              {error}
            </div>
          )}

          {!loading && !error && filteredItems.length === 0 && (
            <div style={{ textAlign: "center", color: "#64748b", marginTop: 40 }}>
              Nenhum item encontrado para este filtro.
            </div>
          )}

          {!loading && !error && filteredItems.length > 0 && (
            <>
              {isMobile ? (
                <div style={cardGrid}>
                  {filteredItems.map((item, idx) => (
                    <div
                      key={`${item.orderId}-${item.itemIndex}-${idx}`}
                      style={card}
                    >
                      <div
                        style={{
                          ...cardRow,
                          borderBottom: "1px solid #f1f5f9",
                          paddingBottom: 8,
                          marginBottom: 12,
                        }}
                      >
                        <span style={{ fontWeight: 700, color: "#0f172a" }}>
                          {item.productName}
                          {item.isDonation && (
                            <span style={donationBadge}>Doação</span>
                          )}
                        </span>
                        <span style={{ color: "#16a34a", fontWeight: 700 }}>
                          {item.quantity}x R$ {item.price.toFixed(2)}
                        </span>
                      </div>
                      <div style={cardRow}>
                        <span style={cardLabel}>Comprador:</span>
                        <span style={cardValue}>{item.buyerName}</span>
                      </div>
                      <div style={cardRow}>
                        <span style={cardLabel}>Data:</span>
                        <span style={cardValue}>
                          {item.date.toLocaleDateString()}
                        </span>
                      </div>
                      <div
                        style={{
                          ...cardRow,
                          alignItems: "center",
                          marginTop: 12,
                        }}
                      >
                        <span style={cardLabel}>Entregue?</span>
                        <label
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={item.delivered}
                            onChange={() => toggleDelivered(item)}
                            style={checkbox}
                          />
                          <span style={statusBadge(item.delivered)}>
                            {item.delivered ? "Entregue" : "Pendente"}
                          </span>
                        </label>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={tableWrap}>
                  <table style={table}>
                    <thead>
                      <tr>
                        <th style={th}>Produto</th>
                        <th style={th}>Qtd</th>
                        <th style={th}>Valor Un.</th>
                        <th style={th}>Comprador</th>
                        <th style={th}>Data</th>
                        <th style={{ ...th, textAlign: "center" }}>Entregue</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredItems.map((item, idx) => (
                        <tr
                          key={`${item.orderId}-${item.itemIndex}-${idx}`}
                          style={{
                            background: idx % 2 === 0 ? "#fff" : "#f8fafc",
                          }}
                        >
                          <td style={td}>
                            <div style={{ fontWeight: 600 }}>
                              {item.productName}
                              {item.isDonation && (
                                <span style={donationBadge}>Doação</span>
                              )}
                            </div>
                          </td>
                          <td style={td}>{item.quantity}</td>
                          <td
                            style={{ ...td, color: "#16a34a", fontWeight: 600 }}
                          >
                            R$ {item.price.toFixed(2)}
                          </td>
                          <td style={td}>
                            <div>{item.buyerName}</div>
                            <div style={{ fontSize: 12, color: "#94a3b8" }}>
                              {item.buyerEmail}
                            </div>
                          </td>
                          <td style={td}>
                            {item.date.toLocaleDateString()}{" "}
                            {item.date.toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </td>
                          <td style={{ ...td, textAlign: "center" }}>
                            <label style={{ cursor: "pointer" }}>
                              <input
                                type="checkbox"
                                checked={item.delivered}
                                onChange={() => toggleDelivered(item)}
                                style={checkbox}
                              />
                            </label>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
