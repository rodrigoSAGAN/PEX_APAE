"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { auth } from "../lib/firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import NavbarAdmin from "./navbar/NavbarAdmin";
import NavbarUser from "./navbar/NavbarUser";
import { useModal } from "./ModalContext";

export default function Nav() {
  const router = useRouter();
  const { showModal } = useModal();
  // 'user' guarda os dados básicos do Firebase Auth (email, uid, etc.)
  // 'claims' são os metadados extras que colocamos no token (como roles, permissões)
  // 'authReady' impede que a navbar piscule no primeiro render antes de saber se tem usuário logado
  const [user, setUser] = useState(null);
  const [claims, setClaims] = useState(null);
  const [authReady, setAuthReady] = useState(false);

  // Aqui ficamos "escutando" o Firebase Auth em tempo real.
  // Toda vez que o usuário faz login ou logout, essa callback é chamada automaticamente.
  // Passamos `true` no getIdTokenResult para forçar a atualização do token do servidor
  // — assim as claims (perm missões) ficam sempre atualizadas, sem cache desatualizado.
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u || null);

      if (u) {
        const token = await u.getIdTokenResult(true);
        setClaims(token.claims);
      } else {
        setClaims(null);
      }

      setAuthReady(true);
    });
    // Essa função de retorno desregistra o listener quando o componente é desmontado,
    // evitando vazamento de memória e updates em componentes inexistentes.
    return () => unsub();
  }, []);

  // Ao fazer logout, limpamos também o carrinho do localStorage.
  // Não queremos que um comprador anônimo herde o carrinho de um admin
  // que fez logout, ou vice-versa.
  async function handleLogout() {
    try {
      if (typeof window !== "undefined") {
        localStorage.removeItem("portal-apae-cart");
        localStorage.removeItem("portal-apae-cart-meta");
      }
      
      await signOut(auth);
      
      router.push("/");
    } catch (e) {
      console.error("Erro ao sair:", e);
      showModal("Não foi possível sair. Tente novamente.", "Erro");
    }
  }

  // Enquanto o Firebase ainda está checando o estado de autenticação,
  // renderizamos um placeholder com a mesma altura da navbar para evitar
  // layout shift (conteúdo pulando) enquanto o auth carrega.
  if (!authReady) return (
    <div
      style={{
        position: "fixed",
        top: 0,
        width: "100%",
        height: 80,
        zIndex: 90,
        backdropFilter: "blur(18px)",
        background:
          "linear-gradient(90deg, rgba(239,68,68,0.40) 0%, rgba(245,158,11,0.42) 18%, rgba(234,179,8,0.44) 32%, rgba(34,197,94,0.44) 48%, rgba(59,130,246,0.44) 66%, rgba(129,140,248,0.44) 82%, rgba(236,72,153,0.44) 100%)",
        borderBottom: "1px solid rgba(15,23,42,0.12)",
      }}
      aria-hidden="true"
    />
  );

  const roles = Array.isArray(claims?.roles) ? claims.roles : [];
  const isAdmin = roles.includes("admin");
  const isColab = roles.includes("colaborador");

  const canStore = claims?.canEditStore === true;
  const canEvents = claims?.canEditEvents === true;

  // Um colaborador só acessa o dashboard se tiver pelo menos uma das permissões específicas.
  // Admins sempre têm acesso total.
  const canAccessDashboard = isAdmin || (isColab && (canStore || canEvents));

  // Se a pessoa tem acesso ao dashboard, mostramos a navbar de administrador.
  // Caso contrário, ela vem com a navbar comum de usuário/visitante.
  if (canAccessDashboard) {
    return <NavbarAdmin user={user} handleLogout={handleLogout} />;
  }

  return <NavbarUser user={user} handleLogout={handleLogout} />;
}
