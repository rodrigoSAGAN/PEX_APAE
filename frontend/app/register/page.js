"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Nav from "../../components/Nav";
import { auth } from "../../lib/firebase";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";

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
      if (name) await updateProfile(cred.user, { displayName: name });
      router.push("/dashboard");
    } catch (e) {
      setErr(e.message || "Falha ao registrar");
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

  const h2 = { margin: 0, fontSize: 22, color: "#0f172a", marginBottom: 12 };
  const input = {
    display: "block",
    width: "100%",
    padding: "10px 12px",
    borderRadius: 10,
    border: "1px solid #e5e7eb",
    background: "#ffffff",
    color: "#111827",
    outline: "none",
    marginBottom: 10,
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
  };

  return (
    <>
      <Nav />
      <main style={page}>
        <form onSubmit={onSubmit} style={card}>
          <h2 style={h2}>Criar conta</h2>
          <input style={input} placeholder="Nome (opcional)" value={name} onChange={(e)=>setName(e.target.value)} />
          <input style={input} placeholder="E-mail" type="email" value={email} onChange={(e)=>setEmail(e.target.value)} required />
          <input style={input} placeholder="Senha (mín. 6 caracteres)" type="password" value={pass} onChange={(e)=>setPass(e.target.value)} required />
          {err && <div style={{ color: "crimson", marginBottom: 8 }}>{err}</div>}
          <button disabled={busy} style={btn}>
            {busy ? "Registrando..." : "Registrar"}
          </button>
        </form>
      </main>
    </>
  );
}
