"use client";
import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../../lib/firebase";
import { useRouter } from "next/navigation";
import Nav from "../../components/Nav";
import Link from "next/link";
import SideMenu from "../../components/SideMenu";

export default function DashboardPage() {
  const [ready, setReady] = useState(false);
  const [claims, setClaims] = useState(null);
  const [stats, setStats] = useState({
    products: 0,
    events: 0,
    users: 0,
    soldThisMonth: 0,
  });
  const [statsLoading, setStatsLoading] = useState(true);
  const [statsError, setStatsError] = useState("");
  const router = useRouter();

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (!u) {
        router.replace("/login");
        return;
      }

      try {
        const tokenResult = await u.getIdTokenResult(true);
        const c = tokenResult.claims || {};
        setClaims(c);

        const roles = Array.isArray(c.roles) ? c.roles : [];
        const isAdmin = roles.includes("admin");
        const isColab = roles.includes("colaborador");
        const canStore = c.canEditStore === true;
        const canEvents = c.canEditEvents === true;

        const canDashboard = isAdmin || (isColab && (canStore || canEvents));

        if (!canDashboard) {
          router.replace("/");
          return;
        }

        setReady(true);
      } catch (e) {
        console.error("[dashboard] erro ao ler claims:", e);
        router.replace("/login");
      }
    });

    return () => unsub();
  }, [router]);


  useEffect(() => {
    if (!ready) return;

    async function loadStats() {
      setStatsLoading(true);
      setStatsError("");

      try {
        const user = auth.currentUser;
        const token = await user.getIdToken();

        const [resProd, resEvents, resUsers, resOrders] = await Promise.all([
          fetch("/api/products", { cache: "no-store" }),
          fetch("/api/events", { cache: "no-store" }),
          fetch("/api/users", {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch("/api/orders/summary?period=month", {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        if (!resProd.ok || !resEvents.ok) {
          throw new Error("Falha ao buscar estatísticas principais");
        }

        const prodData = await resProd.json();
        const eventsData = await resEvents.json();

        let usersCount = 0;
        if (resUsers.ok) {
          const usersData = await resUsers.json();
          if (Array.isArray(usersData)) usersCount = usersData.length;
        }

        let soldThisMonth = 0;
        if (resOrders.ok) {
          const summary = await resOrders.json();
          soldThisMonth = Number(summary.totalSold || 0);
        }

        setStats({
          products: Array.isArray(prodData) ? prodData.length : 0,
          events: Array.isArray(eventsData) ? eventsData.length : 0,
          users: usersCount,
          soldThisMonth,
        });
      } catch (e) {
        console.error("[dashboard] erro ao carregar stats:", e);
        setStatsError("Não foi possível carregar estatísticas agora.");
      } finally {
        setStatsLoading(false);
      }
    }

    loadStats();
  }, [ready]);

  if (!ready) return null;

  const roles = Array.isArray(claims?.roles) ? claims.roles : [];
  const isAdmin = roles.includes("admin");
  const isColab = roles.includes("colaborador");
  const canStore = claims?.canEditStore === true;
  const canEvents = claims?.canEditEvents === true;

  const bgImageOverlay = {
    position: "absolute",
    inset: 0,
    backgroundImage: "url(/images/logo22.jpg)",
    backgroundSize: "cover",
    backgroundPosition: "center",
    opacity: 0.2,
    zIndex: 0,
  };

  const panelContent = {
    position: "relative",
    zIndex: 1,
  };


  return (
    <>
      <Nav />
      <main className="min-h-screen relative bg-slate-50 pt-[200px] pb-10 px-6 overflow-hidden">
        <div style={bgImageOverlay} />
        <div className="relative z-10 max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-[260px_1fr] gap-8">
          <aside>
            <SideMenu claims={claims} />
          </aside>

          <section className="space-y-8">
            <div className="space-y-8">

              <div>
                <h1 className="text-3xl font-bold text-slate-900">Dashboard</h1>
                <p className="text-slate-600 mt-2">
                  Visão geral da Lojinha APAE – Pinhão e eventos.
                </p>
              </div>

              {statsError && (
                <div className="bg-red-50 text-red-700 border border-red-200 rounded-xl p-4 text-sm font-medium">
                  {statsError}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm hover:shadow-md transition-all">
                  <div className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-2">
                    Produtos
                  </div>
                  <div className="text-3xl font-extrabold text-emerald-600">
                    {statsLoading ? "…" : stats.products}
                  </div>
                  <div className="text-xs text-slate-400 mt-2">
                    Itens disponíveis
                  </div>
                </div>

                <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm hover:shadow-md transition-all">
                  <div className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-2">
                    Eventos
                  </div>
                  <div className="text-3xl font-extrabold text-emerald-600">
                    {statsLoading ? "…" : stats.events}
                  </div>
                  <div className="text-xs text-slate-400 mt-2">
                    Ações da APAE
                  </div>
                </div>

                <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm hover:shadow-md transition-all">
                  <div className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-2">
                    Usuários
                  </div>
                  <div className="text-3xl font-extrabold text-emerald-600">
                    {statsLoading ? "…" : stats.users}
                  </div>
                  <div className="text-xs text-slate-400 mt-2">
                    Contas registradas
                  </div>
                </div>

                <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm hover:shadow-md transition-all">
                  <div className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-2">
                    Vendas (Mês)
                  </div>
                  <div className="text-3xl font-extrabold text-emerald-600">
                    {statsLoading ? "…" : stats.soldThisMonth}
                  </div>
                  <div className="text-xs text-slate-400 mt-2">
                    Itens vendidos
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
                <h2 className="text-lg font-bold text-slate-900 mb-4">Acesso Rápido</h2>
                <div className="flex flex-wrap gap-3">
                  {canStore && (
                    <Link
                      href="/products"
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-50 text-slate-700 text-sm font-semibold border border-slate-200 hover:bg-white hover:border-emerald-500 hover:text-emerald-600 transition-all shadow-sm"
                    >
                      <span>📦</span> Gerenciar produtos
                    </Link>
                  )}

                  {canEvents && (
                    <Link
                      href="/events"
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-50 text-slate-700 text-sm font-semibold border border-slate-200 hover:bg-white hover:border-emerald-500 hover:text-emerald-600 transition-all shadow-sm"
                    >
                      <span>📅</span> Gerenciar eventos
                    </Link>
                  )}

                  {isAdmin && (
                    <>
                      <Link
                        href="/relatorios"
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-50 text-slate-700 text-sm font-semibold border border-slate-200 hover:bg-white hover:border-emerald-500 hover:text-emerald-600 transition-all shadow-sm"
                      >
                        <span>📊</span> Relatórios
                      </Link>
                      <Link
                        href="/controle"
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-50 text-slate-700 text-sm font-semibold border border-slate-200 hover:bg-white hover:border-emerald-500 hover:text-emerald-600 transition-all shadow-sm"
                      >
                        <span>🛡️</span> Permissões
                      </Link>
                    </>
                  )}
                </div>
              </div>
            </div>
          </section>
        </div>
      </main>
    </>
  );
}
