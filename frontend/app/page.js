import Nav from "../components/Nav";

export default function HomePage() {
  
  const hero = {
    display: "grid",
    placeItems: "center",
    padding: "56px 16px",
    textAlign: "center",
    background: "#f9fafb", 
  };
  const card = {
    background: "#fff",
    border: "1px solid #e5e7eb",
    borderRadius: 20,
    padding: 32,
    maxWidth: 820,
    boxShadow: "0 10px 28px rgba(0,0,0,0.06)",
  };
  const h1 = { margin: 0, fontSize: 34, color: "#111827", letterSpacing: 0.2 };
  const p = { marginTop: 10, marginBottom: 0, color: "#4b5563", fontSize: 16, lineHeight: 1.6 };
  const ctas = { marginTop: 18, display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" };
  const btn = {
    padding: "12px 18px",
    borderRadius: 12,
    border: "1px solid #e5e7eb",
    background: "#fff",
    cursor: "pointer",
    fontWeight: 700,
    color: "#111827",
    textDecoration: "none",
    transition: "transform .05s, box-shadow .2s",
  };
  const btnPrimary = {
    ...btn,
    background: "#3b82f6", 
    color: "#fff",
    borderColor: "#3b82f6",
  };

  return (
    <>
      <Nav />
      <section style={hero}>
        <div style={card}>
          <h1 style={h1}>Portal APAE — Protótipo (Sprint 1)</h1>
          <p style={p}>
            Navegue pelo menu para acessar Produtos, Login/Registro e Dashboard. Este é o protótipo interativo
            local com integração simples ao Firebase.
          </p>
          <div style={ctas}>
            <a href="/products" style={btnPrimary}>Ver Produtos</a>
            <a href="/login" style={btn}>Entrar</a>
            <a href="/register" style={btn}>Registrar</a>
          </div>
        </div>
      </section>
    </>
  );
}
