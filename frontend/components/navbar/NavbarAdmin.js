// =============================================================================
// Navbar do painel administrativo.
// Aparece pra admins e colaboradores com permissão de dashboard.
// Tem versão desktop (links horizontais) e mobile (menu fullscreen).
// O link "Controle" leva pro dashboard onde ficam os CRUDs e relatórios.
// Estilo com gradiente colorido e glassmorphism (blur + transparência).
// =============================================================================

"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import "../../styles/inter-font.css";

export default function NavbarAdmin({ user, handleLogout }) {
  const pathname = usePathname();
  const [isMobile, setIsMobile] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const checkSize = () => {
      if (typeof window !== "undefined") {
        setIsMobile(window.innerWidth < 768);
      }
    };
    checkSize();
    window.addEventListener("resize", checkSize);

    return () => window.removeEventListener("resize", checkSize);
  }, []);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "auto";
  }, [menuOpen]);

  const icons = {
    menu: (
      <svg width="30" height="30" stroke="#fff" strokeWidth="2" fill="none">
        <path d="M4 7h22M4 15h22M4 23h22" />
      </svg>
    ),
    close: (
      <svg width="32" height="32" stroke="#fff" strokeWidth="2" fill="none">
        <path d="M6 6l20 20M26 6L6 26" />
      </svg>
    ),
    home: (
      <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M3 10L10 3l7 7v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-8Z" />
      </svg>
    ),
    shop: (
      <svg width="20" height="20" stroke="currentColor" fill="none" strokeWidth="2">
        <path d="M3 4h14l-1 10H4L3 4Z" />
        <path d="M3 4l2-3h9l2 3" />
      </svg>
    ),
    events: (
      <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="3" y="5" width="14" height="12" rx="2" />
        <path d="M7 3v4M13 3v4M3 9h14" />
      </svg>
    ),
    dashboard: (
      <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="3" y="3" width="5" height="5" />
        <rect x="12" y="3" width="5" height="4" />
        <rect x="12" y="9" width="5" height="8" />
        <rect x="3" y="10" width="5" height="7" />
      </svg>
    ),
    logout: (
      <svg width="20" height="20" stroke="currentColor" strokeWidth="2" fill="none">
        <path d="M9 12l3-3-3-3" />
        <path d="M12 9H4" />
        <path d="M15 4v12a2 2 0 0 1-2 2H7" />
      </svg>
    ),
  };

  const bar = {
    position: "fixed",
    top: 0,
    width: "100%",
    zIndex: 90,
    backdropFilter: "blur(18px)",
    background:
      "linear-gradient(90deg, rgba(239,68,68,0.40) 0%, rgba(245,158,11,0.42) 18%, rgba(234,179,8,0.44) 32%, rgba(34,197,94,0.44) 48%, rgba(59,130,246,0.44) 66%, rgba(129,140,248,0.44) 82%, rgba(236,72,153,0.44) 100%)",
    borderBottom: "1px solid rgba(15,23,42,0.12)",
    height: isMobile ? (menuOpen ? "100vh" : "80px") : "auto",
    transition: isMobile ? "height 0.35s ease" : "none",
    overflow: "hidden",
    display: "flex",
    flexDirection: "column",
  };

  const wrap = {
    maxWidth: 1200,
    width: "100%",
    margin: "0 auto",
    padding: "10px 14px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    flexShrink: 0,
  };

  const brandLogo = {
    width: 70,
    height: 60,
    borderRadius: "999px",
    objectFit: "cover",
    border: "2px solid #fff",
    background: "white",
  };

  const brand = {
    fontWeight: 900,
    fontSize: 20,
    color: "#ffffff",
    textShadow: "0 1px 4px rgba(0,0,0,0.45)",
  };

  const navItem = {
    display: "flex",
    alignItems: "center",
    gap: 12,
    padding: "14px 20px",
    background: "rgba(255, 255, 255, 0.15)",
    color: "#2C4257",
    borderRadius: 14,
    fontSize: 18,
    fontWeight: 700,
    textDecoration: "none",
    boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
    border: "1px solid rgba(255, 255, 255, 0.2)",
    transition: "background 0.2s ease, transform 0.2s ease",
  };

  const navItemActive = {
    ...navItem,
    background: "rgba(255, 255, 255, 0.25)",
    border: "1px solid rgba(255, 255, 255, 0.4)",
  };

  const adminBtn = {
    ...navItem,
    background: "linear-gradient(135deg, #15803d, #22c55e)",
    color: "white",
    fontWeight: 900,
    borderRadius: 999,
    border: "none",
    boxShadow: "0 4px 12px rgba(22, 163, 74, 0.4)",
  };

  const logoutBtn = {
    ...navItem,
  };

  const mobileNavContainer = {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: 18,
    flex: 1,
    opacity: menuOpen ? 1 : 0,
    transition: "opacity 0.3s ease 0.1s",
    pointerEvents: menuOpen ? "auto" : "none",
    paddingBottom: 40,
    width: "100%",
  };

  const mobileLink = {
    ...navItem,
    width: "80%",
    justifyContent: "center",
    fontSize: 18,
    padding: "14px 20px",
  };

  const mobileAdmin = {
    ...adminBtn,
    width: "80%",
    justifyContent: "center",
    fontSize: 18,
    padding: "14px 20px",
  };

  return (
    <header style={bar}>
      <div style={wrap}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <Link href="/">
            <img src="/images/logo7.jpg" alt="Logo APAE" style={brandLogo} />
          </Link>
          <Link href="/" style={brand}>APAE – Pinhão</Link>
        </div>

        {!isMobile && (
          <nav style={{ display: "flex", gap: 14, alignItems: "center" }}>
            <Link href="/" style={pathname === "/" ? navItemActive : navItem}>{icons.home} Início</Link>
            <Link href="/products" style={pathname === "/products" ? navItemActive : navItem}>{icons.shop} Lojinha</Link>
            <Link href="/events" style={pathname === "/events" ? navItemActive : navItem}>{icons.events} Eventos</Link>
            <Link href="/dashboard" style={mobileAdmin}>{icons.dashboard} Controle</Link>
            <button style={logoutBtn} onClick={handleLogout}>{icons.logout} Sair</button>
          </nav>
        )}

        {isMobile && (
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            style={{ background: "none", border: "none", cursor: "pointer" }}
          >
            {menuOpen ? icons.close : icons.menu}
          </button>
        )}
      </div>

      {isMobile && (
        <nav style={mobileNavContainer}>
          <Link href="/" style={mobileLink} onClick={() => setMenuOpen(false)}>
            {icons.home} Início
          </Link>

          <Link href="/products" style={mobileLink} onClick={() => setMenuOpen(false)}>
            {icons.shop} Lojinha
          </Link>

          <Link href="/events" style={mobileLink} onClick={() => setMenuOpen(false)}>
            {icons.events} Eventos
          </Link>

          <Link href="/dashboard" style={mobileAdmin} onClick={() => setMenuOpen(false)}>
            {icons.dashboard} Controle
          </Link>

          <button
            style={mobileLink}
            onClick={() => {
              setMenuOpen(false);
              handleLogout();
            }}
          >
            {icons.logout} Sair
          </button>
        </nav>
      )}
    </header>
  );
}