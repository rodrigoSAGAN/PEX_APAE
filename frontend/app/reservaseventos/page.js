"use client";
 
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Nav from "../../components/Nav";
import { getIdTokenOrNull } from "../../lib/authToken";
 
export default function ReservasEventosPage() {
   const router = useRouter();
   const [loading, setLoading] = useState(true);
   const [data, setData] = useState([]);
   const [filteredData, setFilteredData] = useState([]);
   const [searchTerm, setSearchTerm] = useState("");
   const [error, setError] = useState("");
 
   useEffect(() => {
       async function init() {
           try {
               const token = await getIdTokenOrNull();
               if (!token) {
                   router.push("/login");
                   return;
               }
 
               const res = await fetch("/api/events/reservations", {
                   headers: {
                       Authorization: `Bearer ${token}`,
                   },
               });
 
               if (res.status === 403 || res.status === 401) {
                   setError("Acesso negado. Você não tem permissão para ver esta página.");
                   setLoading(false);
                   return;
               }
 
               if (!res.ok) {
                   throw new Error("Falha ao carregar reservas");
               }
 
               const json = await res.json();
               setData(json);
               setFilteredData(json);
           } catch (e) {
               console.error("Erro ao carregar reservas:", e);
               setError("Erro ao carregar dados. Tente novamente.");
           } finally {
               setLoading(false);
           }
       }
 
       init();
   }, [router]);
 
   useEffect(() => {
       if (!searchTerm.trim()) {
           setFilteredData(data);
           return;
       }
 
       const term = searchTerm.toLowerCase();
 
       const filtered = data.map(event => {
           const eventTitle = event.eventTitle ? event.eventTitle.toLowerCase() : "";
           const eventMatches = eventTitle.includes(term);
 
           const allReservations = event.reservations || [];
 
           if (eventMatches) {
               return event;
           }
           const matchingReservations = allReservations.filter(r => {
               const respName = r.responsibleName ? r.responsibleName.toLowerCase() : "";
               const custName = r.customerName ? r.customerName.toLowerCase() : "";
               const orderId = r.orderId ? r.orderId.toLowerCase() : "";
 
               return respName.includes(term) || custName.includes(term) || orderId.includes(term);
           });
 
           if (matchingReservations.length === 0) return null;
 
           return {
               ...event,
               reservations: matchingReservations,
               totalAdults: matchingReservations.filter(r => r.type === "Adulto").reduce((acc, curr) => acc + (curr.quantity || 0), 0),
               totalChildren: matchingReservations.filter(r => r.type === "Criança").reduce((acc, curr) => acc + (curr.quantity || 0), 0),
               totalValue: matchingReservations.reduce((acc, curr) => acc + (curr.totalValue || 0), 0)
           };
       }).filter(Boolean);
 
       setFilteredData(filtered);
   }, [searchTerm, data]);
 
   if (loading) {
       return (
           <div className="min-h-screen bg-slate-50 flex items-center justify-center">
               <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
           </div>
       );
   }
 
   if (error) {
       return (
           <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6">
               <div className="bg-white p-8 rounded-2xl shadow-xl text-center max-w-md">
                   <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl text-red-500">
                       🚫
                   </div>
                   <h2 className="text-xl font-bold text-slate-900 mb-2">Acesso Restrito</h2>
                   <div className="text-slate-500 mb-6">{error}</div>
                   <button
                       onClick={() => router.push("/events")}
                       className="w-full px-6 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition shadow-lg hover:shadow-xl hover:-translate-y-0.5"
                   >
                       Voltar para Eventos
                   </button>
               </div>
           </div>
       );
   }
 
   return (
       <>
           <Nav />
           <div className="min-h-screen bg-slate-50">
               <main className="max-w-7xl mx-auto px-4 py-8 pb-20">
                   <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                       <div>
                           <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Relatório de Reservas</h1>
                           <p className="text-slate-500 mt-1 flex items-center gap-2">
                               <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                               Listagem de reservas com pagamento confirmado
                           </p>
                       </div>
                       <button
                           onClick={() => router.push("/events")}
                           className="px-6 py-2.5 bg-white border border-slate-200 text-slate-700 font-bold rounded-xl hover:bg-slate-50 transition shadow-sm flex items-center gap-2 group"
                       >
                           <svg className="w-4 h-4 text-slate-400 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                           </svg>
                           Voltar
                       </button>
                   </div>
 
                   <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-2 mb-8 sticky top-20 z-10">
                       <div className="relative">
                           <input
                               type="text"
                               placeholder="Pesquisar por evento, responsável, comprador ou ID..."
                               className="w-full pl-12 pr-4 py-3.5 rounded-xl bg-slate-50 border-none focus:bg-white focus:ring-2 focus:ring-blue-500 transition-all text-slate-700 font-medium placeholder:font-normal"
                               value={searchTerm}
                               onChange={(e) => setSearchTerm(e.target.value)}
                           />
                           <svg
                               className="w-6 h-6 text-slate-400 absolute left-4 top-3.5"
                               fill="none"
                               stroke="currentColor"
                               viewBox="0 0 24 24"
                           >
                               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                           </svg>
                       </div>
                   </div>
 
                   {filteredData.length === 0 ? (
                       <div className="text-center py-20 bg-white rounded-3xl border border-slate-200 shadow-sm border-dashed">
                           <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6 text-4xl">
                               {searchTerm ? "🔍" : "📅"}
                           </div>
                           <h3 className="text-xl font-bold text-slate-900 mb-2">
                               {searchTerm ? "Nenhum resultado encontrado" : "Nenhuma reserva registrada"}
                           </h3>
                           <p className="text-slate-500">
                               {searchTerm ? `Não encontramos reservas para "${searchTerm}"` : "As reservas confirmadas aparecerão aqui."}
                           </p>
                           {searchTerm && (
                               <button
                                   onClick={() => setSearchTerm("")}
                                   className="mt-6 text-blue-600 font-bold hover:underline"
                               >
                                   Limpar pesquisa
                               </button>
                           )}
                       </div>
                   ) : (
                       <div className="space-y-8 animate-fade-in">
                           {filteredData.map((event) => (
                               <div key={event.eventId} className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
                                   <div className="bg-gradient-to-r from-slate-50 to-white px-6 py-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                       <div>
                                           <h2 className="text-xl font-bold text-slate-900 flex items-center gap-3">
                                               <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100 text-blue-700">
                                                   <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                   </svg>
                                               </span>
                                               {event.eventTitle}
                                           </h2>
                                           <div className="flex items-center gap-2 ml-11 mt-1">
                                               <span className="text-xs font-bold text-slate-500 uppercase tracking-wider bg-slate-100 px-2 py-0.5 rounded">ID: {event.eventId}</span>
                                               {event.eventDate && (
                                                   <span className="text-sm text-slate-600 flex items-center gap-1">
                                                       • {new Date(event.eventDate).toLocaleDateString('pt-BR')}
                                                   </span>
                                               )}
                                           </div>
                                       </div>
 
                                       <div className="flex gap-3">
                                           <div className="flex flex-col items-center justify-center px-4 py-2 bg-blue-50 rounded-xl border border-blue-100 min-w-[80px]">
                                               <span className="text-[10px] font-bold text-blue-400 uppercase tracking-wider">Adultos</span>
                                               <span className="text-2xl font-extrabold text-blue-700 leading-none mt-1">{event.totalAdults}</span>
                                           </div>
                                           <div className="flex flex-col items-center justify-center px-4 py-2 bg-pink-50 rounded-xl border border-pink-100 min-w-[80px]">
                                               <span className="text-[10px] font-bold text-pink-400 uppercase tracking-wider">Crianças</span>
                                               <span className="text-2xl font-extrabold text-pink-700 leading-none mt-1">{event.totalChildren}</span>
                                           </div>
                                           <div className="flex flex-col items-center justify-center px-4 py-2 bg-emerald-50 rounded-xl border border-emerald-100 min-w-[100px]">
                                               <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">Total (R$)</span>
                                               <span className="text-2xl font-extrabold text-emerald-700 leading-none mt-1">{(event.totalValue || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                           </div>
                                       </div>
                                   </div>
 
                                   <div className="overflow-x-auto">
                                       <table className="w-full text-left border-collapse">
                                           <thead>
                                               <tr className="bg-slate-50/50 border-b border-slate-100 text-xs font-bold text-slate-500 uppercase tracking-wider">
                                                   <th className="px-6 py-4">Responsável da Reserva</th>
                                                   <th className="px-6 py-4">Tipo</th>
                                                   <th className="px-6 py-4 text-center">Qtd</th>
                                                   <th className="px-6 py-4 text-right">Valor</th>
                                                   <th className="px-6 py-4">Data Compra</th>
                                               </tr>
                                           </thead>
                                           <tbody className="divide-y divide-slate-50">
                                               {event.reservations.map((res, idx) => (
                                                   <tr key={`${res.orderId}-${idx}`} className="group hover:bg-blue-50/30 transition-colors">
                                                       <td className="px-6 py-4">
                                                           <div className="flex items-center gap-3">
                                                               <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-white group-hover:text-blue-500 transition-colors font-bold text-xs border border-slate-200">
                                                                   {res.responsibleName.charAt(0).toUpperCase()}
                                                               </div>
                                                               <div>
                                                                   <div className="font-bold text-slate-900">{res.responsibleName}</div>
                                                                   <div className="text-xs text-slate-400 flex items-center gap-1 mt-0.5" title={`Pedido: ${res.orderId}`}>
                                                                       <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>
                                                                       Comprado por: <span className="font-medium text-slate-500">{res.customerName}</span>
                                                                   </div>
                                                               </div>
                                                           </div>
                                                       </td>
                                                       <td className="px-6 py-4">
                                                           <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${res.type === "Criança"
                                                               ? "bg-pink-50 text-pink-700 border-pink-100"
                                                               : "bg-blue-50 text-blue-700 border-blue-100"
                                                               }`}>
                                                               <span className={`w-1.5 h-1.5 rounded-full ${res.type === "Criança" ? "bg-pink-400" : "bg-blue-400"}`}></span>
                                                               {res.type}
                                                           </span>
                                                       </td>
                                                       <td className="px-6 py-4 text-center">
                                                           <span className="font-bold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-lg">
                                                               {res.quantity}
                                                           </span>
                                                       </td>
                                                       <td className="px-6 py-4 text-right">
                                                           <div className="font-bold text-emerald-700">
                                                               {(res.totalValue || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                                           </div>
                                                           <div className="text-xs text-slate-400 mt-0.5">
                                                               {(res.unitPrice || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} / un
                                                           </div>
                                                       </td>
                                                       <td className="px-6 py-4 text-sm text-slate-500 tabular-nums">
                                                           {res.date ? new Date(res.date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : "-"}
                                                       </td>
                                                   </tr>
                                               ))}
                                           </tbody>
                                       </table>
                                   </div>
                               </div>
                           ))}
                       </div>
                   )}
               </main>
           </div>
       </>
   );
}