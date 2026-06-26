import {
  createContext,
  useContext,
  useState,
  ReactNode,
  useEffect,
  useCallback,
  useMemo,
} from "react";
import { useAuth } from "./AuthContext";
import { investApi, type PortfolioLine, type ApiTransactionRow } from "../services/investApi";
import { ApiError } from "../lib/api";
import {
  loadPortfolioSnapshot,
  readStoredVerifiedUserId,
  savePortfolioSnapshot,
} from "../utils/clientDataSnapshots";

export interface Asset {
  id: string;
  symbol: string;
  name: string;
  quantity: number;
  purchasePrice: number;
  currentPrice: number;
  type: "stock" | "crypto" | "etf";
  purchaseDate: string;
}

export interface Transaction {
  id: string;
  assetSymbol: string;
  assetName: string;
  type: "buy" | "sell";
  quantity: number;
  price: number;
  date: string;
  total: number;
}

interface PortfolioContextType {
  assets: Asset[];
  transactions: Transaction[];
  loading: boolean;
  error: string | null;
  performance: { date: string; value: number }[];
  refreshPortfolio: (opts?: { silent?: boolean }) => Promise<void>;
  addAsset: (payload: Omit<Asset, "id" | "currentPrice"> & { assetId: number }) => Promise<void>;
  removeAsset: (id: string) => void;
  sellAsset: (id: string, quantity: number, price: number) => Promise<void>;
  updateAssetPrice: (symbol: string, price: number) => void;
  getTotalValue: () => number;
  getTotalProfit: () => number;
}

const PortfolioContext = createContext<PortfolioContextType | undefined>(undefined);

function mapCategory(category: string, ticker: string): Asset["type"] {
  const u = ticker.toUpperCase();
  if (u === "BTC" || u === "ETH") return "crypto";
  const c = category.toLowerCase();
  if (c.includes("etf")) return "etf";
  if (c.includes("crypto")) return "crypto";
  return "stock";
}

/** Earliest buy date per ticker (DATEONLY string yyyy-mm-dd) from transaction history. */
function earliestBuyDateByTicker(transactions: Transaction[]): Map<string, string> {
  const m = new Map<string, string>();
  for (const t of transactions) {
    if (t.type !== "buy" || !t.date) continue;
    const key = t.assetSymbol.trim().toUpperCase();
    const prev = m.get(key);
    if (!prev || t.date < prev) m.set(key, t.date);
  }
  return m;
}

function mapLine(line: PortfolioLine, firstBuyByTicker: Map<string, string>): Asset {
  const sym = line.ticker.trim().toUpperCase();
  const purchaseDate = firstBuyByTicker.get(sym) ?? "";
  return {
    id: String(line.assetId),
    symbol: line.ticker,
    name: line.name,
    quantity: line.quantity,
    purchasePrice: line.averagePurchasePrice,
    currentPrice: line.currentPrice,
    type: mapCategory(line.category, line.ticker),
    purchaseDate: purchaseDate || "—",
  };
}

function mapTx(row: ApiTransactionRow): Transaction {
  return {
    id: row.id,
    assetSymbol: row.assetSymbol,
    assetName: row.assetName,
    type: row.type,
    quantity: row.quantity,
    price: row.price,
    date: row.date,
    total: row.total,
  };
}

function readInitialPortfolioBundle() {
  const uid = readStoredVerifiedUserId();
  const disk = uid ? loadPortfolioSnapshot(uid) : null;
  return {
    assets: (disk?.assets as Asset[]) ?? [],
    transactions: (disk?.transactions as Transaction[]) ?? [],
    summary: disk?.summary ?? { totalValue: 0, investedAmount: 0, profitLoss: 0 },
    performance: disk?.performance ?? [],
    /** Afficher le spinner seulement si compte vérifié attendu mais aucun cache disque. */
    loading: Boolean(uid) && !disk,
  };
}

export function PortfolioProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated, user } = useAuth();
  const skipInvestmentData = user?.role === "admin";
  const initial = useMemo(() => readInitialPortfolioBundle(), []);
  const [assets, setAssets] = useState<Asset[]>(initial.assets);
  const [transactions, setTransactions] = useState<Transaction[]>(initial.transactions);
  const [summary, setSummary] = useState(initial.summary);
  const [performance, setPerformance] = useState<{ date: string; value: number }[]>(initial.performance);
  const [loading, setLoading] = useState(initial.loading);
  const [error, setError] = useState<string | null>(null);

  const loadAll = useCallback(async (opts?: { silent?: boolean }) => {
    const silent = Boolean(opts?.silent);
    if (skipInvestmentData || !isAuthenticated || !user?.isVerified || !user?.id) {
      setAssets([]);
      setTransactions([]);
      setPerformance([]);
      setSummary({ totalValue: 0, investedAmount: 0, profitLoss: 0 });
      setError(null);
      setLoading(false);
      return;
    }
    const uid = user.id;
    if (!silent) setLoading(true);
    if (!silent) setError(null);
    try {
      const [port, txs, perf] = await Promise.all([
        investApi.getPortfolio(),
        investApi.getTransactions(),
        investApi.getPerformance().catch(() => [] as { date: string; value: number }[]),
      ]);
      const txRows = (txs.transactions || []).map(mapTx);
      const firstBuys = earliestBuyDateByTicker(txRows);
      const nextAssets = port.assets.map((line) => mapLine(line, firstBuys));
      setAssets(nextAssets);
      setTransactions(txRows);
      setSummary(port.summary);
      const perfArr = Array.isArray(perf) ? perf : [];
      setPerformance(perfArr);
      savePortfolioSnapshot(uid, {
        assets: nextAssets,
        transactions: txRows,
        summary: port.summary,
        performance: perfArr,
      });
    } catch (e) {
      if (e instanceof ApiError && e.status === 401) {
        return;
      }
      if (!silent) {
        setError("Something went wrong");
        /* Conserver le dernier instantané (mémoire + disque) si l’API échoue. */
      }
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, skipInvestmentData, user?.isVerified, user?.id]);

  useEffect(() => {
    if (skipInvestmentData || !isAuthenticated || !user?.isVerified || !user?.id) {
      setAssets([]);
      setTransactions([]);
      setPerformance([]);
      setSummary({ totalValue: 0, investedAmount: 0, profitLoss: 0 });
      setError(null);
      setLoading(false);
      return;
    }
    const snap = loadPortfolioSnapshot(user.id);
    if (snap) {
      setAssets(snap.assets as Asset[]);
      setTransactions(snap.transactions as Transaction[]);
      setSummary(snap.summary);
      setPerformance(snap.performance);
      void loadAll({ silent: true });
    } else {
      void loadAll();
    }
  }, [isAuthenticated, skipInvestmentData, user?.id, user?.isVerified, loadAll]);

  useEffect(() => {
    if (skipInvestmentData || !isAuthenticated || !user?.isVerified) return;
    const id = window.setInterval(() => {
      void loadAll({ silent: true });
    }, 60_000);
    return () => window.clearInterval(id);
  }, [isAuthenticated, skipInvestmentData, user?.isVerified, loadAll]);

  const addAsset = useCallback(
    async (payload: Omit<Asset, "id" | "currentPrice"> & { assetId: number }) => {
      await investApi.buy({
        assetId: payload.assetId,
        quantity: payload.quantity,
      });
      await loadAll();
    },
    [loadAll]
  );

  const removeAsset = useCallback(() => {}, []);

  const sellAsset = useCallback(
    async (id: string, quantity: number, _price: number) => {
      const assetId = Number(id);
      if (!Number.isFinite(assetId)) {
        throw new Error("Something went wrong");
      }
      await investApi.sell({ assetId, quantity });
      await loadAll();
    },
    [loadAll]
  );

  const updateAssetPrice = useCallback(() => {
    void loadAll();
  }, [loadAll]);

  const getTotalValue = useCallback(() => summary.totalValue, [summary.totalValue]);
  const getTotalProfit = useCallback(() => summary.profitLoss, [summary.profitLoss]);

  const value = useMemo(
    () => ({
      assets,
      transactions,
      loading,
      error,
      performance,
      refreshPortfolio: loadAll,
      addAsset,
      removeAsset,
      sellAsset,
      updateAssetPrice,
      getTotalValue,
      getTotalProfit,
    }),
    [
      assets,
      transactions,
      loading,
      error,
      performance,
      loadAll,
      addAsset,
      removeAsset,
      sellAsset,
      updateAssetPrice,
      getTotalValue,
      getTotalProfit,
    ]
  );

  return <PortfolioContext.Provider value={value}>{children}</PortfolioContext.Provider>;
}

export function usePortfolio() {
  const context = useContext(PortfolioContext);
  if (context === undefined) {
    throw new Error("usePortfolio doit être utilisé dans PortfolioProvider");
  }
  return context;
}
