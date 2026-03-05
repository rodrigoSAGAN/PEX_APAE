"use client";

// Importa hook do React para gerenciamento de estado
import { useState } from "react";

// Componentes reutilizáveis da aplicação
import Nav from "../../components/Nav";
import DonationModal from "../../components/DonationModal";

/*
Lista de valores de doação pré-definidos.
Cada item representa uma opção que o usuário pode escolher para contribuir.
As propriedades controlam também o estilo visual do card exibido na interface.
*/
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

/*
Página responsável por permitir que usuários realizem doações
para a APAE – Pinhão. O usuário pode escolher valores fixos ou
informar um valor personalizado. Após selecionar o valor,
um modal é aberto para geração do pagamento via PIX.
*/
export default function ApoiarPage() {

  // Controla abertura e fechamento do modal de doação
  const [modalOpen, setModalOpen] = useState(false);

  // Armazena a doação selecionada (valor e nome)
  const [selectedDonation, setSelectedDonation] = useState({ value: 0, name: "" });

  // Armazena o valor digitado manualmente pelo usuário
  const [customValue, setCustomValue] = useState("");

  /*
  Função chamada quando o usuário seleciona um valor de doação.
  Ela salva o valor escolhido e abre o modal de pagamento.
  */
  function handleOpenModal(value, name) {
    setSelectedDonation({ value, name });
    setModalOpen(true);
  }

  /*
  Processa doações personalizadas inseridas manualmente.
  Valida se o valor digitado é válido antes de abrir o modal.
  */
  function handleCustomDonate() {
    const val = parseFloat(customValue.replace(",", "."));

    if (!val || val < 1) {
      alert("Por favor, insira um valor válido (mínimo R$ 1,00).");
      return;
    }

    handleOpenModal(val, "Doação Personalizada");
  }

  /*
  Função utilitária responsável por formatar valores
  monetários no padrão brasileiro (Real - BRL).
  */
  function formatCurrency(val) {
    return val.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  }

  return (
    <>
      {/* Barra de navegação principal da aplicação */}
      <Nav />
      
      {/* Seção de destaque da página de doações */}
      <section className="relative bg-gradient-to-br from-slate-50 to-blue-50 pt-20 pb-32 overflow-hidden">

        {/* Elementos visuais decorativos */}
        <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-blue-100/50 to-transparent pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-yellow-200/30 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-6xl mx-auto px-6 relative z-10 text-center">

          {/* Indicador visual de ação */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white shadow-sm border border-slate-100 mb-8 animate-fade-in-up">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-bold text-slate-600 uppercase tracking-wide">
              Faça a diferença hoje
            </span>
          </div>

          {/* Título principal da página */}
          <h1 className="text-4xl md:text-6xl font-black text-slate-900 mb-6 leading-tight tracking-tight animate-fade-in-up delay-100">
            Faça sua contribuição para a <br className="hidden md:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-emerald-500">
              APAE – Pinhão
            </span>
          </h1>

          {/* Texto explicativo */}
          <p className="text-lg md:text-xl text-slate-600 max-w-2xl mx-auto mb-12 leading-relaxed animate-fade-in-up delay-200">
            Escolha um valor, preencha seus dados e receba um QR Code PIX automaticamente. 
            Sua ajuda transforma vidas!
          </p>
        </div>
      </section>

      {/* Seção com os cards de doação */}
      <section className="relative -mt-24 pb-20 z-20">
        <div className="max-w-6xl mx-auto px-6">

          {/* Grid de opções de doação */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            
            {/* Renderiza automaticamente cada valor de doação */}
            {DONATION_ITEMS.map((item, index) => (
              <div 
                key={item.id}
                className="group bg-white rounded-[2rem] p-6 shadow-xl shadow-slate-200/50 border border-slate-100 hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 flex flex-col items-center text-center relative overflow-hidden"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                {/* Barra decorativa superior */}
                <div className={`absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r ${item.color}`} />
                
                {/* Imagem ilustrativa da doação */}
                <div className="w-20 h-20 mb-4 relative">
                  <div className={`absolute inset-0 bg-gradient-to-br ${item.color} opacity-20 rounded-full blur-xl group-hover:opacity-30 transition-opacity`} />
                  <img 
                    src={item.imageUrl} 
                    alt={item.name}
                    className="w-full h-full object-contain relative z-10 drop-shadow-lg group-hover:scale-110 transition-transform duration-500"
                  />
                </div>

                {/* Valor da doação */}
                <h3 className="text-2xl font-black text-slate-900 mb-1">
                  {formatCurrency(item.price)}
                </h3>
                
                {/* Descrição do impacto da doação */}
                <p className="text-slate-500 text-xs mb-6 min-h-[32px] leading-relaxed">
                  {item.description}
                </p>

                {/* Botão para iniciar doação */}
                <button
                  onClick={() => handleOpenModal(item.price, item.name)}
                  className={`w-full py-3 rounded-xl bg-gradient-to-r ${item.color} text-white font-bold text-sm shadow-lg ${item.shadow} hover:shadow-xl hover:scale-105 active:scale-95 transition-all duration-300`}
                >
                  Apoiar agora
                </button>
              </div>
            ))}

            {/* Card para doação personalizada */}
            <div className="group bg-white rounded-[2rem] p-6 shadow-xl shadow-slate-200/50 border border-slate-100 hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 flex flex-col items-center text-center relative overflow-hidden">

              {/* Input de valor personalizado */}
              <div className="w-full relative mb-4">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">R$</span>

                {/* Campo de entrada do valor */}
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

              {/* Botão de confirmação da doação personalizada */}
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

      {/* Modal responsável por gerar o QR Code de pagamento PIX */}
      <DonationModal 
        isOpen={modalOpen} 
        onClose={() => setModalOpen(false)} 
        donationValue={selectedDonation.value}
        donationName={selectedDonation.name}
      />
    </>
  );
}