import { Link } from "react-router";
import { Plus } from "lucide-react";

type Props = {
  /** Uppercased for the tablet label (e.g. SOLDE / BALANCE). */
  balanceLabel: string;
  loadAccountLabel: string;
  locale: string;
  balance: number;
  formatTndNumber: (amount: number, locale?: string) => string;
};

/**
 * Solde strip: no fill — only glass border + blur. `pl-4` matches `.sidebar-nav-item` horizontal padding so
 * label/amount align with nav icons (nav is `px-10` + item `pl-4`).
 */
export function SidebarWalletCard({ balanceLabel, loadAccountLabel, locale, balance, formatTndNumber }: Props) {
  const amount = formatTndNumber(balance, locale);

  return (
    <div
      className="box-border flex w-full max-w-full items-center justify-between gap-3 rounded-2xl border border-white bg-white/50 py-3 pl-4 pr-3 shadow-xl shadow-purple-500/5 backdrop-blur-xl dark:border-white/10 dark:bg-transparent dark:shadow-none"
      role="status"
      aria-label={`${balanceLabel} ${amount} TND`}
    >
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-500 dark:text-zinc-400">
          {balanceLabel}
        </p>
        <p className="ip-fintech-nums mt-1.5 truncate text-lg font-semibold tracking-tight text-ip">
          {amount}
          <span className="text-base font-medium text-ip opacity-60">{"\u00a0"}TND</span>
        </p>
      </div>
      <Link
        to="/load-account"
        title={loadAccountLabel}
        aria-label={loadAccountLabel}
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-slate-200/80 text-ip transition-colors hover:border-purple-300/50 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/40 dark:border-white/10 dark:hover:border-white/20 dark:hover:bg-white/[0.06]"
      >
        <Plus className="h-5 w-5" strokeWidth={2} />
      </Link>
    </div>
  );
}
