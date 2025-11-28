"use client";

import { useState } from "react";
import Nav from "../../components/Nav";
import DonationModal from "../../components/DonationModal";

const DONATION_ITEMS = [
  {
    id: "donation-10",
    name: "Doação solidária",
    price: 10,
    description: "Ajuda a comprar materiais escolares básicos.",
    imageUrl: "/images/flor11.png",
    color: "from-blue-400 to-blue-600",
    shadow: "shadow-blue-500/30",
  },
  {
    id: "donation-30",
    name: "Doação solidária",
    price: 30,
    description: "Contribui para a manutenção das oficinas de arte.",
    imageUrl: "/images/flor22.png",
    color: "from-emerald-400 to-emerald-600",
    shadow: "shadow-emerald-500/30",
  },
  {
    id: "donation-100",
    name: "Doação solidária",
    price: 100,
    description: "Apoia diretamente os atendimentos de saúde e terapia.",
    imageUrl: "/images/flor33.png",
    color: "from-purple-400 to-purple-600",
    shadow: "shadow-purple-500/30",
  },
];

export default function ApoiarPage() {
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedDonation, setSelectedDonation] = useState({ value: 0, name: "" });
  const [customValue, setCustomValue] = useState("");

  function handleOpenModal(value, name) {
    setSelectedDonation({ value, name });
    setModalOpen(true);
  }

  function handleCustomDonate() {
    const val = parseFloat(customValue.replace(",", "."));
    if (!val || val < 1) {
      alert("Por favor, insira um valor válido (mínimo R$ 1,00).");
      return;
    }
    handleOpenModal(val, "Doação Personalizada");
  }

  function formatCurrency(val) {
    return val.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  }

  return (
    <>
      <Nav />
      
      <section className="relative bg-gradient-to-br from-slate-50 to-blue-50 pt-20 pb-32 overflow-hidden">
        <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-blue-100/50 to-transparent pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-yellow-200/30 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-6xl mx-auto px-6 relative z-10 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white shadow-sm border border-slate-100 mb-8 animate-fade-in-up">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-bold text-slate-600 uppercase tracking-wide">Faça a diferença hoje</span>
          </div>

          <h1 className="text-4xl md:text-6xl font-black text-slate-900 mb-6 leading-tight tracking-tight animate-fade-in-up delay-100">
            Faça sua contribuição para a <br className="hidden md:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-emerald-500">
              APAE – Pinhão
            </span>
          </h1>

          <p className="text-lg md:text-xl text-slate-600 max-w-2xl mx-auto mb-12 leading-relaxed animate-fade-in-up delay-200">
            Escolha um valor, preencha seus dados e receba um QR Code PIX automaticamente. Sua ajuda transforma vidas!
          </p>
        </div>
      </section>

      <section className="relative -mt-24 pb-20 z-20">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            
            {DONATION_ITEMS.map((item, index) => (
              <div 
                key={item.id}
                className="group bg-white rounded-[2rem] p-6 shadow-xl shadow-slate-200/50 border border-slate-100 hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 flex flex-col items-center text-center relative overflow-hidden"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className={`absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r ${item.color}`} />
                
                <div className="w-20 h-20 mb-4 relative">
                  <div className={`absolute inset-0 bg-gradient-to-br ${item.color} opacity-20 rounded-full blur-xl group-hover:opacity-30 transition-opacity`} />
                  <img 
                    src={item.imageUrl} 
                    alt={item.name}
                    className="w-full h-full object-contain relative z-10 drop-shadow-lg group-hover:scale-110 transition-transform duration-500"
                  />
                </div>

                <h3 className="text-2xl font-black text-slate-900 mb-1">
                  {formatCurrency(item.price)}
                </h3>
                
                <p className="text-slate-500 text-xs mb-6 min-h-[32px] leading-relaxed">
                  {item.description}
                </p>

                <button
                  onClick={() => handleOpenModal(item.price, item.name)}
                  className={`w-full py-3 rounded-xl bg-gradient-to-r ${item.color} text-white font-bold text-sm shadow-lg ${item.shadow} hover:shadow-xl hover:scale-105 active:scale-95 transition-all duration-300`}
                >
                  Apoiar agora
                </button>
              </div>
            ))}

            <div className="group bg-white rounded-[2rem] p-6 shadow-xl shadow-slate-200/50 border border-slate-100 hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 flex flex-col items-center text-center relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-slate-400 to-slate-600" />
              
              <div className="w-20 h-20 mb-4 flex items-center justify-center bg-slate-50 rounded-full text-slate-400 group-hover:bg-slate-100 transition-colors">
                <svg width="32" height="32" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </div>

              <h3 className="text-lg font-bold text-slate-900 mb-2">
                Outro valor
              </h3>
              
              <p className="text-slate-500 text-xs mb-4">
                Digite o valor que deseja doar (mínimo R$ 1,00)
              </p>

              <div className="w-full relative mb-4">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">R$</span>
                <input 
                  type="number"
                  min="1"
                  step="0.01"
                  value={customValue}
                  onChange={(e) => setCustomValue(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-400 font-bold text-slate-900 transition-all"
                  placeholder="0,00"
                />
              </div>

              <button
                onClick={handleCustomDonate}
                className="w-full py-3 rounded-xl bg-slate-800 text-white font-bold text-sm shadow-lg shadow-slate-500/20 hover:bg-slate-900 hover:shadow-xl hover:scale-105 active:scale-95 transition-all duration-300"
              >
                Apoiar agora
              </button>
            </div>

          </div>
        </div>
      </section>

      <section className="py-20 bg-slate-50">
        <div className="max-w-4xl mx-auto px-6">
          <div className="bg-white rounded-[2rem] p-8 md:p-12 shadow-xl shadow-slate-200/50 border border-slate-100">
            <div className="flex items-center gap-4 mb-8">
              <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
                <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <rect x="3" y="4" width="18" height="14" rx="2" />
                  <path d="M8 10h8M8 14h4" />
                  <circle cx="7" cy="8" r="1" />
                </svg>
              </div>
              <h2 className="text-2xl md:text-3xl font-bold text-slate-900">
                Você também pode doar através do Imposto de Renda
              </h2>
            </div>

            <div className="text-slate-600 space-y-6 text-lg leading-relaxed">
              <p>
                Você pode destinar parte do seu Imposto de Renda ao Fundo Municipal da Criança e do Adolescente e pedir
                que o valor beneficie a APAE – Pinhão.
              </p>

              <ol className="list-decimal pl-6 space-y-4 marker:text-emerald-600 marker:font-bold">
                <li>
                  <strong>Calcule o valor:</strong> até 6% do IR devido (Pessoa Física) ou 1% (Pessoa Jurídica).
                </li>
                <li>
                  <strong>Deposite no Banco do Brasil:</strong>
                  <ul className="mt-2 pl-4 space-y-1 text-slate-700 bg-slate-50 p-4 rounded-xl border border-slate-200">
                    <li>Agência: <strong>2450-3</strong></li>
                    <li>Conta: <strong>14932-2</strong></li>
                    <li>Favorecido: <strong>Fundo Municipal da Criança e do Adolescente</strong></li>
                  </ul>
                </li>
                <li>
                  <strong>Leve o comprovante ao COMDICAPI:</strong> solicite o recibo e indique destinação à APAE – Pinhão.
                </li>
              </ol>

              <div className="bg-emerald-50 text-emerald-800 p-4 rounded-xl text-sm font-medium border border-emerald-100">
                Assim, você fortalece projetos da instituição sem aumentar o valor do seu imposto — apenas redirecionando.
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 bg-white">
        <div className="max-w-3xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">Dúvidas Frequentes</h2>
            <p className="text-slate-500">Entenda como sua doação ajuda a nossa instituição.</p>
          </div>

          <div className="space-y-6">
            <details className="group bg-slate-50 rounded-2xl p-6 [&_summary::-webkit-details-marker]:hidden cursor-pointer transition-colors hover:bg-slate-100">
              <summary className="flex items-center justify-between gap-4 font-bold text-slate-900">
                Como minha contribuição ajuda?
                <span className="transition group-open:rotate-180">
                  <svg fill="none" height="24" shapeRendering="geometricPrecision" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" viewBox="0 0 24 24" width="24"><path d="M6 9l6 6 6-6"></path></svg>
                </span>
              </summary>
              <p className="mt-4 text-slate-600 leading-relaxed">
                Sua doação é direcionada para a manutenção das nossas atividades diárias, incluindo compra de materiais pedagógicos, alimentação, manutenção do prédio e custeio de terapias especializadas para nossos alunos.
              </p>
            </details>

            <details className="group bg-slate-50 rounded-2xl p-6 [&_summary::-webkit-details-marker]:hidden cursor-pointer transition-colors hover:bg-slate-100">
              <summary className="flex items-center justify-between gap-4 font-bold text-slate-900">
                A doação é recorrente?
                <span className="transition group-open:rotate-180">
                  <svg fill="none" height="24" shapeRendering="geometricPrecision" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" viewBox="0 0 24 24" width="24"><path d="M6 9l6 6 6-6"></path></svg>
                </span>
              </summary>
              <p className="mt-4 text-slate-600 leading-relaxed">
                Não. Ao fazer uma doação por aqui, ela é pontual (única). Você pode voltar e doar novamente sempre que desejar!
              </p>
            </details>

            <details className="group bg-slate-50 rounded-2xl p-6 [&_summary::-webkit-details-marker]:hidden cursor-pointer transition-colors hover:bg-slate-100">
              <summary className="flex items-center justify-between gap-4 font-bold text-slate-900">
                Posso doar de outras formas?
                <span className="transition group-open:rotate-180">
                  <svg fill="none" height="24" shapeRendering="geometricPrecision" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" viewBox="0 0 24 24" width="24"><path d="M6 9l6 6 6-6"></path></svg>
                </span>
              </summary>
              <p className="mt-4 text-slate-600 leading-relaxed">
                Sim! Você pode doar alimentos, roupas, móveis ou ser um voluntário. Entre em contato conosco pelo telefone ou visite nossa sede para saber mais.
              </p>
            </details>
          </div>
        </div>
      </section>

      <DonationModal 
        isOpen={modalOpen} 
        onClose={() => setModalOpen(false)} 
        donationValue={selectedDonation.value}
        donationName={selectedDonation.name}
      />
    </>
  );
}
