import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router";
import { useAuth } from "../../contexts/AuthContext";

export function RequireNonAdmin({ children }: { children: ReactNode }) {
  const { isAdmin } = useAuth();
  const location = useLocation();
  if (isAdmin) {
    return <Navigate to="/admin/dashboard" replace state={{ from: location.pathname }} />;
  }
  return children;
}
