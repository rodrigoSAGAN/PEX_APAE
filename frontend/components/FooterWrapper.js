// =============================================================================
// Wrapper que controla quando o Footer aparece.
// Esconde o footer nas páginas de login e cadastro pra manter a tela
// limpa e focada no formulário de autenticação.
// =============================================================================

"use client";
import { usePathname } from "next/navigation";
import Footer from "./Footer";

export default function FooterWrapper() {
  const pathname = usePathname();

  const isAuthPage = 
    pathname === "/login" || 
    pathname?.startsWith("/login/") || 
    pathname === "/register" || 
    pathname === "/cadastro";

  if (isAuthPage) {
    return null;
  }

  return <Footer />;
}
