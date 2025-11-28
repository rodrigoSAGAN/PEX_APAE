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
