import type { ReactNode } from "react";
import { Navigate } from "react-router";
import { useAuth } from "../../contexts/AuthContext";

/** La messagerie investisseur n’est pas disponible pour les comptes admin (panel dédié). */
export function RequireInvestorMessaging({ children }: { children: ReactNode }) {
  const { isAdmin } = useAuth();
  if (isAdmin) {
    return <Navigate to="/admin/messages" replace />;
  }
  return children;
}
