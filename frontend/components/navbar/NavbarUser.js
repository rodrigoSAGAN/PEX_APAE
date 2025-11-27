"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import "../../styles/inter-font.css";

export default function NavbarUser({ user, handleLogout }) {
  const pathname = usePathname();
  const [isMobile, setIsMobile] = useState(false);
  const [hasCartItems, setHasCartItems] = useState(false);

  useEffect(() => {
    const checkSize = () => {
      if (typeof window !== "undefined") {
        setIsMobile(window.innerWidth < 640);
      }
    };
    checkSize();
    window.addEventListener("resize", checkSize);
    return () => window.removeEventListener("resize", checkSize);
  }, []);

  useEffect(() => {
    const checkCart = () => {
      try {
        const raw = localStorage.getItem("portal-apae-cart");
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed && Object.keys(parsed).length > 0) {
            setHasCartItems(true);
            return;
          }
        }
        setHasCartItems(false);
      } catch (e) {
        setHasCartItems(false);
      }
    };

    checkCart();
    window.addEventListener("storage", checkCart);
    const interval = setInterval(checkCart, 1000);

    return () => {
      window.removeEventListener("storage", checkCart);
      clearInterval(interval);
    };
  }, []);

  const icons = {
    home: (
      <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9.75L9 3l6 6.75V15a1.5 1.5 0 0 1-1.5 1.5h-3A1.5 1.5 0 0 1 9 15v-3H7.5V15A1.5 1.5 0 0 1 6 16.5h-3A1.5 1.5 0 0 1 1.5 15V9.75Z" />
      </svg>
    ),
    shop: (
      <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 4.5h12l-1 9.75A1.5 1.5 0 0 1 12.5 15.75h-7A1.5 1.5 0 0 1 4 14.25L3 4.5Z" />
        <path d="M3 4.5l1.5-3h9L15 4.5" />
      </svg>
    ),
    events: (
      <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3.75 3h10.5A1.75 1.75 0 0 1 16 4.75v9.5A1.75 1.75 0 0 1 14.25 16H3.75A1.75 1.75 0 0 1 2 14.25v-9.5A1.75 1.75 0 0 1 3.75 3Z" />
        <path d="M6 1.5v3" />
        <path d="M12 1.5v3" />
        <path d="M2 7.5h14" />
      </svg>
    ),
    gallery: (
      <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="14" height="12" rx="2" />
        <circle cx="8" cy="10" r="2" />
        <path d="M12 10l3 3" />
      </svg>
    ),
    cart: (
      <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="6.5" cy="15" r="1.5" />
        <circle cx="13.5" cy="15" r="1.5" />
        <path d="M3 3h2l2.5 9h7l2-6H6" />
      </svg>
    ),
    login: (
      <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M8 12l3-3-3-3" />
        <path d="M11 9H3" />
        <path d="M15 4v10a2 2 0 0 1-2 2h-4" />
      </svg>
    ),
    logout: (
      <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M9 12l3-3-3-3" />
        <path d="M12 9H4" />
        <path d="M15 4v10a2 2 0 0 1-2 2H7" />
      </svg>
    ),
    heart: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" stroke="none">
        <path d="M12 21s-4.86-2.82-7.54-5.84C2.4 12.73 2 11.4 2 10.25 2 7.9 3.9 6 6.25 6 7.88 6 9.2 6.86 10 8c.8-1.14 2.12-2 3.75-2C16.1 6 18 7.9 18 10.25c0 1.15-.4 2.48-2.46 4.91C16.86 18.18 12 21 12 21z" />
      </svg>
    ),
  };

  const bar = {
    position: "sticky",
    top: 0,
    zIndex: 50,
    backdropFilter: "saturate(180%) blur(14px)",
    background: "linear-gradient(90deg, rgba(239,68,68,0.40) 0%, rgba(245,158,11,0.42) 18%, rgba(234,179,8,0.44) 32%, rgba(34,197,94,0.44) 48%, rgba(59,130,246,0.44) 66%, rgba(129,140,248,0.44) 82%, rgba(236,72,153,0.44) 100%)",
    borderBottom: "1px solid rgba(15,23,42,0.12)",
    fontFamily: "Inter, sans-serif",
  };

  const wrap = {
    maxWidth: 1200,
    margin: "0 auto",
    padding: isMobile ? "10px 12px" : "14px 20px",
    display: "flex",
    alignItems: isMobile ? "stretch" : "center",
    justifyContent: isMobile ? "center" : "space-between",
    gap: isMobile ? 12 : 20,
    flexDirection: isMobile ? "column" : "row",
  };

  const brandLogo = {
    width: isMobile ? 72 : 92,
    height: isMobile ? 64 : 82,
    borderRadius: 999,
    objectFit: "cover",
    border: "2px solid rgba(248,250,252,0.95)",
    background: "#ffffff",
    boxShadow: "0 4px 12px rgba(15,23,42,0.25)",
  };

  const brand = {
    fontWeight: 900,
    color: "#f9fafb",
    letterSpacing: 0.3,
    fontSize: isMobile ? 18 : 20,
    textShadow: "0 1px 4px rgba(15,23,42,0.45)",
  };

  const link = (href) => ({
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    padding: isMobile ? "8px 12px" : "10px 16px",
    borderRadius: 999,
    fontWeight: 700,
    fontSize: 14,
    color: pathname === href ? "#0f172a" : "#f9fafb",
    textDecoration: "none",
    background: pathname === href ? "rgba(248,250,252,0.95)" : "rgba(15,23,42,0.16)",
    border: pathname === href ? "1px solid rgba(148,163,184,0.85)" : "1px solid transparent",
    boxShadow: pathname === href ? "0 4px 12px rgba(15,23,42,0.18)" : "none",
    transition: "background-color 140ms, color 140ms, border-color 140ms, box-shadow 140ms, transform 120ms",
  });

  const cta = {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    padding: isMobile ? "12px 22px" : "12px 22px",
    borderRadius: 999,
    border: "1px solid rgba(240,249,255,0.95)",
    background: "linear-gradient(135deg, #22C55E 0%, #16A34A 40%, #15803D 100%)",
    color: "#f9fafb",
    fontWeight: 800,
    textDecoration: "none",
    fontSize: 16,
    boxShadow: "0 8px 20px rgba(22,163,74,0.45)",
    flex: isMobile ? "1 1 100%" : "0 0 auto",
  };

  const logoutBtn = {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    padding: isMobile ? "8px 12px" : "10px 14px",
    borderRadius: 999,
    border: "1px solid rgba(248,250,252,0.85)",
    background: "rgba(15,23,42,0.10)",
    color: "#f9fafb",
    fontWeight: 800,
    cursor: "pointer",
    fontSize: 14,
  };

  const navWrap = {
    display: "flex",
    alignItems: "center",
    justifyContent: isMobile ? "center" : "flex-end",
    gap: isMobile ? 10 : 14,
    flexWrap: "wrap",
    maxWidth: 900,
  };

  return (
    <header style={bar}>
      <div style={wrap}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, justifyContent: isMobile ? "center" : "flex-start" }}>
          <Link href="/">
            <img src="/images/logo7.jpg" alt="Logo APAE Pinhão" style={brandLogo} />
          </Link>
          <Link href="/" style={brand}>
            APAE – Pinhão
          </Link>
        </div>

        <nav style={navWrap}>
          <Link href="/" style={link("/")}>
            {icons.home} Início
          </Link>

          <Link href="/products" style={link("/products")}>
            {icons.shop} Loja
          </Link>

          <Link href="/events" style={link("/events")}>
            {icons.events} Eventos
          </Link>

          <Link href="/galeria" style={link("/galeria")}>
            {icons.gallery} Galeria
          </Link>

          {hasCartItems && (
            <Link href="/carrinho" style={link("/carrinho")}>
              {icons.cart} Ver carrinho
            </Link>
          )}

          {!user && (
            <Link href="/login" style={link("/login")}>
              {icons.login} Entrar
            </Link>
          )}

          {user && (
            <button onClick={handleLogout} type="button" style={logoutBtn}>
              {icons.logout} Sair
            </button>
          )}

          <Link href="/carrinho" style={cta}>
            {icons.heart} Apoiar
          </Link>
        </nav>
      </div>
    </header>
  );
}
