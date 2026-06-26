import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { formatTndAmount, formatTndWithUnit, roundTndCents } from "../utils/tndCurrency";
import { useAuth } from "./AuthContext";
import { investApi } from "../services/investApi";

/** Ancienne clé globale : supprimée pour éviter tout partage de solde entre comptes sur le même navigateur. */
const LEGACY_GLOBAL_BALANCE_KEY = "investpro-stnd-balance";

export function roundStnd(n: number): number {
  return roundTndCents(n);
}

interface WalletContextType {
  stndBalance: number;
  walletLoading: boolean;
  refreshWallet: () => Promise<void>;
  depositStnd: (amount: number) => Promise<void>;
  withdrawStnd: (amount: number) => Promise<boolean>;
  /** Formatted amount only (no currency suffix), for split typography. */
  formatTndNumber: (amount: number, locale?: string) => string;
  /** Full display string with ` TND` suffix. */
  formatStnd: (amount: number, locale?: string) => string;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export function WalletProvider({ children }: { children: ReactNode }) {
  const { user, isAuthenticated, isAdmin } = useAuth();
  const [stndBalance, setStndBalance] = useState(0);
  const [walletLoading, setWalletLoading] = useState(false);

  const refreshWallet = useCallback(async () => {
    if (!isAuthenticated || !user?.id || isAdmin) {
      setStndBalance(0);
      return;
    }
    setWalletLoading(true);
    try {
      const w = await investApi.getWallet();
      const b = Number(w?.balance);
      /** Ne pas écraser avec 0 si la réponse est invalide — évite une perte d’affichage après erreur parse ou champ absent. */
      if (Number.isFinite(b)) {
        setStndBalance(roundStnd(b));
      }
    } catch {
      /** Conserver le solde affiché : une erreur réseau / 5xx ne doit pas simuler un solde nul (souvent confondu avec un bug « passage Pro »). */
    } finally {
      setWalletLoading(false);
    }
  }, [isAuthenticated, isAdmin, user?.id, user?.investorRole, user?.isPro]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    localStorage.removeItem(LEGACY_GLOBAL_BALANCE_KEY);
  }, []);

  useEffect(() => {
    void refreshWallet();
  }, [refreshWallet]);

  const depositStnd = useCallback(
    async (amount: number) => {
      if (!isAuthenticated || !user?.id || isAdmin) return;
      if (!Number.isFinite(amount) || amount <= 0) return;
      await investApi.deposit({ amount: roundStnd(amount) });
      await refreshWallet();
    },
    [isAuthenticated, isAdmin, user?.id, refreshWallet]
  );

  const withdrawStnd = useCallback(
    async (amount: number): Promise<boolean> => {
      if (!isAuthenticated || !user?.id || isAdmin) return false;
      if (!Number.isFinite(amount) || amount <= 0) return false;
      try {
        await investApi.withdraw({ amount: roundStnd(amount) });
        await refreshWallet();
        return true;
      } catch {
        return false;
      }
    },
    [isAuthenticated, isAdmin, user?.id, refreshWallet]
  );

  const formatTndNumber = useCallback((amount: number, _locale?: string) => {
    return formatTndAmount(amount);
  }, []);

  const formatStnd = useCallback((amount: number, _locale?: string) => formatTndWithUnit(amount), []);

  const value = useMemo(
    () => ({
      stndBalance,
      walletLoading,
      refreshWallet,
      depositStnd,
      withdrawStnd,
      formatTndNumber,
      formatStnd,
    }),
    [stndBalance, walletLoading, refreshWallet, depositStnd, withdrawStnd, formatTndNumber, formatStnd]
  );

  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>;
}

export function useWallet() {
  const ctx = useContext(WalletContext);
  if (!ctx) {
    throw new Error("useWallet must be used within WalletProvider");
  }
  return ctx;
}
