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
      setErr(e.message || "Falha no login");
    } finally {
      setBusy(false);
    }
  }

  const box = { maxWidth: 360, margin: "24px auto", padding: 16, border: "1px solid #ddd", borderRadius: 8 };
  const input = { display: "block", width: "100%", padding: 8, marginBottom: 8 };
  const row = { display: "flex", justifyContent: "space-between", gap: 12, marginTop: 8 };

  return (
    <>
      <Nav />
      <main style={{ padding: 16 }}>
        <form onSubmit={handleLogin} style={box}>
          <h2>Login</h2>
          <input style={input} placeholder="E-mail" type="email" value={email} onChange={(e)=>setEmail(e.target.value)} required />
          <input style={input} placeholder="Senha" type="password" value={pass} onChange={(e)=>setPass(e.target.value)} required />
          {err && <div style={{ color: "crimson", marginBottom: 8 }}>{err}</div>}
          <button disabled={busy} style={{ padding: "8px 12px", background: "#222", color: "#fff", borderRadius: 6 }}>
            {busy ? "Entrando..." : "Entrar"}
          </button>

          <div style={row}>
            <Link href="/register">Registrar-se</Link>
            <a href="#" onClick={(e)=>{ e.preventDefault(); alert("Recuperação de senha entra na próxima sprint :)"); }}>
              Esqueci minha senha
            </a>
          </div>
        </form>
      </main>
    </>
  );
}
