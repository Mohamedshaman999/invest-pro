import { createContext, ReactNode, useContext, useEffect, useMemo, useState, useCallback } from "react";
import type { MarketStock } from "../data/marketData";
import { investApi, type ApiAsset } from "../services/investApi";
import { ApiError } from "../lib/api";
import { formatMarketCapFrTn, formatVolumeFrTn } from "../utils/frTnFormat";
import {
  clearMarketSnapshot,
  loadMarketSnapshot,
  saveMarketSnapshot,
  type MarketSnapshotRow,
} from "../utils/clientDataSnapshots";
import { DEFAULT_MARKETS_SORT, type MarketsCategoryFilter, type MarketsSortBy } from "../utils/marketListDisplay";

export type MarketStockWithApi = MarketStock & {
  apiUrl?: string;
  favorite?: boolean;
  id?: number;
};

type AddMarketInput = {
  symbol: string;
  name: string;
  type: MarketStock["type"];
  apiUrl?: string;
  price?: number;
};

interface MarketDataContextType {
  markets: MarketStockWithApi[];
  loading: boolean;
  error: string | null;
  addMarket: (input: AddMarketInput) => Promise<void>;
  removeMarket: (symbol: string) => Promise<void>;
  refreshMarketPrice: (symbol: string) => Promise<void>;
  toggleFavorite: (symbol: string) => void;
  reloadMarkets: (opts?: { silent?: boolean }) => Promise<void>;
  /** Filtre catégorie Marchés (partagé avec la page Marchés + liste d’achat). */
  marketsCategoryFilter: MarketsCategoryFilter;
  setMarketsCategoryFilter: (c: MarketsCategoryFilter) => void;
  /** Tri Marchés (partagé avec la page Marchés + liste d’achat). */
  marketsSortBy: MarketsSortBy;
  setMarketsSortBy: (s: MarketsSortBy) => void;
  /** Texte de recherche Marchés / header (valeur immédiate du champ). */
  marketsSearchInput: string;
  setMarketsSearchInput: (q: string) => void;
  /** Recherche appliquée aux listes (debounce 300 ms après la saisie). */
  marketsSearchQuery: string;
  /** Réinitialise catégorie, tri par défaut et recherche (état global Marchés). */
  clearMarketsViewFilters: () => void;
}

const MarketDataContext = createContext<MarketDataContextType | undefined>(undefined);

const FAVORITES_KEY = "marketFavorites:v1";
const MARKETS_VIEW_CATEGORY_KEY = "marketsViewCategory:v1";
const MARKETS_VIEW_SORT_KEY = "marketsViewSortBy:v1";
const MARKETS_SEARCH_INPUT_KEY = "marketsSearchInput:v1";

const SORT_VALUES: MarketsSortBy[] = ["perf_desc", "perf_asc", "mcap_desc", "volume_desc"];

function loadMarketsCategoryFilter(): MarketsCategoryFilter {
  try {
    const raw = localStorage.getItem(MARKETS_VIEW_CATEGORY_KEY);
    if (raw === "all" || raw === "stocks" || raw === "crypto") return raw;
  } catch {
    /* ignore */
  }
  return "all";
}

function loadMarketsSortBy(): MarketsSortBy {
  try {
    const raw = localStorage.getItem(MARKETS_VIEW_SORT_KEY);
    if (raw && SORT_VALUES.includes(raw as MarketsSortBy)) return raw as MarketsSortBy;
  } catch {
    /* ignore */
  }
  return DEFAULT_MARKETS_SORT;
}

function loadMarketsSearchInput(): string {
  try {
    const raw = localStorage.getItem(MARKETS_SEARCH_INPUT_KEY);
    if (raw != null) return raw;
  } catch {
    /* ignore */
  }
  return "";
}

function loadFavoriteSet(): Set<string> {
  try {
    const raw = localStorage.getItem(FAVORITES_KEY);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw) as unknown;
    if (Array.isArray(parsed)) return new Set(parsed.map((s) => String(s).toUpperCase()));
  } catch {
    /* ignore */
  }
  return new Set();
}

function saveFavoriteSet(set: Set<string>) {
  localStorage.setItem(FAVORITES_KEY, JSON.stringify([...set]));
}

function mapStockType(category: string, ticker: string): MarketStock["type"] {
  const u = ticker.toUpperCase();
  if (u === "BTC" || u === "ETH") return "crypto";
  const c = category.toLowerCase();
  if (c.includes("etf")) return "etf";
  if (c.includes("crypto")) return "crypto";
  return "stock";
}

function sparklineFromHistory(prices: number[]): { value: number }[] {
  if (prices.length === 0) return [];
  const tail = prices.slice(-12);
  return tail.map((value) => ({ value }));
}

async function buildMarketRow(a: ApiAsset, favorites: Set<string>): Promise<MarketStockWithApi> {
  const symbol = a.ticker.toUpperCase();
  let hist: Array<{ date: string; price: number }> = [];
  try {
    hist = await investApi.getHistory(symbol);
  } catch {
    hist = [];
  }
  const prices = hist.map((h) => Number(h.price)).filter((p) => Number.isFinite(p));
  const currentPrice = Number(a.currentPrice);
  let change = 0;
  let changePercent = 0;

  const serverVarRaw = a.variationPercent;
  const hasServerVar = serverVarRaw != null;
  const serverPct = Number(serverVarRaw);
  if (hasServerVar && Number.isFinite(serverPct)) {
    changePercent = serverPct;
    const denom = 1 + serverPct / 100;
    if (denom !== 0 && Number.isFinite(denom) && Number.isFinite(currentPrice)) {
      const prevPx = currentPrice / denom;
      change = currentPrice - prevPx;
    }
  } else if (prices.length >= 2) {
    const prev = prices[prices.length - 2];
    const lastHist = prices[prices.length - 1];
    const last = Number.isFinite(currentPrice) && currentPrice > 0 ? currentPrice : lastHist;
    change = last - prev;
    changePercent = prev !== 0 ? (change / prev) * 100 : 0;
  } else if (prices.length === 1) {
    const ref = prices[0];
    change = currentPrice - ref;
    changePercent = ref !== 0 ? (change / ref) * 100 : 0;
  }
  const chart =
    prices.length >= 2
      ? sparklineFromHistory(prices)
      : [
          { value: currentPrice },
          { value: currentPrice * 0.998 },
          { value: currentPrice },
        ];

  return {
    id: a.id,
    symbol,
    name: a.name,
    price: currentPrice,
    change,
    changePercent,
    volume: formatVolumeFrTn(a.volume ?? null),
    marketCap: formatMarketCapFrTn(a.capMarket ?? null),
    volumeRaw: a.volume ?? null,
    capMarketRaw: a.capMarket ?? null,
    type: mapStockType(a.category || "Stock", symbol),
    chart,
    favorite: favorites.has(symbol),
  };
}

function initialMarketRows(): MarketStockWithApi[] {
  const snap = loadMarketSnapshot();
  return snap ? (snap as MarketStockWithApi[]) : [];
}

export function MarketDataProvider({ children }: { children: ReactNode }) {
  const [markets, setMarkets] = useState<MarketStockWithApi[]>(() => initialMarketRows());
  const [loading, setLoading] = useState(() => !loadMarketSnapshot()?.length);
  const [error, setError] = useState<string | null>(null);
  const [marketsCategoryFilter, setMarketsCategoryFilterState] = useState<MarketsCategoryFilter>(
    () => loadMarketsCategoryFilter(),
  );
  const [marketsSortBy, setMarketsSortByState] = useState<MarketsSortBy>(() => loadMarketsSortBy());
  const initialSearch = loadMarketsSearchInput();
  const [marketsSearchInput, setMarketsSearchInputState] = useState(initialSearch);
  const [marketsSearchQuery, setMarketsSearchQuery] = useState(initialSearch);

  useEffect(() => {
    const id = window.setTimeout(() => {
      setMarketsSearchQuery(marketsSearchInput);
      try {
        localStorage.setItem(MARKETS_SEARCH_INPUT_KEY, marketsSearchInput);
      } catch {
        /* ignore */
      }
    }, 300);
    return () => window.clearTimeout(id);
  }, [marketsSearchInput]);

  const setMarketsSearchInput = useCallback((q: string) => {
    setMarketsSearchInputState(q);
  }, []);

  const clearMarketsViewFilters = useCallback(() => {
    setMarketsCategoryFilterState("all");
    setMarketsSortByState(DEFAULT_MARKETS_SORT);
    setMarketsSearchInputState("");
    setMarketsSearchQuery("");
    try {
      localStorage.setItem(MARKETS_VIEW_CATEGORY_KEY, "all");
      localStorage.setItem(MARKETS_VIEW_SORT_KEY, DEFAULT_MARKETS_SORT);
      localStorage.removeItem(MARKETS_SEARCH_INPUT_KEY);
    } catch {
      /* ignore */
    }
  }, []);

  const setMarketsCategoryFilter = useCallback((c: MarketsCategoryFilter) => {
    setMarketsCategoryFilterState(c);
    try {
      localStorage.setItem(MARKETS_VIEW_CATEGORY_KEY, c);
    } catch {
      /* ignore */
    }
  }, []);

  const setMarketsSortBy = useCallback((s: MarketsSortBy) => {
    setMarketsSortByState(s);
    try {
      localStorage.setItem(MARKETS_VIEW_SORT_KEY, s);
    } catch {
      /* ignore */
    }
  }, []);

  const reloadMarkets = useCallback(async (opts?: { silent?: boolean }) => {
    const silent = Boolean(opts?.silent);
    if (!silent) setLoading(true);
    if (!silent) setError(null);
    try {
      const { assets } = await investApi.getAssets();
      const list = assets || [];
      if (list.length === 0) {
        setMarkets([]);
        clearMarketSnapshot();
        return;
      }
      const favorites = loadFavoriteSet();
      const rows = await Promise.all(list.map((a) => buildMarketRow(a, favorites)));
      setMarkets(rows);
      saveMarketSnapshot(rows as MarketSnapshotRow[]);
    } catch (e) {
      if (!silent && (!(e instanceof ApiError) || e.status !== 401)) {
        setError("Something went wrong");
      }
      /* Conserver le dernier instantané affiché (disque + état) si l’API échoue. */
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    const hadDisk = loadMarketSnapshot()?.length;
    void reloadMarkets({ silent: Boolean(hadDisk) });
  }, [reloadMarkets]);

  /** Rafraîchissement périodique : cours, volume, cap., variation (aligné sur les jobs BVMT). */
  useEffect(() => {
    const id = window.setInterval(() => {
      void reloadMarkets({ silent: true });
    }, 45_000);
    return () => window.clearInterval(id);
  }, [reloadMarkets]);

  const toggleFavorite = useCallback((symbol: string) => {
    const normalized = symbol.trim().toUpperCase();
    const set = loadFavoriteSet();
    if (set.has(normalized)) set.delete(normalized);
    else set.add(normalized);
    saveFavoriteSet(set);
    setMarkets((prev) => {
      const next = prev.map((m) =>
        m.symbol.toUpperCase() === normalized ? { ...m, favorite: set.has(normalized) } : m
      );
      if (next.length) saveMarketSnapshot(next as MarketSnapshotRow[]);
      return next;
    });
  }, []);

  const addMarket = useCallback(
    async (input: AddMarketInput) => {
      const symbol = input.symbol.trim().toUpperCase();
      const name = input.name.trim();
      if (!symbol || !name) return;
      const price = input.price;
      if (price == null || !Number.isFinite(price)) {
        throw new Error("Prix manquant.");
      }
      const category =
        input.type === "crypto" ? "Crypto" : input.type === "etf" ? "ETF" : "Stock";
      await investApi.adminCreateAsset({
        ticker: symbol,
        name,
        category,
        currentPrice: price,
      });
      await reloadMarkets();
    },
    [reloadMarkets]
  );

  const removeMarket = useCallback(
    async (symbol: string) => {
      await investApi.adminDeleteAsset(symbol.trim().toUpperCase());
      await reloadMarkets();
    },
    [reloadMarkets]
  );

  const refreshMarketPrice = useCallback(async () => {
    await reloadMarkets();
  }, [reloadMarkets]);

  const value = useMemo(
    () => ({
      markets,
      loading,
      error,
      addMarket,
      removeMarket,
      refreshMarketPrice,
      toggleFavorite,
      reloadMarkets,
      marketsCategoryFilter,
      setMarketsCategoryFilter,
      marketsSortBy,
      setMarketsSortBy,
      marketsSearchInput,
      setMarketsSearchInput,
      marketsSearchQuery,
      clearMarketsViewFilters,
    }),
    [
      markets,
      loading,
      error,
      addMarket,
      removeMarket,
      refreshMarketPrice,
      toggleFavorite,
      reloadMarkets,
      marketsCategoryFilter,
      setMarketsCategoryFilter,
      marketsSortBy,
      setMarketsSortBy,
      marketsSearchInput,
      setMarketsSearchInput,
      marketsSearchQuery,
      clearMarketsViewFilters,
    ]
  );

  return <MarketDataContext.Provider value={value}>{children}</MarketDataContext.Provider>;
}

export function useMarketData() {
  const ctx = useContext(MarketDataContext);
  if (!ctx) throw new Error("useMarketData doit être utilisé dans MarketDataProvider");
  return ctx;
}
