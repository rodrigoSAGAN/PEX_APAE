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
      if (name) {
        await updateProfile(cred.user, { displayName: name });
      }
      router.push("/dashboard");
    } catch (e) {
      setErr(e.message || "Falha ao registrar");
    } finally {
      setBusy(false);
    }
  }

  const box = { maxWidth: 380, margin: "24px auto", padding: 16, border: "1px solid #ddd", borderRadius: 8 };
  const input = { display: "block", width: "100%", padding: 8, marginBottom: 8 };

  return (
    <>
      <Nav />
      <main style={{ padding: 16 }}>
        <form onSubmit={onSubmit} style={box}>
          <h2>Criar conta</h2>
          <input style={input} placeholder="Nome (opcional)" value={name} onChange={(e)=>setName(e.target.value)} />
          <input style={input} placeholder="E-mail" type="email" value={email} onChange={(e)=>setEmail(e.target.value)} required />
          <input style={input} placeholder="Senha (mín. 6 caracteres)" type="password" value={pass} onChange={(e)=>setPass(e.target.value)} required />
          {err && <div style={{ color: "crimson", marginBottom: 8 }}>{err}</div>}
          <button disabled={busy} style={{ padding: "8px 12px", background: "#222", color: "#fff", borderRadius: 6 }}>
            {busy ? "Registrando..." : "Registrar"}
          </button>
        </form>
      </main>
    </>
  );
}
