"use client";
import { useEffect, useState } from "react";
import Nav from "../../components/Nav";
import { db } from "../../lib/firebase";
import { collection, getDocs /*, query, orderBy */ } from "firebase/firestore";

export default function ProductsPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  useEffect(() => {
    async function load() {
      setErr("");
      setLoading(true);
      try {
        
        const snap = await getDocs(collection(db, "products"));
        const data = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        setItems(data);
      } catch (e) {
        console.error(e);
        setErr("Falha ao carregar produtos. Tente novamente.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  
  const wrap = { padding: 16, maxWidth: 1080, margin: "0 auto" };
  const h2 = { textAlign: "center", margin: "12px 0 16px 0", color: "#111827", fontSize: 26 };
  const note = { fontSize: 12, color: "#6b7280", textAlign: "center", marginTop: 10 };

 
  const tableWrap = {
    border: "1px solid #e5e7eb",
    borderRadius: 14,
    overflow: "hidden",
    boxShadow: "0 8px 22px rgba(0,0,0,0.05)",
    background: "#fff",
  };
  const table = {
    width: "100%",
    borderCollapse: "separate",
    borderSpacing: 0,
  };
  const th = {
    textAlign: "left",
    padding: "12px 14px",
    background: "#f3f4f6",
    color: "#111827",
    fontWeight: 700,
    borderBottom: "1px solid #e5e7eb",
    fontSize: 14,
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

  return (
    <>
      <Nav />
      <main style={wrap}>
        <h2 style={h2}>Produtos</h2>

        {loading && <div style={{ textAlign: "center" }}>Carregando...</div>}
        {err && <div style={{ color: "crimson", textAlign: "center" }}>{err}</div>}
        {!loading && !err && items.length === 0 && (
          <div style={{ textAlign: "center", color: "#6b7280" }}>Nenhum produto cadastrado.</div>
        )}

        {items.length > 0 && (
          <div style={tableWrap}>
            <table style={table}>
              <thead>
                <tr>
                  <th style={th}>Imagem</th>
                  <th style={th}>Produto</th>
                  <th style={th}>Preço</th>
                  <th style={th}>Estoque</th>
                  <th style={th}>Categoria</th>
                  <th style={th}>Status</th>
                </tr>
              </thead>
              <tbody>
                {items.map((p, i) => (
                  <tr key={p.id} style={i % 2 ? rowAlt : undefined}>
                    <td style={td}>
                      {p.imageUrl ? (
                        <img src={p.imageUrl} alt={p.title} style={imgBox} />
                      ) : (
                        <div style={{ ...imgBox, display: "grid", placeItems: "center", color: "#9ca3af" }}>—</div>
                      )}
                    </td>
                    <td style={td}><strong style={{ color: "#111827" }}>{p.title}</strong></td>
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
                      {p.active === false
                        ? <span style={{ ...badge, background: "#fee2e2", color: "#991b1b", borderColor: "#fecaca" }}>Inativo</span>
                        : <span style={badge}>Ativo</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <p style={note}>
          * Dados do Firestore (coleção <code>products</code>). Para imagens, salve a URL no campo <code>imageUrl</code>.
        </p>
      </main>
    </>
  );
}
