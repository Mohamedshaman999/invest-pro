/**
 * Instantanés des données affichées (localStorage) pour réafficher le dernier état
 * connu après fermeture du navigateur ou redémarrage du front, avant la prochaine synchro API.
 */

const MARKET_SNAPSHOT_KEY = "marketDataSnapshot:v1";

export type MarketSnapshotRow = {
  id?: number;
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  volume: string;
  marketCap: string;
  volumeRaw?: number | null;
  capMarketRaw?: number | null;
  type: "stock" | "crypto" | "etf";
  chart: { value: number }[];
  favorite?: boolean;
};

export function loadMarketSnapshot(): MarketSnapshotRow[] | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(MARKET_SNAPSHOT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { v?: number; rows?: unknown };
    if (parsed?.v !== 1 || !Array.isArray(parsed.rows) || parsed.rows.length === 0) return null;
    for (const r of parsed.rows) {
      if (!r || typeof r !== "object" || typeof (r as MarketSnapshotRow).symbol !== "string") return null;
    }
    return parsed.rows as MarketSnapshotRow[];
  } catch {
    return null;
  }
}

export function saveMarketSnapshot(rows: MarketSnapshotRow[]) {
  try {
    localStorage.setItem(
      MARKET_SNAPSHOT_KEY,
      JSON.stringify({ v: 1, savedAt: new Date().toISOString(), rows })
    );
  } catch {
    /* quota / private mode */
  }
}

export function clearMarketSnapshot() {
  try {
    localStorage.removeItem(MARKET_SNAPSHOT_KEY);
  } catch {
    /* ignore */
  }
}

// --- Portefeuille (par utilisateur) ---

const PORTFOLIO_PREFIX = "portfolioDataSnapshot:v1:";

/** Formes sérialisées alignées sur `Asset` / `Transaction` du PortfolioContext. */
export type PortfolioAssetSnapshot = {
  id: string;
  symbol: string;
  name: string;
  quantity: number;
  purchasePrice: number;
  currentPrice: number;
  type: "stock" | "crypto" | "etf";
  purchaseDate: string;
};

export type PortfolioTransactionSnapshot = {
  id: string;
  assetSymbol: string;
  assetName: string;
  type: "buy" | "sell";
  quantity: number;
  price: number;
  date: string;
  total: number;
};

export type PortfolioDiskSnapshot = {
  v: 1;
  savedAt: string;
  assets: PortfolioAssetSnapshot[];
  transactions: PortfolioTransactionSnapshot[];
  summary: { totalValue: number; investedAmount: number; profitLoss: number };
  performance: { date: string; value: number }[];
};

function portfolioKey(userId: string) {
  return `${PORTFOLIO_PREFIX}${userId}`;
}

export function loadPortfolioSnapshot(
  userId: string
): {
  assets: PortfolioAssetSnapshot[];
  transactions: PortfolioTransactionSnapshot[];
  summary: { totalValue: number; investedAmount: number; profitLoss: number };
  performance: { date: string; value: number }[];
} | null {
  if (typeof window === "undefined" || !userId) return null;
  try {
    const raw = localStorage.getItem(portfolioKey(userId));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PortfolioDiskSnapshot;
    if (parsed?.v !== 1 || !Array.isArray(parsed.assets)) return null;
    return {
      assets: parsed.assets,
      transactions: Array.isArray(parsed.transactions) ? parsed.transactions : [],
      summary:
        parsed.summary && typeof parsed.summary === "object"
          ? {
              totalValue: Number(parsed.summary.totalValue) || 0,
              investedAmount: Number(parsed.summary.investedAmount) || 0,
              profitLoss: Number(parsed.summary.profitLoss) || 0,
            }
          : { totalValue: 0, investedAmount: 0, profitLoss: 0 },
      performance: Array.isArray(parsed.performance) ? parsed.performance : [],
    };
  } catch {
    return null;
  }
}

export function savePortfolioSnapshot(
  userId: string,
  data: {
    assets: PortfolioAssetSnapshot[];
    transactions: PortfolioTransactionSnapshot[];
    summary: { totalValue: number; investedAmount: number; profitLoss: number };
    performance: { date: string; value: number }[];
  }
) {
  if (!userId) return;
  try {
    const payload: PortfolioDiskSnapshot = {
      v: 1,
      savedAt: new Date().toISOString(),
      assets: data.assets,
      transactions: data.transactions,
      summary: data.summary,
      performance: data.performance,
    };
    localStorage.setItem(portfolioKey(userId), JSON.stringify(payload));
  } catch {
    /* ignore */
  }
}

export function clearPortfolioSnapshot(userId: string) {
  if (!userId) return;
  try {
    localStorage.removeItem(portfolioKey(userId));
  } catch {
    /* ignore */
  }
}

/** Lit l’id utilisateur en cache (même clé que AuthContext) si le compte est vérifié. */
export function readStoredVerifiedUserId(): string | undefined {
  if (typeof window === "undefined") return undefined;
  try {
    const raw = localStorage.getItem("user");
    if (!raw) return undefined;
    const u = JSON.parse(raw) as { id?: unknown; isVerified?: boolean };
    if (!u || u.isVerified !== true) return undefined;
    if (u.id == null) return undefined;
    return String(u.id);
  } catch {
    return undefined;
  }
}
