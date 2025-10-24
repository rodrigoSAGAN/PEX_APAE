"use client";
import { useState } from "react";
import { getAuth, sendPasswordResetEmail } from "firebase/auth";
import Nav from "../../components/Nav";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const actionCodeSettings = {
    url: `${APP_URL}/login`,
    handleCodeInApp: false,
  };

  async function handleSubmit(e) {
    e.preventDefault();
    setErr(""); setMsg("");
    if (!email) return setErr("Informe seu e-mail.");

    setSending(true);
    try {
      const auth = getAuth();
      await sendPasswordResetEmail(auth, email, actionCodeSettings);
      setMsg("Enviamos um e-mail com o link de redefinição. Verifique sua caixa de entrada e o spam.");
    } catch (e) {
      const code = e?.code || "";
      if (code.includes("auth/invalid-email")) setErr("E-mail inválido.");
      else if (code.includes("auth/user-not-found")) setErr("Não há usuário com esse e-mail.");
      else if (code.includes("auth/too-many-requests")) setErr("Muitas tentativas. Tente novamente em alguns minutos.");
      else setErr("Não foi possível enviar o e-mail. Tente novamente.");
      console.error(e);
    } finally {
      setSending(false);
    }
  }

  const page = {
    minHeight: "calc(100svh - 56px)",
    display: "grid",
    placeItems: "center",
    padding: 16,
  };

  const card = { background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, padding: 18, boxShadow: "0 10px 22px rgba(0,0,0,0.05)", width: "100%", maxWidth: 460 };
  const h2 = { textAlign: "center", margin: "12px 0 16px 0", color: "#111827", fontSize: 22 };
  const label = { display: "block", marginBottom: 6, color: "#374151", fontSize: 14 };
  const input = { width: "100%", border: "1px solid #e5e7eb", borderRadius: 8, padding: "10px 12px", marginBottom: 12 };
  const btn = { width: "100%", background: "#16A34A", color: "#fff", border: "none", borderRadius: 8, padding: "10px 12px", cursor: "pointer" };
  const note = { fontSize: 12, color: "#6b7280", marginTop: 8, textAlign: "center" };

  return (
    <>
      <Nav />
      <main style={page}>
        <div style={card}>
          <h2 style={h2}>Redefinir senha</h2>
          <form onSubmit={handleSubmit}>
            <label style={label} htmlFor="email">E-mail</label>
            <input
              id="email"
              type="email"
              placeholder="seuemail@exemplo.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={input}
              required
            />
            <button type="submit" style={btn} disabled={sending}>
              {sending ? "Enviando..." : "Enviar link de redefinição"}
            </button>
          </form>

          {msg && <div style={{ color: "#065f46", background: "#ecfdf5", border: "1px solid #a7f3d0", borderRadius: 8, padding: 10, marginTop: 12 }}>{msg}</div>}
          {err && <div style={{ color: "#991b1b", background: "#fee2e2", border: "1px solid #fecaca", borderRadius: 8, padding: 10, marginTop: 12 }}>{err}</div>}

          <p style={note}>
            Você receberá um e-mail com um link para criar uma nova senha. Caso não encontre, verifique o Spam.
          </p>
        </div>
      </main>
    </>
  );
}
