import { useCallback, useMemo, useState } from "react";
import { Loader2, Search, Sparkles } from "lucide-react";
import type { MarketStock } from "../../data/marketData";
import { useMarketData } from "../../contexts/MarketDataContext";
import { useLanguage } from "../../contexts/LanguageContext";
import type { AppLanguage } from "../../contexts/LanguageContext";
import { investApi, type AssetAiInfoResponse } from "../../services/investApi";
import { formatTndWithUnit } from "../../utils/tndCurrency";

function apiLang(language: AppLanguage): "fr" | "en" {
  return language === "fr" ? "fr" : "en";
}

export function AssetAiPage() {
  const { text, language } = useLanguage();
  const t = text.pages.aiAsset;
  const { markets, loading: marketsLoading, error: marketsError } = useMarketData();
  const [searchTerm, setSearchTerm] = useState("");
  const [selected, setSelected] = useState<MarketStock | null>(null);
  const [info, setInfo] = useState<AssetAiInfoResponse | null>(null);
  const [loadingInfo, setLoadingInfo] = useState(false);
  const [infoError, setInfoError] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return markets;
    return markets.filter(
      (m) => m.symbol.toLowerCase().includes(q) || m.name.toLowerCase().includes(q)
    );
  }, [markets, searchTerm]);

  const fetchInfo = useCallback(
    async (symbol: string) => {
      setLoadingInfo(true);
      setInfoError(null);
      setInfo(null);
      try {
        const data = await investApi.postAssetAiInfo({ ticker: symbol, lang: apiLang(language) });
        setInfo(data);
      } catch (e) {
        setInfoError(t.error);
        setInfo(null);
      } finally {
        setLoadingInfo(false);
      }
    },
    [language, t.error]
  );

  const onExplain = (stock: MarketStock) => {
    setSelected(stock);
    void fetchInfo(stock.symbol);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="mb-2 flex items-center gap-2 text-3xl font-bold tracking-tight text-ip">
          <Sparkles className="h-8 w-8 text-violet-400" aria-hidden />
          {t.title}
        </h1>
        <p className="text-ip-muted">{t.subtitle}</p>
      </div>

      <div className="relative max-w-xl">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-ip-secondary" />
        <input
          type="search"
          placeholder={t.searchPlaceholder}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="app-field w-full py-3 pl-10 pr-4"
          autoComplete="off"
        />
      </div>

      {marketsLoading ? (
        <div className="flex items-center gap-2 rounded-xl border border-ip bg-[var(--ip-nav-hover-bg)] px-4 py-3 text-sm text-ip-muted">
          <Loader2 className="h-4 w-4 animate-spin" />
          {t.loadingAssets}
        </div>
      ) : null}
      {marketsError ? (
        <div className="rounded-xl border border-red-400/25 bg-red-500/10 px-4 py-3 text-sm text-red-200">{t.error}</div>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-ip bg-[var(--ip-card-bg)] p-4 shadow-sm">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-ip-secondary">{text.nav.markets}</h2>
          <ul className="max-h-[min(480px,50vh)] space-y-2 overflow-y-auto pr-1">
            {filtered.map((m) => (
              <li key={m.symbol}>
                <div
                  className={`flex flex-wrap items-center justify-between gap-2 rounded-xl border px-3 py-2 transition-colors ${
                    selected?.symbol === m.symbol
                      ? "border-violet-500/40 bg-violet-500/10"
                      : "border-ip bg-[var(--ip-inner-well)] hover:border-ip/80"
                  }`}
                >
                  <div className="min-w-0">
                    <p className="font-semibold text-ip">{m.symbol}</p>
                    <p className="truncate text-sm text-ip-muted">{m.name}</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <span className="ip-fintech-nums text-sm font-medium text-ip">{formatTndWithUnit(m.price)}</span>
                    <button
                      type="button"
                      onClick={() => onExplain(m)}
                      className="hero-cta inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold"
                    >
                      <Sparkles className="h-3.5 w-3.5" />
                      {t.explain}
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
          {!filtered.length && !marketsLoading ? (
            <p className="mt-4 text-sm text-ip-muted">{t.pickAsset}</p>
          ) : null}
        </section>

        <section className="space-y-4">
          {!selected && !loadingInfo && !info ? (
            <div className="rounded-2xl border border-dashed border-ip px-4 py-8 text-center text-sm text-ip-muted">
              {t.pickAsset}
            </div>
          ) : null}

          {selected ? (
            <p className="text-sm text-ip-muted">
              <span className="font-semibold text-ip">{selected.symbol}</span> — {selected.name}
            </p>
          ) : null}

          {loadingInfo ? (
            <div className="flex items-center gap-2 rounded-xl border border-ip bg-[var(--ip-nav-hover-bg)] px-4 py-3 text-sm text-ip-muted">
              <Loader2 className="h-4 w-4 animate-spin" />
              {t.loading}
            </div>
          ) : null}

          {infoError ? (
            <div className="rounded-xl border border-red-400/25 bg-red-500/10 px-4 py-3 text-sm text-red-200">{infoError}</div>
          ) : null}

          {info ? (
            <div className="space-y-4">
              <article className="rounded-2xl border border-ip bg-[var(--ip-card-bg)] p-5 shadow-sm">
                <h3 className="mb-2 flex items-center gap-2 text-lg font-semibold text-ip">
                  <span className="rounded-lg bg-violet-500/15 px-2 py-0.5 text-xs font-bold uppercase tracking-wide text-violet-300">
                    {t.cardWhat}
                  </span>
                </h3>
                <p className="leading-relaxed text-ip [text-wrap:pretty]">{info.description}</p>
              </article>

              <article className="rounded-2xl border border-ip bg-[var(--ip-card-bg)] p-5 shadow-sm">
                <h3 className="mb-2 text-lg font-semibold text-ip">{t.cardRisk}</h3>
                <p className="leading-relaxed text-amber-200/90 [text-wrap:pretty]">{info.riskLevel}</p>
              </article>

              <article className="rounded-2xl border border-ip bg-[var(--ip-card-bg)] p-5 shadow-sm">
                <h3 className="mb-3 text-lg font-semibold text-ip">{t.cardWhy}</h3>
                <ul className="list-inside list-disc space-y-2 text-ip [text-wrap:pretty]">
                  {info.whyInvest.map((line, i) => (
                    <li key={i} className="leading-relaxed">
                      {line}
                    </li>
                  ))}
                </ul>
              </article>

              <p className="text-xs text-ip-secondary">{t.disclaimer}</p>
            </div>
          ) : null}
        </section>
      </div>
    </div>
  );
}
