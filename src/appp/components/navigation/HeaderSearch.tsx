import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router";
import { useLanguage } from "../../contexts/LanguageContext";
import { useMarketData } from "../../contexts/MarketDataContext";
import { useMarketFilters } from "../../hooks/useMarketFilters";
import { formatTndWithUnit } from "../../utils/tndCurrency";
import { filterSortMarketsForMarketsView } from "../../utils/marketListDisplay";
import type { MarketStockWithApi } from "../../contexts/MarketDataContext";
import { MarketsToolbarFilters } from "../markets/MarketsToolbarFilters";
import { TrendingDown, TrendingUp } from "lucide-react";

type HeaderSearchProps = {
  placeholder: string;
  filterAriaLabel?: string;
};

function isInsideRadixSelectTarget(target: EventTarget | null): boolean {
  if (!(target instanceof Element)) return false;
  return Boolean(
    target.closest?.('[data-slot="select-content"]') ||
      target.closest?.("[data-radix-select-content]") ||
      target.closest?.("[data-radix-popper-content-wrapper]"),
  );
}

export function HeaderSearch({ placeholder, filterAriaLabel = "Filter" }: HeaderSearchProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { text, language } = useLanguage();
  const { markets } = useMarketData();
  const {
    marketsSearchInput,
    setMarketsSearchInput,
    marketsSearchQuery,
    marketsCategoryFilter,
    marketsSortBy,
    activeStructuredFilterCount,
  } = useMarketFilters();

  const [resultsOpen, setResultsOpen] = useState(false);
  const [filterPanelOpen, setFilterPanelOpen] = useState(false);

  const focusInput = useCallback(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        focusInput();
        setResultsOpen(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [focusInput]);

  useEffect(() => {
    if (!resultsOpen && !filterPanelOpen) return;
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setResultsOpen(false);
        setFilterPanelOpen(false);
      }
    };
    window.addEventListener("keydown", onEsc);
    return () => window.removeEventListener("keydown", onEsc);
  }, [resultsOpen, filterPanelOpen]);

  useEffect(() => {
    if (!resultsOpen && !filterPanelOpen) return;
    const onDown = (e: MouseEvent) => {
      const t = e.target;
      if (rootRef.current && t instanceof Node && rootRef.current.contains(t)) return;
      if (isInsideRadixSelectTarget(t)) return;
      setResultsOpen(false);
      setFilterPanelOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [resultsOpen, filterPanelOpen]);

  const headerResults: MarketStockWithApi[] = useMemo(
    () => filterSortMarketsForMarketsView(markets, marketsSearchQuery, marketsCategoryFilter, marketsSortBy).slice(0, 12),
    [markets, marketsSearchQuery, marketsCategoryFilter, marketsSortBy],
  );

  const openMarketsToRow = useCallback(
    (symbol: string) => {
      setResultsOpen(false);
      setFilterPanelOpen(false);
      navigate({ pathname: "/markets", search: `?symbol=${encodeURIComponent(symbol)}` });
    },
    [navigate],
  );

  return (
    <div ref={rootRef} className="relative w-full max-w-md">
      <div className="ip-header-search" id="poda">
        <div className="ip-header-search__glow glow" aria-hidden />
        <div className="ip-header-search__dark-border-bg darkBorderBg" aria-hidden />
        <div className="ip-header-search__dark-border-bg darkBorderBg" aria-hidden />
        <div className="ip-header-search__dark-border-bg darkBorderBg" aria-hidden />
        <div className="ip-header-search__white white" aria-hidden />
        <div className="ip-header-search__border border" aria-hidden />

        <div className="ip-header-search__main" id="main">
          <input
            ref={inputRef}
            type="text"
            name="header-search"
            placeholder={placeholder}
            className="ip-header-search__input input"
            autoComplete="off"
            spellCheck={false}
            value={marketsSearchInput}
            onChange={(e) => {
              setMarketsSearchInput(e.target.value);
              setResultsOpen(true);
            }}
            onFocus={() => setResultsOpen(true)}
            aria-expanded={resultsOpen}
            aria-controls="ip-header-search-results"
          />
          <div className="ip-header-search__filter-border filterBorder" aria-hidden />
          <div className="ip-header-search__search-icon" id="search-icon" aria-hidden>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden>
              <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <button
            type="button"
            className="ip-header-search__filter-btn"
            id="filter-icon"
            aria-label={filterAriaLabel}
            aria-expanded={filterPanelOpen}
            onClick={() => {
              setFilterPanelOpen((v) => !v);
              setResultsOpen(false);
            }}
          >
            <svg height="27" width="27" viewBox="4.8 4.56 14.832 15.408" fill="none" aria-hidden>
              <path
                d="M8.16 6.65002H15.83C16.47 6.65002 16.99 7.17002 16.99 7.81002V9.09002C16.99 9.56002 16.7 10.14 16.41 10.43L13.91 12.64C13.56 12.93 13.33 13.51 13.33 13.98V16.48C13.33 16.83 13.1 17.29 12.81 17.47L12 17.98C11.24 18.45 10.2 17.92 10.2 16.99V13.91C10.2 13.5 9.97 12.98 9.73 12.69L7.52 10.36C7.23 10.08 7 9.55002 7 9.20002V7.87002C7 7.17002 7.52 6.65002 8.16 6.65002Z"
                stroke="currentColor"
                strokeWidth="1"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            {activeStructuredFilterCount > 0 ? (
              <span
                className="ip-header-search__filter-badge"
                aria-label={
                  language === "fr"
                    ? `${activeStructuredFilterCount} filtres actifs`
                    : `${activeStructuredFilterCount} active filters`
                }
              >
                {activeStructuredFilterCount > 9 ? "9+" : activeStructuredFilterCount}
              </span>
            ) : null}
          </button>
        </div>
      </div>

      {filterPanelOpen ? (
        <div
          className="absolute right-0 top-[calc(100%+10px)] z-[100] w-[min(100vw-2rem,28rem)] animate-in fade-in-0 zoom-in-95 slide-in-from-top-2 rounded-2xl border border-ip bg-[var(--ip-popover-bg)] p-4 shadow-xl backdrop-blur-xl duration-200"
          role="dialog"
          aria-label={filterAriaLabel}
        >
          <MarketsToolbarFilters showClearButton />
        </div>
      ) : null}

      {resultsOpen ? (
        <div
          id="ip-header-search-results"
          className="absolute left-0 right-0 top-[calc(100%+10px)] z-[100] max-h-[min(22rem,50vh)] overflow-y-auto rounded-2xl border border-ip bg-[var(--ip-popover-bg)] py-2 shadow-xl backdrop-blur-xl animate-in fade-in-0 zoom-in-95 slide-in-from-top-2 duration-200"
          role="listbox"
          aria-label={text.header.searchPlaceholder}
        >
          {headerResults.length === 0 ? (
            <p className="px-4 py-6 text-center text-sm text-ip-muted">{text.pages.markets.noMatchFilters}</p>
          ) : (
            <ul className="divide-y divide-ip/60">
              {headerResults.map((m) => (
                <li key={m.symbol}>
                  <button
                    type="button"
                    className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-[var(--ip-nav-hover-bg)]"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => openMarketsToRow(m.symbol)}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-ip">{m.symbol}</span>
                        <span
                          className={`inline-flex items-center gap-0.5 text-xs font-medium ${m.change >= 0 ? "text-emerald-400" : "text-rose-400"}`}
                        >
                          {m.change >= 0 ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
                          {m.changePercent >= 0 ? "+" : ""}
                          {m.changePercent.toFixed(2)}%
                        </span>
                      </div>
                      <p className="truncate text-xs text-ip-muted">{m.name}</p>
                    </div>
                    <span className="ip-fintech-nums shrink-0 text-sm font-semibold text-ip">{formatTndWithUnit(m.price)}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : null}
    </div>
  );
}
