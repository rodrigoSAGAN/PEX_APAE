"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Nav from "../../components/Nav";
import { auth } from "../../lib/firebase";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import Link from "next/link";

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const router = useRouter();

  async function onSubmit(e) {
    e.preventDefault();
    setErr("");
    setBusy(true);
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, pass);
      if (name) {
        await updateProfile(cred.user, { displayName: name });
      }
      router.push("/home");
    } catch (e) {
      setErr(e.message || "Falha ao registrar");
    } finally {
      setBusy(false);
    }
  }

  // === Fundo azul clarinho igual às outras telas ===
  const page = {
    minHeight: "calc(100svh - 56px)",
    display: "grid",
    placeItems: "center",
    padding: 16,
    background: "#e6f3ff", // 👈 azul clarinho
  };

  const card = {
    background: "#ffffff",
    borderWidth: 1,
    borderStyle: "solid",
    borderColor: "#e5e7eb",
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

  const errorBox = {
    background: "#FEF2F2",
    color: "#991B1B",
    borderWidth: 1,
    borderStyle: "solid",
    borderColor: "#FECACA",
    borderRadius: 10,
    padding: "10px 12px",
    margin: "8px 0 12px 0",
    fontSize: 14,
  };

  const actions = {
    display: "flex",
    flexDirection: "column",
    alignItems: "stretch",
    gap: 10,
    marginTop: 12,
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
  };

  const btnDisabled = {
    opacity: 0.75,
    cursor: "not-allowed",
    filter: "grayscale(10%)",
  };

  const linkRow = {
    display: "flex",
    flexWrap: "wrap",
    gap: 8,
    justifyContent: "space-between",
  };

  const linkBase = {
    fontSize: 13,
    fontWeight: 600,
    padding: "8px 12px",
    borderRadius: 999,
    textDecoration: "none",
    borderWidth: 1,
    borderStyle: "solid",
    borderColor: "transparent",
    flexShrink: 0,
  };

  const linkPrimary = {
    ...linkBase,
    color: "#0f172a",
    background: "#E5F9FF",
    borderColor: "#7DD3FC",
  };

  const linkOutline = {
    ...linkBase,
    color: "#065F46",
    background: "transparent",
    borderColor: "#A7F3D0",
  };

  const helper = {
    fontSize: 12,
    color: "#6B7280",
    textAlign: "center",
    marginTop: 12,
  };

  const [focus, setFocus] = useState({
    name: false,
    email: false,
    pass: false,
  });

  return (
    <>
      <Nav />
      <main style={page}>
        <form onSubmit={onSubmit} style={card}>
          <div style={header}>
            <div style={logoWrap}>
              <img
                src="/images/logo7.jpg"
                alt="Logo APAE Pinhão"
                style={logoImg}
              />
            </div>
            <h1 style={title}>Criar conta</h1>
            <p style={subtitle}>Preencha seus dados para acessar o portal.</p>
          </div>

          <label style={label} htmlFor="name">
            Nome (opcional)
          </label>
          <input
            id="name"
            style={{ ...input, ...(focus.name ? inputFocus : null) }}
            placeholder="Seu nome completo"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onFocus={() => setFocus((f) => ({ ...f, name: true }))}
            onBlur={() => setFocus((f) => ({ ...f, name: false }))}
          />

          <label style={label} htmlFor="email">
            E-mail
          </label>
          <input
            id="email"
            style={{ ...input, ...(focus.email ? inputFocus : null) }}
            placeholder="seuemail@exemplo.com"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onFocus={() => setFocus((f) => ({ ...f, email: true }))}
            onBlur={() => setFocus((f) => ({ ...f, email: false }))}
            required
            autoComplete="email"
          />

          <label style={label} htmlFor="password">
            Senha (mín. 6 caracteres)
          </label>
          <input
            id="password"
            style={{ ...input, ...(focus.pass ? inputFocus : null) }}
            placeholder="••••••••"
            type="password"
            value={pass}
            onChange={(e) => setPass(e.target.value)}
            onFocus={() => setFocus((f) => ({ ...f, pass: true }))}
            onBlur={() => setFocus((f) => ({ ...f, pass: false }))}
            required
            autoComplete="new-password"
          />

          {err && <div style={errorBox}>{err}</div>}

          <div style={actions}>
            <button
              disabled={busy}
              style={{ ...btn, ...(busy ? btnDisabled : null) }}
            >
              {busy ? "Registrando..." : "Registrar"}
            </button>

            <div style={linkRow}>
              <Link href="/login" style={linkPrimary}>
                Já tenho conta
              </Link>
              <Link href="/forgot-password" style={linkOutline}>
                Esqueci minha senha
              </Link>
            </div>
          </div>

          <p style={helper}>
            Sua senha é armazenada com segurança pelo Firebase Authentication.
          </p>
        </form>
      </main>
    </>
  );
}
