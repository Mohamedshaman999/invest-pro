import { useEffect, useMemo, useRef, useState } from "react";
import type { Asset } from "../contexts/PortfolioContext";
import { investApi } from "../services/investApi";

const CACHE_MS = 60_000;

export type NotifPerformanceRow = {
  ticker: string;
  name: string;
  currentPrice: number;
  referencePrice: number;
  changePct: number;
  usedFallback: boolean;
  sparklineNormalized: number[];
};

function parseHistoryDateMs(dateStr: string): number {
  const s = String(dateStr).trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
    const [y, m, d] = s.split("-").map(Number);
    return Date.UTC(y, m - 1, d);
  }
  const t = Date.parse(s);
  return Number.isFinite(t) ? t : NaN;
}

function buildSparkline(
  sorted: Array<{ date: string; price: number }>,
  currentPrice: number,
): number[] {
  const tail = sorted.slice(-14).map((h) => h.price);
  if (tail.length === 0) return [0.5];
  const last = tail[tail.length - 1];
  if (Math.abs(last - currentPrice) > 1e-9 * (Math.abs(last) + 1)) {
    tail.push(currentPrice);
  }
  const min = Math.min(...tail);
  const max = Math.max(...tail);
  const span = max - min || 1;
  return tail.map((p) => (p - min) / span);
}

function rowForAsset(
  a: Asset,
  history: Array<{ date: string; price: number }>,
  targetMs: number,
): NotifPerformanceRow {
  const sym = a.symbol.trim().toUpperCase();
  const sorted = [...history].sort((x, y) => parseHistoryDateMs(x.date) - parseHistoryDateMs(y.date));
  let refPrice: number | null = null;
  let usedFallback = false;

  for (let i = sorted.length - 1; i >= 0; i--) {
    const t = parseHistoryDateMs(sorted[i].date);
    if (Number.isFinite(t) && t <= targetMs) {
      refPrice = sorted[i].price;
      break;
    }
  }

  if (refPrice == null && sorted.length > 0) {
    refPrice = sorted[0].price;
    usedFallback = true;
  }

  const currentPrice = a.currentPrice;

  if (refPrice == null || refPrice === 0) {
    return {
      ticker: sym,
      name: a.name,
      currentPrice,
      referencePrice: currentPrice,
      changePct: 0,
      usedFallback: true,
      sparklineNormalized: buildSparkline(sorted, currentPrice),
    };
  }

  const changePct = ((currentPrice - refPrice) / refPrice) * 100;
  return {
    ticker: sym,
    name: a.name,
    currentPrice,
    referencePrice: refPrice,
    changePct,
    usedFallback,
    sparklineNormalized: buildSparkline(sorted, currentPrice),
  };
}

/**
 * Historique public par ticker + portefeuille authentifié (`assets`) : aucune fuite hors lignes détenues.
 * Cache court pour éviter de recharger à chaque ouverture du menu.
 */
function isOwnedStockLike(a: Asset): boolean {
  return a.quantity > 0 && (a.type === "stock" || a.type === "etf");
}

export function useOwnedAssets24hPerformance(isActive: boolean, assets: Asset[]) {
  const held = useMemo(() => assets.filter(isOwnedStockLike), [assets]);
  const tickersKey = useMemo(
    () =>
      held
        .map((a) => `${a.id}:${a.symbol.trim().toUpperCase()}`)
        .sort()
        .join("|"),
    [held],
  );

  const cacheRef = useRef<{
    at: number;
    tickersKey: string;
    map: Record<string, Array<{ date: string; price: number }>>;
  } | null>(null);

  const [historyMap, setHistoryMap] = useState<Record<string, Array<{ date: string; price: number }>>>({});
  const [fetchedAt, setFetchedAt] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const heldRef = useRef(held);
  heldRef.current = held;

  useEffect(() => {
    if (!isActive) return;

    const list = heldRef.current;
    if (list.length === 0) {
      setHistoryMap({});
      setFetchedAt(null);
      setLoading(false);
      return;
    }

    const now = Date.now();
    const cached = cacheRef.current;
    if (cached && cached.tickersKey === tickersKey && now - cached.at < CACHE_MS) {
      setHistoryMap(cached.map);
      setFetchedAt(cached.at);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);

    void (async () => {
      try {
        const entries = await Promise.all(
          list.map(async (a) => {
            const sym = a.symbol.trim().toUpperCase();
            try {
              const hist = await investApi.getHistory(sym);
              return [sym, hist] as const;
            } catch {
              return [sym, [] as Array<{ date: string; price: number }>] as const;
            }
          }),
        );
        if (cancelled) return;
        const map: Record<string, Array<{ date: string; price: number }>> = {};
        for (const [sym, h] of entries) {
          map[sym] = h;
        }
        const at = Date.now();
        cacheRef.current = { at, tickersKey, map };
        setHistoryMap(map);
        setFetchedAt(at);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isActive, tickersKey]);

  const rows = useMemo(() => {
    const targetMs = Date.now() - 24 * 60 * 60 * 1000;
    return held.map((a) => {
      const sym = a.symbol.trim().toUpperCase();
      return rowForAsset(a, historyMap[sym] ?? [], targetMs);
    });
  }, [held, historyMap]);

  return { rows, loading, fetchedAt };
}
