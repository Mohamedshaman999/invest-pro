import { usePortfolio } from "../../contexts/PortfolioContext";
import { ArrowDownCircle, ArrowUpCircle, Filter, Loader2 } from "lucide-react";
import { useState } from "react";
import { useLanguage } from "../../contexts/LanguageContext";
import { formatTndWithUnit } from "../../utils/tndCurrency";

export function TransactionsPage() {
  const { transactions, loading } = usePortfolio();
  const { text, language } = useLanguage();
  const isFr = language === "fr";
  const [filterType, setFilterType] = useState<"all" | "buy" | "sell">("all");

  const filteredTransactions = transactions.filter((transaction) => {
    if (filterType === "all") return true;
    return transaction.type === filterType;
  });

  const totalBuy = transactions
    .filter((t) => t.type === "buy")
    .reduce((sum, t) => sum + t.total, 0);

  const totalSell = transactions
    .filter((t) => t.type === "sell")
    .reduce((sum, t) => sum + t.total, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="mb-2 text-3xl font-bold tracking-tight text-ip">{text.pages.transactions.title}</h1>
        <p className="text-ip-muted">{text.pages.transactions.subtitle}</p>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 rounded-xl border border-ip bg-[var(--ip-nav-hover-bg)] px-4 py-3 text-sm text-ip-muted">
          <Loader2 className="h-4 w-4 animate-spin" />
          {isFr ? "Chargement..." : "Loading..."}
        </div>
      ) : null}

      {/* Statistiques */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <div className="rounded-xl ip-panel p-6">
          <div className="mb-2 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/20">
              <ArrowDownCircle className="h-6 w-6 text-violet-600 dark:text-violet-300" />
            </div>
            <h3 className="text-sm font-medium text-ip-muted">{text.pages.transactions.totalBuy}</h3>
          </div>
          <p className="ip-fintech-nums text-2xl font-bold text-ip">{formatTndWithUnit(totalBuy)}</p>
          <p className="mt-1 text-sm text-ip-subtle">
            {transactions.filter((t) => t.type === "buy").length} transaction(s)
          </p>
        </div>

        <div className="rounded-xl ip-panel p-6">
          <div className="mb-2 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/20">
              <ArrowUpCircle className="h-6 w-6 text-emerald-700 dark:text-emerald-300" />
            </div>
            <h3 className="text-sm font-medium text-ip-muted">{text.pages.transactions.totalSell}</h3>
          </div>
          <p className="ip-fintech-nums text-2xl font-bold text-ip">{formatTndWithUnit(totalSell)}</p>
          <p className="mt-1 text-sm text-ip-subtle">
            {transactions.filter((t) => t.type === "sell").length} transaction(s)
          </p>
        </div>

        <div className="rounded-xl ip-panel p-6">
          <div className="mb-2 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-fuchsia-500/20">
              <Filter className="h-6 w-6 text-fuchsia-600 dark:text-fuchsia-300" />
            </div>
            <h3 className="text-sm font-medium text-ip-muted">{text.pages.transactions.totalTransactions}</h3>
          </div>
          <p className="ip-fintech-nums text-2xl font-bold text-ip">{transactions.length}</p>
          <p className="mt-1 text-sm text-ip-subtle">{text.pages.transactions.fromStart}</p>
        </div>
      </div>

      {/* Filtres */}
      <div className="rounded-xl ip-panel p-4">
        <div className="flex flex-wrap items-center gap-3">
          <Filter className="h-5 w-5 text-ip-subtle" />
          <span className="text-sm font-medium text-ip-secondary">Filtrer par type:</span>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setFilterType("all")}
              className={`rounded-xl px-4 py-2 text-sm font-semibold transition-all ${
                filterType === "all"
                  ? "hero-cta"
                  : "border border-ip bg-slate-50 text-ip-secondary hover:bg-slate-100 dark:border-white/10 dark:bg-white/5 dark:text-slate-300 dark:hover:bg-white/10"
              }`}
            >
              <span className={filterType === "all" ? "hero-cta-label" : undefined}>Toutes</span>
            </button>
            <button
              type="button"
              onClick={() => setFilterType("buy")}
              className={`rounded-xl px-4 py-2 text-sm font-semibold transition-all ${
                filterType === "buy"
                  ? "hero-cta"
                  : "border border-ip bg-slate-50 text-ip-secondary hover:bg-slate-100 dark:border-white/10 dark:bg-white/5 dark:text-slate-300 dark:hover:bg-white/10"
              }`}
            >
              <span className={filterType === "buy" ? "hero-cta-label" : undefined}>{isFr ? "Achats" : "Buys"}</span>
            </button>
            <button
              type="button"
              onClick={() => setFilterType("sell")}
              className={`rounded-xl px-4 py-2 text-sm font-semibold transition-all ${
                filterType === "sell"
                  ? "hero-cta"
                  : "border border-ip bg-slate-50 text-ip-secondary hover:bg-slate-100 dark:border-white/10 dark:bg-white/5 dark:text-slate-300 dark:hover:bg-white/10"
              }`}
            >
              <span className={filterType === "sell" ? "hero-cta-label" : undefined}>{isFr ? "Ventes" : "Sells"}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Liste des transactions */}
      <div className="overflow-hidden rounded-xl ip-panel">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-ip ip-table-head">
                <th className="px-6 py-4 text-left text-sm font-semibold uppercase tracking-wide text-ip-muted">Date</th>
                <th className="px-6 py-4 text-left text-sm font-semibold uppercase tracking-wide text-ip-muted">Type</th>
                <th className="px-6 py-4 text-left text-sm font-semibold uppercase tracking-wide text-ip-muted">{isFr ? "Actif" : "Asset"}</th>
                <th className="px-6 py-4 text-right text-sm font-semibold uppercase tracking-wide text-ip-muted">{isFr ? "Quantite" : "Quantity"}</th>
                <th className="px-6 py-4 text-right text-sm font-semibold uppercase tracking-wide text-ip-muted">{isFr ? "Prix unitaire" : "Unit price"}</th>
                <th className="px-6 py-4 text-right text-sm font-semibold uppercase tracking-wide text-ip-muted">Total</th>
              </tr>
            </thead>
            <tbody>
              {filteredTransactions.map((transaction) => (
                <tr key={transaction.id} className="border-b border-ip/50 transition-colors ip-row-hover">
                  <td className="px-6 py-4 text-sm text-ip">
                    {new Date(transaction.date).toLocaleDateString('fr-FR', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      {transaction.type === "buy" ? (
                        <>
                          <ArrowDownCircle className="h-5 w-5 text-violet-600 dark:text-violet-400" />
                          <span className="text-sm font-medium text-violet-800 dark:text-violet-300">{isFr ? "Achat" : "Buy"}</span>
                        </>
                      ) : (
                        <>
                          <ArrowUpCircle className="h-5 w-5 text-emerald-700 dark:text-emerald-400" />
                          <span className="text-sm font-medium text-emerald-800 dark:text-emerald-300">{isFr ? "Vente" : "Sell"}</span>
                        </>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div>
                      <p className="font-semibold text-ip">{transaction.assetSymbol}</p>
                      <p className="text-xs text-ip-subtle">{transaction.assetName}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right font-medium tabular-nums text-ip">
                    {transaction.quantity}
                  </td>
                  <td className="ip-fintech-nums px-6 py-4 text-right font-medium text-ip">
                    {formatTndWithUnit(transaction.price)}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span className="ip-fintech-nums font-semibold text-ip">{formatTndWithUnit(transaction.total)}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {filteredTransactions.length === 0 && (
        <div className="rounded-xl ip-panel py-12 text-center">
          <p className="text-ip-muted">{text.pages.portfolio.noTransactions}</p>
        </div>
      )}
    </div>
  );
}