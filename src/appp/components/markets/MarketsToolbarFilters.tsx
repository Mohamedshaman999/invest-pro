import { SlidersHorizontal } from "lucide-react";
import { useLanguage } from "../../contexts/LanguageContext";
import type { MarketsSortBy } from "../../utils/marketListDisplay";
import { countStructuredMarketFilters } from "../../utils/marketListDisplay";
import { useMarketFilters } from "../../hooks/useMarketFilters";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";

type MarketsToolbarFiltersProps = {
  /** Affiche le bouton réinitialiser (même style que la barre Marchés). */
  showClearButton?: boolean;
  className?: string;
};

export function MarketsToolbarFilters({ showClearButton = false, className = "" }: MarketsToolbarFiltersProps) {
  const { text, language } = useLanguage();
  const isFr = language === "fr";
  const {
    marketsCategoryFilter,
    setMarketsCategoryFilter,
    marketsSortBy,
    setMarketsSortBy,
    marketsSearchInput,
    clearMarketsViewFilters,
  } = useMarketFilters();

  const sortOptions: { value: MarketsSortBy; label: string }[] =
    isFr
      ? [
          { value: "perf_desc", label: "Meilleure performance (%)" },
          { value: "perf_asc", label: "Moindre performance (%)" },
          { value: "mcap_desc", label: "Capitalisation (decroissant)" },
          { value: "volume_desc", label: "Volume (decroissant)" },
        ]
      : [
          { value: "perf_desc", label: "Best performance (%)" },
          { value: "perf_asc", label: "Lowest performance (%)" },
          { value: "mcap_desc", label: "Highest market cap" },
          { value: "volume_desc", label: "Highest volume" },
        ];

  const clearDisabled =
    countStructuredMarketFilters(marketsCategoryFilter, marketsSortBy) === 0 &&
    marketsSearchInput.trim() === "";

  return (
    <div className={`flex flex-wrap items-stretch gap-2 ${className}`.trim()}>
      <div className="markets-sort-shell group/markets-sort relative min-w-[220px] shrink-0">
        <span className="sr-only">{isFr ? "Trier les actifs" : "Sort assets"}</span>
        <Select value={marketsSortBy} onValueChange={(v) => setMarketsSortBy(v as MarketsSortBy)}>
          <SelectTrigger
            aria-label={isFr ? "Trier par" : "Sort by"}
            className="relative z-[2] flex h-auto min-h-[2.85rem] w-full min-w-0 items-center justify-start gap-2 border-0 bg-transparent py-3 pl-11 pr-3 text-sm font-semibold text-ip shadow-none ring-0 ring-offset-0 transition-colors hover:bg-transparent focus-visible:border-0 focus-visible:ring-0 focus-visible:outline-none data-[size=default]:h-auto dark:border-0 dark:bg-transparent dark:hover:bg-transparent [&>svg:last-child]:shrink-0 [&>svg:last-child]:text-ip-secondary/75 [&>svg:last-child]:opacity-90 group-hover/markets-sort:[&>svg:last-child]:text-violet-400/85 dark:group-hover/markets-sort:[&>svg:last-child]:text-violet-300/80"
          >
            <SlidersHorizontal
              className="pointer-events-none absolute left-3.5 top-1/2 z-[1] h-[1.125rem] w-[1.125rem] -translate-y-1/2 text-ip-secondary opacity-80 transition-colors duration-300 group-hover/markets-sort:text-violet-300/90 group-hover/markets-sort:opacity-100 dark:group-hover/markets-sort:text-violet-200/90"
              aria-hidden
            />
            <SelectValue className="line-clamp-1 min-w-0 flex-1 text-left" />
          </SelectTrigger>
          <SelectContent
            sideOffset={8}
            position="popper"
            className="markets-sort-content max-h-[min(22rem,var(--radix-select-content-available-height))] min-w-[var(--radix-select-trigger-width)] text-ip shadow-none data-[side=bottom]:translate-y-1 data-[side=top]:-translate-y-1"
          >
            {sortOptions.map((opt) => (
              <SelectItem key={opt.value} value={opt.value} className="markets-sort-item my-0.5 rounded-xl py-2.5 pr-9 pl-3">
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <button
        type="button"
        onClick={() => setMarketsCategoryFilter("all")}
        className={`rounded-xl px-4 py-3 text-sm font-semibold transition-all ${
          marketsCategoryFilter === "all"
            ? "hero-cta shadow-lg shadow-purple-900/30"
            : "border border-ip bg-[var(--ip-nav-hover-bg)] text-ip-secondary hover:border-purple-400/30 hover:bg-[var(--ip-sidebar-pro-bg)]"
        }`}
      >
        <span className={marketsCategoryFilter === "all" ? "hero-cta-label" : undefined}>{text.pages.markets.all}</span>
      </button>
      <button
        type="button"
        onClick={() => setMarketsCategoryFilter("stocks")}
        className={`rounded-xl px-4 py-3 text-sm font-semibold transition-all ${
          marketsCategoryFilter === "stocks"
            ? "hero-cta shadow-lg shadow-purple-900/30"
            : "border border-ip bg-[var(--ip-nav-hover-bg)] text-ip-secondary hover:border-purple-400/30 hover:bg-[var(--ip-sidebar-pro-bg)]"
        }`}
      >
        <span className={marketsCategoryFilter === "stocks" ? "hero-cta-label" : undefined}>{text.pages.markets.stocks}</span>
      </button>
      <button
        type="button"
        onClick={() => setMarketsCategoryFilter("crypto")}
        className={`rounded-xl px-4 py-3 text-sm font-semibold transition-all ${
          marketsCategoryFilter === "crypto"
            ? "hero-cta shadow-lg shadow-purple-900/30"
            : "border border-ip bg-[var(--ip-nav-hover-bg)] text-ip-secondary hover:border-purple-400/30 hover:bg-[var(--ip-sidebar-pro-bg)]"
        }`}
      >
        <span className={marketsCategoryFilter === "crypto" ? "hero-cta-label" : undefined}>{text.pages.markets.crypto}</span>
      </button>
      {showClearButton ? (
        <button
          type="button"
          disabled={clearDisabled}
          onClick={() => clearMarketsViewFilters()}
          className="rounded-xl border border-ip bg-[var(--ip-nav-hover-bg)] px-4 py-3 text-sm font-semibold text-ip-secondary transition-all hover:border-purple-400/30 hover:bg-[var(--ip-sidebar-pro-bg)] disabled:cursor-not-allowed disabled:opacity-40"
        >
          {text.pages.markets.clearFilters}
        </button>
      ) : null}
    </div>
  );
}
