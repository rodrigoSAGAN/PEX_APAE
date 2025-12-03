"use client";

import { useState, useEffect, useRef } from "react";

export default function DonationModal({ isOpen, onClose, donationValue, donationName }) {
  const [step, setStep] = useState("form");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState("");
  const [pixData, setPixData] = useState(null);
  const modalRef = useRef(null);
  const previousFocusRef = useRef(null);

  // Focus management
  useEffect(() => {
    if (isOpen) {
      previousFocusRef.current = document.activeElement;
      setTimeout(() => {
        const firstInput = modalRef.current?.querySelector('input, button');
        firstInput?.focus();
      }, 100);
    } else {
      previousFocusRef.current?.focus();
    }
  }, [isOpen]);

  // Escape key handler
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  // Focus trap
  useEffect(() => {
    if (!isOpen) return;

    const handleTab = (e) => {
      if (e.key !== 'Tab') return;

      const focusableElements = modalRef.current?.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      const firstElement = focusableElements?.[0];
      const lastElement = focusableElements?.[focusableElements.length - 1];

      if (e.shiftKey && document.activeElement === firstElement) {
        e.preventDefault();
        lastElement?.focus();
      } else if (!e.shiftKey && document.activeElement === lastElement) {
        e.preventDefault();
        firstElement?.focus();
      }
    };

    document.addEventListener('keydown', handleTab);
    return () => document.removeEventListener('keydown', handleTab);
  }, [isOpen, step]);

  if (!isOpen) return null;

  function handlePhoneChange(e) {
    let val = e.target.value.replace(/\D/g, "");
    if (val.length > 11) val = val.slice(0, 11);

    if (val.length > 2) {
      val = `(${val.slice(0, 2)}) ${val.slice(2)}`;
    }
    if (val.length > 9) {
      val = `${val.slice(0, 9)}-${val.slice(9)}`;
    }
    setPhone(val);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (!name.trim()) {
      setError("Por favor, informe seu nome completo.");
      return;
    }

    if (phone && phone.replace(/\D/g, "").length < 10) {
      setError("Por favor, informe um telefone válido.");
      return;
    }

    setStep("loading");

    try {
      const res = await fetch("/api/pix", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: donationValue,
          totalValue: donationValue,
          description: `Doação APAE - ${name}`,
          payer: {
            name: name,
            phone: phone.replace(/\D/g, ""),
          },
        }),
      });

      if (!res.ok) {
        throw new Error("Falha ao gerar PIX");
      }

      const data = await res.json();
      setPixData(data);
      setStep("result");
    } catch (err) {
      console.error(err);
      setError("Ocorreu um erro ao gerar o PIX. Tente novamente.");
      setStep("form");
    }
  }

  function handleCopyPix() {
    const code = pixData?.qr_code || pixData?.copyPaste || pixData?.qrCode || "";
    if (code) {
      navigator.clipboard.writeText(code);
      alert("Código PIX copiado!");
    }
  }

  const pixQrBase64 = pixData?.qr_code_base64 || pixData?.qrCodeBase64 || null;
  const pixCopyCode = pixData?.qr_code || pixData?.copyPaste || pixData?.qrCode || "";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="donation-modal-title"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        ref={modalRef}
        className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-zoom-in relative"
      >

        <button
          onClick={onClose}
          aria-label="Fechar modal de doação"
          className="absolute top-4 right-4 p-2 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 transition-colors"
        >
          <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="p-8">
          {step === "form" && (
            <>
              <div className="text-center mb-6">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 mb-4" aria-hidden="true">
                  <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                </div>
                <h3 id="donation-modal-title" className="text-2xl font-bold text-slate-900">Confirmar Doação</h3>
                <p className="text-slate-500 mt-2">
                  Você está doando <strong className="text-emerald-600">{donationValue.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</strong>
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label htmlFor="donor-name" className="block text-sm font-bold text-slate-700 mb-1.5">
                    Nome Completo <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="donor-name"
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    aria-required="true"
                    aria-invalid={error && !name.trim() ? "true" : "false"}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                    placeholder="Seu nome"
                  />
                </div>

                <div>
                  <label htmlFor="donor-phone" className="block text-sm font-bold text-slate-700 mb-1.5">
                    WhatsApp <span className="text-slate-400 font-normal">(Opcional)</span>
                  </label>
                  <input
                    id="donor-phone"
                    type="text"
                    value={phone}
                    onChange={handlePhoneChange}
                    maxLength={15}
                    aria-invalid={error && phone && phone.replace(/\D/g, "").length < 10 ? "true" : "false"}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                    placeholder="(00) 00000-0000"
                  />
                </div>

                {error && (
                  <div
                    role="alert"
                    aria-live="assertive"
                    className="p-3 rounded-lg bg-red-50 text-red-600 text-sm font-medium text-center"
                  >
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  className="w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-bold shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/30 hover:-translate-y-0.5 transition-all"
                >
                  Gerar Doação via PIX
                </button>
              </form>
            </>
          )}

          {step === "loading" && (
            <div className="py-12 flex flex-col items-center justify-center text-center" role="status" aria-live="polite">
              <div className="w-12 h-12 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin mb-4" aria-hidden="true"></div>
              <p className="text-slate-600 font-medium">Gerando seu código PIX...</p>
            </div>
          )}

          {step === "result" && (
            <div className="text-center animate-fade-in">
              <h3 className="text-xl font-bold text-slate-900 mb-2">Obrigado pelo apoio! 💛</h3>
              <p className="text-slate-500 text-sm mb-6">
                Utilize o QR Code abaixo para concluir sua doação.
              </p>

              {pixQrBase64 && (
                <div className="bg-white p-2 rounded-xl border border-slate-200 shadow-inner mb-6 inline-block">
                  <img
                    src={`data:image/png;base64,${pixQrBase64}`}
                    alt="QR Code PIX para doação"
                    className="w-48 h-48 object-contain"
                  />
                </div>
              )}

              {pixCopyCode && (
                <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 mb-6 text-left">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2 block">Copia e Cola:</span>
                  <div className="flex gap-2">
                    <input
                      readOnly
                      value={pixCopyCode}
                      aria-label="Código PIX copia e cola"
                      className="flex-1 bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-600 font-mono focus:outline-none"
                    />
                    <button
                      onClick={handleCopyPix}
                      aria-label="Copiar código PIX"
                      className="bg-emerald-100 text-emerald-700 px-3 py-2 rounded-lg font-bold text-xs hover:bg-emerald-200 transition-colors"
                    >
                      Copiar
                    </button>
                  </div>
                </div>
              )}

              <button
                onClick={onClose}
                className="w-full py-3 rounded-xl bg-slate-100 text-slate-700 font-bold hover:bg-slate-200 transition-colors"
              >
                Fechar
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
