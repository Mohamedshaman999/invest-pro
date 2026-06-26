import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { usePortfolio } from "../../contexts/PortfolioContext";
import { investApi, type AiTradingBotRow, type AiTradingFeedRow } from "../../services/investApi";
import { useAiTradingSocket } from "../../hooks/useAiTradingSocket";
import { CreateBotWizard } from "../ai-trading/CreateBotWizard";
import { Activity, Pause, Play, Square, Radio, Bot, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { formatTndWithUnit } from "../../utils/tndCurrency";
import { useLanguage } from "../../contexts/LanguageContext";
function statusDot(status: AiTradingBotRow["status"]) {
  if (status === "active")
    return "bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.65)] animate-pulse";
  if (status === "paused") return "bg-amber-400 shadow-[0_0_10px_rgba(251,191,36,0.5)]";
  return "bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.45)]";
}

function formatTs(iso: string, locale: string) {
  try {
    return new Date(iso).toLocaleString(locale, { dateStyle: "short", timeStyle: "medium" });
  } catch {
    return iso;
  }
}

function languageToLocale(language: string) {
  return language === "fr"
    ? "fr-FR"
    : language === "es"
    ? "es-ES"
    : language === "de"
    ? "de-DE"
    : language === "ar"
    ? "ar-EG"
    : "en-US";
}

export function AiTradingPage() {
  const { user } = useAuth();
  const { getTotalProfit } = usePortfolio();
  const { text, language } = useLanguage();
  const t = text.pages.aiTradingPage;
  const locale = languageToLocale(language);
  const [bots, setBots] = useState<AiTradingBotRow[]>([]);
  const [feed, setFeed] = useState<AiTradingFeedRow[]>([]);
  const [selectedBotId, setSelectedBotId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [feedLoading, setFeedLoading] = useState(false);
  const [marketBanner, setMarketBanner] = useState<string | null>(null);
  const [wizardOpen, setWizardOpen] = useState(false);
  const selectedBotIdRef = useRef<string | null>(null);
  selectedBotIdRef.current = selectedBotId;

  const loadBots = useCallback(async () => {
    setLoading(true);
    try {
      const res = await investApi.getAiTradingBots();
      setBots(res.bots);
      setSelectedBotId((prev) => {
        if (prev && res.bots.some((b) => b.id === prev)) return prev;
        return res.bots[0]?.id ?? null;
      });
    } catch {
      toast.error(t.loadBotsError);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadFeed = useCallback(async (botId: string) => {
    setFeedLoading(true);
    try {
      const res = await investApi.getAiTradingBotTransactions(botId);
      setFeed(res.transactions);
      setMarketBanner(null);
    } catch {
      setFeed([]);
      setMarketBanner(t.marketBannerUnavailable);
    } finally {
      setFeedLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadBots();
  }, [loadBots]);

  useEffect(() => {
    if (selectedBotId) void loadFeed(selectedBotId);
  }, [selectedBotId, loadFeed]);

  useAiTradingSocket(Boolean(user?.isVerified), {
    onTradeExecuted: () => {
      const id = selectedBotIdRef.current;
      if (id) void loadFeed(id);
      void loadBots();
    },
    onBotStarted: () => void loadBots(),
    onBotPaused: () => void loadBots(),
    onLossLimit: () => {
      toast.warning(t.dailyLossLimitReached);
      void loadBots();
    },
  });

  const selectedBot = useMemo(
    () => bots.find((b) => b.id === selectedBotId) ?? null,
    [bots, selectedBotId]
  );

  async function setStatus(botId: string, status: "active" | "paused" | "stopped") {
    try {
      await investApi.patchAiTradingBotStatus(botId, status);
      toast.success(
        status === "active"
          ? t.botStartedToast
          : status === "paused"
          ? t.botPausedToast
          : t.botStoppedToast
      );
      await loadBots();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Action impossible";
      toast.error(msg || t.actionFailed);
    }
  }

  const pnl = getTotalProfit();

  const card =
    "rounded-2xl border border-white/[0.08] bg-zinc-950/40 p-5 shadow-[0_8px_40px_-16px_rgba(0,0,0,0.85)] backdrop-blur-xl";

  return (
    <div className="relative min-h-0 flex-1 overflow-auto px-6 py-8">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(34,211,238,0.12),transparent_55%),radial-gradient(ellipse_at_bottom,_rgba(16,185,129,0.1),transparent_50%)]" />

      <div className="relative mx-auto max-w-6xl space-y-8">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-cyan-300/80">{t.moduleLabel}</p>
            <h1
              className="mt-1 text-3xl font-bold tracking-tight text-white"
              style={{ fontFamily: "Orbitron, ui-sans-serif, system-ui, sans-serif" }}
            >
              {t.title}
            </h1>
            <p className="mt-2 max-w-xl text-sm text-zinc-400">{t.subtitle}</p>
          </div>
          <button
            type="button"
            onClick={() => setWizardOpen(true)}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-500 to-emerald-500 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-cyan-500/25 transition hover:brightness-110"
          >
            <Bot className="h-5 w-5" />
            {t.newBot}
          </button>
        </header>

        {!user?.isVerified ? (
          <div className={`${card} flex items-start gap-3 border-amber-500/20 bg-amber-500/5`}>
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-300" />
            <p className="text-sm text-amber-100/90">{t.verificationRequired}</p>
          </div>
        ) : null}

        <div className="grid gap-6 lg:grid-cols-3">
          <div className={`${card} lg:col-span-2`}>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-white">{t.activeBotsHeading}</h2>
              <span className="text-xs text-zinc-500">{text.nav.aiTrading}</span>
            </div>
            {loading ? (
              <p className="text-sm text-zinc-500">{t.loading}</p>
            ) : bots.length === 0 ? (
              <p className="text-sm text-zinc-500">{t.emptyBots}</p>
            ) : (
              <ul className="space-y-3">
                {bots.map((b) => (
                  <li key={b.id}>
                    <button
                      type="button"
                      onClick={() => setSelectedBotId(b.id)}
                      className={`flex w-full items-center justify-between gap-3 rounded-xl border px-4 py-3 text-left transition ${
                        selectedBotId === b.id
                          ? "border-cyan-400/35 bg-cyan-500/10"
                          : "border-white/10 bg-black/20 hover:border-white/20"
                      }`}
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <span className={`inline-block size-2.5 rounded-full ${statusDot(b.status)}`} />
                        <div className="min-w-0">
                          <p className="truncate font-medium text-white">{b.name}</p>
                          <p className="truncate text-xs text-zinc-500">
                            {b.mode === "ai_strategy" ? t.modeAiStrategy : t.modeManual} · max {b.maxTransactionsPerDay}{" "}
                            {t.transactionsPerDay} · {b.maxAllocation} TND / trade
                          </p>
                        </div>
                      </div>
                      <span className="shrink-0 rounded-lg border border-white/10 px-2 py-0.5 text-[11px] uppercase tracking-wide text-zinc-400">
                        {b.status}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className={`${card}`}>
            <h2 className="mb-1 text-lg font-semibold text-white">{t.pnlTitle}</h2>
            <p className="text-xs text-zinc-500">{t.pnlSubtitle}</p>
            <p
              className={`mt-4 text-3xl font-semibold tabular-nums ${pnl >= 0 ? "text-emerald-300" : "text-rose-300"}`}
            >
              {formatTndWithUnit(pnl)}
            </p>
            <div className="mt-4 flex items-center gap-2 text-xs text-zinc-500">
              <Radio className="h-4 w-4 text-cyan-400/80" />
              {t.socketStream}
            </div>
          </div>
        </div>

        {selectedBot ? (
          <div className="grid gap-6 lg:grid-cols-3">
            <div className={`${card} lg:col-span-1`}>
              <h2 className="mb-4 text-lg font-semibold text-white">{t.controlPanelTitle}</h2>
              <p className="mb-4 text-xs leading-relaxed text-zinc-500">
                {t.selectedBot} <span className="text-zinc-200">{selectedBot.name}</span>
              </p>
              <div className="flex flex-col gap-2">
                <button
                  type="button"
                  disabled={!user?.isVerified}
                  onClick={() => void setStatus(selectedBot.id, "active")}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-2.5 text-sm font-medium text-emerald-100 transition hover:bg-emerald-500/20 disabled:opacity-40"
                >
                  <Play className="h-4 w-4" /> {t.start}
                </button>
                <button
                  type="button"
                  disabled={!user?.isVerified}
                  onClick={() => void setStatus(selectedBot.id, "paused")}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-2.5 text-sm font-medium text-amber-100 transition hover:bg-amber-500/20 disabled:opacity-40"
                >
                  <Pause className="h-4 w-4" /> {t.pause}
                </button>
                <button
                  type="button"
                  disabled={!user?.isVerified}
                  onClick={() => void setStatus(selectedBot.id, "stopped")}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-rose-500/35 bg-rose-500/10 px-4 py-2.5 text-sm font-medium text-rose-100 transition hover:bg-rose-500/20 disabled:opacity-40"
                >
                  <Square className="h-4 w-4" /> {t.stopHard}
                </button>
              </div>
              <p className="mt-4 text-[11px] text-zinc-600">
                {t.realizedLossToday} <span className="text-zinc-300">{selectedBot.dailyRealizedLossTnd?.toFixed?.(2) ?? 0} TND</span>
              </p>
            </div>

            <div className={`${card} lg:col-span-2`}>
              <div className="mb-4 flex items-center justify-between gap-2">
                <h2 className="text-lg font-semibold text-white">{t.operationsFeedTitle}</h2>
                <Activity className="h-5 w-5 text-cyan-400/70" />
              </div>
              {marketBanner ? (
                <p className="mb-3 rounded-lg border border-amber-500/25 bg-amber-500/10 px-3 py-2 text-xs text-amber-100">
                  {marketBanner}
                </p>
              ) : null}
              {feedLoading ? (
                <p className="text-sm text-zinc-500">{t.feedLoading}</p>
              ) : feed.length === 0 ? (
                <p className="text-sm text-zinc-500">{t.feedEmpty}</p>
              ) : (
                <div className="overflow-x-auto rounded-xl border border-white/10">
                  <table className="w-full min-w-[480px] text-left text-sm">
                    <thead className="border-b border-white/10 bg-black/30 text-xs uppercase tracking-wide text-zinc-500">
                      <tr>
                        <th className="px-3 py-2">{t.tableHeaderAsset}</th>
                        <th className="px-3 py-2">{t.tableHeaderAction}</th>
                        <th className="px-3 py-2">{t.tableHeaderAmount}</th>
                        <th className="px-3 py-2">{t.tableHeaderResult}</th>
                        <th className="px-3 py-2">{t.tableHeaderTime}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {feed.map((row) => (
                        <tr key={row.id} className="bg-black/10 text-zinc-200">
                          <td className="px-3 py-2 font-medium text-white">{row.assetSymbol}</td>
                          <td className="px-3 py-2 uppercase">{row.action}</td>
                          <td className="px-3 py-2 tabular-nums">{formatTndWithUnit(row.amount)}</td>
                          <td className="px-3 py-2">
                            {row.status === "success" && (
                              <span className="text-emerald-300/90">{t.statusSuccess}</span>
                            )}
                            {row.status === "pending" && (
                              <span className="text-amber-200/90">{t.statusPending}</span>
                            )}
                            {row.status === "failed" && (
                              <span className="text-rose-300/90" title={row.errorMessage || ""}>
                                {t.statusFailed}
                              </span>
                            )}
                          </td>
                          <td className="px-3 py-2 text-xs text-zinc-500">{formatTs(row.timestamp, locale)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        ) : null}
      </div>

      <CreateBotWizard open={wizardOpen} onOpenChange={setWizardOpen} onCreated={() => void loadBots()} />
    </div>
  );
}
