import { Fragment, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, Search, Star, X, Maximize2, Loader2, Plus } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router";
import { LineChart, Line, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip, Area, AreaChart } from "recharts";
import type { AnimationTiming } from "recharts/types/util/types";
import type { MarketStockWithApi } from "../../contexts/MarketDataContext";
import { useMarketData } from "../../contexts/MarketDataContext";
import { investApi, type AssetDetailResponse } from "../../services/investApi";
import { formatMarketCapFrTn, formatVolumeFrTn } from "../../utils/frTnFormat";
import { useLanguage } from "../../contexts/LanguageContext";
import { useTheme } from "../../contexts/ThemeContext";
import { formatTndAmount, formatTndWithUnit } from "../../utils/tndCurrency";
import { filterSortMarketsForMarketsView } from "../../utils/marketListDisplay";
import { useMarketFilters } from "../../hooks/useMarketFilters";
import { MarketsToolbarFilters } from "../markets/MarketsToolbarFilters";

const chartAxisTick = { fontSize: 12 };

const STUDIO_EASE = "cubic-bezier(0.4, 0, 0.2, 1)" as AnimationTiming;

const CARD_LAYOUT_TRANSITION = { type: "spring" as const, stiffness: 380, damping: 32 };

function formatCardVolume(m: MarketStockWithApi): string {
  if (m.volumeRaw != null && Number.isFinite(m.volumeRaw)) return formatVolumeFrTn(m.volumeRaw);
  return m.volume;
}

function formatCardMarketCap(m: MarketStockWithApi): string {
  if (m.capMarketRaw != null && Number.isFinite(m.capMarketRaw)) return formatMarketCapFrTn(m.capMarketRaw);
  return m.marketCap;
}

type Timeframe = '1D' | '7D' | '1M' | '3M' | '6M' | '1Y' | '3Y' | 'ALL';

function sliceHistoryForTimeframe(
  data: { date: string; value: number }[],
  tf: Timeframe
): { date: string; value: number }[] {
  if (!data.length) return data;
  const limits: Record<Timeframe, number> = {
    "1D": 2,
    "7D": 7,
    "1M": 30,
    "3M": 90,
    "6M": 180,
    "1Y": 365,
    "3Y": 1095,
    ALL: data.length,
  };
  const n = limits[tf] ?? data.length;
  return data.slice(-Math.min(n, data.length));
}

export function MarketsPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const symbolFromUrl = searchParams.get("symbol");
  const {
    markets,
    toggleFavorite,
    loading: marketsLoading,
    error: marketsError,
  } = useMarketData();
  const { marketsSearchInput, setMarketsSearchInput, marketsSearchQuery, marketsCategoryFilter, marketsSortBy } =
    useMarketFilters();
  const { text, language } = useLanguage();
  const { resolvedTheme } = useTheme();
  const isFr = language === "fr";
  const [selectedStock, setSelectedStock] = useState<MarketStockWithApi | null>(null);
  const [selectedTimeframe, setSelectedTimeframe] = useState<Timeframe>('1M');
  const [detailSeries, setDetailSeries] = useState<{ date: string; value: number }[]>([]);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailPayload, setDetailPayload] = useState<AssetDetailResponse | null>(null);

  useEffect(() => {
    const sym = symbolFromUrl?.trim().toUpperCase();
    if (!sym || marketsLoading) return;
    const m = markets.find((x) => x.symbol.toUpperCase() === sym);
    if (m) setSelectedStock(m);
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.delete("symbol");
        return next;
      },
      { replace: true },
    );
  }, [symbolFromUrl, markets, marketsLoading, setSearchParams]);

  useEffect(() => {
    if (!selectedStock) {
      setDetailSeries([]);
      setDetailPayload(null);
      return;
    }
    let cancelled = false;
    setDetailLoading(true);
    setDetailPayload(null);
    void investApi
      .getAssetDetail(selectedStock.symbol)
      .then((detail) => {
        if (cancelled) return;
        setDetailPayload(detail);
        const arr = Array.isArray(detail.history) ? detail.history : [];
        setDetailSeries(arr.map((h) => ({ date: h.date, value: h.price })));
      })
      .catch(() => {
        if (!cancelled) {
          setDetailPayload(null);
          setDetailSeries([]);
        }
      })
      .finally(() => {
        if (!cancelled) setDetailLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [selectedStock?.symbol]);

  const chartDataForModal = useMemo(
    () => sliceHistoryForTimeframe(detailSeries, selectedTimeframe),
    [detailSeries, selectedTimeframe]
  );

  const sortedAssets = useMemo(
    () => filterSortMarketsForMarketsView(markets, marketsSearchQuery, marketsCategoryFilter, marketsSortBy),
    [markets, marketsSearchQuery, marketsCategoryFilter, marketsSortBy],
  );

  const favoriteMarkets = sortedAssets.filter((market) => market.favorite);
  const otherMarkets = sortedAssets.filter((market) => !market.favorite);

  const chartTooltipContentStyle = useMemo(
    () =>
      resolvedTheme === "dark"
        ? {
            backgroundColor: "rgba(15, 23, 42, 0.95)",
            border: "1px solid rgba(255, 255, 255, 0.1)",
            borderRadius: "12px",
            boxShadow: "0 20px 40px rgba(0, 0, 0, 0.45)",
            color: "#f1f5f9",
          }
        : {
            backgroundColor: "rgba(255, 255, 255, 0.96)",
            border: "1px solid rgba(139, 92, 246, 0.2)",
            borderRadius: "12px",
            boxShadow: "0 16px 40px rgba(139, 92, 246, 0.12)",
            color: "#0f172a",
          },
    [resolvedTheme],
  );

  const chartGridStroke =
    resolvedTheme === "dark" ? "rgba(255, 255, 255, 0.03)" : "rgba(0, 0, 0, 0.03)";
  const chartAxisTickFill = resolvedTheme === "dark" ? "#94a3b8" : "#64748b";

  const renderMarketCard = (market: MarketStockWithApi) => (
    <motion.div
      layout
      transition={CARD_LAYOUT_TRANSITION}
      className="stock-card group"
      onClick={() => setSelectedStock(market)}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-1">
            <h3 className="text-xl font-bold text-ip">{market.symbol}</h3>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                toggleFavorite(market.symbol);
              }}
              aria-pressed={market.favorite ? "true" : "false"}
              aria-label={market.favorite ? "Remove from favorites" : "Add to favorites"}
              className={`transition-colors ${market.favorite ? "text-amber-300" : "text-ip-secondary hover:text-amber-300/90"}`}
            >
              <Star
                className={`h-5 w-5 ${market.favorite ? "fill-current text-amber-300" : "text-ip-secondary"}`}
                fill={market.favorite ? "currentColor" : "none"}
              />
            </button>
            <Maximize2 className="ml-auto h-4 w-4 text-ip-secondary opacity-0 transition-opacity group-hover:opacity-100" />
          </div>
          <p className="text-sm text-ip-muted">{market.name}</p>
        </div>
        
        <div className="text-right">
          <p className="ip-fintech-nums text-2xl font-bold text-ip">
            {formatTndWithUnit(market.price)}
          </p>
          <div className={`flex items-center justify-end gap-1 ${market.change >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
            {market.change >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
            <span className="ip-fintech-nums font-semibold">
              {market.change >= 0 ? "+" : ""}
              {formatTndWithUnit(market.change)}
            </span>
            <span className="text-sm">
              ({market.changePercent >= 0 ? '+' : ''}{market.changePercent.toFixed(2)}%)
            </span>
          </div>
        </div>
      </div>

      <div className="mb-4 h-16 rounded-xl border border-ip bg-[var(--ip-inner-well)] p-2">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={market.chart}>
            <Line
              type="monotone"
              dataKey="value"
              stroke={market.change >= 0 ? "#10B981" : "#EF4444"}
              strokeWidth={2}
              dot={false}
              isAnimationActive
              animationDuration={900}
              animationEasing={STUDIO_EASE}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-2 gap-4 border-t border-ip pt-4">
        <div>
          <p className="mb-1 text-xs text-ip-secondary">{isFr ? "Volume" : "Volume"}</p>
          <p className="text-sm font-semibold text-ip ip-fintech-nums">{formatCardVolume(market)}</p>
        </div>
        <div>
          <p className="mb-1 text-xs text-ip-secondary">{isFr ? "Cap. marche" : "Market cap"}</p>
          <p className="text-sm font-semibold text-ip ip-fintech-nums">{formatCardMarketCap(market)}</p>
        </div>
      </div>
    </motion.div>
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="mb-2 text-3xl font-bold tracking-tight text-ip">{text.pages.markets.title}</h1>
        <p className="text-ip-muted">{text.pages.markets.subtitle}</p>
      </div>

      {marketsLoading ? (
        <div className="flex items-center gap-2 rounded-xl border border-ip bg-[var(--ip-nav-hover-bg)] px-4 py-3 text-sm text-ip-muted">
          <Loader2 className="h-4 w-4 animate-spin" />
          {isFr ? "Chargement des marches..." : "Loading markets..."}
        </div>
      ) : null}
      {marketsError ? (
        <div className="rounded-xl border border-red-400/25 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          Something went wrong
        </div>
      ) : null}

      {/* Filtres et recherche */}
      <div className="flex flex-col gap-4 sm:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-ip-secondary" />
          <input
            type="text"
            placeholder={text.pages.markets.searchPlaceholder}
            value={marketsSearchInput}
            onChange={(e) => setMarketsSearchInput(e.target.value)}
            className="app-field py-3 pl-10 pr-4"
          />
        </div>

        <MarketsToolbarFilters showClearButton />
      </div>

      {!marketsLoading && markets.length > 0 && sortedAssets.length === 0 ? (
        <div className="rounded-xl border border-ip bg-[var(--ip-nav-hover-bg)] px-4 py-6 text-center text-sm text-ip-muted">
          {text.pages.markets.noMatchFilters}
        </div>
      ) : null}

      {/* Grille de marchés */}
      {favoriteMarkets.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-ip">{text.pages.markets.favorites}</h2>
          </div>
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {favoriteMarkets.map((m) => (
              <Fragment key={m.symbol}>{renderMarketCard(m)}</Fragment>
            ))}
          </div>
          {otherMarkets.length > 0 && <div className="border-t border-ip" />}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {otherMarkets.map((m) => (
          <Fragment key={m.symbol}>{renderMarketCard(m)}</Fragment>
        ))}
      </div>

      {/* Modal détaillé du graphique */}
      {selectedStock && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm ip-modal-overlay">
          <div className="ip-popover max-h-[90vh] w-full max-w-6xl overflow-y-auto rounded-2xl">
            {/* Header */}
            <div className="sticky top-0 z-[1] rounded-t-2xl border-b border-ip bg-[var(--ip-popover-bg)] p-6 backdrop-blur-xl">
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div>
                    <div className="flex items-center gap-3">
                      <h2 className="text-3xl font-bold text-ip">{selectedStock.symbol}</h2>
                      <button type="button" className="text-ip-secondary transition-colors hover:text-amber-300">
                        <Star className="h-6 w-6" />
                      </button>
                    </div>
                    <p className="mt-1 text-ip-muted">{selectedStock.name}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedStock(null)}
                  className="text-ip-secondary transition-colors hover:text-ip"
                >
                  <X className="h-8 w-8" />
                </button>
              </div>

              <div className="flex flex-wrap items-end justify-between gap-4">
                <div className="flex min-w-0 flex-1 flex-wrap items-end gap-4">
                  <div>
                    <p className="mb-1 text-sm text-ip-secondary">{isFr ? "Prix actuel" : "Current price"}</p>
                    <p className="ip-fintech-nums text-4xl font-bold text-ip">{formatTndWithUnit(selectedStock.price)}</p>
                  </div>
                  <div className={`flex items-center gap-2 pb-1 ${selectedStock.change >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                    {selectedStock.change >= 0 ? <TrendingUp className="w-6 h-6" /> : <TrendingDown className="w-6 h-6" />}
                    <span className="ip-fintech-nums text-2xl font-bold">
                      {selectedStock.change >= 0 ? "+" : ""}
                      {formatTndWithUnit(selectedStock.change)}
                    </span>
                    <span className="text-xl">
                      ({selectedStock.changePercent >= 0 ? '+' : ''}{selectedStock.changePercent.toFixed(2)}%)
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  disabled={selectedStock.id == null}
                  onClick={() => {
                    navigate("/portfolio", { state: { buySymbol: selectedStock.symbol } });
                    setSelectedStock(null);
                  }}
                  className="hero-cta inline-flex shrink-0 items-center gap-2 self-end rounded-xl px-6 py-3 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-45"
                >
                  <Plus className="h-5 w-5 shrink-0" />
                  <span className="hero-cta-label">{text.pages.portfolio.buyAsset}</span>
                </button>
              </div>
            </div>

            {/* Timeframe selector */}
            <div className="border-b border-ip p-6">
              <div className="flex flex-wrap gap-2">
                {[
                  { value: '1D' as Timeframe, label: '1 Jour' },
                  { value: '7D' as Timeframe, label: '7 Jours' },
                  { value: '1M' as Timeframe, label: '1 Mois' },
                  { value: '3M' as Timeframe, label: '3 Mois' },
                  { value: '6M' as Timeframe, label: '6 Mois' },
                  { value: '1Y' as Timeframe, label: '1 An' },
                  { value: '3Y' as Timeframe, label: '3 Ans' },
                  { value: 'ALL' as Timeframe, label: 'Tout' },
                ].map((tf) => (
                  <button
                    type="button"
                    key={tf.value}
                    onClick={() => setSelectedTimeframe(tf.value)}
                    className={`rounded-xl px-4 py-2 text-sm font-semibold transition-all ${
                      selectedTimeframe === tf.value
                        ? "hero-cta shadow-md shadow-purple-900/30"
                        : "border border-ip bg-[var(--ip-nav-hover-bg)] text-ip-secondary hover:bg-[var(--ip-sidebar-pro-bg)]"
                    }`}
                  >
                    <span className={selectedTimeframe === tf.value ? "hero-cta-label" : undefined}>{tf.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Graphique détaillé */}
            <div className="p-6">
              <div className="rounded-xl ip-inner-well p-6">
                {detailLoading ? (
                  <div className="flex h-[400px] items-center justify-center gap-2 text-ip-muted">
                    <Loader2 className="h-8 w-8 animate-spin" />
                  </div>
                ) : (
                <ResponsiveContainer width="100%" height={400}>
                  <AreaChart data={chartDataForModal.length ? chartDataForModal : [{ date: "", value: selectedStock.price }]}>
                    <defs>
                      <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={selectedStock.change >= 0 ? "#10B981" : "#EF4444"} stopOpacity={0.3}/>
                        <stop offset="95%" stopColor={selectedStock.change >= 0 ? "#10B981" : "#EF4444"} stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke={chartGridStroke} />
                    <XAxis 
                      dataKey="date" 
                      stroke="#64748b"
                      tick={{ ...chartAxisTick, fill: chartAxisTickFill }}
                    />
                    <YAxis
                      stroke="#64748b"
                      tick={{ ...chartAxisTick, fill: chartAxisTickFill }}
                      width={76}
                      tickFormatter={(value) => formatTndAmount(Number(value))}
                      label={{
                        value: "TND",
                        angle: -90,
                        position: "insideLeft",
                        fill: chartAxisTickFill,
                        fontSize: 11,
                        offset: 4,
                      }}
                    />
                    <Tooltip
                      contentStyle={chartTooltipContentStyle}
                      formatter={(value: number) => [formatTndWithUnit(value), isFr ? "Prix" : "Price"]}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="value" 
                      stroke={selectedStock.change >= 0 ? "#10B981" : "#EF4444"}
                      strokeWidth={3}
                      fill="url(#colorPrice)"
                      isAnimationActive
                      animationDuration={1000}
                      animationEasing={STUDIO_EASE}
                    />
                  </AreaChart>
                </ResponsiveContainer>
                )}
              </div>

              {/* Statistiques détaillées */}
              <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-4">
                <div className="rounded-xl border border-violet-500/20 bg-violet-500/10 p-4">
                  <p className="mb-1 text-sm text-violet-700 dark:text-violet-200">Volume</p>
                  <p className="text-xl font-bold text-ip ip-fintech-nums">
                    {detailPayload !== null
                      ? formatVolumeFrTn(detailPayload.volume)
                      : formatCardVolume(selectedStock)}
                  </p>
                </div>
                <div className="rounded-xl border border-fuchsia-500/20 bg-fuchsia-500/10 p-4">
                  <p className="mb-1 text-sm text-fuchsia-700 dark:text-fuchsia-200">{isFr ? "Cap. marche" : "Market cap"}</p>
                  <p className="text-xl font-bold text-ip ip-fintech-nums">
                    {detailPayload !== null
                      ? formatMarketCapFrTn(detailPayload.capMarket)
                      : formatCardMarketCap(selectedStock)}
                  </p>
                </div>
                <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-4">
                  <p className="mb-1 text-sm text-emerald-700 dark:text-emerald-200">{isFr ? "Variation" : "Change"}</p>
                  <p className={`text-xl font-bold ${selectedStock.change >= 0 ? "text-emerald-700 dark:text-emerald-300" : "text-rose-600 dark:text-rose-300"}`}>
                    {selectedStock.change >= 0 ? '+' : ''}{selectedStock.changePercent.toFixed(2)}%
                  </p>
                </div>
                <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 p-4">
                  <p className="mb-1 text-sm text-amber-800 dark:text-amber-200">{isFr ? "Type" : "Type"}</p>
                  <p className="text-xl font-bold capitalize text-ip">{selectedStock.type === 'stock' ? 'Action' : selectedStock.type}</p>
                </div>
              </div>

              {detailPayload?.analysis ? (
                <div className="mt-6 rounded-xl border border-ip bg-[var(--ip-inner-well)] p-5">
                  <h3 className="text-base font-semibold text-ip">
                    {isFr ? "Analyse technique" : "Technical analysis"}
                  </h3>
                  {detailPayload.analysis.insufficientData ? (
                    <p className="mt-2 text-sm text-ip-muted">
                      {isFr
                        ? "Donnees insuffisantes (moins de 14 seances). Statut neutre."
                        : "Insufficient data (fewer than 14 sessions). Neutral status."}
                    </p>
                  ) : (
                    <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
                      <div className="flex justify-between gap-4 rounded-lg border border-white/10 bg-white/5 px-3 py-2 dark:bg-black/20">
                        <dt className="text-ip-muted">SMA 20</dt>
                        <dd className="ip-fintech-nums font-semibold text-ip">
                          {detailPayload.analysis.sma20 != null
                            ? formatTndWithUnit(detailPayload.analysis.sma20)
                            : "—"}
                        </dd>
                      </div>
                      <div className="flex justify-between gap-4 rounded-lg border border-white/10 bg-white/5 px-3 py-2 dark:bg-black/20">
                        <dt className="text-ip-muted">RSI 14</dt>
                        <dd className="ip-fintech-nums font-semibold text-ip">
                          {detailPayload.analysis.rsi14 != null ? detailPayload.analysis.rsi14.toFixed(2) : "—"}
                        </dd>
                      </div>
                      <div className="flex justify-between gap-4 rounded-lg border border-white/10 bg-white/5 px-3 py-2 dark:bg-black/20 sm:col-span-2">
                        <dt className="text-ip-muted">{isFr ? "Statut" : "Status"}</dt>
                        <dd className="font-semibold text-ip">{detailPayload.analysis.status}</dd>
                      </div>
                    </dl>
                  )}
                </div>
              ) : null}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}