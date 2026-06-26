import { useId, useMemo } from "react";
import { Loader2 } from "lucide-react";
import { usePortfolio } from "../../contexts/PortfolioContext";
import { useWallet } from "../../contexts/WalletContext";
import { TrendingUp, TrendingDown, Wallet, DollarSign, BarChart3, Info } from "lucide-react";
import {
  AreaChart,
  Area,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import type { AnimationTiming } from "recharts/types/util/types";
/** Recharts passes `Payload<ValueType, NameType>[]` from chart callbacks; widen for strict TS. */
type ChartTooltipPayload = ReadonlyArray<{ value?: unknown; name?: unknown; payload?: unknown }> | undefined;
import { useLanguage } from "../../contexts/LanguageContext";
import { useTheme } from "../../contexts/ThemeContext";
import { formatTndAmount, formatTndWithUnit } from "../../utils/tndCurrency";

const legendDotClasses = ["bg-violet-500", "bg-purple-500", "bg-fuchsia-500", "bg-amber-500"];

const COLORS = ["#8B5CF6", "#A855F7", "#EC4899", "#F59E0B"];

/** Passed to CSS `transition` / JS easing; typings only list keywords. */
const STUDIO_EASE = "cubic-bezier(0.4, 0, 0.2, 1)" as AnimationTiming;

function PerformanceTooltip({
  active,
  label,
  payload,
  valueLabel,
}: {
  active?: boolean;
  label?: string;
  payload?: ChartTooltipPayload;
  valueLabel: string;
}) {
  if (!active || !payload?.length) return null;
  const v = payload[0]?.value;
  if (typeof v !== "number") return null;
  return (
    <div className="rounded-xl border border-white/10 bg-zinc-900/80 px-3 py-2.5 shadow-xl backdrop-blur-md">
      <p className="mb-0.5 text-xs font-medium text-zinc-400">{label}</p>
      <p className="ip-fintech-nums text-sm font-semibold text-white">{formatTndWithUnit(v)}</p>
      <p className="mt-0.5 text-[11px] text-zinc-500">{valueLabel}</p>
    </div>
  );
}

function DistributionTooltip({
  active,
  payload,
  investedPortfolioTotal,
  investedShareSuffix,
}: {
  active?: boolean;
  payload?: ChartTooltipPayload;
  investedPortfolioTotal: number;
  investedShareSuffix: string;
}) {
  if (!active || !payload?.length) return null;
  const item = payload[0]?.payload as { name?: string; value?: number } | undefined;
  const nameRaw = item?.name ?? payload[0]?.name;
  const nameLabel =
    typeof nameRaw === "string" || typeof nameRaw === "number" ? String(nameRaw) : "";
  const v = payload[0]?.value;
  if (typeof v !== "number") return null;
  const pct =
    investedPortfolioTotal > 0 ? (v / investedPortfolioTotal) * 100 : 0;
  return (
    <div className="rounded-xl border border-white/10 bg-zinc-900/80 px-3 py-2.5 shadow-xl backdrop-blur-md">
      <p className="mb-0.5 text-xs font-medium text-zinc-400">{nameLabel}</p>
      <p className="ip-fintech-nums text-sm font-semibold text-white">{formatTndWithUnit(v)}</p>
      <p className="mt-1 text-[11px] tabular-nums text-zinc-400">
        {pct.toFixed(1)}% {investedShareSuffix}
      </p>
    </div>
  );
}

function PulsingActiveDot(props: { cx?: number; cy?: number }) {
  const { cx, cy } = props;
  if (cx == null || cy == null) return null;
  return (
    <g className="pointer-events-none">
      <circle cx={cx} cy={cy} r={7} fill="none" stroke="#a855f7" strokeWidth={2}>
        <animate attributeName="r" values="7;22" dur="1.15s" repeatCount="indefinite" />
        <animate attributeName="stroke-opacity" values="0.55;0" dur="1.15s" repeatCount="indefinite" />
      </circle>
      <circle cx={cx} cy={cy} r={5} fill="#ffffff" stroke="#3b82f6" strokeWidth={2} />
    </g>
  );
}

export function DashboardPage() {
  const { assets, getTotalValue, getTotalProfit, performance, loading: portfolioLoading } = usePortfolio();
  const { stndBalance } = useWallet();
  const { text, language } = useLanguage();
  const { resolvedTheme } = useTheme();
  const chartGradId = useId().replace(/:/g, "");

  const chartGridStroke =
    resolvedTheme === "dark" ? "rgba(255, 255, 255, 0.03)" : "rgba(0, 0, 0, 0.03)";
  const chartAxisColor = resolvedTheme === "dark" ? "#94a3b8" : "#64748b";
  const localeMap: Record<string, string> = {
    fr: "fr-FR",
    en: "en-US",
    es: "es-ES",
    de: "de-DE",
    ar: "ar-SA",
  };
  const locale = localeMap[language] ?? "en-US";

  /** Market value of held assets only (excludes TND cash balance). */
  const portfolioMarketValue = getTotalValue();
  const cashTndBalance = stndBalance;
  /** Net worth shown on "Valeur totale" card: assets + liquidity. */
  const netWorthTotal = portfolioMarketValue + cashTndBalance;

  const totalProfit = getTotalProfit();
  const profitCostBasis = portfolioMarketValue - totalProfit;
  const profitPercentage =
    Math.abs(profitCostBasis) > 1e-9 ? (totalProfit / profitCostBasis) * 100 : 0;

  const netWorthBreakdownText = `${text.pages.dashboard.totalValueBreakdownAssets}: ${formatTndWithUnit(portfolioMarketValue)} | ${text.pages.dashboard.totalValueBreakdownCash}: ${formatTndWithUnit(cashTndBalance)}`;

  const performanceData = useMemo(() => {
    if (performance.length > 0) {
      return performance.map((p) => ({
        date: p.date,
        valeur: p.value,
      }));
    }
    return text.pages.dashboard.performanceMonths.map((month) => ({
      date: month,
      valeur: 0,
    }));
  }, [performance, text.pages.dashboard.performanceMonths]);

  const assetsByType = assets.reduce(
    (acc, asset) => {
      const value = asset.quantity * asset.currentPrice;
      let typeName = "";

      if (asset.type === "stock") {
        typeName = text.pages.dashboard.assetTypes.stock;
      } else if (asset.type === "crypto") {
        typeName = text.pages.dashboard.assetTypes.crypto;
      } else if (asset.type === "etf") {
        typeName = text.pages.dashboard.assetTypes.etf;
      }

      const existing = acc.find((item) => item.name === typeName);
      if (existing) {
        existing.value += value;
      } else {
        acc.push({ name: typeName, value });
      }
      return acc;
    },
    [] as { name: string; value: number }[],
  );

  const stats = [
    {
      label: text.pages.dashboard.statLabels.totalValue,
      value: formatTndWithUnit(netWorthTotal),
      change: text.pages.dashboard.statChanges.thisMonth,
      isPositive: totalProfit >= 0,
      icon: Wallet,
      color: "bg-violet-500",
    },
    {
      label: text.pages.dashboard.statLabels.profitLoss,
      value: `${totalProfit > 0 ? "+" : ""}${formatTndWithUnit(totalProfit)}`,
      change: text.pages.dashboard.statChanges.thisMonth,
      isPositive: totalProfit >= 0,
      icon: DollarSign,
      color: totalProfit >= 0 ? "bg-emerald-500" : "bg-rose-500",
    },
    {
      label: text.pages.dashboard.statLabels.assetsCount,
      value: assets.length.toString(),
      change: text.pages.dashboard.statChanges.assetsDifferent,
      isPositive: true,
      icon: BarChart3,
      color: "bg-purple-500",
    },
    {
      label: text.pages.dashboard.statLabels.performance,
      value: `+${profitPercentage.toFixed(1)}%`,
      change: text.pages.dashboard.statChanges.over7Months,
      isPositive: true,
      icon: TrendingUp,
      color: "bg-fuchsia-600",
    },
  ];

  const strokeGradId = `perf-stroke-${chartGradId}`;
  const areaFillGradId = `perf-fill-${chartGradId}`;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="mb-2 text-3xl font-bold tracking-tight text-ip">{text.pages.dashboard.title}</h1>
        <p className="text-ip-muted">{text.pages.dashboard.subtitle}</p>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, index) => (
          <div key={index} className="rounded-xl ip-panel p-6">
            <div className="mb-4 flex items-center justify-between">
              <div
                className={`${stat.color} flex h-12 w-12 items-center justify-center rounded-xl shadow-lg shadow-purple-500/15 dark:shadow-purple-900/25`}
              >
                <stat.icon className="h-6 w-6 text-white" />
              </div>
              <div
                className={`flex items-center gap-1 text-sm ${stat.isPositive ? "text-emerald-700 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}`}
              >
                {stat.isPositive ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                <span className="font-medium">{stat.change}</span>
              </div>
            </div>
            <div className="mb-1 flex items-center gap-1.5 text-sm text-ip-muted">
              <span>{stat.label}</span>
              {index === 0 ? (
                <span className="group relative inline-flex">
                  <button
                    type="button"
                    aria-label={text.pages.dashboard.totalValueInfoAria}
                    className="rounded p-0.5 text-ip-muted transition-colors hover:text-ip focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/60 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--ip-panel-bg,var(--background))]"
                  >
                    <Info className="h-3.5 w-3.5" strokeWidth={2} />
                  </button>
                  <span
                    role="tooltip"
                    className="pointer-events-none invisible absolute bottom-[calc(100%+8px)] left-1/2 z-50 w-max max-w-[min(280px,calc(100vw-2rem))] -translate-x-1/2 rounded-lg border border-white/10 bg-zinc-900/95 px-2.5 py-2 text-left text-[11px] leading-snug text-zinc-100 opacity-0 shadow-xl backdrop-blur-sm transition-[opacity,visibility] duration-150 group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100"
                  >
                    {netWorthBreakdownText}
                  </span>
                </span>
              ) : null}
            </div>
            <p className="ip-fintech-nums text-2xl font-bold text-ip">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="rounded-xl ip-panel p-6 lg:col-span-2">
          <div className="mb-6">
            <h2 className="mb-1 text-xl font-bold text-ip">{text.pages.dashboard.chart.portfolioTitle}</h2>
            <p className="text-sm text-ip-muted">{text.pages.dashboard.chart.portfolioSubtitle}</p>
          </div>
          {portfolioLoading ? (
            <div className="flex h-[300px] items-center justify-center gap-2 text-ip-muted">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : null}
          {!portfolioLoading ? (
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart
              data={performanceData}
              margin={{ top: 8, right: 8, left: 4, bottom: 0 }}
            >
              <defs>
                <linearGradient id={strokeGradId} x1="0" y1="0" x2="1" y2="0" gradientUnits="objectBoundingBox">
                  <stop offset="0%" stopColor="#a855f7" />
                  <stop offset="100%" stopColor="#3b82f6" />
                </linearGradient>
                <linearGradient id={areaFillGradId} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="rgb(168, 85, 247)" stopOpacity={0.2} />
                  <stop offset="100%" stopColor="rgb(168, 85, 247)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={chartGridStroke} />
              <XAxis dataKey="date" stroke={chartAxisColor} tick={{ fill: chartAxisColor, fontSize: 12 }} />
              <YAxis
                stroke={chartAxisColor}
                tick={{ fill: chartAxisColor, fontSize: 11 }}
                width={72}
                tickFormatter={(v) => formatTndAmount(Number(v))}
                label={{
                  value: "TND",
                  angle: -90,
                  position: "insideLeft",
                  fill: chartAxisColor,
                  fontSize: 11,
                  offset: 4,
                }}
              />
              <Tooltip
                cursor={{ stroke: "rgba(168, 85, 247, 0.25)", strokeWidth: 1 }}
                content={(props) => (
                  <PerformanceTooltip
                    active={props.active}
                    label={props.label}
                    payload={props.payload}
                    valueLabel={text.pages.dashboard.chart.tooltipValueLabel}
                  />
                )}
              />
              <Area
                type="monotone"
                dataKey="valeur"
                stroke={`url(#${strokeGradId})`}
                strokeWidth={3}
                fill={`url(#${areaFillGradId})`}
                dot={false}
                activeDot={(dotProps) => <PulsingActiveDot cx={dotProps.cx} cy={dotProps.cy} />}
                isAnimationActive
                animationDuration={1000}
                animationEasing={STUDIO_EASE}
              />
            </AreaChart>
          </ResponsiveContainer>
          ) : null}
        </div>

        <div className="rounded-xl ip-panel p-6">
          <div className="mb-6">
            <h2 className="mb-1 text-xl font-bold text-ip">{text.pages.dashboard.chart.distributionTitle}</h2>
            <p className="text-sm text-ip-muted">{text.pages.dashboard.chart.distributionSubtitle}</p>
          </div>
          <div className="relative h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <RechartsPieChart>
                <Pie
                  data={assetsByType}
                  cx="50%"
                  cy="50%"
                  innerRadius="85%"
                  outerRadius="100%"
                  paddingAngle={3}
                  cornerRadius={10}
                  dataKey="value"
                  stroke="none"
                  isAnimationActive
                  animationDuration={1000}
                  animationEasing={STUDIO_EASE}
                >
                  {assetsByType.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  content={(props) => (
                    <DistributionTooltip
                      active={props.active}
                      payload={props.payload}
                      investedPortfolioTotal={portfolioMarketValue}
                      investedShareSuffix={text.pages.dashboard.chart.distributionTooltipInvestedShare}
                    />
                  )}
                />
              </RechartsPieChart>
            </ResponsiveContainer>
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
              <p className="text-xs font-medium text-zinc-500">{text.pages.dashboard.chart.donutTotalLabel}</p>
              <p className="ip-fintech-nums mt-0.5 text-lg font-bold text-zinc-900 dark:text-white">
                {formatTndWithUnit(portfolioMarketValue)}
              </p>
            </div>
          </div>
          <div className="mt-4 space-y-2">
            {assetsByType.map((item, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`h-3 w-3 rounded-full ${legendDotClasses[index % legendDotClasses.length]}`} />
                  <span className="text-sm text-ip-muted">{item.name}</span>
                </div>
                <span className="ip-fintech-nums text-sm font-semibold text-ip">
                  {portfolioMarketValue > 0
                    ? ((item.value / portfolioMarketValue) * 100).toFixed(1)
                    : "0.0"}
                  %
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl ip-panel">
        <div className="border-b border-ip p-6">
          <h2 className="text-xl font-bold text-ip">{text.pages.dashboard.table.topPerformances}</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-ip ip-table-head">
                <th className="px-6 py-4 text-left text-sm font-semibold uppercase tracking-wide text-ip-muted">
                  {text.pages.dashboard.table.asset}
                </th>
                <th className="px-6 py-4 text-right text-sm font-semibold uppercase tracking-wide text-ip-muted">
                  {text.pages.dashboard.table.quantity}
                </th>
                <th className="px-6 py-4 text-right text-sm font-semibold uppercase tracking-wide text-ip-muted">
                  {text.pages.dashboard.table.purchasePrice}
                </th>
                <th className="px-6 py-4 text-right text-sm font-semibold uppercase tracking-wide text-ip-muted">
                  {text.pages.dashboard.table.currentPrice}
                </th>
                <th className="px-6 py-4 text-right text-sm font-semibold uppercase tracking-wide text-ip-muted">
                  {text.pages.dashboard.table.gainLoss}
                </th>
              </tr>
            </thead>
            <tbody>
              {assets
                .sort((a, b) => {
                  const profitA = (a.currentPrice - a.purchasePrice) / a.purchasePrice;
                  const profitB = (b.currentPrice - b.purchasePrice) / b.purchasePrice;
                  return profitB - profitA;
                })
                .slice(0, 5)
                .map((asset) => {
                  const profit = asset.quantity * (asset.currentPrice - asset.purchasePrice);
                  const profitPercent = ((asset.currentPrice - asset.purchasePrice) / asset.purchasePrice) * 100;
                  return (
                    <tr key={asset.id} className="border-b border-ip/50 transition-colors ip-row-hover">
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-semibold text-ip">{asset.symbol}</p>
                          <p className="text-sm text-ip-subtle">{asset.name}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right text-ip-secondary">{asset.quantity}</td>
                      <td className="ip-fintech-nums px-6 py-4 text-right text-ip-secondary">
                        {formatTndWithUnit(asset.purchasePrice)}
                      </td>
                      <td className="ip-fintech-nums px-6 py-4 text-right text-ip-secondary">
                        {formatTndWithUnit(asset.currentPrice)}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div
                          className={`inline-flex items-center gap-1 ${profit >= 0 ? "text-emerald-700 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}`}
                        >
                          {profit >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                          <span className="ip-fintech-nums font-semibold">
                            {profit >= 0 ? "+" : ""}
                            {formatTndWithUnit(profit)}
                          </span>
                          <span className="text-sm">
                            ({profitPercent >= 0 ? "+" : ""}
                            {profitPercent.toFixed(2)}%)
                          </span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
