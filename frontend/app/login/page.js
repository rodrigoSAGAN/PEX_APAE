"use client";
import Nav from "../../components/Nav";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { auth } from "../../lib/firebase";
import { signInWithEmailAndPassword } from "firebase/auth";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const router = useRouter();

  async function handleLogin(e) {
    e.preventDefault();
    setErr("");
    setBusy(true);
    try {
      await signInWithEmailAndPassword(auth, email, pass);
      router.push("/dashboard");
    } catch (e) {
      setErr(e?.message || "Falha no login");
    } finally {
      setBusy(false);
    }
  }

  const page = {
    minHeight: "calc(100svh - 56px)",
    display: "grid",
    placeItems: "center",
    padding: 16,
  };

  const card = {
    background: "#ffffff",
    border: "1px solid #e5e7eb",
    borderRadius: 16,
    padding: 24,
    boxShadow: "0 12px 28px rgba(2, 8, 20, 0.06)",
    width: "100%",
    maxWidth: 420,
  };

  const header = { textAlign: "center", marginBottom: 16 };

  const title = {
    fontSize: 24,
    lineHeight: 1.2,
    color: "#0f172a",
    margin: 0,
    fontWeight: 700,
  };

  const subtitle = { marginTop: 6, fontSize: 14, color: "#475569" };

  const label = { display: "block", fontSize: 13, color: "#334155", marginBottom: 6, fontWeight: 600 };

  const input = {
    display: "block",
    width: "100%",
    padding: "10px 12px",
    borderRadius: 10,
    border: "1px solid #e5e7eb",
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
    border: "1px solid #FECACA",
    borderRadius: 10,
    padding: "10px 12px",
    margin: "8px 0 12px 0",
    fontSize: 14,
  };

  const actions = {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    marginTop: 8,
  };

  const btn = {
    padding: "10px 14px",
    background: "linear-gradient(180deg, #22C55E 0%, #16A34A 100%)",
    color: "#ffffff",
    borderRadius: 10,
    border: "none",
    fontWeight: 700,
    cursor: "pointer",
    minWidth: 120,
    boxShadow: "0 6px 14px rgba(22,163,74,0.25)",
    transition: "transform 80ms ease, filter 80ms ease, opacity 120ms ease",
  };

  const btnDisabled = { opacity: 0.75, cursor: "not-allowed", filter: "grayscale(10%)" };

  const link = { color: "#0F172A", textDecoration: "none", fontSize: 14, fontWeight: 600, padding: "6px 8px", borderRadius: 8 };
  const linkAlt = { color: "#065F46" };

  const helper = { fontSize: 12, color: "#6B7280", textAlign: "center", marginTop: 12 };

  const [focus, setFocus] = useState({ email: false, pass: false });

  return (
    <>
      <Nav />
      <main style={page}>
        <form onSubmit={handleLogin} style={card}>
          <div style={header}>
            <div
              aria-hidden
              style={{
                display: "inline-block",
                width: 42,
                height: 42,
                borderRadius: 12,
                background:
                  "conic-gradient(from 160deg at 50% 50%, #FACC15 0deg, #fde68a 160deg, #FACC15 360deg)",
                boxShadow: "inset 0 2px 4px rgba(0,0,0,0.06)",
                marginBottom: 10,
              }}
            />
            <h1 style={title}>Entrar</h1>
            <p style={subtitle}>Acesse o painel com seu e-mail e senha.</p>
          </div>

          <label style={label} htmlFor="email">E-mail</label>
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

          <label style={label} htmlFor="password">Senha</label>
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
            autoComplete="current-password"
          />

          {err && <div style={errorBox}>{err}</div>}

          <div style={actions}>
            <button disabled={busy} style={{ ...btn, ...(busy ? btnDisabled : null) }}>
              {busy ? "Entrando..." : "Entrar"}
            </button>

            <div style={{ display: "flex", gap: 10 }}>
              <Link href="/register" style={link}>Registrar</Link>
              <Link href="/forgot-password" style={{ ...link, ...linkAlt }}>Esqueci minha senha</Link>
            </div>
          </div>

          <p style={helper}>
            Dica: se esqueceu a senha, solicite o link de redefinição. Verifique também a caixa de spam.
          </p>
        </form>
      </main>
    </>
  );
}
