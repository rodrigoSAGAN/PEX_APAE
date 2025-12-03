"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function SideMenu({ claims }) {
  const pathname = usePathname();
  const roles = Array.isArray(claims?.roles) ? claims.roles : [];
  const isAdmin = roles.includes("admin");

  const asidePanel = {
    border: "1px solid #e5e7eb",
    borderRadius: 12,
    padding: 12,
    background: "#ffffff",
    minHeight: "fit-content",
    display: "flex",
    flexDirection: "column",
    gap: 8,
  };

  const asideList = { listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 4 };

  const linkBase = {
    display: "block",
    padding: "8px 12px",
    borderRadius: 8,
    textDecoration: "none",
    fontSize: 14,
    fontWeight: 500,
    transition: "all 0.2s",
    color: "#475569",
  };

  const linkActive = {
    ...linkBase,
    background: "#eff6ff",
    color: "#2563eb",
    fontWeight: 600,
  };

  const getStyle = (path) => {
    return pathname === path ? linkActive : linkBase;
  };

  return (
    <aside style={asidePanel} role="navigation" aria-label="Menu lateral">
      <strong style={{ color: "#0f172a", padding: "0 4px" }}>Menu</strong>
      <ul style={asideList}>
        <li>
          <Link href="/products" style={getStyle("/products")} aria-current={pathname === "/products" ? "page" : undefined}>
            Lojinha
          </Link>
        </li>

        <li>
          <Link href="/pedidos" style={getStyle("/pedidos")} aria-current={pathname === "/pedidos" ? "page" : undefined}>
            Pedidos
          </Link>
        </li>

        <li>
          <Link href="/events" style={getStyle("/events")} aria-current={pathname === "/events" ? "page" : undefined}>
            Eventos
          </Link>
        </li>

        {isAdmin && (
          <>
            <li>
              <Link href="/relatorios" style={getStyle("/relatorios")} aria-current={pathname === "/relatorios" ? "page" : undefined}>
                Relatórios
              </Link>
            </li>
            <li>
              <Link href="/controle" style={getStyle("/controle")} aria-current={pathname === "/controle" ? "page" : undefined}>
                Permissões
              </Link>
            </li>
            <li>
              <Link href="/galeria" style={getStyle("/galeria")} aria-current={pathname === "/galeria" ? "page" : undefined}>
                Galeria
              </Link>
            </li>
          </>
        )}
      </ul>
    </aside>
  );
}
