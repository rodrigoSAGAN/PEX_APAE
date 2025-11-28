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
  return (
    <>
      <Nav />
      <main className="min-h-screen grid place-items-center px-4 pt-4 bg-gradient-to-br from-blue-50 to-blue-100">
        <form 
          onSubmit={handleSubmit} 
          className="bg-white border border-slate-200 rounded-3xl p-8 shadow-2xl w-full max-w-md animate-fade-in"
        >
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-slate-900 mb-2">Redefinir senha</h1>
            <p className="text-sm text-slate-500">Informe seu e-mail para receber o link de redefinição.</p>
          </div>

          <div className="mb-6">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2" htmlFor="email">
              E-mail
            </label>
            <input
              id="email"
              type="email"
              className="w-full px-5 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              placeholder="seuemail@exemplo.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onFocus={() => setFocus({ email: true })}
              onBlur={() => setFocus({ email: false })}
              required
              autoComplete="email"
            />
          </div>

          <div className="flex flex-col gap-4">
            <button
              type="submit"
              disabled={sending}
              className="w-full py-3.5 rounded-full bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-bold shadow-lg shadow-emerald-500/30 hover:shadow-emerald-500/40 hover:-translate-y-0.5 transition-all disabled:opacity-70 disabled:cursor-not-allowed disabled:shadow-none disabled:translate-y-0"
            >
              {sending ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                  Enviando...
                </span>
              ) : (
                "Enviar link de redefinição"
              )}
            </button>

            {msg && (
              <div className="bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl p-3 text-sm font-medium text-center">
                {msg}
              </div>
            )}
            
            {err && (
              <div className="bg-red-50 text-red-700 border border-red-200 rounded-xl p-3 text-sm font-medium text-center">
                {err}
              </div>
            )}

            <p className="text-xs text-center text-slate-400 leading-relaxed">
              Você receberá um e-mail com um link para criar uma nova senha. Caso
              não encontre, verifique também a pasta de Spam.
            </p>

            <div className="text-center mt-2">
              <Link 
                href="/login" 
                className="inline-flex items-center justify-center px-4 py-2 rounded-full bg-blue-50 text-blue-600 text-sm font-bold border border-blue-200 hover:bg-blue-100 transition-all"
              >
                Voltar para o login
              </Link>
            </div>
          </div>
        </form>
      </main>
    </>
  );
}
