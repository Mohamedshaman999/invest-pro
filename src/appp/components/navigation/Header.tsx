import { Bell, ChevronDown, LogOut } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { useIsProInvestor } from "../../hooks/useInvestorAccess";
import { useNavigate, useLocation } from "react-router";
import { useEffect, useState } from "react";
import { useLanguage } from "../../contexts/LanguageContext";
import { useTheme } from "../../contexts/ThemeContext";
import { usePortfolio } from "../../contexts/PortfolioContext";
import { ThemeSwitch } from "./ThemeSwitch";
import { InvestProMagneticGlass } from "./InvestProMagneticGlass";
import { HeaderSearch } from "./HeaderSearch";
import { NotificationPerformanceDropdown } from "./NotificationPerformanceDropdown";
import { useOnClickOutside } from "../../hooks/useOnClickOutside";
import { useOwnedAssets24hPerformance } from "../../hooks/useOwnedAssets24hPerformance";

export function Header() {
  const { user, logout, isAdmin } = useAuth();
  const isProInvestor = useIsProInvestor();
  const { text, language } = useLanguage();
  const { assets } = usePortfolio();
  const filterSearchAria: Record<string, string> = {
    fr: "Filtrer la recherche",
    en: "Filter search",
    es: "Filtrar búsqueda",
    de: "Suche filtern",
    ar: "تصفية البحث",
  };
  const { resolvedTheme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const profileMenuRef = useOnClickOutside<HTMLDivElement>(() => setIsOpen(false), isOpen);
  const notifWrapRef = useOnClickOutside<HTMLDivElement>(() => setIsNotifOpen(false), isNotifOpen);
  const { rows: notifRows, loading: notifLoading, fetchedAt: notifFetchedAt } = useOwnedAssets24hPerformance(
    isNotifOpen,
    assets,
  );

  useEffect(() => {
    setIsOpen(false);
    setIsNotifOpen(false);
  }, [location.pathname]);

  const handleLogout = () => {
    setIsOpen(false);
    logout();
    navigate("/login");
  };

  return (
    <header className="ip-header relative box-border flex h-20 shrink-0 items-stretch overflow-visible">
      <div
        className="pointer-events-none absolute inset-0 z-0 box-border border-b border-slate-100 bg-[var(--ip-header-bg)] backdrop-blur-xl dark:border-white/[0.08] dark:backdrop-blur-md"
        aria-hidden
      />
      <div className="relative z-[1] box-border flex h-full min-h-0 w-full items-center justify-between gap-4 overflow-visible px-10">
        {!isAdmin ? (
          <div className="relative z-[40] min-w-0 max-w-md flex-1">
            <HeaderSearch
              placeholder={text.header.searchPlaceholder}
              filterAriaLabel={filterSearchAria[language] ?? filterSearchAria.en}
            />
          </div>
        ) : (
          <div className="relative z-[40] min-w-0 flex-1" aria-hidden />
        )}

        <div className="relative z-[21] flex shrink-0 items-center gap-2 px-1 py-1 sm:gap-3">
          {/* Ref englobe pilule + panneau : le panneau est en dehors du verre (overflow-hidden) pour ne pas être rogné */}
          {!isAdmin ? (
            <div ref={notifWrapRef} className="relative flex shrink-0 items-center">
              <InvestProMagneticGlass
                outerClassName="relative z-[1] overflow-visible"
                innerProps={{
                  role: "group",
                  "aria-label": "Settings & Alerts",
                }}
              >
                <span className="flex shrink-0 items-center justify-center">
                  <ThemeSwitch resolvedTheme={resolvedTheme} toggleTheme={toggleTheme} />
                </span>
                <div className="relative flex shrink-0 items-center">
                  <button
                    type="button"
                    id="ip-notif-performance-trigger"
                    className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-ip-muted transition-[color,transform] duration-300 ease-out hover:text-ip focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400/50"
                    aria-label="Notifications"
                    aria-expanded={isNotifOpen}
                    aria-haspopup="dialog"
                    aria-controls={isNotifOpen ? "ip-notif-performance-panel" : undefined}
                    onClick={() => setIsNotifOpen((v) => !v)}
                  >
                    <Bell className="h-5 w-5" strokeWidth={1.75} />
                    <span className="ip-notification-pulse pointer-events-none absolute right-1 top-1" />
                  </button>
                </div>
              </InvestProMagneticGlass>
              <NotificationPerformanceDropdown
                open={isNotifOpen}
                language={language}
                rows={notifRows}
                loading={notifLoading}
                fetchedAt={notifFetchedAt}
              />
            </div>
          ) : (
            <div className="relative flex shrink-0 items-center">
              <InvestProMagneticGlass
                outerClassName="relative z-[1] overflow-visible"
                innerProps={{
                  role: "group",
                  "aria-label": "Theme",
                }}
              >
                <span className="flex shrink-0 items-center justify-center px-0.5">
                  <ThemeSwitch resolvedTheme={resolvedTheme} toggleTheme={toggleTheme} />
                </span>
              </InvestProMagneticGlass>
            </div>
          )}

          <div ref={profileMenuRef} className="relative z-[1]">
            <InvestProMagneticGlass
              as="button"
              outerClassName="relative z-[1] overflow-visible"
              innerProps={{
                type: "button",
                onClick: () => setIsOpen((open) => !open),
                "aria-expanded": isOpen,
              }}
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-600 shadow-lg shadow-purple-900/40">
                <span className="text-sm font-semibold text-white">
                  {(user?.name?.trim()?.charAt(0) || "?").toUpperCase()}
                </span>
              </div>
              {!isAdmin && isProInvestor ? (
                <span
                  className="shrink-0 rounded-full border border-amber-400/35 bg-gradient-to-r from-amber-500/25 via-yellow-400/20 to-amber-600/25 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-100 shadow-[0_0_12px_-2px_rgba(251,191,36,0.45)]"
                  aria-label="Pro"
                >
                  PRO
                </span>
              ) : null}
              <span className="max-w-[min(140px,42vw)] truncate text-left text-sm font-medium text-ip">{user?.name}</span>
              <ChevronDown className="h-4 w-4 shrink-0 text-ip-subtle" />
            </InvestProMagneticGlass>

            {isOpen && (
              <div className="ip-popover absolute right-0 z-10 mt-2 w-48 rounded-xl py-1">
                <button
                  type="button"
                  onClick={handleLogout}
                  className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-ip-muted transition-colors hover:bg-[var(--ip-nav-hover-bg)] hover:text-ip"
                >
                  <LogOut className="h-4 w-4" />
                  {text.header.logout}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
