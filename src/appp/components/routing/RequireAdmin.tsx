import type { ReactNode } from "react";
import { Navigate } from "react-router";
import { useAuth } from "../../contexts/AuthContext";

export function RequireAdmin({ children }: { children: ReactNode }) {
  const { isAdmin } = useAuth();
  if (!isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }
  return children;
}
