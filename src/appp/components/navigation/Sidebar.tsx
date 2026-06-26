import { Link, NavLink } from "react-router";
import {
  LayoutDashboard,
  Briefcase,
  TrendingUp,
  Receipt,
  Settings,
  Shield,
  Sparkles,
  Calculator,
  Bot,
  Lock,
  Mail,
  MessageSquare,
  Users,
} from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { useIsProInvestor } from "../../hooks/useInvestorAccess";
import { useLanguage } from "../../contexts/LanguageContext";
import { useWallet } from "../../contexts/WalletContext";
import logo1 from "../../../../logo1.png";
import { SidebarWalletCard } from "./SidebarWalletCard";

const PRO_GATED_PATHS = new Set(["/ai-trading", "/ai/simulator", "/ai/asset"]);

export function Sidebar() {
  const { isAdmin } = useAuth();
  const isPro = useIsProInvestor();
  const { text, language } = useLanguage();
  const proBadge = text.pages.proFeature.badgePro;
  const { stndBalance, formatTndNumber } = useWallet();
  const localeMap: Record<string, string> = { fr: "fr-FR", en: "en-US", es: "es-ES", de: "de-DE", ar: "ar-SA" };
  const locale = localeMap[language] ?? "en-US";

  const navItems = isAdmin
    ? [
        { path: "/admin/dashboard", label: text.nav.dashboard, icon: LayoutDashboard },
        { path: "/admin/users", label: text.nav.adminUsers, icon: Users },
        { path: "/admin/actifs", label: text.nav.adminAssets, icon: Shield },
        { path: "/admin/messages", label: text.nav.adminMessages, icon: MessageSquare },
        { path: "/settings", label: text.nav.settings, icon: Settings },
      ]
    : [
        { path: "/dashboard", label: text.nav.dashboard, icon: LayoutDashboard },
        { path: "/portfolio", label: text.nav.portfolio, icon: Briefcase },
        { path: "/markets", label: text.nav.markets, icon: TrendingUp },
        { path: "/ai/asset", label: text.nav.aiAsset, icon: Sparkles },
        { path: "/ai/simulator", label: text.nav.aiSimulator, icon: Calculator },
        { path: "/ai-trading", label: text.nav.aiTrading, icon: Bot },
        { path: "/ai/assistant", label: text.nav.aiAssistant, icon: MessageSquare },
        { path: "/transactions", label: text.nav.transactions, icon: Receipt },
        { path: "/messages", label: text.nav.messages, icon: Mail },
        { path: "/settings", label: text.nav.settings, icon: Settings },
      ];

  return (
    <aside className="ip-sidebar box-border flex min-h-0 w-64 flex-col">
      <div className="box-border flex h-20 shrink-0 items-center gap-[12px] border-b border-slate-100 px-10 dark:border-white/[0.08]">
        <div className="hero-logo-wrap hero-logo-compact ip-sidebar-brand-mark shrink-0">
          <img src={logo1} alt="InvestPro logo" className="hero-logo-image object-contain" />
        </div>
        <span
          className="logo-text text-2xl font-bold tracking-tight"
          style={{ fontFamily: "Orbitron, ui-sans-serif, system-ui, sans-serif" }}
        >
          InvestPro
        </span>
      </div>

      {!isAdmin ? (
        <div className="mt-10 mb-10 w-full px-10">
          <SidebarWalletCard
            balanceLabel={text.header.stndChipLabel.toUpperCase()}
            loadAccountLabel={text.pages.portfolio.loadAccount}
            locale={locale}
            balance={stndBalance}
            formatTndNumber={formatTndNumber}
          />
        </div>
      ) : (
        <div className="mt-8 shrink-0 px-10" aria-hidden />
      )}

      <nav className="ip-sidebar-scroll min-h-0 flex-1 overflow-x-hidden overflow-y-auto overscroll-y-contain px-10 pb-4 pt-0">
        <ul className="w-full space-y-2">
          {navItems.map((item) => {
            const gated = !isAdmin && PRO_GATED_PATHS.has(item.path);
            const lockedNav = gated && !isPro;
            return (
              <li key={item.path}>
                <NavLink
                  to={item.path}
                  end={item.path === "/dashboard" || item.path === "/admin/dashboard"}
                  className={({ isActive }) =>
                    [
                      "sidebar-nav-item transition-opacity duration-300 ease-out",
                      isActive ? "sidebar-nav-item-active" : "",
                      lockedNav ? "opacity-60 hover:opacity-95" : "",
                    ].join(" ")
                  }
                >
                  <item.icon className="h-5 w-5 shrink-0 opacity-90" />
                  <span className="flex min-w-0 flex-1 items-center justify-between gap-2 font-medium">
                    <span className="truncate">{item.label}</span>
                    {lockedNav ? (
                      <span className="flex shrink-0 items-center gap-1.5">
                        <span
                          className="rounded-full border border-white/15 bg-white/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-violet-200/95 backdrop-blur-md dark:border-white/10 dark:bg-white/[0.08]"
                          style={{ boxShadow: "inset 0 1px 0 0 rgba(255,255,255,0.12)" }}
                        >
                          {proBadge}
                        </span>
                        <Lock className="h-3.5 w-3.5 text-violet-300/85" aria-hidden />
                      </span>
                    ) : null}
                  </span>
                </NavLink>
              </li>
            );
          })}
        </ul>
      </nav>

      {!isAdmin && !isPro ? (
        <div className="border-t border-ip px-10 py-4">
          <div className="ip-sidebar-pro rounded-2xl p-4">
            <p className="mb-1 text-sm font-semibold text-ip">{text.sidebar.proVersion}</p>
            <p className="mb-3 text-xs text-ip-muted">{text.sidebar.advancedInsights}</p>
            <Link
              to="/upgrade"
              className="hero-cta inline-flex w-full items-center justify-center rounded-xl py-2.5 text-sm font-semibold"
            >
              <span className="hero-cta-label">{text.sidebar.upgrade}</span>
            </Link>
          </div>
        </div>
      ) : null}
    </aside>
  );
}
