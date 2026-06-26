import { Link } from "react-router";
import { LayoutDashboard, MessageSquare, Shield, Users } from "lucide-react";
import { useLanguage } from "../../contexts/LanguageContext";

export function AdminDashboardPage() {
  const { text } = useLanguage();
  const subtitle = text.pages.adminDashboard.subtitle;

  const cards = [
    { to: "/admin/users", label: text.nav.adminUsers, Icon: Users },
    { to: "/admin/actifs", label: text.nav.adminAssets, Icon: Shield },
    { to: "/admin/messages", label: text.nav.adminMessages, Icon: MessageSquare },
  ] as const;

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <header className="space-y-2">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.06] text-violet-300 shadow-inner shadow-black/20 backdrop-blur-md dark:border-white/[0.08]">
            <LayoutDashboard className="h-5 w-5" aria-hidden />
          </span>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-ip">{text.nav.dashboard}</h1>
            <p className="text-sm text-ip-muted">{subtitle}</p>
          </div>
        </div>
      </header>

      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map(({ to, label, Icon }) => (
          <li key={to}>
            <Link
              to={to}
              className="group ip-glass-card flex items-center gap-4 rounded-2xl border border-white/10 bg-white/[0.04] p-5 shadow-lg shadow-purple-900/10 backdrop-blur-xl transition-[transform,box-shadow,border-color] duration-300 hover:-translate-y-0.5 hover:border-violet-400/25 hover:shadow-purple-900/20 dark:border-white/[0.06]"
            >
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-gradient-to-br from-violet-500/90 to-fuchsia-600/90 text-white shadow-md shadow-violet-900/30">
                <Icon className="h-5 w-5" aria-hidden />
              </span>
              <span className="min-w-0 flex-1 font-semibold text-ip transition-colors group-hover:text-violet-200">{label}</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
