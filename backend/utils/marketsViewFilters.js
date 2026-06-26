/**
 * Même sémantique que `src/appp/utils/marketListDisplay.ts` (catégorie, recherche, tri).
 * Utilisable côté serveur pour filtrer une liste d’actifs (ex. scripts admin).
 */

const VALID_SORT = new Set(["perf_desc", "perf_asc", "mcap_desc", "volume_desc"]);

export function normalizeCategoryParam(raw) {
  const s = String(raw || "")
    .trim()
    .toLowerCase();
  if (s === "stocks" || s === "crypto" || s === "all") return s;
  return "all";
}

export function normalizeSortParam(raw) {
  const s = String(raw || "")
    .trim()
    .toLowerCase();
  if (s === "top_gainers") return "perf_desc";
  if (s === "top_losers") return "perf_asc";
  if (VALID_SORT.has(s)) return s;
  return "perf_desc";
}

export function marketMatchesCategoryAsset(asset, selectedCategory) {
  const symbol = String(asset.ticker || "")
    .trim()
    .toUpperCase();
  if (selectedCategory === "all") return true;
  if (selectedCategory === "stocks") return !["BTC", "ETH"].includes(symbol);
  if (selectedCategory === "crypto") return ["BTC", "ETH"].includes(symbol);
  return true;
}

export function assetMatchesSearchQuery(asset, query) {
  const q = String(query || "")
    .trim()
    .toLowerCase();
  if (!q) return true;
  const sym = String(asset.ticker || "").toLowerCase();
  const name = String(asset.name || "").toLowerCase();
  return sym.includes(q) || name.includes(q);
}

export function filterAssetsForMarketsView(assets, query, category) {
  return assets.filter(
    (a) => assetMatchesSearchQuery(a, query) && marketMatchesCategoryAsset(a, category),
  );
}

function perf(a) {
  return Number(a.variationPercent ?? 0);
}

function sortNumeric(a, kind) {
  if (kind === "volume") return Number(a.volume ?? 0);
  return Number(a.capMarket ?? 0);
}

export function sortAssetsForMarketsView(assets, sortBy) {
  const list = [...assets];
  switch (sortBy) {
    case "perf_desc":
      list.sort((a, b) => perf(b) - perf(a));
      break;
    case "perf_asc":
      list.sort((a, b) => perf(a) - perf(b));
      break;
    case "mcap_desc":
      list.sort((a, b) => sortNumeric(b, "mcap") - sortNumeric(a, "mcap"));
      break;
    case "volume_desc":
      list.sort((a, b) => sortNumeric(b, "volume") - sortNumeric(a, "volume"));
      break;
    default:
      break;
  }
  return list;
}

export function parseFiltersFromQuery(req) {
  let category = "all";
  let sort = "perf_desc";
  const raw = req.query.filters;
  if (typeof raw === "string" && raw.trim()) {
    try {
      const o = JSON.parse(raw);
      if (o && typeof o === "object") {
        if (o.category != null) category = normalizeCategoryParam(o.category);
        if (o.sort != null) sort = normalizeSortParam(o.sort);
      }
    } catch {
      /* ignore */
    }
  }
  if (req.query.category != null) category = normalizeCategoryParam(req.query.category);
  if (req.query.sector != null) category = normalizeCategoryParam(req.query.sector);
  if (req.query.sort != null) sort = normalizeSortParam(req.query.sort);
  return { category, sort };
}
