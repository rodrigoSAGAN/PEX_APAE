// =============================================================================
// pagamento/[orderId]/page.js — Página de acompanhamento do pagamento PIX
//
// Após o usuário gerar um PIX no carrinho, ele pode ser redirecionado pra cá.
// A página faz polling a cada 3 segundos no endpoint /api/payments/status/:id
// para verificar se o pagamento foi aprovado, rejeitado ou ainda está pendente.
// Quando o status muda, a UI atualiza automaticamente mostrando o resultado.
// =============================================================================

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Nav from "../../../components/Nav";

export default function PagamentoPage({ params }) {
    const router = useRouter();
    const [status, setStatus] = useState("pending");
    const [loading, setLoading] = useState(true);
    const orderId = params.orderId;

    // Polling a cada 3 segundos para verificar se o PIX foi aprovado.
    // Quando o status muda de "pending" para "approved" ou "rejected",
    // para o polling e atualiza a UI automaticamente.
    useEffect(() => {
        if (!orderId) return;

        const checkStatus = async () => {
            try {
                const res = await fetch(`http://localhost:4000/api/payments/status/${orderId}`);
                const data = await res.json();

                if (data.status) {
                    setStatus(data.status);

                    if (data.status === "approved") {
                        setLoading(false);
                    }
                }
            } catch (error) {
                console.error("Erro ao verificar status:", error);
            }
        };

        const interval = setInterval(checkStatus, 3000);

        checkStatus();

        return () => clearInterval(interval);
    }, [orderId]);

    return (
        <>
            <Nav />
            <main className="min-h-screen flex items-center justify-center px-4 bg-gradient-to-br from-slate-50 to-slate-100">
                <div className="bg-white rounded-3xl shadow-2xl p-8 md:p-12 max-w-md w-full text-center">

                    {status === "pending" && (
                        <>
                            <div className="w-20 h-20 mx-auto mb-6 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" aria-hidden="true"></div>
                            <h1 className="text-2xl font-bold text-slate-900 mb-3">
                                Aguardando confirmação do pagamento...
                            </h1>
                            <p className="text-slate-600 mb-6">
                                Assim que o pagamento PIX for confirmado, você receberá a confirmação automática.
                            </p>
                            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-800">
                                <p className="font-medium">💡 Dica:</p>
                                <p className="mt-1">O pagamento pode levar alguns segundos para ser processado.</p>
                            </div>
                        </>
                    )}

                    {status === "approved" && (
                        <>
                            <div className="w-20 h-20 mx-auto mb-6 bg-emerald-100 rounded-full flex items-center justify-center">
                                <svg className="w-12 h-12 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                                </svg>
                            </div>
                            <h1 className="text-3xl font-bold text-emerald-600 mb-3">
                                ✅ Pagamento confirmado com sucesso!
                            </h1>
                            <p className="text-slate-600 mb-8">
                                Seu pedido foi confirmado e está sendo processado.
                            </p>
                            <button
                                onClick={() => router.push("/products")}
                                className="w-full py-3.5 rounded-full bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-bold shadow-lg shadow-emerald-500/30 hover:shadow-emerald-500/40 hover:-translate-y-0.5 transition-all"
                            >
                                Voltar para a loja
                            </button>
                        </>
                    )}

                    {status === "rejected" && (
                        <>
                            <div className="w-20 h-20 mx-auto mb-6 bg-red-100 rounded-full flex items-center justify-center">
                                <svg className="w-12 h-12 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </div>
                            <h1 className="text-2xl font-bold text-red-600 mb-3">
                                Pagamento não confirmado
                            </h1>
                            <p className="text-slate-600 mb-8">
                                Houve um problema ao processar seu pagamento. Tente novamente.
                            </p>
                            <button
                                onClick={() => router.push("/carrinho")}
                                className="w-full py-3.5 rounded-full bg-slate-900 text-white font-bold shadow-lg hover:bg-slate-800 hover:-translate-y-0.5 transition-all"
                            >
                                Voltar ao carrinho
                            </button>
                        </>
                    )}

                </div>
            </main>
        </>
    );
}
