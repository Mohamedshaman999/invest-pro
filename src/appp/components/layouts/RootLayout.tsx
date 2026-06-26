import { useEffect } from "react";
import { Outlet, useNavigate, useLocation } from "react-router";
import { useAuth } from "../../contexts/AuthContext";
import { Sidebar } from "../navigation/Sidebar";
import { Header } from "../navigation/Header";

export function RootLayout() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!isAuthenticated && location.pathname !== "/") {
      navigate("/login");
    }
  }, [isAuthenticated, navigate, location.pathname]);

  if (location.pathname === "/") {
    return <Outlet />;
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="ip-app-root relative flex h-screen overflow-hidden">
      <div className="pointer-events-none absolute inset-0 ip-shell-radial" />
      <div className="pointer-events-none absolute inset-0 ip-shell-grid" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-48 ip-vignette-top" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-40 ip-vignette-bottom" />

      <div className="relative z-10 flex min-h-0 flex-1 overflow-visible">
        <Sidebar />
        <div className="flex min-h-0 flex-1 flex-col overflow-visible">
          <Header />
          <main className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden p-6">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}
