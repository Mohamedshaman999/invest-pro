import { useMemo } from "react";
import { useMarketData } from "../contexts/MarketDataContext";
import { countStructuredMarketFilters } from "../utils/marketListDisplay";

/**
 * État filtres / tri / recherche Marchés (même source que la page Marchés).
 */
export function useMarketFilters() {
  const {
    marketsCategoryFilter,
    setMarketsCategoryFilter,
    marketsSortBy,
    setMarketsSortBy,
    marketsSearchInput,
    setMarketsSearchInput,
    marketsSearchQuery,
    clearMarketsViewFilters,
  } = useMarketData();

  const activeStructuredFilterCount = useMemo(
    () => countStructuredMarketFilters(marketsCategoryFilter, marketsSortBy),
    [marketsCategoryFilter, marketsSortBy]
  );

  return {
    marketsCategoryFilter,
    setMarketsCategoryFilter,
    marketsSortBy,
    setMarketsSortBy,
    marketsSearchInput,
    setMarketsSearchInput,
    marketsSearchQuery,
    activeStructuredFilterCount,
    clearMarketsViewFilters,
  };
}
