"use client";

import { useState, useEffect } from "react";
import Nav from "../components/Nav";

// Carrossel principal 
const SLIDES_MAIN = [
  {
    src: "/images/faxada.JPG",
    title: "APAE – Pinhão",
    caption: "Vista da fachada da instituição, acolhendo a comunidade de Pinhão.",
  },
  {
    src: "/images/patio1.JPG",
    title: "Pátio externo",
    caption: "Espaço para convivência, atividades recreativas e eventos.",
  },
  {
    src: "/images/patio2.JPG",
    title: "Ambientes de integração",
    caption: "Áreas utilizadas em projetos pedagógicos e ações inclusivas.",
  },
  {
    src: "/images/patio3.JPG",
    title: "Estrutura acolhedora",
    caption:
      "Ambiente pensado para o bem-estar das pessoas atendidas pela APAE – Pinhão.",
  },
];

// Carrossel menor – horta
const SLIDES_HORTA = [
  {
    src: "/images/horta1.JPG",
    title: "Horta comunitária",
    caption: "Cultivo realizado com participação dos atendidos e equipe.",
  },
  {
    src: "/images/horta2.JPG",
    title: "Aprendizado na prática",
    caption: "A horta contribui para educação ambiental e alimentação saudável.",
  },
  {
    src: "/images/horta3.JPG",
    title: "Cuidado e inclusão",
    caption:
      "Atividades que estimulam autonomia, convivência e responsabilidade.",
  },
];

// Eventos
const EVENTS = [
  {
    date: "25/11/2025",
    title: "Bazar de Natal Solidário",
    desc: "Venda de artigos e produtos da loja APAE – Pinhão. Toda renda é revertida para os projetos da instituição.",
    tag: "Comunidade",
  },
  {
    date: "03/12/2025",
    title: "Dia Internacional da Pessoa com Deficiência",
    desc: "Programação especial com oficinas, apresentações e ações de conscientização.",
    tag: "Conscientização",
  },
  {
    date: "15/12/2025",
    title: "Feira de Produtos da APAE – Pinhão",
    desc: "Exposição dos itens cadastrados no Portal APAE e produtos produzidos localmente.",
    tag: "Loja APAE",
  },
];

export default function HomePage() {
  const [mainIndex, setMainIndex] = useState(0);
  const [hortaIndex, setHortaIndex] = useState(0);
  const [homeEvents, setHomeEvents] = useState(EVENTS);
  const [showTaxModal, setShowTaxModal] = useState(false);

  // troca automática do carrossel principal
  useEffect(() => {
    const id = setInterval(
      () => setMainIndex((prev) => (prev + 1) % SLIDES_MAIN.length),
      7000
    );
    return () => clearInterval(id);
  }, []);

  // troca automática do carrossel da horta
  useEffect(() => {
    const id = setInterval(
      () => setHortaIndex((prev) => (prev + 1) % SLIDES_HORTA.length),
      6000
    );
    return () => clearInterval(id);
  }, []);

  // Carrega eventos da API e pega os 3 próximos eventos 
  useEffect(() => {
    async function loadEvents() {
      try {
        const res = await fetch("/api/events", { cache: "no-store" });
        if (!res.ok) throw new Error("Falha ao buscar eventos");

        const data = await res.json();
        const all = Array.isArray(data) ? data : [];
        const now = new Date();

        const futureEvents = all
          .filter((ev) => {
            if (!ev.date) return false;
            const d = new Date(ev.date);
            return !isNaN(d.getTime()) && d >= now;
          })
          .sort((a, b) => new Date(a.date) - new Date(b.date))
          .slice(0, 3)
          .map((ev) => {
            const d = new Date(ev.date);
            return {
              date: !isNaN(d.getTime())
                ? d.toLocaleDateString("pt-BR")
                : ev.date,
              title: ev.title || "Evento",
              desc: ev.description || ev.desc || "",
              tag: ev.category || ev.tag || "Evento",
            };
          });

        if (futureEvents.length > 0) {
          setHomeEvents(futureEvents);
        } else {
          setHomeEvents(EVENTS);
        }
      } catch (e) {
        console.error("[home] erro ao carregar eventos:", e);
        setHomeEvents(EVENTS);
      }
    }

    loadEvents();
  }, []);

  const mainSlide = SLIDES_MAIN[mainIndex];
  const hortaSlide = SLIDES_HORTA[hortaIndex];

  //estilos
  const page = {
    minHeight: "calc(100svh - 56px)",
    paddingBottom: 32,
    background: "#e6f3ff", 
  };

  // subtítulo logo abaixo da Nav
  const institutionSubtitleWrap = {
    maxWidth: 1100,
    margin: "0 auto",
    padding: "10px 16px 0 16px",
  };

  const institutionSubtitleText = {
    textAlign: "center",
    fontSize: 24,
    color: "#1f2937",
    fontWeight: 600,
  };

  const hero = {
    padding: "24px 16px 24px 16px",
    maxWidth: 1100,
    margin: "0 auto",
    display: "grid",
    gridTemplateColumns: "minmax(0, 1.1fr) minmax(0, 1.1fr)",
    gap: 28,
    alignItems: "center",
  };

  const heroTitle = {
    fontSize: 34,
    fontWeight: 700,
    color: "#0f172a",
    marginBottom: 10,
  };

  const heroSubtitle = {
    fontSize: 14,
    fontWeight: 600,
    color: "#166534",
    textTransform: "uppercase",
    letterSpacing: 0.12,
    marginBottom: 6,
  };

  const heroText = {
    fontSize: 15,
    color: "#4b5563",
    lineHeight: 1.6,
  };

  const ctas = {
    marginTop: 20,
    display: "flex",
    gap: 12,
    flexWrap: "wrap",
  };

  const btnBase = {
    padding: "10px 18px",
    borderRadius: 999,
    border: "none",
    cursor: "pointer",
    fontWeight: 800,
    textDecoration: "none",
    fontSize: 15,
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
  };

  // Botão Lojinha APAE
  const btnLojinha = {
    ...btnBase,
    padding: "16px 32px",
    fontSize: 17,
    background: "linear-gradient(135deg, #FACC15, #EAB308)",
    color: "#1f2933",
    boxShadow: "0 14px 34px rgba(234,179,8,0.6)",
    textTransform: "uppercase",
    letterSpacing: 1,
  };

  // Botão de imposto de renda 
  const btnTax = {
    ...btnBase,
    padding: "12px 22px",
    background: "linear-gradient(135deg, #FACC15, #EAB308)",
    color: "#1f2933",
    boxShadow: "0 10px 26px rgba(234,179,8,0.58)",
    textTransform: "uppercase",
    letterSpacing: 0.7,
  };

  const lojaIcon = (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 9l1-5h16l1 5" />
      <path d="M3 9h18v11H3z" />
      <path d="M9 13h6" />
      <path d="M9 17h3" />
    </svg>
  );

  // Ícone do modal de IR
  const taxIcon = (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="#16a34a"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="3" y="4" width="18" height="14" rx="2" />
      <path d="M8 10h8" />
      <path d="M8 14h4" />
      <circle cx="7" cy="8" r="1" />
    </svg>
  );

  //carrossel principal
  const mainCarousel = {
    position: "relative",
    borderRadius: 24,
    overflow: "hidden",
    minHeight: 340,
    boxShadow: "0 22px 48px rgba(15,23,42,0.18)",
    background: "#020617",
  };

  const mainImg = {
    width: "100%",
    height: 340,
    objectFit: "cover",
    display: "block",
  };

  const overlay = {
    position: "absolute",
    inset: 0,
    background:
      "linear-gradient(120deg, rgba(15,23,42,0.75) 0%, rgba(15,23,42,0.15) 55%)",
  };

  const slideContent = {
    position: "absolute",
    inset: 0,
    padding: 22,
    display: "flex",
    flexDirection: "column",
    justifyContent: "flex-end",
    color: "#f9fafb",
  };

  const slideTitle = {
    fontSize: 20,
    fontWeight: 700,
    marginBottom: 4,
  };

  const slideCaption = {
    fontSize: 13,
    color: "#e5e7eb",
    maxWidth: 420,
  };

  const bulletsRow = {
    position: "absolute",
    bottom: 12,
    left: 0,
    right: 0,
    display: "flex",
    justifyContent: "center",
    gap: 6,
  };

  const bullet = (active) => ({
    width: active ? 18 : 8,
    height: 8,
    borderRadius: 999,
    background: active ? "#22c55e" : "#94a3b8",
    cursor: "pointer",
    transition: "all 120ms ease-out",
  });

  const arrowBase = {
    position: "absolute",
    top: "50%",
    transform: "translateY(-50%)",
    width: 34,
    height: 34,
    borderRadius: "999px",
    border: "none",
    background: "rgba(15,23,42,0.7)",
    color: "#e5e7eb",
    display: "grid",
    placeItems: "center",
    cursor: "pointer",
    fontSize: 18,
  };

  const arrowLeft = { ...arrowBase, left: 10 };
  const arrowRight = { ...arrowBase, right: 10 };

  //eventos
  const eventsSection = {
    maxWidth: 1100,
    margin: "24px auto 0",
    padding: "0 16px",
  };

  const eventsGrid = {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
    gap: 16,
    marginTop: 14,
  };

  const eventCard = {
    background: "#ffffff",
    borderRadius: 16,
    border: "1px solid #e5e7eb",
    padding: 16,
    boxShadow: "0 10px 24px rgba(15,23,42,0.06)",
  };

  //carrossel da horta
  const hortaSection = {
    maxWidth: 1100,
    margin: "38px auto 24px",
    padding: "0 16px",
  };

  const hortaCarousel = {
    position: "relative",
    borderRadius: 20,
    overflow: "hidden",
    minHeight: 220,
    boxShadow: "0 16px 32px rgba(15,23,42,0.14)",
    background: "#020617",
  };

  const hortaImg = {
    width: "100%",
    height: 220,
    objectFit: "cover",
    display: "block",
  };

  const hortaBullets = {
    position: "absolute",
    bottom: 10,
    left: 0,
    right: 0,
    display: "flex",
    justifyContent: "center",
    gap: 6,
  };

  // seção de contato 
  const contactSection = {
    maxWidth: 1100,
    margin: "0 auto",
    padding: "0 16px 24px 16px",
  };

  const contactCard = {
    background: "#ffffff",
    borderRadius: 20,
    border: "1px solid #e5e7eb",
    padding: 18,
    boxShadow: "0 10px 24px rgba(15,23,42,0.08)",
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: 12,
  };

  const contactTitle = {
    fontSize: 18,
    fontWeight: 700,
    color: "#0f172a",
    marginBottom: 10,
  };

  const contactItem = {
    display: "flex",
    alignItems: "flex-start",
    gap: 10,
    fontSize: 14,
    color: "#374151",
  };

  const contactIconBox = {
    width: 32,
    height: 32,
    borderRadius: 999,
    background: "#e0f2fe",
    display: "grid",
    placeItems: "center",
    color: "#1d4ed8",
    flexShrink: 0,
  };

  const facebookLink = {
    color: "#1d4ed8",
    textDecoration: "none",
    fontWeight: 600,
  };

  const addressLink = {
    color: "#1d4ed8",
    textDecoration: "underline",
    cursor: "pointer",
    fontWeight: 500,
  };

  const socialRow = {
    display: "flex",
    alignItems: "center",
    gap: 6,
    marginTop: 4,
  };

  const socialIconSmall = {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
  };

  const pinIcon = (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 21s-6-4.35-6-10a6 6 0 0 1 12 0c0 5.65-6 10-6 10z" />
      <circle cx="12" cy="11" r="2.5" />
    </svg>
  );

  const phoneIcon = (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.79 19.79 0 0 1 2.1 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11l-1.1 1.1a16 16 0 0 0 6 6l1.1-1.1a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
    </svg>
  );

  const fbIcon = (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="#1877f2"
      stroke="none"
    >
      <path d="M22 12.07C22 6.52 17.52 2 12 2S2 6.52 2 12.07C2 17.1 5.66 21.25 10.44 22v-6.99H8.08v-2.94h2.36v-2.24c0-2.33 1.38-3.62 3.5-3.62.99 0 2.02.18 2.02.18v2.23H14.9c-1.3 0-1.7.81-1.7 1.64v1.81h2.89l-.46 2.94H13.2V22C17.98 21.25 22 17.1 22 12.07z" />
    </svg>
  );

  const fbSmallIcon = (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="#1877f2"
      stroke="none"
    >
      <path d="M22 12.07C22 6.52 17.52 2 12 2S2 6.52 2 12.07C2 17.1 5.66 21.25 10.44 22v-6.99H8.08v-2.94h2.36v-2.24c0-2.33 1.38-3.62 3.5-3.62.99 0 2.02.18 2.02.18v2.23H14.9c-1.3 0-1.7.81-1.7 1.64v1.81h2.89l-.46 2.94H13.2V22C17.98 21.25 22 17.1 22 12.07z" />
    </svg>
  );

  const igIcon = (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="#db2777"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="3" y="3" width="18" height="18" rx="5" ry="5" />
      <circle cx="12" cy="12" r="4" />
      <path d="M17.5 6.5h.01" />
    </svg>
  );

  // ===== estilos do modal de IR =====
  const modalOverlay = {
    position: "fixed",
    inset: 0,
    background: "rgba(15,23,42,0.55)",
    display: "grid",
    placeItems: "center",
    zIndex: 60,
    padding: 16,
  };

  const modalCard = {
    width: "100%",
    maxWidth: 520,
    background: "#ffffff",
    borderRadius: 18,
    border: "1px solid #e5e7eb",
    boxShadow: "0 18px 40px rgba(15,23,42,0.6)",
    padding: 20,
  };

  const modalHeader = {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  };

  const modalTitleWrap = {
    display: "flex",
    alignItems: "center",
    gap: 8,
  };

  const modalTitle = {
    fontSize: 18,
    fontWeight: 700,
    color: "#0f172a",
  };

  const modalCloseBtn = {
    border: "none",
    background: "transparent",
    cursor: "pointer",
    fontSize: 18,
    color: "#6b7280",
  };

  const modalBody = {
    fontSize: 14,
    color: "#374151",
    lineHeight: 1.6,
  };

  const modalList = {
    marginTop: 8,
    marginBottom: 10,
    paddingLeft: 18,
  };

  const modalListItem = {
    marginBottom: 6,
  };

  const modalNote = {
    marginTop: 8,
    fontSize: 12,
    color: "#6b7280",
  };

  return (
    <>
      <Nav />
      <main style={page}>
        {/* subtítulo institucional */}
        <section style={institutionSubtitleWrap}>
          <p style={institutionSubtitleText}>
            Escola básica na modalidade de educação especial Pequeno Príncipe
          </p>
        </section>

        {/* HERO + CARROSSEL PRINCIPAL */}
        <section style={hero}>
          <div>
            <div style={heroSubtitle}>Portal APAE – Pinhão</div>
            <h1 style={heroTitle}>Bem-vindo ao nosso Portal</h1>
            <p style={heroText}>
              A APAE – Pinhão é uma instituição sem fins lucrativos, que oferece
              atendimento educacional especializado, apoio às famílias e ações
              de inclusão social. Ao comprar na nossa lojinha solidária, você
              contribui diretamente para a manutenção das atividades
              pedagógicas, terapêuticas e projetos da escola, fortalecendo o
              cuidado e a inclusão de quem mais precisa.
            </p>
            <div style={ctas}>
              <a href="/products" style={btnLojinha}>
                {lojaIcon} CONFIRA NOSSA LOJINHA
              </a>
            </div>
          </div>

          <div style={mainCarousel}>
            <img src={mainSlide.src} alt={mainSlide.title} style={mainImg} />
            <div style={overlay} />
            <div style={slideContent}>
              <div style={slideTitle}>{mainSlide.title}</div>
              <div style={slideCaption}>{mainSlide.caption}</div>
            </div>

            {/* setas */}
            <button
              type="button"
              style={arrowLeft}
              onClick={() =>
                setMainIndex(
                  (mainIndex - 1 + SLIDES_MAIN.length) % SLIDES_MAIN.length
                )
              }
              aria-label="Slide anterior"
            >
              ‹
            </button>
            <button
              type="button"
              style={arrowRight}
              onClick={() =>
                setMainIndex((mainIndex + 1) % SLIDES_MAIN.length)
              }
              aria-label="Próximo slide"
            >
              ›
            </button>

            {/* bullets */}
            <div style={bulletsRow}>
              {SLIDES_MAIN.map((_, i) => (
                <div
                  key={i}
                  style={bullet(i === mainIndex)}
                  onClick={() => setMainIndex(i)}
                />
              ))}
            </div>
          </div>
        </section>

        {/* EVENTOS E CAMPANHAS */}
        <section style={eventsSection}>
          <h2 style={{ fontSize: 22, color: "#0f172a", marginBottom: 6 }}>
            Eventos e campanhas 
          </h2>
          <p style={{ fontSize: 14, color: "#4b5563", marginBottom: 10 }}>
            Fique por dentro das próximas ações solidárias, datas especiais e
            oportunidades de participação da comunidade.
          </p>

          <div style={eventsGrid}>
            {homeEvents.map((ev) => (
              <article key={ev.title + ev.date} style={eventCard}>
                <div
                  style={{
                    fontSize: 12,
                    color: "#0f766e",
                    fontWeight: 600,
                    textTransform: "uppercase",
                  }}
                >
                  {ev.date}
                </div>
                <h3
                  style={{
                    marginTop: 6,
                    marginBottom: 4,
                    fontSize: 16,
                    color: "#111827",
                  }}
                >
                  {ev.title}
                </h3>
                {ev.desc && (
                  <p
                    style={{
                      margin: 0,
                      fontSize: 14,
                      color: "#4b5563",
                      lineHeight: 1.5,
                    }}
                  >
                    {ev.desc}
                  </p>
                )}
                <span
                  style={{
                    display: "inline-block",
                    marginTop: 10,
                    fontSize: 11,
                    padding: "3px 8px",
                    borderRadius: 999,
                    background: "#f1f5f9",
                    color: "#475569",
                  }}
                >
                  {ev.tag}
                </span>
              </article>
            ))}
          </div>

          {/* Botão para modal de doação via IR */}
          <div
            style={{
              marginTop: 22,
              display: "flex",
              justifyContent: "center",
            }}
          >
            <button
              type="button"
              style={btnTax}
              onClick={() => setShowTaxModal(true)}
            >
              {taxIcon} Como doar através do Imposto de Renda?
            </button>
          </div>
        </section>

        {/* CARROSSEL DA HORTA */}
        <section style={hortaSection}>
          <h2 style={{ fontSize: 22, color: "#0f172a", marginBottom: 6 }}>
            Projeto da horta dos alunos
          </h2>
          <p
            style={{
              fontSize: 14,
              color: "#4b5563",
              marginBottom: 14,
              maxWidth: 720,
            }}
          >
            A horta dos alunos é um espaço de aprendizado, terapia ocupacional
            e integração com a natureza. As imagens a seguir mostram um pouco
            desse trabalho realizado com os atendidos e a equipe da APAE –
            Pinhão.
          </p>

          <div style={hortaCarousel}>
            <img src={hortaSlide.src} alt={hortaSlide.title} style={hortaImg} />
            <div style={overlay} />
            <div style={slideContent}>
              <div style={slideTitle}>{hortaSlide.title}</div>
              <div style={slideCaption}>{hortaSlide.caption}</div>
            </div>

            {/* bullets menores */}
            <div style={hortaBullets}>
              {SLIDES_HORTA.map((_, i) => (
                <div
                  key={i}
                  style={bullet(i === hortaIndex)}
                  onClick={() => setHortaIndex(i)}
                />
              ))}
            </div>
          </div>
        </section>

        {/* CONTATO E INFORMAÇÕES DA APAE */}
        <section style={contactSection}>
          <h2 style={contactTitle}>Informações de contato – APAE Pinhão</h2>
          <div style={contactCard}>
            <div style={contactItem}>
              <div style={contactIconBox}>{pinIcon}</div>
              <div>
                <strong>Endereço</strong>
                <div>
                  <a
                    href="https://www.google.com/maps?q=APAE+Pinh%C3%A3o+PR"
                    target="_blank"
                    rel="noreferrer"
                    style={addressLink}
                  >
                    Rua XV de Novembro, 30
                    <br />
                    Pinhão - PR, CEP 85170-000
                  </a>
                </div>
              </div>
            </div>

            <div style={contactItem}>
              <div style={contactIconBox}>{phoneIcon}</div>
              <div>
                <strong>Telefone</strong>
                <div>(42) 9 9828-3685</div>
                <div>(42) 9 9966-2008</div>
                <div>(42) 3677-1653</div>
                <div>(42) 3677-3792</div>
              </div>
            </div>

            <div style={contactItem}>
              <div style={contactIconBox}>{fbIcon}</div>
              <div>
                <strong>Redes sociais</strong>

                <div style={socialRow}>
                  <span style={socialIconSmall}>{fbSmallIcon}</span>
                  <a
                    href="https://www.facebook.com/p/APAE-Pinh%C3%A3o-100057227448645/"
                    target="_blank"
                    rel="noreferrer"
                    style={facebookLink}
                  >
                    /APAE-Pinhão
                  </a>
                </div>

                <div style={socialRow}>
                  <span style={socialIconSmall}>{igIcon}</span>
                  <a
                    href="https://www.instagram.com/apae_pinhaopr/?hl=en"
                    target="_blank"
                    rel="noreferrer"
                    style={facebookLink}
                  >
                    @apae_pinhaopr
                  </a>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* MODAL DE DOAÇÃO VIA IMPOSTO DE RENDA */}
        {showTaxModal && (
          <div
            style={modalOverlay}
            onClick={() => setShowTaxModal(false)}
          >
            <div
              style={modalCard}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={modalHeader}>
                <div style={modalTitleWrap}>
                  {taxIcon}
                  <span style={modalTitle}>
                    Como doar através do Imposto de Renda
                  </span>
                </div>
                <button
                  type="button"
                  style={modalCloseBtn}
                  onClick={() => setShowTaxModal(false)}
                  aria-label="Fechar"
                >
                  ×
                </button>
              </div>

              <div style={modalBody}>
                <p>
                  Você pode destinar parte do seu Imposto de Renda ao Fundo
                  Municipal da Criança e do Adolescente e pedir que o valor
                  beneficie a APAE – Pinhão.
                </p>
                <ol style={modalList}>
                  <li style={modalListItem}>
                    <strong>Calcule o valor:</strong> com ajuda de um
                    contador, defina até quanto pode doar – até{" "}
                    <strong>6% do IR devido (Pessoa Física)</strong> ou{" "}
                    <strong>1% (Pessoa Jurídica)</strong>.
                  </li>
                  <li style={modalListItem}>
                    <strong>Faça o depósito:</strong> deposite esse valor no{" "}
                    <strong>Banco do Brasil</strong> – Agência{" "}
                    <strong>2450-3</strong>, Conta Corrente{" "}
                    <strong>14932-2</strong>, em nome do{" "}
                    <strong>Fundo Municipal da Criança e do Adolescente</strong>.
                  </li>
                  <li style={modalListItem}>
                    <strong>Garanta a destinação:</strong> com o comprovante e
                    seu CPF/CNPJ, vá ao{" "}
                    <strong>COMDICAPI de Pinhão</strong>, solicite o recibo
                    para dedução no IR e informe que a doação deve ser
                    destinada à <strong>APAE de Pinhão</strong>.
                  </li>
                </ol>
                <p style={modalNote}>
                  Assim, você fortalece os projetos da instituição sem aumentar
                  o valor total do seu imposto – apenas direcionando parte dele
                  para quem mais precisa. 💛
                </p>
              </div>
            </div>
          </div>
        )}
      </main>
    </>
  );
}
