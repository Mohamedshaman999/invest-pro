import { useEffect, useRef } from "react";
import { Outlet, useLocation } from "react-router";

const ROUTE_TRANSITION_MS = 400;

export function PageTransitionLayout() {
  const location = useLocation();
  const prevPathRef = useRef<string | null>(null);

  useEffect(() => {
    const el = document.getElementById("page-loader");
    if (!el) return;

    const hide = () => el.classList.add("hidden");

    if (document.readyState === "complete") {
      requestAnimationFrame(hide);
    } else {
      window.addEventListener("load", () => requestAnimationFrame(hide), {
        once: true,
      });
    }
  }, []);

  useEffect(() => {
    const el = document.getElementById("page-loader");
    if (!el) return;

    if (prevPathRef.current === null) {
      prevPathRef.current = location.pathname;
      return;
    }
    if (prevPathRef.current === location.pathname) return;
    prevPathRef.current = location.pathname;

    el.classList.remove("hidden");
    const t = window.setTimeout(() => el.classList.add("hidden"), ROUTE_TRANSITION_MS);
    return () => window.clearTimeout(t);
  }, [location.pathname]);

  return <Outlet />;
}
