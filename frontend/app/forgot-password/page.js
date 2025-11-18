"use client";
import { useState } from "react";
import { getAuth, sendPasswordResetEmail } from "firebase/auth";
import Nav from "../../components/Nav";
import Link from "next/link";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const [focus, setFocus] = useState({ email: false });

  const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const actionCodeSettings = {
    url: `${APP_URL}/login`,
    handleCodeInApp: false,
  };

  async function handleSubmit(e) {
    e.preventDefault();
    setErr("");
    setMsg("");
    if (!email) return setErr("Informe seu e-mail.");

    setSending(true);
    try {
      const auth = getAuth();
      await sendPasswordResetEmail(auth, email, actionCodeSettings);
      setMsg(
        "Enviamos um e-mail com o link de redefinição. Verifique sua caixa de entrada e o spam."
      );
    } catch (e) {
      const code = e?.code || "";
      if (code.includes("auth/invalid-email")) setErr("E-mail inválido.");
      else if (code.includes("auth/user-not-found"))
        setErr("Não há usuário com esse e-mail.");
      else if (code.includes("auth/too-many-requests"))
        setErr("Muitas tentativas. Tente novamente em alguns minutos.");
      else setErr("Não foi possível enviar o e-mail. Tente novamente.");
      console.error(e);
    } finally {
      setSending(false);
    }
  }
//estilos
  const page = {
    minHeight: "calc(100svh - 56px)",
    display: "grid",
    placeItems: "center",
    padding: 16,
    background: "#e6f3ff", 
  };

  const card = {
    background: "#ffffff",
    border: "1px solid #e5e7eb",
    borderRadius: 20,
    padding: 24,
    boxShadow: "0 12px 28px rgba(2, 8, 20, 0.06)",
    width: "100%",
    maxWidth: 420,
  };

  const header = { textAlign: "center", marginBottom: 18 };

  const logoWrap = {
    width: 80,
    height: 80,
    borderRadius: "999px",
    overflow: "hidden",
    margin: "0 auto 10px auto",
    border: "2px solid rgba(248,250,252,0.9)",
    boxShadow: "0 6px 16px rgba(15,23,42,0.25)",
    background: "#fff",
  };

  const logoImg = {
    width: "100%",
    height: "100%",
    objectFit: "cover",
  };

  const title = {
    fontSize: 24,
    lineHeight: 1.2,
    color: "#0f172a",
    margin: 0,
    fontWeight: 700,
  };

  const subtitle = { marginTop: 6, fontSize: 14, color: "#475569" };

  const label = {
    display: "block",
    fontSize: 13,
    color: "#334155",
    marginBottom: 6,
    fontWeight: 600,
  };

  const input = {
    display: "block",
    width: "100%",
    padding: "20px 22px",
    borderRadius: 10,
    borderWidth: 1,
    borderStyle: "solid",
    borderColor: "#e5e7eb",
    background: "#ffffff",
    color: "#111827",
    outline: "none",
    transition: "box-shadow 120ms, border-color 120ms",
    marginBottom: 12,
  };

  const inputFocus = {
    boxShadow: "0 0 0 4px rgba(34,197,94,0.15)",
    borderColor: "#22C55E",
  };

  const btn = {
    padding: "12px 16px",
    background: "linear-gradient(180deg, #22C55E 0%, #16A34A 100%)",
    color: "#ffffff",
    borderRadius: 999,
    border: "none",
    fontWeight: 700,
    cursor: "pointer",
    width: "100%",
    boxShadow: "0 6px 14px rgba(22,163,74,0.25)",
    transition: "transform 80ms ease, filter 80ms ease, opacity 120ms ease",
    marginTop: 4,
  };

  const btnDisabled = {
    opacity: 0.75,
    cursor: "not-allowed",
    filter: "grayscale(10%)",
  };

  const errorBox = {
    background: "#FEF2F2",
    color: "#991B1B",
    border: "1px solid #FECACA",
    borderRadius: 10,
    padding: "10px 12px",
    margin: "8px 0 0 0",
    fontSize: 14,
  };

  const successBox = {
    background: "#ECFDF5",
    color: "#065F46",
    border: "1px solid #A7F3D0",
    borderRadius: 10,
    padding: "10px 12px",
    margin: "8px 0 0 0",
    fontSize: 14,
  };

  const helper = {
    fontSize: 12,
    color: "#6B7280",
    textAlign: "center",
    marginTop: 12,
  };

  const linkBack = {
    display: "inline-block",
    marginTop: 12,
    fontSize: 13,
    fontWeight: 600,
    color: "#0f172a",
    textDecoration: "none",
    padding: "6px 10px",
    borderRadius: 999,
    background: "#E5F9FF",
    border: "1px solid #7DD3FC",
  };

  return (
    <>
      <Nav />
      <main style={page}>
        <form onSubmit={handleSubmit} style={card}>
          <div style={header}>
            <div style={logoWrap}>
              <img
                src="/images/logo7.jpg"
                alt="Logo APAE Pinhão"
                style={logoImg}
              />
            </div>
            <h1 style={title}>Redefinir senha</h1>
            <p style={subtitle}>
              Informe seu e-mail para receber o link de redefinição.
            </p>
          </div>

          <label style={label} htmlFor="email">
            E-mail
          </label>
          <input
            id="email"
            type="email"
            placeholder="seuemail@exemplo.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{ ...input, ...(focus.email ? inputFocus : null) }}
            onFocus={() => setFocus({ email: true })}
            onBlur={() => setFocus({ email: false })}
            required
            autoComplete="email"
          />

          <button
            type="submit"
            style={{ ...btn, ...(sending ? btnDisabled : null) }}
            disabled={sending}
          >
            {sending ? "Enviando..." : "Enviar link de redefinição"}
          </button>

          {msg && <div style={successBox}>{msg}</div>}
          {err && <div style={errorBox}>{err}</div>}

          <p style={helper}>
            Você receberá um e-mail com um link para criar uma nova senha. Caso
            não encontre, verifique também a pasta de Spam.
          </p>

          <div style={{ textAlign: "center" }}>
            <Link href="/login" style={linkBack}>
              Voltar para o login
            </Link>
          </div>
        </form>
      </main>
    </>
  );
}
