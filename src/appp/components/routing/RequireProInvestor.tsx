import type { ReactNode } from "react";
import { Navigate } from "react-router";
import { useAuth } from "../../contexts/AuthContext";
import { useIsProInvestor } from "../../hooks/useInvestorAccess";

/** Pages réservées aux comptes Pro : redirection vers `/pro` (upgrade) si non abonné. */
export function RequireProInvestor({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth();
  const isPro = useIsProInvestor();

  if (!isAuthenticated) {
    return null;
  }
  if (!isPro) {
    return <Navigate to="/pro" replace />;
  }
  return children;
}
