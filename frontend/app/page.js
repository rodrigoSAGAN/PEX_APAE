"use client";
 
import { useState, useEffect, useCallback } from "react";
import Nav from "../components/Nav";
import useEmblaCarousel from "embla-carousel-react";
import Autoplay from "embla-carousel-autoplay";
 
const SLIDES_MAIN = [
 { src: "/images/faxada.JPG", title: "APAE – Pinhão", caption: "Vista da fachada da instituição, acolhendo a comunidade de Pinhão." },
 { src: "/images/patio1.JPG", title: "Pátio externo", caption: "Espaço para convivência, atividades recreativas e eventos." },
 { src: "/images/patio2.JPG", title: "Ambientes de integração", caption: "Áreas utilizadas em projetos pedagógicos e ações inclusivas." },
 { src: "/images/patio3.JPG", title: "Estrutura acolhedora", caption: "Ambiente pensado para o bem-estar das pessoas atendidas." },
];
 
const SLIDES_HORTA = [
 { src: "/images/horta1.JPG", title: "Horta comunitária", caption: "Cultivo realizado com participação dos atendidos e equipe." },
 { src: "/images/horta2.JPG", title: "Aprendizado na prática", caption: "A horta contribui para educação ambiental e alimentação saudável." },
 { src: "/images/horta3.JPG", title: "Cuidado e inclusão", caption: "Atividades que estimulam autonomia, convivência e responsabilidade." },
];
 
const EVENTS = [
 { date: "25/11/2025", title: "Bazar de Natal Solidário", desc: "Venda de artigos e produtos da loja APAE – Pinhão.", tag: "Comunidade", image: "/images/events/bazar-natal.jpg" },
 { date: "03/12/2025", title: "Dia Internacional da Pessoa com Deficiência", desc: "Oficinas, apresentações e ações de conscientização.", tag: "Conscientização", image: "/images/events/dia-deficiencia.jpg" },
 { date: "15/12/2025", title: "Feira de Produtos da APAE – Pinhão", desc: "Exposição dos itens cadastrados no Portal APAE.", tag: "Loja APAE", image: "/images/events/feira-produtos.jpg" },
];
 
export default function HomePage() {
 const [homeEvents, setHomeEvents] = useState(EVENTS);
 const [showTaxModal, setShowTaxModal] = useState(false);
 const [galleryFilter, setGalleryFilter] = useState("Todos");
 
 const galleryImages = [
   { src: "/images/gallery/event1.jpg", category: "Eventos", label: "Festa Junina 2024" },
   { src: "/images/gallery/pedagogico1.jpg", category: "Atividades Pedagógicas", label: "Aula de Artes" },
   { src: "/images/gallery/momento1.jpg", category: "Momentos Especiais", label: "Visita ao Parque" },
   { src: "/images/gallery/event2.jpg", category: "Eventos", label: "Dia das Crianças" },
   { src: "/images/gallery/pedagogico2.jpg", category: "Atividades Pedagógicas", label: "Horta Comunitária" },
   { src: "/images/gallery/momento2.jpg", category: "Momentos Especiais", label: "Apresentação de Natal" },
 ];
 
 const filteredImages = galleryFilter === "Todos"
   ? galleryImages
   : galleryImages.filter(img => img.category === galleryFilter);
 
 const [emblaRefMain, emblaApiMain] = useEmblaCarousel({ loop: true }, [Autoplay({ delay: 6000 })]);
 const [selectedIndexMain, setSelectedIndexMain] = useState(0);
 
 const onSelectMain = useCallback(() => {
   if (!emblaApiMain) return;
   setSelectedIndexMain(emblaApiMain.selectedScrollSnap());
 }, [emblaApiMain]);
 
 useEffect(() => {
   if (!emblaApiMain) return;
   onSelectMain();
   emblaApiMain.on("select", onSelectMain);
   return () => emblaApiMain.off("select", onSelectMain);
 }, [emblaApiMain, onSelectMain]);
 
 const scrollPrevMain = useCallback(() => emblaApiMain && emblaApiMain.scrollPrev(), [emblaApiMain]);
 const scrollNextMain = useCallback(() => emblaApiMain && emblaApiMain.scrollNext(), [emblaApiMain]);
 const scrollToMain = useCallback((index) => emblaApiMain && emblaApiMain.scrollTo(index), [emblaApiMain]);
 
 const [emblaRefHorta, emblaApiHorta] = useEmblaCarousel({ loop: true }, [Autoplay({ delay: 5500 })]);
 const [selectedIndexHorta, setSelectedIndexHorta] = useState(0);
 
 const onSelectHorta = useCallback(() => {
   if (!emblaApiHorta) return;
   setSelectedIndexHorta(emblaApiHorta.selectedScrollSnap());
 }, [emblaApiHorta]);
 
 useEffect(() => {
   if (!emblaApiHorta) return;
   onSelectHorta();
   emblaApiHorta.on("select", onSelectHorta);
   return () => emblaApiHorta.off("select", onSelectHorta);
 }, [emblaApiHorta, onSelectHorta]);
 
 const scrollPrevHorta = useCallback(() => emblaApiHorta && emblaApiHorta.scrollPrev(), [emblaApiHorta]);
 const scrollNextHorta = useCallback(() => emblaApiHorta && emblaApiHorta.scrollNext(), [emblaApiHorta]);
 const scrollToHorta = useCallback((index) => emblaApiHorta && emblaApiHorta.scrollTo(index), [emblaApiHorta]);
 
 useEffect(() => {
   async function loadEvents() {
     try {
       const res = await fetch("/api/events", { cache: "no-store" });
       if (!res.ok) throw new Error();
       const data = await res.json();
 
       const now = new Date();
       const future = data
         .filter((ev) => ev.date && new Date(ev.date) >= now)
         .sort((a, b) => new Date(a.date) - new Date(b.date))
         .slice(0, 3)
         .map((ev) => ({
           date: new Date(ev.date).toLocaleDateString("pt-BR"),
           title: ev.title,
           desc: ev.description ?? ev.desc,
           tag: ev.category ?? ev.tag,
           image: ev.coverImage ?? ev.image ?? null,
         }));
 
       setHomeEvents(future.length ? future : EVENTS);
     } catch {
       setHomeEvents(EVENTS);
     }
   }
   loadEvents();
 }, []);
 
 const lojaIcon = (
   <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
     <path d="M3 9l1-5h16l1 5M3 9h18v11H3zM9 13h6M9 17h3" />
   </svg>
 );
 
 const taxIcon = (
   <svg width="20" height="20" fill="none" stroke="#16a34a" strokeWidth="2">
     <rect x="3" y="4" width="18" height="14" rx="2" />
     <path d="M8 10h8M8 14h4" />
     <circle cx="7" cy="8" r="1" />
   </svg>
 );
 
 return (
   <>
     <Nav />
 
     <main className="bg-gradient-to-b from-sky-50 to-white min-h-screen pb-[80px]">
 
       <section className="max-w-6xl mx-auto px-6 mt-8 grid md:grid-cols-2 gap-12 items-center">
         <div className="space-y-4">
           <p className="uppercase text-green-700 font-semibold tracking-widest text-sm">
             Portal APAE – Pinhão
           </p>
           <h1 className="text-2xl md:text-4xl tracking-tight font-bold text-slate-900">
             Bem-vindo ao nosso Portal
           </h1>
           <p className="text-slate-600 leading-relaxed text-base">
             A APAE – Pinhão é uma instituição sem fins lucrativos, que oferece atendimento especializado,
             apoio às famílias e ações de inclusão social. Ao comprar na nossa loja solidária, você contribui diretamente
             para a manutenção das atividades pedagógicas e terapêuticas.
           </p>
            <div className="pt-6">
              <a
                href="/products"
                className="inline-flex items-center gap-4 bg-gradient-to-r from-yellow-400 to-yellow-500 text-slate-900 font-extrabold px-10 py-4 rounded-full shadow-2xl hover:shadow-yellow-400/50 hover:scale-105 transition-all duration-300 text-lg border-4 border-yellow-300"
              >
                {lojaIcon}
                CONFIRA NOSSA LOJA
              </a>
            </div>
         </div>
 
         <div className="relative rounded-3xl overflow-hidden shadow-2xl h-[360px] group" ref={emblaRefMain}>
           <div className="flex h-full">
             {SLIDES_MAIN.map((slide, index) => (
               <div key={index} className="relative min-w-full h-full">
                 <img src={slide.src} alt={slide.title} className="object-cover w-full h-full" />
                 <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-black/20" />
                 <div className="absolute bottom-4 left-4 text-white">
                   <h3 className="text-xl font-bold">{slide.title}</h3>
                   <p className="text-sm opacity-90 max-w-xs">{slide.caption}</p>
                 </div>
               </div>
             ))}
           </div>
 
           <button
             className="absolute top-1/2 -translate-y-1/2 left-3 bg-black/40 hover:bg-black/60 text-white w-9 h-9 rounded-full grid place-items-center z-10 opacity-0 group-hover:opacity-100 transition-opacity"
             onClick={scrollPrevMain}
           >
             ‹
           </button>
 
           <button
             className="absolute top-1/2 -translate-y-1/2 right-3 bg-black/40 hover:bg-black/60 text-white w-9 h-9 rounded-full grid place-items-center z-10 opacity-0 group-hover:opacity-100 transition-opacity"
             onClick={scrollNextMain}
           >
             ›
           </button>
 
           <div className="absolute bottom-3 w-full flex justify-center gap-2 z-10">
             {SLIDES_MAIN.map((_, i) => (
               <button
                 key={i}
                 onClick={() => scrollToMain(i)}
                 className={`h-2 rounded-full transition-all ${i === selectedIndexMain ? "w-6 bg-emerald-400" : "w-2 bg-white/70"
                   }`}
               />
             ))}
           </div>
         </div>
       </section>
 
       <section className="max-w-6xl mx-auto px-6 mt-16">
         <h2 className="text-3xl font-bold text-slate-900 mb-2">
           Eventos e campanhas
         </h2>
 
         <p className="text-slate-600 mb-6">
           Acompanhe as próximas ações da APAE – Pinhão.
         </p>
 
         <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
           {homeEvents.map((ev) => (
             <div
               key={ev.title}
               className="bg-white rounded-2xl shadow-md border border-slate-100 overflow-hidden transition hover:shadow-lg"
             >
               {/* Imagem de capa do evento */}
               {ev.image && (
                 <div className="relative h-48 w-full overflow-hidden bg-slate-200">
                   <img
                     src={ev.image}
                     alt={ev.title}
                     className="w-full h-full object-cover"
                     onError={(e) => {
                       e.currentTarget.src = "/images/imagem-erro.jpeg";
                       e.currentTarget.onerror = null;
                     }}
                   />
                 </div>
               )}
 
               <div className="p-5">
                 <p className="text-xs font-bold uppercase text-teal-700 tracking-widest">
                   {ev.date}
                 </p>
 
                 <h3 className="text-lg font-semibold text-slate-900 mt-2">
                   {ev.title}
                 </h3>
 
                 <p className="text-sm text-slate-600 mt-1 leading-relaxed">
                   {ev.desc}
                 </p>
 
                 <span className="inline-block mt-4 text-xs bg-slate-200 px-3 py-1 rounded-full text-slate-700 font-medium">
                   {ev.tag}
                 </span>
               </div>
             </div>
           ))}
         </div>
 
         <div className="flex justify-center mt-10">
           <button
             onClick={() => setShowTaxModal(true)}
             className="inline-flex items-center gap-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-extrabold px-10 py-4 rounded-full shadow-2xl hover:shadow-green-500/50 hover:scale-105 transition-all duration-300 text-base md:text-lg border-2 border-green-400"
           >
             {taxIcon}
             Como doar através do Imposto de Renda?
           </button>
         </div>
       </section>
 
       <section className="max-w-6xl mx-auto px-6 mt-20">
         <h2 className="text-3xl font-bold text-slate-900 mb-2">
           Projeto da horta dos alunos
         </h2>
 
         <p className="text-slate-600 max-w-xl leading-relaxed mb-4">
           A horta é um espaço de aprendizado, terapia ocupacional e contato direto com a natureza.
         </p>
 
         <div className="relative h-[260px] rounded-3xl overflow-hidden shadow-lg mt-3 group" ref={emblaRefHorta}>
           <div className="flex h-full">
             {SLIDES_HORTA.map((slide, index) => (
               <div key={index} className="relative min-w-full h-full">
                 <img src={slide.src} alt={slide.title} className="w-full h-full object-cover" />
                 <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-black/20" />
                 <div className="absolute bottom-4 left-4 text-white">
                   <h3 className="text-xl font-semibold">{slide.title}</h3>
                   <p className="text-sm opacity-90 max-w-xs">{slide.caption}</p>
                 </div>
               </div>
             ))}
           </div>
 
           <button
             className="absolute top-1/2 -translate-y-1/2 left-3 bg-black/40 hover:bg-black/60 text-white w-8 h-8 rounded-full grid place-items-center z-10 opacity-0 group-hover:opacity-100 transition-opacity"
             onClick={scrollPrevHorta}
           >
             ‹
           </button>
 
           <button
             className="absolute top-1/2 -translate-y-1/2 right-3 bg-black/40 hover:bg-black/60 text-white w-8 h-8 rounded-full grid place-items-center z-10 opacity-0 group-hover:opacity-100 transition-opacity"
             onClick={scrollNextHorta}
           >
             ›
           </button>
 
           <div className="absolute bottom-3 w-full flex justify-center gap-2 z-10">
             {SLIDES_HORTA.map((_, i) => (
               <button
                 key={i}
                 onClick={() => scrollToHorta(i)}
                 className={`h-2 rounded-full transition-all ${i === selectedIndexHorta ? "w-6 bg-emerald-400" : "w-2 bg-white/70"
                   }`}
               />
             ))}
           </div>
         </div>
       </section>
 
       <section className="max-w-6xl mx-auto px-6 py-16 bg-white rounded-3xl my-10 shadow-sm border border-slate-100">
         <div className="text-center mb-10">
           <h2 className="text-3xl font-bold text-slate-900 mb-2">Galeria de Fotos</h2>
           <p className="text-slate-600 max-w-2xl mx-auto">
             Veja momentos especiais, eventos e atividades pedagógicas na APAE – Pinhão.
           </p>
         </div>
 
         <div className="flex flex-wrap justify-center gap-3 mb-10">
           {["Todos", "Eventos", "Atividades Pedagógicas", "Momentos Especiais"].map((cat) => (
             <button
               key={cat}
               onClick={() => setGalleryFilter(cat)}
               className={`px-5 py-2 rounded-full text-sm font-semibold transition-all shadow-sm
                 ${galleryFilter === cat
                   ? "bg-emerald-500 text-white shadow-emerald-200"
                   : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                 }`}
             >
               {cat}
             </button>
           ))}
         </div>
 
         <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
           {filteredImages.map((img, idx) => (
             <div
               key={idx}
               className="group relative h-64 rounded-2xl overflow-hidden shadow-md cursor-pointer animate-in fade-in zoom-in-95 duration-500"
             >
               <img
                 src={img.src}
                 alt={img.label}
                 className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110 bg-slate-200" onError={(e) => { e.currentTarget.src = "/images/imagem-erro.jpeg"; e.currentTarget.onerror = null; }}
               />
 
               <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-6">
                 <div>
                   <span className="text-emerald-300 text-xs font-bold uppercase tracking-wider mb-1 block">
                     {img.category}
                   </span>
                   <p className="text-white font-semibold text-lg leading-tight">
                     {img.label}
                   </p>
                 </div>
               </div>
             </div>
           ))}
         </div>
       </section>
 
       <section className="max-w-6xl mx-auto px-6 pt-16 pb-0">
         <h2 className="text-3xl font-bold text-slate-900 mb-2 text-center">
           Como chegar na APAE
         </h2>
         <p className="text-slate-600 mb-8 text-center max-w-2xl mx-auto">
           Veja a localização exata da APAE – Pinhão e encontre a melhor rota até nós.
         </p>
 
         <div className="w-full h-[350px] md:h-[420px] lg:h-[480px] rounded-2xl overflow-hidden shadow-xl bg-slate-100 mb-8">
           <iframe
             src="https://www.google.com/maps?q=APAE+Pinh%C3%A3o+PR&output=embed&hl=pt-BR"
             width="100%"
             height="100%"
             style={{ border: 0 }}
             allowFullScreen=""
             loading="lazy"
             referrerPolicy="no-referrer-when-downgrade"
           />
         </div>
 
         <div className="flex justify-center">
           <a
             href="https://www.google.com/maps?q=APAE+Pinh%C3%A3o+PR"
             target="_blank"
             rel="noopener noreferrer"
             className="rounded-full bg-emerald-500 hover:bg-emerald-600 text-white font-semibold px-6 py-3 shadow-lg transition-colors"
           >
             Ir para a APAE
           </a>
         </div>
       </section>
     </main>
 
     {showTaxModal && (
       <div
         className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
         onClick={() => setShowTaxModal(false)}
       >
         <div
           className="bg-white rounded-3xl max-w-3xl w-full h-[75vh] overflow-y-auto shadow-2xl"
           onClick={(e) => e.stopPropagation()}
         >
           <div className="sticky top-0 bg-white border-b border-slate-100 p-6 flex items-center justify-between rounded-t-3xl">
             <div className="flex items-center gap-3">
               <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
                 <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                   <rect x="3" y="4" width="18" height="14" rx="2" />
                   <path d="M8 10h8M8 14h4" />
                   <circle cx="7" cy="8" r="1" />
                 </svg>
               </div>
               <h2 className="text-2xl font-bold text-slate-900">
                 Doação via Imposto de Renda
               </h2>
             </div>
             <button
               onClick={() => setShowTaxModal(false)}
               className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors"
               aria-label="Fechar"
             >
               <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                 <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
               </svg>
             </button>
           </div>
 
           <div className="p-6 md:p-8">
             <div className="text-slate-600 space-y-6 text-base leading-relaxed">
               <p className="text-lg">
                 Você pode destinar parte do seu Imposto de Renda ao Fundo Municipal da Criança e do Adolescente e pedir
                 que o valor beneficie a APAE – Pinhão.
               </p>
 
               <ol className="list-decimal pl-6 space-y-4 marker:text-emerald-600 marker:font-bold">
                 <li>
                   <strong className="text-slate-900">Calcule o valor:</strong> até 6% do IR devido (Pessoa Física) ou 1% (Pessoa Jurídica).
                 </li>
                 <li>
                   <strong className="text-slate-900">Deposite no Banco do Brasil:</strong>
                   <ul className="mt-3 pl-4 space-y-2 text-slate-700 bg-emerald-50 p-4 rounded-xl border border-emerald-200">
                     <li className="flex items-center gap-2">
                       <span className="font-normal">Agência:</span>
                       <strong className="font-bold text-slate-900">2450-3</strong>
                     </li>
                     <li className="flex items-center gap-2">
                       <span className="font-normal">Conta:</span>
                       <strong className="font-bold text-slate-900">14932-2</strong>
                     </li>
                     <li className="flex flex-col gap-1">
                       <span className="font-normal">Favorecido:</span>
                       <strong className="font-bold text-slate-900">Fundo Municipal da Criança e do Adolescente</strong>
                     </li>
                   </ul>
                 </li>
                 <li>
                   <strong className="text-slate-900">Leve o comprovante ao COMDICAPI:</strong> solicite o recibo e indique destinação à APAE – Pinhão.
                 </li>
               </ol>
 
               <div className="bg-emerald-50 text-emerald-800 p-5 rounded-xl text-sm font-medium border border-emerald-200 flex items-start gap-3">
                 <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                   <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                 </svg>
                 <p>
                   Assim, você fortalece projetos da instituição sem aumentar o valor do seu imposto — apenas redirecionando.
                 </p>
               </div>
             </div>
 
             <div className="mt-8 flex flex-col sm:flex-row gap-3">
               <a
                 href="/apoiar"
                 className="flex-1 inline-flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-6 py-3 rounded-xl transition-colors shadow-lg"
               >
                 <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                   <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                 </svg>
                 Ver outras formas de apoiar
               </a>
               <button
                 onClick={() => setShowTaxModal(false)}
                 className="flex-1 inline-flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-900 font-bold px-6 py-3 rounded-xl transition-colors"
               >
                 Fechar
               </button>
             </div>
           </div>
         </div>
       </div>
     )}
   </>
 );
}