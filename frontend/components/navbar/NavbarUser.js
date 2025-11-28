"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import "../../styles/inter-font.css";

export default function NavbarUser({ user, handleLogout }) {
  const pathname = usePathname();
  const [isMobile, setIsMobile] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [hasCartItems, setHasCartItems] = useState(false);

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
      } catch {
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
      <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
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
    cart: (
      <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="7" cy="17" r="1.3" />
        <circle cx="14" cy="17" r="1.3" />
        <path d="M3 4h2l2 9h7l2-6H6" />
      </svg>
    ),
    login: (
      <svg width="20" height="20" stroke="currentColor" strokeWidth="2" fill="none">
        <path d="M8 12l3-3-3-3" />
        <path d="M11 9H3" />
        <path d="M15 4v12a2 2 0 0 1-2 2H7" />
      </svg>
    ),
    logout: (
      <svg width="20" height="20" stroke="currentColor" strokeWidth="2" fill="none">
        <path d="M9 12l3-3-3-3" />
        <path d="M12 9H4" />
        <path d="M15 4v12a2 2 0 0 1-2 2H7" />
      </svg>
    ),
    heart: (
      <svg width="20" height="20" fill="currentColor">
        <path d="M12 21s-5-3-7.6-6C2.2 12.8 2 11.5 2 10.3 2 8 3.9 6 6.2 6c1.6 0 2.9 1 3.8 2.2C11 7 12.3 6 13.9 6c2.3 0 4.1 2 4.1 4.3 0 1.2-.3 2.5-2.4 4.7C17 18 12 21 12 21z" />
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
    objectFit: "cover",
    borderRadius: "999px",
    border: "2px solid #fff",
    background: "#fff",
  };

  const brand = {
    fontWeight: 900,
    fontSize: 20,
    color: "white",
    textShadow: "0 1px 4px rgba(0,0,0,0.4)",
  };

  const menuItem = {
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

  const menuCTA = {
    ...menuItem,
    background: "linear-gradient(135deg, #22C55E, #15803D)",
    color: "white",
    fontWeight: 900,
    border: "none",
    boxShadow: "0 4px 12px rgba(22, 163, 74, 0.4)",
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
    ...menuItem,
    width: "80%",
    justifyContent: "center",
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
          <nav style={{ display: "flex", gap: 14 }}>
            <Link href="/" style={menuItem}>{icons.home} Início</Link>
            <Link href="/products" style={menuItem}>{icons.shop} Loja</Link>
            <Link href="/events" style={menuItem}>{icons.events} Eventos</Link>

            {hasCartItems && (
              <Link href="/carrinho" style={menuItem}>{icons.cart} Ver carrinho</Link>
            )}

            {!user && (
              <Link href="/login" style={menuItem}>{icons.login} Entrar</Link>
            )}

            {user && (
              <button onClick={handleLogout} style={menuItem}>
                {icons.logout} Sair
              </button>
            )}

            <Link href="/apoiar" style={menuCTA}>
              {icons.heart} Apoiar
            </Link>
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
            {icons.shop} Loja
          </Link>

          <Link href="/events" style={mobileLink} onClick={() => setMenuOpen(false)}>
            {icons.events} Eventos
          </Link>

          {hasCartItems && (
            <Link href="/carrinho" style={mobileLink} onClick={() => setMenuOpen(false)}>
              {icons.cart} Ver carrinho
            </Link>
          )}

          {!user && (
            <Link href="/login" style={mobileLink} onClick={() => setMenuOpen(false)}>
              {icons.login} Entrar
            </Link>
          )}

          {user && (
            <button
              onClick={() => {
                setMenuOpen(false);
                handleLogout();
              }}
              style={mobileLink}
            >
              {icons.logout} Sair
            </button>
          )}

          <Link href="/apoiar" style={{ ...menuCTA, width: "80%", justifyContent: "center" }} onClick={() => setMenuOpen(false)}>
            {icons.heart} Apoiar
          </Link>
        </nav>
      )}
    </header>
  );
}