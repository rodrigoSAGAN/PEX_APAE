// =============================================================================
// Wrapper de conteúdo que adiciona padding-top nas páginas públicas.
// Isso compensa a navbar fixa (fixed) que fica por cima do conteúdo.
// Nas páginas de auth (login, cadastro) e dashboard, não adiciona padding
// porque essas telas têm layout próprio.
// flex: 1 garante que o conteúdo sempre expanda até empurrar o footer
// para o rodapé, evitando o bug de "footer subindo" em páginas com pouco conteúdo.
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
    ? { flex: 1 }
    : { paddingTop: "150px", flex: 1 };

  return (
    <div style={style} className="page-transition">
      {children}
    </div>
  );
}
