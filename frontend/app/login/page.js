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
      const userCred = await signInWithEmailAndPassword(auth, email, pass);
      const user = userCred.user;

      try {
        const localRaw = localStorage.getItem("portal-apae-cart");
        const token = await user.getIdToken();

        if (localRaw) {
          const localCart = JSON.parse(localRaw);

          const res = await fetch("/api/cart/merge", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ localItems: localCart }),
          });

          if (res.ok) {
            const data = await res.json();
            if (data.items) {
              localStorage.setItem("portal-apae-cart", JSON.stringify(data.items));
            }
          }
        } else {
          const res = await fetch("/api/cart", {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });

          if (res.ok) {
            const data = await res.json();
            if (data.items) {
              localStorage.setItem("portal-apae-cart", JSON.stringify(data.items));
            }
          }
        }
      } catch (cartErr) {
        console.error("Erro ao sincronizar carrinho:", cartErr);
      }

      router.push("/home");
    } catch (e) {
      setErr(e?.message || "Falha no login");
    } finally {
      setBusy(false);
    }
  }

  const [focus, setFocus] = useState({ email: false, pass: false });

  return (
    <>
      <Nav />
      <main className="min-h-screen grid place-items-center px-4 pt-4 bg-gradient-to-br from-blue-50 to-blue-100">
        <form
          onSubmit={handleLogin}
          className="bg-white border border-slate-200 rounded-3xl p-8 shadow-2xl w-full max-w-md animate-fade-in"
        >
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-slate-900 mb-2">Entrar</h1>
            <p className="text-sm text-slate-500">Acesse o painel com seu e-mail e senha.</p>
          </div>

          <div className="mb-5">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2" htmlFor="email">
              E-mail
            </label>
            <input
              id="email"
              className="w-full px-5 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              placeholder="seuemail@exemplo.com"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onFocus={() => setFocus((f) => ({ ...f, email: true }))}
              onBlur={() => setFocus((f) => ({ ...f, email: false }))}
              required
              autoComplete="email"
              aria-required="true"
              aria-invalid={err ? "true" : "false"}
            />
          </div>

          <div className="mb-6">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2" htmlFor="password">
              Senha
            </label>
            <input
              id="password"
              className="w-full px-5 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              placeholder="••••••••"
              type="password"
              value={pass}
              onChange={(e) => setPass(e.target.value)}
              onFocus={() => setFocus((f) => ({ ...f, pass: true }))}
              onBlur={() => setFocus((f) => ({ ...f, pass: false }))}
              required
              autoComplete="current-password"
              aria-required="true"
              aria-invalid={err ? "true" : "false"}
            />
          </div>

          {err && (
            <div
              role="alert"
              aria-live="assertive"
              className="bg-red-50 text-red-700 border border-red-200 rounded-xl p-3 mb-6 text-sm font-medium text-center"
            >
              {err}
            </div>
          )}

          <div className="flex flex-col gap-4">
            <button
              disabled={busy}
              className="w-full py-3.5 rounded-full bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-bold shadow-lg shadow-emerald-500/30 hover:shadow-emerald-500/40 hover:-translate-y-0.5 transition-all disabled:opacity-70 disabled:cursor-not-allowed disabled:shadow-none disabled:translate-y-0"
            >
              {busy ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                  Entrando...
                </span>
              ) : (
                "Entrar"
              )}
            </button>

            <div className="flex flex-wrap items-center justify-between gap-4 mt-2">
              <Link
                href="/register"
                className="text-sm font-bold text-blue-600 hover:text-blue-700 hover:underline transition-all"
              >
                Criar conta
              </Link>
              <Link
                href="/forgot-password"
                className="text-sm font-medium text-slate-500 hover:text-slate-700 transition-all"
              >
                Esqueci minha senha
              </Link>
            </div>
          </div>

          <p className="text-xs text-center text-slate-400 mt-8 leading-relaxed">
            Dica: se esqueceu a senha, solicite o link de redefinição. Verifique
            também a caixa de spam.
          </p>
        </form>
      </main>
    </>
  );
}
