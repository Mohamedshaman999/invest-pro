import type { MarketStock } from "../data/marketData";

export type MarketsSortBy = "perf_desc" | "perf_asc" | "mcap_desc" | "volume_desc";

export type MarketsCategoryFilter = "all" | "stocks" | "crypto";

/** Parse scraper-style percent strings ("+0,98%", "N/A") or numeric values for sorting. */
export function parseScrapedPercent(input: string | number | null | undefined): number {
  if (typeof input === "number" && Number.isFinite(input)) return input;
  if (input == null) return 0;
  const s = String(input).trim();
  if (!s || /^n\/a$/i.test(s) || s === "—") return 0;
  const normalized = s.replace(/%/g, "").replace(/\+/g, "").replace(/\s/g, "").replace(",", ".");
  const n = parseFloat(normalized);
  return Number.isFinite(n) ? n : 0;
}

/** Parse fr-TN style numbers from formatted cap/volume strings; missing → 0. */
function parseFrTnNumericString(raw: string | null | undefined): number {
  if (raw == null) return 0;
  const s = raw.trim();
  if (!s || /^n\/a$/i.test(s) || s === "—") return 0;
  const noUnit = s.replace(/\s*TND\s*/gi, "").trim();
  const compact = noUnit.replace(/[\s\u00a0\u202f]/g, "").replace(",", ".");
  const cleaned = compact.replace(/[^\d.-]/g, "");
  const n = parseFloat(cleaned);
  return Number.isFinite(n) ? n : 0;
}

/** Fallback for legacy compact labels like "2.4M", "568M TND". */
function parseCompactAbbrevNumber(raw: string | null | undefined): number {
  if (raw == null) return 0;
  const t = raw.trim().toUpperCase().replace(/\s/g, "").replace(/TND/g, "");
  if (!t || /^N\/A/.test(t)) return 0;
  const m = t.match(/^([\d.,]+)\s*([KMB])?/);
  if (!m) return 0;
  const n = parseFloat(m[1].replace(",", "."));
  if (!Number.isFinite(n)) return 0;
  const mult = m[2] === "K" ? 1e3 : m[2] === "M" ? 1e6 : m[2] === "B" ? 1e9 : 1;
  return n * mult;
}

function sortNumericForMarket(m: MarketStock, kind: "volume" | "mcap"): number {
  if (kind === "volume") {
    if (m.volumeRaw != null && Number.isFinite(m.volumeRaw)) return m.volumeRaw;
    const fromFr = parseFrTnNumericString(m.volume);
    if (fromFr !== 0) return fromFr;
    return parseCompactAbbrevNumber(m.volume);
  }
  if (m.capMarketRaw != null && Number.isFinite(m.capMarketRaw)) return m.capMarketRaw;
  const fromFr = parseFrTnNumericString(m.marketCap);
  if (fromFr !== 0) return fromFr;
  return parseCompactAbbrevNumber(m.marketCap);
}

export const DEFAULT_MARKETS_SORT: MarketsSortBy = "perf_desc";

export function marketMatchesCategory(market: MarketStock, selectedCategory: MarketsCategoryFilter): boolean {
  if (selectedCategory === "all") return true;
  if (selectedCategory === "stocks") return !["BTC", "ETH"].includes(market.symbol);
  if (selectedCategory === "crypto") return ["BTC", "ETH"].includes(market.symbol);
  return true;
}

/** Même règle que la recherche texte de la page Marchés (symbole ou nom). */
export function marketMatchesSearchQuery(market: MarketStock, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return (
    market.symbol.toLowerCase().includes(q) || market.name.toLowerCase().includes(q)
  );
}

/**
 * Filtre combiné recherche + catégorie (logique unique partagée header / Marchés).
 */
export function filterMarketsForMarketsView<T extends MarketStock>(
  markets: T[],
  query: string,
  category: MarketsCategoryFilter
): T[] {
  return markets.filter(
    (m) => marketMatchesSearchQuery(m, query) && marketMatchesCategory(m, category)
  );
}

export function filterSortMarketsForMarketsView<T extends MarketStock>(
  markets: T[],
  query: string,
  category: MarketsCategoryFilter,
  sortBy: MarketsSortBy
): T[] {
  return sortMarketsDisplayList(filterMarketsForMarketsView(markets, query, category), sortBy);
}

/** Nombre de contraintes structurées actives (hors texte), pour badge filtres. */
export function countStructuredMarketFilters(
  category: MarketsCategoryFilter,
  sortBy: MarketsSortBy
): number {
  let n = 0;
  if (category !== "all") n += 1;
  if (sortBy !== DEFAULT_MARKETS_SORT) n += 1;
  return n;
}

/** Filter only (e.g. Markets search is applied separately in the page). */
export function filterMarketsByCategory(markets: MarketStock[], selectedCategory: MarketsCategoryFilter): MarketStock[] {
  return markets.filter((m) => marketMatchesCategory(m, selectedCategory));
}

/**
 * Sort a copy of the list (same rules as Markets grid). Preserves API order when sortBy is not matched.
 */
export function sortMarketsDisplayList<T extends MarketStock>(markets: T[], sortBy: MarketsSortBy): T[] {
  const list = [...markets];
  const perf = (m: MarketStock) => parseScrapedPercent(m.changePercent);
  switch (sortBy) {
    case "perf_desc":
      list.sort((a, b) => perf(b) - perf(a));
      break;
    case "perf_asc":
      list.sort((a, b) => perf(a) - perf(b));
      break;
    case "mcap_desc":
      list.sort((a, b) => sortNumericForMarket(b, "mcap") - sortNumericForMarket(a, "mcap"));
      break;
    case "volume_desc":
      list.sort((a, b) => sortNumericForMarket(b, "volume") - sortNumericForMarket(a, "volume"));
      break;
    default:
      break;
  }
  return list;
}
