// =============================================================================
// Wrapper de conteúdo que adiciona padding-top nas páginas públicas.
// Isso compensa a navbar fixa (fixed) que fica por cima do conteúdo.
// Nas páginas de auth (login, cadastro) e dashboard, não adiciona padding
// porque essas telas têm layout próprio.
// =============================================================================

"use client";
import { usePathname } from "next/navigation";

export default function PageContentWrapper({ children }) {
  const pathname = usePathname();

  const isExcluded =
    pathname === "/login" ||
    pathname?.startsWith("/login/") ||
    pathname?.startsWith("/auth/") ||
    pathname === "/register" ||
    pathname === "/cadastro" ||
    pathname === "/dashboard" ||
    pathname?.startsWith("/dashboard/");

  const style = isExcluded
    ? {}
    : { paddingTop: "150px" };

  return <div style={style}>{children}</div>;
}
