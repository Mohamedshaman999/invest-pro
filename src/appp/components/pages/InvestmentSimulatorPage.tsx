import { useCallback, useEffect, useMemo, useState } from "react";
import { Area, AreaChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Calculator, Loader2, Sparkles } from "lucide-react";
import { useLanguage, type AppLanguage } from "../../contexts/LanguageContext";
import { investApi, type InvestmentSimulateResponse, type PortfolioExpectedReturnResponse } from "../../services/investApi";
import { ApiError } from "../../lib/api";
import { formatTndWithUnit } from "../../utils/tndCurrency";
function apiLang(language: AppLanguage): "fr" | "en" {
  return language === "fr" ? "fr" : "en";
}

function parseYears(raw: string): number | null {
  const n = Number(String(raw).replace(",", "."));
  if (!Number.isFinite(n) || n <= 0) return null;
  return n;
}

function lookbackYearsForApi(simulationYears: number): number {
  return Math.max(1, Math.min(40, Math.round(simulationYears)));
}

export function InvestmentSimulatorPage() {
  const { text, language } = useLanguage();
  const t = text.pages.simulator;
  const localeMap: Record<string, string> = { fr: "fr-FR", en: "en-US", es: "es-ES", de: "de-DE", ar: "ar-SA" };
  const locale = localeMap[language] ?? "en-US";

  const [monthly, setMonthly] = useState("200");
  const [years, setYears] = useState("15");
  const [useCustomReturn, setUseCustomReturn] = useState(false);
  const [customPct, setCustomPct] = useState("7");

  const [returnLoading, setReturnLoading] = useState(false);
  const [returnError, setReturnError] = useState<string | null>(null);
  const [expectedPayload, setExpectedPayload] = useState<PortfolioExpectedReturnResponse | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<InvestmentSimulateResponse | null>(null);

  const yearsNum = useMemo(() => parseYears(years), [years]);

  useEffect(() => {
    if (useCustomReturn) {
      setReturnLoading(false);
      setReturnError(null);
      setExpectedPayload(null);
      return;
    }

    if (yearsNum == null) {
      setExpectedPayload(null);
      setReturnError(null);
      setReturnLoading(false);
      return;
    }

    const lookback = lookbackYearsForApi(yearsNum);
    let cancelled = false;
    const tmr = window.setTimeout(() => {
      void (async () => {
        setReturnLoading(true);
        setReturnError(null);
        try {
          const data = await investApi.getPortfolioExpectedReturn(lookback);
          if (!cancelled) {
            setExpectedPayload(data);
            setReturnError(null);
          }
        } catch (e) {
          if (!cancelled) {
            setExpectedPayload(null);
            const msg = e instanceof ApiError ? e.message : t.portfolioUnavailable;
            setReturnError(msg);
          }
        } finally {
          if (!cancelled) setReturnLoading(false);
        }
      })();
    }, 400);

    return () => {
      cancelled = true;
      window.clearTimeout(tmr);
    };
  }, [yearsNum, useCustomReturn, t.portfolioUnavailable]);

  const chartData = useMemo(() => {
    if (!result?.curve?.length) return [];
    return result.curve.map((row) => ({
      label: row.year === 0 ? t.year0 : `${t.yearPrefix} ${row.year}`,
      year: row.year,
      projected: row.value,
      contributed: row.contributions,
    }));
  }, [result, t.year0, t.yearPrefix]);

  const canSubmit = useMemo(() => {
    if (yearsNum == null) return false;
    const m = Number(String(monthly).replace(",", "."));
    if (!Number.isFinite(m) || m < 0) return false;
    if (useCustomReturn) {
      const c = Number(String(customPct).replace(",", "."));
      return Number.isFinite(c);
    }
    return !returnLoading && !returnError && expectedPayload != null;
  }, [yearsNum, monthly, useCustomReturn, customPct, returnLoading, returnError, expectedPayload]);

  const onSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setError(null);
      setLoading(true);
      setResult(null);
      try {
        const m = Number(String(monthly).replace(",", "."));
        const y = yearsNum;
        if (y == null || !Number.isFinite(m) || m < 0) {
          setError(t.invalidNumbers);
          return;
        }
        if (useCustomReturn) {
          const c = Number(String(customPct).replace(",", "."));
          if (!Number.isFinite(c)) {
            setError(t.invalidNumbers);
            return;
          }
        }
        const data = await investApi.postInvestmentSimulate({
          monthlyInvestment: m,
          years: y,
          lang: apiLang(language),
          useCustomReturn,
          ...(useCustomReturn ? { customAnnualReturnPercent: Number(String(customPct).replace(",", ".")) } : {}),
        });
        setResult(data);
      } catch (err) {
        setError(err instanceof ApiError ? err.message : t.error);
      } finally {
        setLoading(false);
      }
    },
    [language, monthly, yearsNum, useCustomReturn, customPct, t.error, t.invalidNumbers]
  );

  const displayBreakdown = useCustomReturn ? [] : expectedPayload?.breakdown ?? result?.breakdown ?? [];
  const customNum = Number(String(customPct).replace(",", "."));
  const displayExpectedPct = useCustomReturn
    ? Number.isFinite(customNum)
      ? customNum
      : null
    : expectedPayload?.expectedReturn ?? result?.expectedReturn ?? null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="mb-2 flex items-center gap-2 text-3xl font-bold tracking-tight text-ip">
          <Calculator className="h-8 w-8 text-violet-400" aria-hidden />
          {t.title}
        </h1>
        <p className="text-ip-muted">{t.subtitle}</p>
        <p className="mt-2 text-sm font-medium text-violet-200/90">{t.portfolioBasisLabel}</p>
        <p className="mt-1 text-xs text-ip-secondary">{t.disclaimerPastPerformance}</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-ip bg-[var(--ip-card-bg)] p-5 shadow-sm">
          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-ip-secondary">{t.monthlyLabel}</label>
              <input
                className="app-field w-full rounded-lg px-4 py-3"
                inputMode="decimal"
                value={monthly}
                onChange={(e) => setMonthly(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-ip-secondary">{t.yearsLabel}</label>
              <input
                className="app-field w-full rounded-lg px-4 py-3"
                inputMode="decimal"
                value={years}
                onChange={(e) => setYears(e.target.value)}
                required
              />
            </div>

            <div className="flex items-start gap-3 rounded-xl border border-ip bg-[var(--ip-inner-well)] px-3 py-3">
              <input
                id="sim-custom-return"
                type="checkbox"
                className="mt-1 h-4 w-4 rounded border-ip text-violet-500"
                checked={useCustomReturn}
                onChange={(e) => setUseCustomReturn(e.target.checked)}
              />
              <label htmlFor="sim-custom-return" className="cursor-pointer text-sm text-ip">
                {t.customReturnToggle}
              </label>
            </div>

            {useCustomReturn ? (
              <div>
                <label className="mb-2 block text-sm font-medium text-ip-secondary">{t.customReturnLabel}</label>
                <input
                  className="app-field w-full rounded-lg px-4 py-3"
                  inputMode="decimal"
                  value={customPct}
                  onChange={(e) => setCustomPct(e.target.value)}
                  required
                />
              </div>
            ) : (
              <div className="space-y-2 rounded-xl border border-ip bg-[var(--ip-inner-well)] px-3 py-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-ip-secondary">{t.estimatedAnnualReturn}</p>
                {returnLoading ? (
                  <div className="flex items-center gap-2 text-sm text-ip-muted">
                    <Loader2 className="h-4 w-4 animate-spin shrink-0" />
                    {t.loadingExpectedReturn}
                  </div>
                ) : returnError ? (
                  <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-100">{returnError}</div>
                ) : displayExpectedPct != null && Number.isFinite(displayExpectedPct) ? (
                  <p className="ip-fintech-nums text-2xl font-semibold text-ip">
                    {displayExpectedPct.toLocaleString(locale, { maximumFractionDigits: 2 })}%
                  </p>
                ) : (
                  <p className="text-sm text-ip-muted">—</p>
                )}

                {!useCustomReturn && displayBreakdown.length > 0 ? (
                  <div className="mt-3 border-t border-ip pt-3">
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ip-secondary">{t.breakdownHeading}</p>
                    <ul className="max-h-48 space-y-2 overflow-y-auto text-sm">
                      {displayBreakdown.map((row) => (
                        <li
                          key={row.symbol}
                          className="flex flex-wrap items-center gap-2 rounded-lg border border-ip/60 bg-[var(--ip-card-bg)] px-2 py-1.5 ip-fintech-nums"
                        >
                          <span className="font-semibold text-ip">{row.symbol}</span>
                          <span className="text-ip-muted">→</span>
                          <span className="text-ip-muted">
                            {(row.weight * 100).toLocaleString(locale, { maximumFractionDigits: 1 })}%
                          </span>
                          <span className="text-ip-muted">→</span>
                          <span className="font-medium text-violet-200">
                            {row.return.toLocaleString(locale, { maximumFractionDigits: 2 })}%
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !canSubmit}
              className="hero-cta inline-flex w-full items-center justify-center gap-2 rounded-lg px-5 py-3 text-sm font-semibold disabled:opacity-60"
            >
              {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Sparkles className="h-5 w-5" />}
              {t.run}
            </button>
          </form>
          <p className="mt-4 text-xs leading-relaxed text-ip-muted">{t.footerNote}</p>
        </section>

        <section className="rounded-2xl border border-ip bg-[var(--ip-card-bg)] p-5 shadow-sm">
          {!result && !loading ? (
            <p className="text-sm text-ip-muted">{t.emptyHint}</p>
          ) : null}
          {loading ? (
            <div className="flex items-center gap-2 text-sm text-ip-muted">
              <Loader2 className="h-5 w-5 animate-spin" />
              {t.loading}
            </div>
          ) : null}
          {error ? <div className="rounded-xl border border-red-400/25 bg-red-500/10 px-4 py-3 text-sm text-red-200">{error}</div> : null}
          {result ? (
            <div className="space-y-4">
              <div className="rounded-xl border border-violet-500/20 bg-violet-500/5 px-3 py-2 text-sm text-ip-muted">
                <span className="font-medium text-ip">{t.estimatedAnnualReturn}: </span>
                <span className="ip-fintech-nums font-semibold text-violet-100">
                  {result.expectedReturn.toLocaleString(locale, { maximumFractionDigits: 2 })}%
                </span>
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-xl border border-ip bg-[var(--ip-inner-well)] p-3">
                  <p className="text-xs font-medium uppercase tracking-wide text-ip-secondary">{t.finalValue}</p>
                  <p className="ip-fintech-nums mt-1 text-lg font-semibold text-ip">{formatTndWithUnit(result.finalValue)}</p>
                </div>
                <div className="rounded-xl border border-ip bg-[var(--ip-inner-well)] p-3">
                  <p className="text-xs font-medium uppercase tracking-wide text-ip-secondary">{t.contributed}</p>
                  <p className="ip-fintech-nums mt-1 text-lg font-semibold text-ip">{formatTndWithUnit(result.totalContributions)}</p>
                </div>
                <div className="rounded-xl border border-ip bg-[var(--ip-inner-well)] p-3">
                  <p className="text-xs font-medium uppercase tracking-wide text-ip-secondary">{t.gain}</p>
                  <p className="ip-fintech-nums mt-1 text-lg font-semibold text-emerald-400">{formatTndWithUnit(result.gain)}</p>
                </div>
              </div>
              <div>
                <h2 className="mb-2 text-sm font-semibold text-ip">{t.chartTitle}</h2>
                <div className="h-72 w-full min-w-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="simProj" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.35} />
                          <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="simContrib" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#94a3b8" stopOpacity={0.25} />
                          <stop offset="95%" stopColor="#94a3b8" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-ip/20" />
                      <XAxis dataKey="label" tick={{ fontSize: 11 }} className="fill-ip-muted" />
                      <YAxis
                        tick={{ fontSize: 11 }}
                        className="fill-ip-muted"
                        tickFormatter={(v) =>
                          typeof v === "number"
                            ? v.toLocaleString(locale, { notation: v >= 1e6 ? "compact" : "standard", maximumFractionDigits: 0 })
                            : String(v)
                        }
                      />
                      <Tooltip
                        formatter={(value: number) => formatTndWithUnit(value)}
                        labelClassName="text-ip"
                        contentStyle={{
                          borderRadius: 12,
                          border: "1px solid rgba(148,163,184,0.25)",
                          background: "rgba(15,23,42,0.92)",
                        }}
                      />
                      <Legend />
                      <Area type="monotone" dataKey="projected" name={t.chartProjected} stroke="#8b5cf6" fill="url(#simProj)" strokeWidth={2} />
                      <Area type="monotone" dataKey="contributed" name={t.chartContributed} stroke="#94a3b8" fill="url(#simContrib)" strokeWidth={1.5} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          ) : null}
        </section>
      </div>

      {result?.explanation ? (
        <section className="rounded-2xl border border-violet-500/25 bg-violet-500/5 p-5">
          <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-violet-200">
            <Sparkles className="h-4 w-4" />
            {t.aiTitle}
          </h2>
          <div className="whitespace-pre-wrap text-sm leading-relaxed text-ip">{result.explanation}</div>
        </section>
      ) : null}
    </div>
  );
}
